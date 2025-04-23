Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>
# Aplikacja - PizzaComposer (MVP)

## Główny problem
Tworzenie coraz to nowych kompozycji pizzy jest trudne i wymaga dużego doświadczenia pizzaiolo. Ocena oraz powrót do stworzonych przepisów wymaga sumienności i regularnego prowadzenia notatek. Aplikacja generuje nowe kompozycje pizzy oraz pozwala na ich ocene i ponowne wykorzystanie. 

## Najmniejszy zestaw funkcjonalności
- Generatywne tworzenie nowych przepisów na kompozycję pizzy przy pomocy AI.
- Użytkownik podaje jako dane wejściowe dla AI od 1 do 3 składników bazowych, AI generuje resztę składników kompozycji.
- Kompozycja składa się z maksymalnie 10 składników.
- AI podaje składniki w kolejności nakładania ich na pizzę.
- Użytkownik ma mozliwość stworzenia swojej kompozycji.
- Prosty system kont użytkowników do powiązania użytkownika z kompozycjami.
- Zapisywanie, przeglądanie oraz w razie potrzeby kasowanie kompozycji na pizzę.
- Ocena kompozycji na pizzę w skali 1 - 6 gwiazdek.
- Dodanie do przepisu zdjęcia wypieku przy pomocy prostegu uploadu.

## Co NIE wchodzi w zakres MVP
- Udostępnianie kompozycji dla innych użytkowników.
- Funkcje społecznościowe.
- Generowanie przepisu na ciasto oraz porad dotyczących gotowania.

## Kryteria sukcesu
- Użytkownik wygenerował przynajmniej 10 kompozycji pizzy.
- Użytkownik zuploadował przynajmniej 3 zdjęcia upieczonej pizzy.
</project_description>

<project_details>

<conversation_summary>
<decisions>
1.  Aplikacja wykorzysta zewnętrzne API AI (Google Gemini lub OpenAI) do generowania kompozycji pizzy.
2.  AI będzie zwracać listę składników w formacie JSON (tablica stringów), odzwierciedlającą kolejność nakładania na pizzę.
3.  AI ma generować sensowne i jadalne kompozycje, bazując na 1 do 3 składnikach wejściowych podanych przez użytkownika.
4.  Dane wejściowe dla AI (składniki bazowe) będą wprowadzane w 3 polach tekstowych bez walidacji.
5.  Użytkownicy będą mogli tworzyć kompozycje ręcznie, wpisując składniki w 10 dedykowanych, etykietowanych polach tekstowych, bez walidacji.
6.  System kont użytkowników będzie prosty, oparty na emailu i haśle, z zastosowaniem standardowych zasad bezpieczeństwa.
7.  Zdjęcia (max 2000x2000px, 2.5MB) będą przechowywane w Supabase Storage, dostęp przez API z podstawowymi zabezpieczeniami.
8.  Kryteria sukcesu (10 wygenerowanych kompozycji, 3 uploadowane zdjęcia na użytkownika) będą mierzone za pomocą prostych liczników zdarzeń per użytkownik.
9.  Aplikacja nie będzie używać predefiniowanej listy składników; będzie przetwarzać i przechowywać czysty tekst wprowadzony przez użytkownika, akceptując potencjalne niespójności.
10. Nie przewiduje się aktywnej mitygacji generowania niesmacznych przepisów przez AI poza możliwością ich odrzucenia lub niskiej oceny przez użytkownika. Użytkownik może odrzucić (nie zapisać) wygenerowaną kompozycję.
11. Platformą docelową jest aplikacja webowa.
12. Zasoby projektowe to jeden deweloper wspomagany przez AI. Potwierdzono konieczność dalszej priorytetyzacji.
13. System ocen (1-6 gwiazdek) nie będzie wpływał na przyszłe generowanie kompozycji przez AI w ramach MVP.
14. W przypadku błędów (np. API, uploadu) użytkownikowi zostanie wyświetlony ogólny komunikat błędu serwera.
15. AI w przypadkach brzegowych (np. mało składników, duplikaty) po prostu zwróci wynik, który zostanie pokazany użytkownikowi.
16. Składniki bazowe podane AI nie będą zapisywane osobno, staną się częścią opisu wygenerowanej kompozycji.
17. Koszty API AI pokrywa inwestor.
</decisions>

<matched_recommendations>
1.  Dokładnie zdefiniować w PRD przepływy użytkownika dla kluczowych funkcji (rejestracja, generowanie AI, tworzenie ręczne, zapis, przeglądanie, ocena, upload, usuwanie).
2.  Stworzyć makiety (wireframes) lub prototypy kluczowych ekranów, aby zwizualizować interfejs użytkownika, zwłaszcza dla wprowadzania składników i ich listowania.
3.  W PRD szczegółowo opisać logikę działania generatora AI: strukturę promptu, przetwarzanie wejść tekstowych, oczekiwany format wyjściowy JSON.
4.  Jasno określić strukturę danych dla zapisywanych kompozycji (lista stringów dla składników, ocena, link do zdjęcia w Supabase, ID użytkownika).
5.  Zdefiniować wymagania niefunkcjonalne: wydajność (akceptowalny czas odpowiedzi AI), podstawowe bezpieczeństwo (konta, dostęp do storage).
6.  Uwzględnić w PRD plan zbierania danych analitycznych: zdefiniować konkretne zdarzenia do logowania dla pomiaru kryteriów sukcesu.
7.  Opisać strategię obsługi i przechowywania zdjęć: Supabase Storage, limity rozmiaru/formatu, podstawowe zasady dostępu.
8.  Rozważyć zaplanowanie testów użyteczności, nawet prostych, w celu weryfikacji przepływów i łatwości obsługi interfejsu (szczególnie wprowadzania tekstowego).
9.  Udokumentować zależności zewnętrzne (wybrane API AI, Supabase) i potencjalne ryzyka (np. jakość odpowiedzi AI, brak walidacji).
10. Opracować treść ogólnego komunikatu o błędzie oraz rozważyć dodanie wskaźnika ładowania podczas generowania przez AI.
</matched_recommendations>

