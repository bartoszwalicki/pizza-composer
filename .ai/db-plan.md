# Schemat bazy danych - PizzaComposer

## 1. Tabele

### 1.1 Tabela: users

This table is managed by Supabase Auth.

- `id` UUID PRIMARY KEY
- `email` TEXT NOT NULL UNIQUE
- `registration_date` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `composition_generated_count` INTEGER NOT NULL DEFAULT 0
- `photo_uploaded_count` INTEGER NOT NULL DEFAULT 0

### 1.2 Tabela: compositions
- `composition_id` SERIAL PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `ingredients` TEXT[] NOT NULL CHECK (array_length(ingredients, 1) <= 10)
- `rating` INTEGER CHECK (rating BETWEEN 1 AND 6)
- `composition_type` ENUM NOT NULL DEFAULT manual
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `photo_url` TEXT

#### Indeksy:
- Indeks na kolumnie `user_id`
- Kompozytowy indeks na (`user_id`, `created_at`)

#### RLS:
- Włączone: ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
- Przykładowa polityka RLS:
  ```sql
  CREATE POLICY user_isolation ON compositions
      USING (user_id = current_setting('app.current_user'));
  ```

### 1.3 Tabela: generation_log
- `generation_id` SERIAL PRIMARY KEY
- `generation_duration` INTERVAL NOT NULL
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `composition_id` INTEGER NOT NULL REFERENCES compositions(composition_id) ON DELETE CASCADE

## 2. Relacje między tabelami
- `users` (1) ⇔ (N) `compositions` (jeden użytkownik może mieć wiele kompozycji)
- `compositions` (1) ⇔ (1) `generation_log` (dla jednej kompozycji jest jeden log generacji)
- `users` (1) ⇔ (N) `generation_log` (jeden użytkownik może mieć wiele logów generacji)

## 3. Indeksy
- Na tabeli `compositions`:
  - Indeks na `user_id`
  - Kompozytowy indeks na (`user_id`, `created_at`) dla optymalizacji zapytań dotyczących użytkownika i daty utworzenia

## 4. Zasady PostgreSQL (RLS)
- W tabeli `compositions` RLS jest włączone, aby ograniczyć dostęp rekordów tylko do właściciela.
- Przykładowa polityka RLS:
  ```sql
  ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_isolation ON compositions
      USING (user_id = current_setting('app.current_user'));
  ```

## 5. Dodatkowe uwagi
- Schemat został zaprojektowany z myślą o skalowalności i wydajności poprzez odpowiednie indeksowanie.
- Ograniczenie dla tablicy `ingredients` gwarantuje, że kompozycja nie przekroczy 10 składników.
- Kolumna `composition_type` (ENUM) określa, czy kompozycja została wygenerowana przez AI (ai-generated) czy wprowadzona ręcznie (manual).
- Użycie kluczy obcych z kaskadowym usuwaniem zapewnia spójność danych w przypadku usunięcia użytkownika lub kompozycji. 