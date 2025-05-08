# Dokument wymagań produktu (PRD) - PizzaComposer

## 1. Przegląd produktu
PizzaComposer to aplikacja webowa typu MVP mająca na celu wspomóc tworzenie i zarządzanie kompozycjami pizzy. Aplikacja umożliwia generowanie nowych przepisów przy pomocy AI, a także ręczne tworzenie kompozycji. Kluczowymi funkcjami są:
- Generatywne tworzenie kompozycji pizzy na podstawie 1-3 składników bazowych, wykorzystujące zewnętrzne API AI. Wynik generowany jest w formacie JSON jako lista składników w kolejności nakładania.
- Możliwość ręcznego wpisywania składników pizzy za pomocą 10 dedykowanych pól tekstowych.
- Prosty system rejestracji i logowania oparty na emailu i haśle, dzięki któremu kompozycje są powiązane z kontem użytkownika.
- Zarządzanie zapisanymi kompozycjami: przegląd, usuwanie, ocena w skali od 1 do 6 gwiazdek.
- Upload zdjęć wypieku przechowywanych w Supabase Storage, przy ograniczeniach 2000x2000px i 2.5MB.
- Monitorowanie liczników zdarzeń takich jak liczba wygenerowanych kompozycji i przesłanych zdjęć.

## 2. Problem użytkownika
Tworzenie nowych, interesujących kompozycji pizzy jest skomplikowanym zadaniem wymagającym doświadczenia i precyzji. Pizzaiolo musi pamiętać o odpowiedniej kolejności nakładania składników, a także utrzymywać notatki z wcześniej stworzonych przepisów. Aplikacja PizzaComposer rozwiązuje ten problem, umożliwiając automatyczne generowanie przemyślanych kompozycji oraz przechowywanie i ocenę ulubionych kombinacji, co ułatwia podejmowanie decyzji oraz rozwija kreatywność w tworzeniu nowych przepisów.

## 3. Wymagania funkcjonalne
1. Generowanie kompozycji przez AI
   - Użytkownik wprowadza 1-3 składniki bazowe bez walidacji.
   - System wysyła zapytanie do zewnętrznego API AI z odpowiednio skonstruowanym promptem.
   - AI zwraca listę składników w formacie JSON, maksymalnie do 10 pozycji, w kolejności nakładania na pizzę.
   - Użytkownik może zaakceptować lub odrzucić wygenerowaną kompozycję.

2. Ręczne tworzenie kompozycji
   - Użytkownik ma do dyspozycji 10 pól tekstowych do ręcznego wpisywania składników.
   - Wprowadzone dane nie są walidowane i są zapisywane jako tekst.

3. Rejestracja i logowanie
   - Użytkownik może stworzyć konto lub się zalogować przy użyciu emaila i hasła.
   - System stosuje standardowe zasady bezpieczeństwa przy przechowywaniu danych uwierzytelniających.

4. Zarządzanie kompozycjami
   - Możliwość zapisywania, przeglądania, oceny (skala 1-6 gwiazdek) oraz usuwania kompozycji powiązanych z użytkownikiem.
   - Kompozycja zawiera listę składników, ocenę oraz opcjonalny link do zdjęcia.

5. Upload zdjęć
   - Użytkownik ma możliwość uploadu zdjęcia wypieku pizzy.
   - Zdjęcie musi spełniać ograniczenia rozdzielczości (max 2000x2000px) oraz rozmiaru (2.5MB).
   - Zdjęcia są przechowywane w Supabase Storage z podstawowymi zabezpieczeniami.

6. Liczniki zdarzeń
   - System rejestruje zdarzenia, takie jak liczba wygenerowanych kompozycji (`composition_generated_count`) i przesłanych zdjęć (`photo_uploaded_count`) dla celów analitycznych.

7. Logowanie szczegółów generacji AI
   - Dla każdej pomyślnie wygenerowanej kompozycji przez AI, system zapisuje szczegółowy log.
   - Log zawiera czas trwania procesu generacji (`generation_duration`), identyfikator użytkownika (`user_id`) oraz identyfikator powiązanej kompozycji (`composition_id`).
   - Dane te są wykorzystywane do analizy użycia funkcji AI oraz monitorowania jej wydajności.