<prd_planning_summary>
Aplikacja PizzaComposer (MVP) ma na celu rozwiązanie problemu trudności w tworzeniu i zarządzaniu nowymi kompozycjami pizzy. Będzie to aplikacja webowa.
**Główne Wymagania Funkcjonalne:**
*   Generowanie kompozycji pizzy przez AI (Gemini/OpenAI) na podstawie 1-3 składników bazowych podanych przez użytkownika (tekstowo, bez walidacji). Wynik w formie listy JSON (max 10 składników w kolejności).
*   Ręczne tworzenie kompozycji przez użytkownika za pomocą 10 pól tekstowych (bez walidacji).
*   Prosty system kont użytkowników (email/hasło).
*   Zapisywanie, przeglądanie, ocenianie (1-6 gwiazdek) i usuwanie kompozycji powiązanych z użytkownikiem.
*   Możliwość uploadu zdjęcia (max 2000x2000, 2.5MB) do kompozycji, przechowywanego w Supabase Storage.
*   Brak funkcji społecznościowych, udostępniania, generowania przepisów na ciasto.

**Kluczowe Historie Użytkownika / Ścieżki Korzystania:**
1.  *Rejestracja/Logowanie:* Użytkownik tworzy konto lub loguje się przy użyciu emaila i hasła.
2.  *Generowanie AI:* Użytkownik wprowadza 1-3 składniki bazowe, inicjuje generowanie, otrzymuje listę max 10 składników, decyduje o zapisaniu/odrzuceniu, ocenia zapisaną kompozycję, opcjonalnie dodaje zdjęcie.
3.  *Tworzenie Ręczne:* Użytkownik wprowadza do 10 składników w dedykowanych polach tekstowych, zapisuje kompozycję, opcjonalnie dodaje zdjęcie.
4.  *Zarządzanie Kompozycjami:* Użytkownik przegląda swoje zapisane kompozycje, może je ocenić, usunąć lub obejrzeć powiązane zdjęcie.

**Kryteria Sukcesu i Mierzenie:**
*   Sukces MVP: Użytkownik wygenerował minimum 10 kompozycji, użytkownik załadował minimum 3 zdjęcia.
*   Mierzenie: Proste liczniki zdarzeń per użytkownik (np. `composition_generated_count`, `photo_uploaded_count`) zapisywane w logach.

**Ważne Założenia i Ograniczenia:**
*   Platforma: Web.
*   Zasoby: 1 deweloper + AI. Wymaga priorytetyzacji.
*   Brak walidacji danych wejściowych od użytkownika (składniki).
*   Brak predefiniowanej listy składników.
*   Podstawowe bezpieczeństwo i ogólne komunikaty błędów.
*   Ocena nie wpływa na AI.
*   Zależności: API AI, Supabase Storage.

</prd_planning_summary>

<unresolved_issues>
1.  **Szczegóły Promptu AI:** Dokładna konstrukcja promptu do API AI, aby zapewnić zwracanie sensownych, jadalnych składników w poprawnym formacie JSON i kolejności, respektując składniki wejściowe i limit 10 pozycji.
2.  **Ryzyko Braku Walidacji:** Chociaż zaakceptowane dla MVP, brak walidacji i predefiniowanej listy stwarza ryzyko niskiej jakości danych, błędów w działaniu AI i potencjalnie złego UX. Należy to monitorować.
3.  **Specyfikacja "Standardowego Bezpieczeństwa":** Wymaga doprecyzowania, jakie konkretnie środki bezpieczeństwa zostaną zastosowane dla kont użytkowników i dostępu do Supabase Storage.
4.  **Struktura Logów Zdarzeń:** Jak dokładnie będą wyglądać logi zdarzeń/liczniki używane do śledzenia kryteriów sukcesu?
5.  **UI/UX dla List Składników:** Jak dokładnie będą prezentowane listy składników (generowane i wprowadzane ręcznie) w interfejsie użytkownika?
6.  **Priorytetyzacja MVP:** Biorąc pod uwagę ograniczone zasoby, które funkcje są absolutnym minimum, a które mogą zostać uproszczone lub odłożone, jeśli zajdzie taka potrzeba?
</unresolved_issues>
</conversation_summary>
</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:
- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( ** ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}
## 1. Przegląd produktu
## 2. Problem użytkownika
## 3. Wymagania funkcjonalne
## 4. Granice produktu
## 5. Historyjki użytkowników
## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md