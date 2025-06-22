# API Endpoint Implementation Plan: PATCH /api/compositions/{composition_id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia użytkownikom częściową aktualizację ich własnych kompozycji pizzy. Użytkownik może zmodyfikować składniki, ocenę lub adres URL zdjęcia powiązanego z kompozycją. Endpoint zapewnia, że tylko właściciel kompozycji może dokonywać zmian.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/compositions/{composition_id}`
- **Parametry**:
  - **Wymagane (w ścieżce)**: `composition_id` (integer) - ID kompozycji do aktualizacji.
  - **Opcjonalne (w body)**: Przynajmniej jedno z poniższych pól musi być obecne.
    - `ingredients`: `string[]` (maksymalnie 10)
    - `rating`: `integer` (zakres 1-6)
    - `photo_url`: `string` (ważny URL)
- **Request Body (Przykład)**:
  ```json
  {
      "rating": 5,
      "photo_url": "https://example.com/new-pizza-photo.jpg"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model (Request)**: `UpdateCompositionCommand` z `src/types.ts`.
- **DTO (Response)**: `CompositionDto` z `src/types.ts`.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca pełny, zaktualizowany obiekt kompozycji w formacie `CompositionDto`.
  ```json
  {
      "composition_id": 123,
      "user_id": "uuid-of-the-user",
      "ingredients": ["ser", "szynka", "pieczarki"],
      "rating": 5,
      "composition_type": "manual",
      "created_at": "2023-10-27T10:00:00Z",
      "photo_url": "https://example.com/new-pizza-photo.jpg"
  }
  ```
- **Kody błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych
1.  Klient wysyła żądanie `PATCH` na adres `/api/compositions/{composition_id}` z tokenem uwierzytelniającym i ciałem żądania.
2.  Middleware Astro weryfikuje token JWT, pobiera dane użytkownika z Supabase i dołącza je do `context.locals`.
3.  Handler API w `src/pages/api/compositions/[composition_id].ts` odbiera żądanie.
4.  `composition_id` jest parsowane z URL.
5.  Ciało żądania jest walidowane za pomocą dedykowanego schematu Zod (`updateCompositionValidator`). W przypadku błędu zwracane jest `400`.
6.  Handler wywołuje metodę serwisową `compositionService.updateComposition(userId, compositionId, validatedData)`.
7.  **W warstwie serwisowej (`composition.service.ts`):**
    a. Sprawdzane jest istnienie kompozycji o danym `composition_id`. Jeśli nie istnieje, serwis rzuca błąd `NotFoundError`.
    b. Weryfikowana jest przynależność kompozycji do zalogowanego użytkownika. Jeśli nie należy, rzucany jest błąd `ForbiddenError`.
    c. Jeśli w żądaniu znajduje się `photo_url`, serwis przygotowuje transakcję (np. przez funkcję RPC w Supabase), która atomowo:
        i. Aktualizuje tabelę `compositions`.
        ii. Inkrementuje pole `photo_uploaded_count` w tabeli `users`.
    d. Jeśli `photo_url` nie jest aktualizowane, wykonywane jest standardowe zapytanie `UPDATE` na tabeli `compositions`.
    e. Serwis zwraca zaktualizowany obiekt kompozycji.
8.  Handler API przechwytuje wyjątki z warstwy serwisowej i mapuje je na odpowiednie kody statusu HTTP (403, 404, 500).
9.  W przypadku sukcesu, handler zwraca status `200 OK` i zaktualizowany obiekt kompozycji.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware, które weryfikuje ważność tokena sesji Supabase.
- **Autoryzacja**: Warstwa serwisowa musi bezwzględnie weryfikować, czy `user_id` z sesji jest właścicielem modyfikowanej kompozycji. Wykorzystanie RLS w Supabase stanowi dodatkowe zabezpieczenie na poziomie bazy danych.
- **Walidacja danych**: Użycie Zod do walidacji ciała żądania chroni przed niepoprawnymi danymi i potencjalnymi atakami (np. NoSQL injection, chociaż używamy Postgresa).

## 7. Rozważania dotyczące wydajności
- Zapytania do bazy danych będą operować na kluczach głównych (`composition_id`) i indeksowanych (`user_id`), co zapewnia wysoką wydajność.
- Użycie transakcji dla aktualizacji `photo_url` wprowadza niewielki narzut, ale jest niezbędne dla zachowania spójności danych. Operacja ta powinna być zoptymalizowana, np. poprzez stworzenie dedykowanej funkcji `pl/pgsql` w bazie danych.

## 8. Etapy wdrożenia
1.  **Walidator**: W pliku `src/lib/validators/composition.validators.ts` zdefiniować nowy schemat `updateCompositionValidator` używając Zod. Schemat musi walidować `ingredients`, `rating`, `photo_url` oraz zapewniać, że ciało żądania nie jest puste.
2.  **Warstwa serwisu**: W `src/lib/services/composition.service.ts` zaimplementować nową metodę `updateComposition`.
    - Metoda powinna przyjmować `compositionId`, `userId` oraz dane do aktualizacji.
    - Należy w niej zawrzeć logikę sprawdzania istnienia zasobu i uprawnień.
    - Zaimplementować obsługę transakcji dla przypadku aktualizacji `photo_url`. Można zacząć od prostszej implementacji z dwoma zapytaniami, a docelowo stworzyć funkcję RPC w Supabase.
    - Wprowadzić dedykowane klasy błędów (`NotFoundError`, `ForbiddenError`) rzucane przez serwis.
3.  **Trasa API**: Utworzyć plik `src/pages/api/compositions/[composition_id].ts`.
    - Dodać handler dla metody `PATCH`.
    - Zintegrować walidator Zod.
    - Wywołać metodę z serwisu `compositionService`.
    - Dodać obsługę błędów (try-catch) i mapowanie wyjątków na kody odpowiedzi HTTP.
4.  **Testy**: Napisać testy jednostkowe dla walidatora i logiki serwisowej oraz testy integracyjne dla całego endpointu, uwzględniając wszystkie ścieżki (sukces, błędy walidacji, brak autoryzacji, brak zasobu). 