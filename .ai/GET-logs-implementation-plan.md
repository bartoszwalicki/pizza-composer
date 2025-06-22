# API Endpoint Implementation Plan: GET /api/generation-logs

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom pobieranie paginowanej listy logów generacji kompozycji AI. Użytkownicy mogą sortować wyniki i kontrolować paginację za pomocą parametrów zapytania. Endpoint zwraca tylko logi należące do zalogowanego użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/generation-logs`
- **Parametry zapytania (Query Parameters)**:
  - **Opcjonalne**:
    - `page` (integer, domyślnie: 1): Numer strony do pobrania.
    - `pageSize` (integer, domyślnie: 10): Liczba wyników na stronie.
    - `sortBy` (string, domyślnie: `generation_id`): Pole, po którym odbywa się sortowanie. Dozwolone wartości: `generation_id`, `generation_duration`.
    - `sortOrder` (string, domyślnie: `desc`): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **DTO (Data Transfer Object)**:
  - `GenerationLogDto` (z `src/types.ts`): Reprezentuje pojedynczy log generacji.
  - `GetGenerationLogsResponseDto` (z `src/types.ts`): Reprezentuje pełną strukturę odpowiedzi, w tym dane i informacje o paginacji.
  - `PaginationInfo` (z `src/types.ts`): Reprezentuje metadane paginacji.
- **Walidatory**:
  - Nowy schemat walidacji Zod dla parametrów zapytania w `src/lib/validators/log.validators.ts`.

## 4. Przepływ danych
1. Użytkownik wysyła żądanie `GET` do `/api/generation-logs` z opcjonalnymi parametrami paginacji i sortowania.
2. Middleware Astro weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`.
3. Handler API w `src/pages/api/generation-logs.ts` parsuje i waliduje parametry zapytania przy użyciu schemy Zod. W przypadku błędu walidacji zwraca `400 Bad Request`.
4. Handler wywołuje metodę z serwisu `GenerationLogService`, przekazując `user_id` z sesji oraz zwalidowane opcje paginacji i sortowania.
5. `GenerationLogService` konstruuje i wykonuje zapytanie do bazy danych Supabase, aby pobrać odpowiedni podzbiór logów z tabeli `generation_log`, filtrując po `user_id`.
6. Serwis oblicza również metadane paginacji (całkowita liczba elementów, liczba stron).
7. Handler API otrzymuje dane z serwisu, formatuje je zgodnie z `GetGenerationLogsResponseDto` i zwraca odpowiedź JSON z kodem statusu `200 OK`.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony przez middleware Astro, które weryfikuje sesję użytkownika na podstawie tokena JWT Supabase.
- **Autoryzacja**: Zapytania do bazy danych muszą bezwzględnie zawierać warunek `WHERE user_id = :current_user_id`, aby uniemożliwić jednemu użytkownikowi dostęp do danych innego.
- **Walidacja danych wejściowych**: Parametry zapytania są walidowane, aby zapobiec błędom i potencjalnym atakom (np. DoS przez duży `pageSize`). Maksymalna wartość `pageSize` zostanie ograniczona do 100.
- **Rekomendacja RLS**: Zaleca się włączenie Row Level Security (RLS) na tabeli `generation_log`, aby dodać dodatkową warstwę zabezpieczeń na poziomie bazy danych:
  ```sql
  ALTER TABLE generation_log ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_can_read_own_logs ON generation_log FOR SELECT
    USING (user_id = auth.uid());
  ```

## 6. Obsługa błędów
- **`400 Bad Request`**: Zwracany, gdy parametry zapytania (`page`, `pageSize`, `sortBy`, `sortOrder`) są nieprawidłowe (np. zły typ, niedozwolona wartość). Odpowiedź będzie zawierać szczegóły błędu walidacji Zod.
- **`401 Unauthorized`**: Zwracany przez middleware, jeśli użytkownik nie jest zalogowany lub jego token jest nieważny.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu serwera, np. problemu z połączeniem z bazą danych. Błąd zostanie zalogowany po stronie serwera w celu dalszej analizy.

## 7. Rozważania dotyczące wydajności
- **Paginacja**: Kluczowy element zapewniający wydajność. Zapobiega pobieraniu i przesyłaniu dużych zbiorów danych naraz.
- **Indeksowanie**: Aby zapewnić szybkie wykonywanie zapytań, należy upewnić się, że na kolumnie `user_id` w tabeli `generation_log` istnieje indeks. Jeśli sortowanie po `generation_duration` będzie częste, warto rozważyć dodanie indeksu również na tej kolumnie.
  ```sql
  CREATE INDEX IF NOT EXISTS idx_generation_log_user_id ON generation_log(user_id);
  ```
- **Limity**: Ograniczenie `pageSize` do rozsądnej wartości (np. 100) chroni serwer przed nadmiernym obciążeniem.

## 8. Etapy wdrożenia
1. **Baza danych**:
    - Dodać politykę RLS dla tabeli `generation_log` w nowym pliku migracji Supabase.
    - Upewnić się, że istnieje indeks na kolumnie `user_id`.
2. **Walidacja**:
    - Utworzyć plik `src/lib/validators/log.validators.ts`.
    - Zdefiniować w nim schemę Zod (`GetGenerationLogsValidator`) do walidacji parametrów `page`, `pageSize`, `sortBy`, `sortOrder`.
3. **Serwis**:
    - Utworzyć plik `src/lib/services/generation-log.service.ts`.
    - Zaimplementować w nim klasę `GenerationLogService` z metodą `getLogsForUser(...)`.
    - Metoda ta będzie przyjmować `userId` i opcje paginacji/sortowania, a następnie komunikować się z Supabase w celu pobrania danych i metadanych paginacji.
4. **Endpoint API**:
    - Utworzyć plik `src/pages/api/generation-logs.ts`.
    - Zaimplementować handler `GET`, który:
        - Pobiera `user_id` z `context.locals`.
        - Parsuje parametry zapytania z `Astro.url.searchParams`.
        - Waliduje parametry przy użyciu `GetGenerationLogsValidator`.
        - Wywołuje serwis `GenerationLogService`.
        - Formatuje i zwraca odpowiedź `GetGenerationLogsResponseDto` lub odpowiedni błąd.
5. **Testowanie**:
    - Przygotować testy jednostkowe dla serwisu i walidatorów.
    - Przeprowadzić testy integracyjne endpointu, sprawdzając różne scenariusze (poprawne dane, błędy walidacji, brak autoryzacji, różne opcje sortowania i paginacji). 