## 4. Granice produktu
- Aplikacja nie umożliwia udostępniania kompozycji innym użytkownikom ani funkcji społecznościowych.
- Nie przewidziano generowania przepisu na ciasto czy udzielania porad kulinarnych.
- Brak walidacji danych wejściowych powoduje ryzyko niskiej jakości informacji, jednak akceptowane jest to dla MVP.
- Informacje wprowadzone przez użytkownika są zapisywane jako czysty tekst bez predefiniowanej listy składników.
- Uwierzytelnianie i bezpieczeństwo są oparte na standardowych zasadach, bez dodatkowych, zaawansowanych mechanizmów w ramach MVP.
- Zależności zewnętrzne to API AI (Google Gemini lub OpenAI) oraz Supabase Storage.

## 5. Historyjki użytkowników
US-001
Tytuł: Rejestracja i logowanie
Opis: Jako nowy użytkownik chcę zarejestrować się przy użyciu emaila i hasła, aby moje kompozycje były powiązane z kontem. Jako istniejący użytkownik chcę się zalogować, aby uzyskać dostęp do swoich zapisanych kompozycji.
Kryteria akceptacji:
- Użytkownik może zarejestrować konto podając email i hasło.
- System weryfikuje poprawność formatu emaila.
- Po rejestracji użytkownik może się zalogować i uzyskać dostęp do panelu zarządzania kompozycjami.
- Pojawiają się komunikaty o błędach przy niepoprawnych danych.

US-002
Tytuł: Generowanie kompozycji przez AI
Opis: Jako użytkownik chcę wprowadzić 1-3 składniki bazowe i uzyskać wygenerowaną kompozycję pizzy przez AI, aby szybko otrzymać propozycję przemyślanych kombinacji.
Kryteria akceptacji:
- Użytkownik wprowadza 1-3 składniki bazowe poprzez pola tekstowe.
- Po wywołaniu funkcji AI, system wyświetla listę składników jako ponumerowana lista, maksymalnie 10 pozycji, w kolejności nakładania.
- Użytkownik może zaakceptować lub odrzucić wygenerowaną kompozycję.
- W przypadku błędu API, użytkownik otrzymuje komunikat o problemie.

US-003
Tytuł: Ręczne tworzenie kompozycji
Opis: Jako użytkownik chcę móc ręcznie wprowadzić składniki pizzy w 10 dedykowanych polach tekstowych, aby tworzyć własne kompozycje.
Kryteria akceptacji:
- System udostępnia 10 pól tekstowych dla składników.
- Użytkownik może wpisać dowolny tekst w każdym polu bez walidacji.
- Po zapisaniu, kompozycja jest powiązana z kontem użytkownika.

US-004
Tytuł: Zarządzanie kompozycjami
Opis: Jako użytkownik chcę przeglądać, usuwać i oceniać zapisane kompozycje, aby móc efektywnie zarządzać swoimi przepisami.
Kryteria akceptacji:
- Użytkownik widzi listę swoich zapisanych kompozycji.
- System umożliwia usunięcie wybranej kompozycji.
- Użytkownik może ocenić kompozycję w skali od 1 do 6 gwiazdek.
- Lista kompozycji pokazuje szczegóły, takie jak lista składników i ewentualne zdjęcie.

US-005
Tytuł: Upload zdjęć do kompozycji
Opis: Jako użytkownik chcę móc dodać zdjęcie wypieku do mojej kompozycji, aby móc wizualnie udokumentować rezultat.
Kryteria akceptacji:
- Użytkownik może przesłać plik graficzny (np. jpg, png) o maksymalnym rozmiarze 2.5MB i rozdzielczości nie przekraczającej 2000x2000px.
- Po udanym uploadzie zdjęcie jest przechowywane w Supabase Storage.
- Zdjęcie pojawia się w szczegółach zapisanej kompozycji.

## 6. Metryki sukcesu
- Użytkownik wygenerował co najmniej 10 kompozycji przy użyciu funkcji AI.
- Użytkownik przesłał co najmniej 3 zdjęcia powiązane z zapisanymi kompozycjami.
- Licznik composition_generated_count osiąga wartość co najmniej 10, a photo_uploaded_count co najmniej 3 dla przeciętnego użytkownika.
- System zapewnia stabilność działania i wyświetla jasne komunikaty w przypadku wystąpienia błędów. 