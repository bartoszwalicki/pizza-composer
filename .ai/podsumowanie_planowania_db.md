<conversation_summary>
<decisions>
1. Użytkownicy będą identyfikowani przez adres email, który jednocześnie pełni rolę nazwy użytkownika.  
2. Do rozróżnienia kompozycji generowanych przez AI od wprowadzanych ręcznie zostanie zastosowana boolean flaga (np. is_ai_generated).  
3. Składniki kompozycji będą przechowywane w formie tablicy tekstowej (text[]) z ograniczeniem do maksymalnie 10 elementów.  
4. Ocena kompozycji (rating) zostanie przechowywana jako typ liczbowy (integer) z ograniczeniem CHECK, aby wartość mieściła się w przedziale 1-6.  
5. Każda kompozycja będzie posiadać kolumnę created_at przechowującą datę utworzenia.  
6. Indeksy optymalizujące zapytania będą oparte na kolumnach user_id oraz created_at w tabeli kompozycji.  
7. Polityka bezpieczeństwa na poziomie wierszy (RLS) zostanie wdrożona, opierając się na porównaniu user_id z kontekstem autoryzacji (np. Supabase Auth).
</decisions>

<matched_recommendations>
1. Utworzyć tabelę „users” z kolumną email jako PRIMARY KEY, dodatkowym polem registration_date oraz licznikami zdarzeń (composition_generated_count, photo_uploaded_count).  
2. Utworzyć tabelę „compositions” z kolumnami: composition_id (PRIMARY KEY), user_id (FOREIGN KEY do tabeli users, oparte na email), ingredients (text[] z CHECK ograniczającym liczbę elementów do 10), rating (integer z CHECK dla zakresu 1-6), composition_type (boolean), created_at (timestamp with time zone) oraz opcjonalnym photo_url.  
3. Wdrożyć politykę RLS na tabeli „compositions”, aby zapewnić, że użytkownicy mają dostęp tylko do swoich danych.  
4. Zaimplementować indeksy na kolumnach user_id oraz kompozytowy indeks na (user_id, created_at) w tabeli „compositions” dla optymalizacji zapytań.
5. Utworzyć tabele generation_log z kolumnami generation_id, generation_duration, user_id (FOREIGN KEY do tabeli users), composition_id (FOREIGN KEY do tabeli compositions)
</matched_recommendations>

<database_planning_summary>
Główne wymagania dotyczące schematu bazy danych obejmują identyfikację użytkowników przez email oraz konieczność odróżnienia kompozycji generowanych przez AI i wprowadzanych ręcznie. Kluczowe encje to:
• Użytkownicy (users) – z unikalnym adresem email, datą rejestracji oraz licznikami zdarzeń.  
• Kompozycje (compositions) – powiązane z użytkownikami poprzez FOREIGN KEY, zawierające tablicę składników, ocenę, flagę boolean określającą sposób tworzenia, datę utworzenia oraz opcjonalny link do zdjęcia.
Relacje między encjami są realizowane przez powiązanie kompozycji z użytkownikami bazujące na adresie email.  
Ważne kwestie dotyczące bezpieczeństwa obejmują wdrożenie RLS, które ograniczy widoczność rekordów do właściciela (użytkownika), a skalowalność zapewniona jest przez optymalne indeksowanie kolumn user_id oraz created_at.
</database_planning_summary>

<unresolved_issues>
Brak nierozwiązanych kwestii – wszystkie aspekty projektowe niezbędne do fazy MVP zostały omówione.
</unresolved_issues>
</conversation_summary>
