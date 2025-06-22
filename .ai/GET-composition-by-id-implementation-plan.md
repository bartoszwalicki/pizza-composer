# API Endpoint Implementation Plan: Get Composition by ID

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie zalogowanemu użytkownikowi pobranie szczegółów pojedynczej kompozycji pizzy na podstawie jej unikalnego identyfikatora. Dostęp jest ograniczony wyłącznie do kompozycji należących do danego użytkownika, co jest gwarantowane przez mechanizmy Row Level Security (RLS) w bazie danych.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/compositions/{composition_id}`
- **Parametry**:
  - **Wymagane**:
    - `composition_id` (parametr ścieżki): Unikalny identyfikator (`integer`) kompozycji do pobrania.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **DTO odpowiedzi**: `CompositionDto` zdefiniowany w `src/types.ts`.
  ```typescript
  // src/types.ts
  export type CompositionDto = Tables<'compositions'>;
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON reprezentujący kompozycję.
  ```json
  {
      "composition_id": 1,
      "user_id": "d1e7b8c8-3e4f-4d2a-8b1a-9c7f2b3a4d5e",
      "ingredients": ["ser", "szynka", "pieczarki"],
      "rating": 5,
      "composition_type": "manual",
      "created_at": "2024-09-07T10:00:00Z",
      "photo_url": "https://example.com/pizza.jpg"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy `composition_id` jest w nieprawidłowym formacie.
  - `401 Unauthorized`: Gdy użytkownik jest niezalogowany.
  - `404 Not Found`: Gdy kompozycja o podanym ID nie istnieje lub nie należy do użytkownika.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1. Użytkownik wysyła żądanie `GET` na adres `/api/compositions/{composition_id}`.
2. Middleware Astro przechwytuje żądanie, weryfikuje token JWT użytkownika i udostępnia instancję klienta Supabase (`context.locals.supabase`) z sesją użytkownika. Jeśli token jest nieprawidłowy, zwraca `401 Unauthorized`.
3. Handler API w `src/pages/api/compositions/[composition_id].ts` jest wywoływany.
4. Handler waliduje `composition_id` z URL. Jeśli jest nieprawidłowy, zwraca `400 Bad Request`.
5. Handler wywołuje metodę `CompositionService.getCompositionById(compositionId, supabase)`.
6. Serwis wykonuje zapytanie do bazy danych Supabase: `supabase.from('compositions').select().eq('composition_id', compositionId).single()`. Polityka RLS automatycznie filtruje wyniki, aby zwrócić wiersz tylko wtedy, gdy `user_id` pasuje do ID zalogowanego użytkownika.
7. Jeśli zapytanie nie zwróci żadnych danych (`data` jest `null`), serwis zwraca `null`. Oznacza to, że kompozycja nie została znaleziona lub użytkownik nie ma do niej dostępu.
8. Handler API otrzymuje `null` z serwisu i zwraca odpowiedź `404 Not Found`.
9. Jeśli zapytanie zwróci dane kompozycji, serwis przekazuje je do handlera API.
10. Handler API zwraca odpowiedź `200 OK` z danymi kompozycji w formacie `CompositionDto`.
11. W przypadku błędu bazy danych, serwis propaguje błąd w górę, a handler API go przechwytuje, loguje i zwraca `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Obowiązkowe, obsługiwane przez middleware Astro i Supabase Auth. Każde żądanie musi zawierać ważny token JWT.
- **Autoryzacja**: Zapewniona przez RLS w PostgreSQL. Użytkownicy mają dostęp wyłącznie do swoich danych, co zapobiega wyciekom danych między kontami.
- **Walidacja wejścia**: Parametr `composition_id` jest walidowany jako dodatnia liczba całkowita, co chroni przed błędami przetwarzania.

## 7. Rozważania dotyczące wydajności
- Zapytanie do bazy danych jest wysoce wydajne, ponieważ operuje na kluczu głównym (`composition_id`).
- Nie przewiduje się problemów z wydajnością dla tego punktu końcowego.

## 8. Etapy wdrożenia
1.  **Aktualizacja serwisu**:
    -   W pliku `src/lib/services/composition.service.ts` dodać nową metodę `getCompositionById`.
    -   Metoda przyjmie `compositionId: number` i `supabase: SupabaseClient` jako argumenty.
    -   Wewnątrz metody wykonać zapytanie `select` do tabeli `compositions` z filtrowaniem po `composition_id` i użyciem `.single()` do pobrania pojedynczego rekordu.
    -   Metoda powinna zwracać `CompositionDto | null` w przypadku sukcesu lub `null`, gdy nic nie znaleziono. W przypadku błędu bazy danych, błąd powinien być rzucony dalej.

2.  **Utworzenie walidatora**:
    -   W pliku `src/lib/validators/composition.validators.ts` (lub w nowym pliku, jeśli nie istnieje) dodać schemat Zod do walidacji `composition_id`.
    -   Schemat powinien wymuszać, aby wartość była dodatnią liczbą całkowitą: `z.coerce.number().int().positive()`.

3.  **Implementacja handlera API**:
    -   Utworzyć nowy plik `src/pages/api/compositions/[composition_id].ts`.
    -   W pliku zaimplementować `GET` handler (`export const GET: APIRoute = async ({ params, locals }) => { ... };`).
    -   Pobrać `composition_id` z `params`.
    -   Użyć wcześniej zdefiniowanego schematu Zod do walidacji `composition_id`. W razie błędu zwrócić `400 Bad Request`.
    -   Pobrać klienta `supabase` z `locals.supabase`.
    -   Wywołać `compositionService.getCompositionById`.
    -   Na podstawie wyniku zwrócić `200 OK` z danymi kompozycji lub `404 Not Found`.
    -   Dodać blok `try...catch` do obsługi ewentualnych błędów z serwisu i zwrócenia `500 Internal Server Error`. 