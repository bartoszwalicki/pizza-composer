# API Endpoint Implementation Plan: POST /api/compositions

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za tworzenie nowych kompozycji pizzy. Umożliwia użytkownikom tworzenie kompozycji na dwa sposoby: ręcznie (`manual`) poprzez podanie pełnej listy składników, lub z pomocą AI (`ai-generated`), gdzie system generuje propozycję składników na podstawie 1-3 składników bazowych dostarczonych przez użytkownika. Endpoint wymaga uwierzytelnienia.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/compositions`
-   **Parametry**: Brak parametrów w URL.
-   **Request Body**: Ciało żądania musi być w formacie `application/json` i pasować do poniższej struktury, która jest modelowana przez typ `CreateCompositionCommand`.

    ```json
    {
        "composition_type": "manual" | "ai-generated",
        "ingredients": ["string"],
        "rating": null | integer,
        "photo_url": null | "string"
    }
    ```
- **Ograniczenia**:
    - `composition_type: 'manual'`: `ingredients` musi zawierać od 1 do 10 elementów.
    - `composition_type: 'ai-generated'`: `ingredients` musi zawierać od 1 do 3 elementów bazowych.
    - `rating` musi być liczbą całkowitą w zakresie od 1 do 6.

## 3. Wykorzystywane typy
-   **Command Model (Request)**: `CreateCompositionCommand` (unia dyskryminowana `CreateManualCompositionCommand` i `CreateAiCompositionCommand`) z `src/types.ts`.
-   **DTO (Response)**: `CompositionDto` z `src/types.ts` dla pomyślnej odpowiedzi.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (201 Created)**: Zwraca nowo utworzony obiekt kompozycji.
    ```json
    {
        "composition_id": integer,
        "user_id": "uuid",
        "ingredients": ["string"],
        "rating": integer | null,
        "composition_type": "manual" | "ai-generated",
        "created_at": "timestampz",
        "photo_url": "string" | null
    }
    ```
-   **Odpowiedzi błędów**: Zwraca obiekt błędu w formacie JSON.
    ```json
    {
        "error": "Komunikat błędu",
        "details"?: "Dodatkowe informacje (np. błędy walidacji)"
    }
    ```

## 5. Przepływ danych
1.  Żądanie `POST` trafia do endpointu Astro `src/pages/api/compositions.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT i umieszcza dane użytkownika w `context.locals.user`.
3.  **Walidacja**: Endpoint waliduje ciało żądania przy użyciu schemy Zod. W przypadku błędu zwraca `400 Bad Request`.
4.  **Uwierzytelnianie**: Endpoint sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
5.  **Przekazanie do serwisu**: Endpoint wywołuje odpowiednią metodę w `CompositionService` (`src/lib/services/composition.service.ts`), przekazując ID użytkownika i zwalidowane dane.
6.  **Logika `CompositionService`**:
    -   **Dla typu `manual`**:
        1.  Wywołuje klienta Supabase w celu wstawienia nowego rekordu do tabeli `compositions`.
        2.  Zwraca nowo utworzoną kompozycję.
    -   **Dla typu `ai-generated`**:
        1.  Wywołuje `AiGenerationService` w celu uzyskania sugestii składników od Openrouter.ai.
        2.  Jeśli serwis AI zwróci błąd, `CompositionService` propaguje go w górę (co skutkuje błędem `503 Service Unavailable`).
        3.  Sugesite zwrócone przez serwis AI zawierają juz skladniki bazowe, w kolejnosci odpowiadajacej nakladniu na pizze (zaczynajac od spodu).
        4.  Rozpoczyna transakcję bazodanową:
            a. Wstawia nowy rekord do tabeli `compositions` z pełną listą składników.
            b. Wstawia nowy rekord do tabeli `generation_log`, zapisując czas trwania operacji AI.
            c. Inkrementuje licznik `composition_generated_count` w tabeli `users` dla danego użytkownika.
        5.  Jeśli transakcja się powiedzie, zatwierdza ją i zwraca nowo utworzoną kompozycję. W razie błędu cofa transakcję.
