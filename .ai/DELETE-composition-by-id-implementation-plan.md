# API Endpoint Implementation Plan: DELETE /api/compositions/{composition_id}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom usuwanie własnych kompozycji pizzy. Operacja jest identyfikowana przez `composition_id` przekazane w ścieżce URL. Pomyślne usunięcie kompozycji jest nieodwracalne.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/compositions/{composition_id}`
- **Parametry**:
  - **Wymagane**:
    - `composition_id` (w ścieżce): numeryczny identyfikator kompozycji. Musi być dodatnią liczbą całkowitą.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
Implementacja nie wymaga definiowania nowych typów DTO ani Command Model dla kontraktu API. Wewnętrznie, warstwa serwisowa będzie operować na typie `CompositionDto` z `src/types.ts` w celu weryfikacji właściciela.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - Kod statusu: `204 No Content`
  - Treść odpowiedzi: Pusta.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy `composition_id` jest nieprawidłowe (np. nie jest liczbą, jest ujemne).
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony (obsługiwane przez middleware).
  - `403 Forbidden`: Gdy użytkownik próbuje usunąć kompozycję, której nie jest właścicielem.
  - `404 Not Found`: Gdy kompozycja o podanym `composition_id` nie istnieje.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera (np. problem z bazą danych).

## 5. Przepływ danych
1. Klient wysyła żądanie `DELETE` na adres `/api/compositions/{id}`.
2. Middleware Astro przechwytuje żądanie, weryfikuje token JWT użytkownika i umieszcza w kontekście (`context.locals`) klienta Supabase oraz dane użytkownika. Jeśli uwierzytelnianie zawiedzie, zwraca `401 Unauthorized`.
3. Handler endpointu w Astro (`src/pages/api/compositions/[composition_id].ts`) odczytuje `composition_id` z parametrów ścieżki.
4. Następuje walidacja `composition_id` za pomocą Zod, aby upewnić się, że jest to dodatnia liczba całkowita. W przypadku błędu walidacji, zwracany jest `400 Bad Request`.
5. Handler wywołuje funkcję `compositionService.deleteComposition`, przekazując `compositionId`, `userId` (z `context.locals.user`) oraz klienta Supabase (`context.locals.supabase`).
6. Funkcja `deleteComposition` w `composition.service.ts` wykonuje następujące kroki:
   a. Wysyła zapytanie `SELECT` do bazy danych, aby pobrać kompozycję o podanym `composition_id`.
   b. Jeśli kompozycja nie zostanie znaleziona, zwraca status błędu `not_found`.
   c. Jeśli kompozycja zostanie znaleziona, porównuje jej pole `user_id` z `userId` przekazanym do funkcji.
   d. Jeśli `user_id` się nie zgadzają, zwraca status błędu `forbidden`.
   e. Jeśli `user_id` się zgadzają, wykonuje operację `DELETE` na tabeli `compositions`, używając `composition_id`.
   f. Zwraca status sukcesu lub błędu bazy danych.
7. Handler w Astro na podstawie obiektu zwróconego z serwisu mapuje wynik na odpowiedni kod statusu HTTP (`204`, `403`, `404`, `500`) i wysyła odpowiedź do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą ważnego tokenu JWT. Jest to realizowane przez globalny middleware Astro.
- **Autoryzacja**: Kluczowym elementem jest weryfikacja własności kompozycji. Logika biznesowa w warstwie serwisu musi bezwzględnie sprawdzać, czy `composition.user_id` jest zgodne z ID uwierzytelnionego użytkownika. Mechanizm RLS (Row Level Security) w Supabase stanowi dodatkową, głęboką warstwę obrony.
- **Walidacja danych wejściowych**: Parametr `composition_id` musi być rygorystycznie walidowany, aby zapobiec błędom przetwarzania i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK je mityguje).

## 7. Rozważania dotyczące wydajności
- Operacje `SELECT` i `DELETE` będą wykonywane na kolumnie `composition_id`, która jest kluczem głównym (`PRIMARY KEY`), co gwarantuje bardzo wysoką wydajność tych zapytań.
- Nie przewiduje się problemów z wydajnością dla tego punktu końcowego przy normalnym użytkowaniu.

## 8. Etapy wdrożenia
1. **Utworzenie pliku endpointu**: Stwórz nowy plik `src/pages/api/compositions/[composition_id].ts`.
2. **Implementacja handlera `DELETE`**: W nowo utworzonym pliku zaimplementuj funkcję `DELETE` (`export async function DELETE({ params, locals }: APIContext)`).
3. **Walidacja parametru**: Wewnątrz handlera `DELETE` dodaj logikę walidacji parametru `params.composition_id` przy użyciu biblioteki Zod.
4. **Rozszerzenie serwisu**: W pliku `src/lib/services/composition.service.ts` dodaj nową publiczną metodę `deleteComposition`.
5. **Implementacja logiki usuwania**: Zaimplementuj w `deleteComposition` logikę opisaną w sekcji "Przepływ danych", obejmującą wyszukanie rekordu, weryfikację właściciela i usunięcie. Funkcja powinna zwracać ustrukturyzowaną odpowiedź, np. `{ success: true }` lub `{ success: false, errorType: 'notFound' | 'forbidden' }`.
6. **Integracja handlera z serwisem**: W handlerze `DELETE` wywołaj nową funkcję z serwisu, przekazując niezbędne dane (`compositionId`, `user.id`, `supabase`).
7. **Obsługa odpowiedzi**: Na podstawie obiektu zwróconego z serwisu, zaimplementuj w handlerze zwracanie odpowiednich kodów statusu HTTP.
8. **Testowanie**: Dodaj testy jednostkowe dla nowej funkcji w serwisie oraz testy integracyjne dla całego punktu końcowego, uwzględniając wszystkie ścieżki sukcesu i błędów. 