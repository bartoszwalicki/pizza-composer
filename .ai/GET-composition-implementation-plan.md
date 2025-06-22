# API Endpoint Implementation Plan: GET /api/compositions

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`endpoint`) jest odpowiedzialny za pobieranie listy kompozycji pizzy należących do aktualnie uwierzytelnionego użytkownika. Obsługuje paginację, sortowanie i filtrowanie wyników, umożliwiając klientowi elastyczne przeszukiwanie danych. Odpowiedź jest ustrukturyzowana tak, aby zawierała zarówno dane, jak i informacje o paginacji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/compositions`
- **Parametry zapytania (Query Parameters)**:
  - **Opcjonalne**:
    - `page` (integer, domyślnie: 1): Numer strony do wyświetlenia.
    - `pageSize` (integer, domyślnie: 10): Liczba kompozycji na stronie.
    - `sortBy` (string, domyślnie: `created_at`): Pole, po którym odbywa się sortowanie. Dozwolone wartości: `created_at`, `rating`.
    - `sortOrder` (string, domyślnie: `desc`): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`.
    - `rating` (integer): Filtrowanie po ocenie. Dozwolone wartości: od 1 do 6.
    - `composition_type` (string): Filtrowanie po typie kompozycji. Dozwolone wartości: `manual`, `ai-generated`.
- **Request Body**: Brak (N/A dla metody GET).

## 3. Wykorzystywane typy
- **`GetCompositionsResponseDto`**: Główny typ odpowiedzi.
- **`CompositionDto`**: Typ reprezentujący pojedynczą kompozycję.
- **`PaginationInfo`**: Typ dla metadanych paginacji.
- **`Zod Schema`**: Nowy schemat walidacji dla parametrów zapytania.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
      "data": [
          {
              "composition_id": 1,
              "user_id": "...",
              "ingredients": ["ser", "szynka", "pieczarki"],
              "rating": 5,
              "composition_type": "manual",
              "created_at": "2023-10-27T10:00:00Z",
              "photo_url": null
          }
      ],
      "pagination": {
          "page": 1,
          "pageSize": 10,
          "totalItems": 1,
          "totalPages": 1
      }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu Astro `/api/compositions`.
2.  Middleware Astro weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. Jeśli jest prawidłowy, udostępnia `user` i `supabase` w `context.locals`.
3.  Handler endpointu (`GET` function) odczytuje parametry z `Astro.url.searchParams`.
4.  Parametry są walidowane za pomocą predefiniowanego schematu Zod. W przypadku błędu walidacji zwracany jest status `400 Bad Request`.
5.  Handler wywołuje metodę z serwisu `CompositionService`, np. `getUserCompositions(userId, validatedParams)`, przekazując ID użytkownika z `context.locals` i zwalidowane parametry.
6.  `CompositionService` buduje zapytanie do Supabase:
    -   Używa `select()` z opcją `{ count: 'exact' }`, aby jednocześnie pobrać dane i całkowitą liczbę rekordów.
    -   Dodaje warunek `eq('user_id', userId)`.
    -   Warunkowo dodaje filtry `eq('rating', ...)` i `eq('composition_type', ...)` jeśli zostały podane.
    -   Dodaje `order(sortBy, { ascending: sortOrder === 'asc' })`.
    -   Dodaje paginację za pomocą `range(from, to)`.
7.  Serwis wykonuje zapytanie przy użyciu klienta Supabase z `context.locals`.
8.  Serwis oblicza `totalPages` i konstruuje obiekt `GetCompositionsResponseDto`.
9.  Handler endpointu zwraca odpowiedź w formacie JSON ze statusem `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp jest ograniczony do uwierzytelnionych użytkowników. Middleware Astro jest odpowiedzialne za weryfikację sesji Supabase.
- **Autoryzacja**: Każde zapytanie do bazy danych musi być ściśle powiązane z ID zalogowanego użytkownika (`user_id`). Dodatkowo, polityka RLS włączona na tabeli `compositions` zapewni, że użytkownik może uzyskać dostęp tylko do swoich danych, nawet w przypadku błędu w logice backendu.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania muszą być rygorystycznie walidowane (typ, zakres, dozwolone wartości), aby zapobiec błędom i potencjalnym atakom (np. na wydajność poprzez sortowanie po nieindeksowanych kolumnach).

## 7. Rozważania dotyczące wydajności
- **Indeksowanie**: Kluczowe jest upewnienie się, że kolumny używane do filtrowania (`user_id`, `rating`, `composition_type`) i sortowania (`created_at`, `rating`) są odpowiednio zindeksowane w bazie danych PostgreSQL. Plan bazy danych (`db-plan.md`) już przewiduje indeks na `user_id` oraz kompozytowy na `(user_id, created_at)`. Należy rozważyć dodanie indeksów na `rating` i `composition_type`, jeśli filtrowanie po nich będzie częste.
- **Paginacja**: Zapytanie do bazy danych musi być efektywnie paginowane za pomocą `range()`, aby uniknąć pobierania dużych ilości danych naraz.
- **Liczba zapytań**: Użycie `{ count: 'exact' }` w zapytaniu Supabase pozwala na uzyskanie całkowitej liczby wyników w jednym zapytaniu zamiast wykonywania osobnego `COUNT(*)`, co jest bardziej wydajne.

## 8. Etapy wdrożenia
1.  **Definicja schematu walidacji**: W `src/lib/validators` utwórz plik `composition.validators.ts` i zdefiniuj schemat Zod dla parametrów zapytania GET.
2.  **Utworzenie serwisu**: W `src/lib/services` utwórz plik `composition.service.ts` (jeśli jeszcze nie istnieje).
3.  **Implementacja logiki w serwisie**: W `CompositionService` dodaj metodę `getUserCompositions(supabase: SupabaseClient, userId: string, params: ValidatedParams)`. Zaimplementuj w niej logikę budowania i wykonywania zapytania do Supabase.
4.  **Utworzenie endpointu API**: W `src/pages/api/` utwórz plik `compositions/index.ts`.
5.  **Implementacja endpointu**:
    -   Zdefiniuj funkcję `GET({ request, locals })`.
    -   Pobierz `user` i `supabase` z `locals`. Sprawdź, czy użytkownik jest zalogowany.
    -   Wyodrębnij parametry zapytania z `request.url`.
    -   Użyj schematu Zod do walidacji i parsowania parametrów.
    -   Wywołaj metodę z `CompositionService`, przekazując klienta `supabase`, ID użytkownika i zwalidowane parametry.
    -   Obsłuż potencjalne błędy z serwisu i zwróć odpowiedni kod statusu.
    -   Zwróć pomyślną odpowiedź jako `Response.json()`.
6.  **Testowanie**: Przygotuj testy jednostkowe dla logiki serwisu oraz testy integracyjne dla endpointu, obejmujące różne kombinacje parametrów, przypadki sukcesu i błędów.
7.  **Dokumentacja**: Upewnij się, że nowo dodany kod jest zgodny ze standardami projektu i w razie potrzeby zaktualizuj dokumentację (np. w Storybooku lub w plikach markdown). 