7.  **Odpowiedź**: Endpoint Astro otrzymuje wynik z serwisu i wysyła odpowiedź do klienta ( `201 Created` lub odpowiedni kod błędu).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Wszystkie żądania muszą być uwierzytelnione za pomocą ważnego tokenu JWT. Middleware jest odpowiedzialne za jego weryfikację.
-   **Autoryzacja**: Identyfikator `user_id` musi być pobierany wyłącznie z zaufanego źródła (`context.locals.user.id`), nigdy z ciała żądania. Gwarantuje to, że użytkownicy mogą tworzyć kompozycje tylko w swoim imieniu.
-   **Walidacja danych wejściowych**: Rygorystyczna walidacja za pomocą Zod na serwerze zapobiega nieprawidłowym danym i potencjalnym atakom (np. NoSQL injection, jeśli dane byłyby używane w sposób niebezpieczny).
-   **Zarządzanie sekretami**: Klucz API do Openrouter.ai musi być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i dostępny tylko po stronie serwera.
-   **Ochrona przed nadużyciami**: Należy rozważyć wprowadzenie mechanizmu ograniczania szybkości (rate limiting) dla tego punktu końcowego, zwłaszcza dla kosztownej operacji `ai-generated`.

## 7. Obsługa błędów
-   `400 Bad Request`: Zwracany, gdy walidacja Zod nie powiedzie się. Odpowiedź powinna zawierać szczegóły dotyczące pól, które zawiodły.
-   `401 Unauthorized`: Zwracany przez middleware lub endpoint, jeśli `context.locals.user` nie jest dostępny.
-   `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanych błędów po stronie serwera, takich jak błędy transakcji bazodanowej lub inne nieprzechwycone wyjątki. Błąd powinien być logowany po stronie serwera.
-   `503 Service Unavailable`: Zwracany, gdy zewnętrzny serwis AI jest niedostępny lub zwraca błąd. Dotyczy tylko typu `ai-generated`.

## 8. Rozważania dotyczące wydajności
-   **Interakcja z AI**: Główne wąskie gardło wydajnościowe to czas odpowiedzi zewnętrznego serwisu AI. Należy ustawić rozsądny `timeout` dla tego wywołania. Czas generacji (`generation_duration`) jest logowany w celu monitorowania.
-   **Transakcje bazodanowe**: Operacje na bazie danych dla generacji AI powinny być zamknięte w jednej transakcji, aby zapewnić spójność danych i zminimalizować narzut.
-   **Optymalizacja zapytań**: Używane zapytania są prostymi operacjami `INSERT` i `UPDATE` na kluczach głównych lub indeksowanych kolumnach, więc nie powinny stanowić problemu wydajnościowego.

## 9. Etapy wdrożenia
1.  **Struktura plików**:
    -   Utwórz plik endpointu: `src/pages/api/compositions.ts`.
    -   Utwórz plik serwisu kompozycji: `src/lib/services/composition.service.ts`.
    -   Utwórz plik serwisu AI: `src/lib/services/ai.service.ts`.
2.  **Walidacja (Zod)**:
    -   W `src/pages/api/compositions.ts` zdefiniuj schemę Zod, która implementuje logikę walidacji dla `CreateCompositionCommand`, w tym reguły warunkowe dla `ingredients` w oparciu o `composition_type`.
3.  **Serwis AI (`ai.service.ts`)**:
    -   Zaimplementuj metodę, która przyjmuje listę składników bazowych.
    -   Metoda ta będzie wysyłać żądanie `POST` do API Openrouter.ai z odpowiednio przygotowanym promptem.
    -   Dodaj obsługę błędów i timeout'ów dla wywołania API.
    -   Zapewnij, że klucz API jest ładowany z `import.meta.env`.
4.  **Serwis kompozycji (`composition.service.ts`)**:
    -   Wstrzyknij klienta Supabase jako zależność (lub importuj go).
    -   Zaimplementuj metodę `createManualComposition`, która zapisuje dane w tabeli `compositions`.
    -   Zaimplementuj metodę `createAiGeneratedComposition`:
        -   Wywołaj `AiGenerationService`.
        -   Użyj `supabase.rpc` lub transakcji do wykonania operacji wstawienia kompozycji, logu generacji oraz aktualizacji licznika użytkownika w sposób atomowy.
5.  **Endpoint API (`compositions.ts`)**:
    -   Zaimplementuj handler `POST`.
    -   Pobierz ciało żądania i wykonaj walidację Zod.
    -   Sprawdź istnienie `context.locals.user`.
    -   Zaimplementuj blok `try...catch` do obsługi błędów z warstwy serwisowej.
    -   Wywołaj odpowiednią metodę z `CompositionService` na podstawie `composition_type`.
    -   Zwróć odpowiedź `201 Created` z danymi kompozycji lub odpowiedni kod błędu z komunikatem.
6.  **Testowanie**:
    -   Przygotuj testy jednostkowe dla logiki w `CompositionService`.
    -   Przygotuj testy integracyjne dla endpointu API, obejmujące oba typy kompozycji oraz wszystkie scenariusze błędów.
7.  **Dokumentacja**:
    -   Upewnij się, że kod jest dobrze skomentowany, zwłaszcza w częściach dotyczących logiki biznesowej i interakcji z AI.