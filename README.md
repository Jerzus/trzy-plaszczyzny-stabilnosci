# Trzy płaszczyzny stabilności

Projekt na przedmiot **Inżynieria Systemów Dynamicznych** — Politechnika Gdańska.

Interaktywny symulator do analizy stabilności układów regulacji. Jedna transmitancja
układu otwartego `G_o(s)`, oglądana równocześnie w trzech płaszczyznach:

- **linie pierwiastkowe** — wędrówka biegunów układu zamkniętego przy zmianie wzmocnienia,
- **charakterystyki Bodego** — moduł i faza, z odczytem `ω_c`, `ω_180`, `PM`, `GM`,
- **hodograf Nyquista** — pełny obraz konturu Cauchy'ego z domknięciem wokół biegunów
  w zerze, punktem krytycznym `(−1, j0)` i liczbą okrążeń.

Kryterium Nyquista `Z = N + P` liczone jest numerycznie z przyrostu argumentu
`1 + G_o(s)` wzdłuż całego konturu, więc działa też dla układów nieminimalnofazowych,
z biegunami w prawej półpłaszczyźnie i z opóźnieniem transportowym.

## Uruchomienie

**Wersja online: https://jerzus.github.io/trzy-plaszczyzny-stabilnosci/**

Lokalnie — otwórz `index.html` w przeglądarce. Nic więcej — brak zależności, brak budowania,
brak serwera.

## Co można ustawiać

| Parametr | Zakres |
|---|---|
| wzmocnienie `K` | 0,01 … 1000, ze znakiem |
| rząd astatyzmu `ν` | 0 … 3 |
| opóźnienie transportowe `T_d` | 0 … 2 s |
| bieguny i zera | dowolna liczba, rzeczywiste lub pary sprzężone, włączane pojedynczo |

Sześć układów wzorcowych jest dostępnych jednym kliknięciem.

## Dokładność

Opóźnienie wchodzi **ściśle** do charakterystyk Bodego i hodografu Nyquista
(`e^{-sT_d}` liczone bezpośrednio). Na liniach pierwiastkowych jest przybliżone
aproksymacją Padégo pierwszego rzędu — równanie charakterystyczne z opóźnieniem
nie jest wielomianem.

Pierwiastki równania charakterystycznego liczy metoda Duranda–Kernera.

## Kontrola poprawności

Przy starcie uruchamiany jest zestaw asercji sprawdzających wyniki na trzech
układach o znanych rozwiązaniach analitycznych; rezultat trafia do konsoli
przeglądarki (`selftest: OK`).

| Układ | Oczekiwane |
|---|---|
| `10/[(s+1)(s+2)]` | ω_c = 2,759 · PM = 55,9° · GM = ∞ · Z = 0 |
| `10/[s(s+1)(s+2)]` | ω_180 = √2 · Re = −1,67 · ω_c = 1,80 · PM = −13° · Z = 2 |
| `−1/[s(s−1)]` | P = 1 · Z = 1 (uproszczone kryterium Bodego tu zawodzi) |

## Powstanie projektu

Kod powstał we współpracy z Claude (Anthropic), na podstawie specyfikacji, materiałów
dziedzinowych i weryfikacji numerycznej autora. Wkład AI jest widoczny w historii
repozytorium — commity noszą trailer `Co-Authored-By: Claude`.

Autor odpowiada za zakres i wymagania, decyzje projektowe, dobór metod numerycznych
oraz sprawdzenie wyników względem rozwiązań analitycznych (patrz *Kontrola poprawności*).

Uwaga prawna: zgodnie z aktualnym stanem prawa autorskiego w Polsce (art. 1 ust. 1
oraz art. 8 ust. 1 ustawy o prawie autorskim i prawach pokrewnych) i w USA
(wytyczne Copyright Office z 2023 r., *Thaler v. Perlmutter*) fragmenty wygenerowane
maszynowo mogą nie podlegać ochronie prawnoautorskiej. Licencja MIT obejmuje ten
wkład autorski, który ochronie podlega; w pozostałym zakresie nie rości sobie
uprawnień, których nie ma.

## Licencja

MIT — patrz [LICENSE](LICENSE).
