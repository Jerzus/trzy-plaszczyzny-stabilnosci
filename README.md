# Trzy płaszczyzny stabilności

Własny projekt interaktywnych materiałów do nauki teorii sterowania ISD na PG.

Interaktywny symulator do analizy i syntezy układów regulacji, podzielony na cztery
karty w stylu kart przeglądarki:

- **Analiza częstotliwościowa** — jedna transmitancja układu otwartego `G_o(s)`,
  oglądana równocześnie jako **linie pierwiastkowe** (wędrówka biegunów zamkniętych
  przy zmianie wzmocnienia), **charakterystyki Bodego** (moduł i faza, z odczytem
  `ω_c`, `ω_180`, `PM`, `GM`) i **hodograf Nyquista** (pełny obraz konturu Cauchy'ego
  z domknięciem wokół biegunów w zerze, punktem krytycznym `(−1, j0)` i liczbą okrążeń).
  Kryterium Nyquista `Z = N + P` liczone jest numerycznie z przyrostu argumentu
  `1 + G_o(s)` wzdłuż całego konturu, więc działa też dla układów nieminimalnofazowych,
  z biegunami w prawej półpłaszczyźnie i z opóźnieniem transportowym. Hodograf jest
  rozpisany na **etapy rysowania ręcznego** — patrz niżej.
- **Routh–Hurwitz** — warunek konieczny (znaki współczynników) i pełna tablica Routha
  dla bieżącego `K`, z krzyżową kontrolą względem `Z` z konturu Nyquista; oraz
  przedziały `K`, dla których układ zamknięty jest stabilny, wyznaczone symbolicznie
  (tablica Routha liczona jako funkcje wymierne `K`, granice — z pierwiastków liczników
  pierwszej kolumny).
- **Schemat blokowy** — rysowany jako prawdziwy schemat (sumatory ze znakami, strzałki,
  gałąź równoległa nad ścieżką, sprzężenie zwrotne pod nią). Bloki przeciąga się myszą
  wprost na rysunku: kolejność w szeregu można zmienić, a `G(s)` się nie zmieni — to
  naoczny dowód przemienności iloczynu. Kliknięcie bloku otwiera edycję typu i wartości;
  wypadkowe `G(s)` przenosi się jednym kliknięciem do kart Analiza i Routh–Hurwitz.
- **Model stanowy · RLC** — dwukierunkowa konwersja transmitancja ⟷ model stanowy
  (TF→SS przez postać sterowalną, SS→TF przez algorytm Faddeeva–LeVerriera) rzędu
  do 4, rysowana dodatkowo jako **schemat symulacyjny**: łańcuch integratorów ze
  współczynnikami `aᵢ` w sprzężeniach i `bᵢ` w torach w przód. Do tego siedem obwodów
  RLC/RC/RL rysowanych prawdziwymi symbolami elektrycznymi (rezystor, cewka,
  kondensator, węzły, zaciski `u₁`/`u₂`), z transmitancją i modelem stanowym
  wyprowadzonymi z równań obwodu.

## Hodograf krok po kroku: P(ω), Q(ω) i etapy konturu

Karta Analiza pokazuje hodograf tak, jak wyprowadza się go na kartce.

**Krok 1 — rozdzielenie na P i Q.** Po podstawieniu `s = jω` mianownik jest
zespolony, więc mnożymy licznik i mianownik przez sprzężenie mianownika:

```
G_o(jω) = (A + jB)/(C + jD) = (A + jB)(C − jD)/(C² + D²)
P(ω) = (A·C + B·D)/(C² + D²)      Q(ω) = (B·C − A·D)/(C² + D²)
```

`A`, `B`, `C`, `D` to wielomiany rzeczywiste w `ω`, powstałe z podstawienia
`s = jω` (`j^k` cykluje `1, j, −1, −j`, więc potęgi parzyste dają część
rzeczywistą, nieparzyste — urojoną). Wszystkie cztery, a także liczniki `P` i `Q`
oraz wspólny mianownik `C² + D²`, są wypisane w karcie w postaci jawnej.

Ponieważ to zwykła arytmetyka wielomianów, kilka wielkości wychodzi **dokładnie**,
a nie z przeszukiwania siatki częstotliwości:

| wielkość | równanie |
|---|---|
| `ω_180` i `Re G` w tym punkcie | dodatnie pierwiastki licznika `Q(ω) = 0` |
| `ω_c` i `PM` | dodatnie pierwiastki `A² + B² − C² − D² = 0` (czyli `\|G\| = 1`) |
| asymptota pionowa `Re = lim_{ω→0} P(ω)` | iloraz najniższych potęg `ω` licznika i mianownika |
| kąt dojścia do zera | `−90°·(n − m)` |

Dla `10/[s(s+1)(s+2)]` daje to `P = −30ω²/(ω⁶ + 5ω⁴ + 4ω²)`,
`Q = (10ω³ − 20ω)/(ω⁶ + 5ω⁴ + 4ω²)`, stąd `ω_180 = √2`, `P(ω_180) = −5/3`
i asymptota `Re = −7,5` — dokładnie wyniki z instrukcji.
Moduł nie zależy od opóźnienia (`|e^{-jωT_d}| = 1`), więc pierwiastki dla `ω_c`
pozostają dokładne również przy `T_d > 0`; `ω_180` — nie, bo faza się przesuwa.

**Krok 2 — etapy konturu.** Liczba etapów zależy wyłącznie od tego, czy `G_o(s)`
ma miejsce zerowe w `s = 0`: biegun w mianowniku (`ν`) albo zero w liczniku (`μ`).
Kontur Cauchy'ego nie może przez taki punkt przejść, więc omija go wcięciem
`s = ε·e^{jθ}`, `ε → 0` — przechodzi nieskończenie blisko `(0, j0)`, ale po stronie
prawej półpłaszczyzny, przez co biegun w zerze zostaje **na zewnątrz** konturu i nie
wlicza się do `P`. Wcięcie dokłada dwa etapy:

| | ν = μ = 0 — trzy etapy | ν > 0 lub μ > 0 — pięć etapów |
|---|---|---|
| 1 | `s = jω`, `ω: 0 → +∞` | górny łuk wcięcia, `θ: 0° → +90°` |
| 2 | `s = R·e^{jθ}`, `R → ∞`, `θ: +90° → −90°` | `s = jω`, `ω: 0⁺ → +∞` |
| 3 | `s = jω`, `ω: −∞ → 0` | `s = R·e^{jθ}`, `R → ∞`, `θ: +90° → −90°` |
| 4 | | `s = jω`, `ω: −∞ → 0⁻` |
| 5 | | dolny łuk wcięcia, `θ: −90° → 0°` |

Kolejność jest kolejnością obchodzenia konturu, startując od `s = +ε` na osi
rzeczywistej. Obrazem wcięcia jest łuk o promieniu `|c|·ε^{−d}`, gdzie
`d = ν − μ`, a `c = lim_{s→0} s^d·G_o(s)`; argument zmienia się o `−d·180°` na
całym wcięciu, po `−d·90°` na każdą połówkę. Dla `d > 0` promień dąży do
nieskończoności — i to właśnie ten łuk wnosi okrążenia punktu `(−1, j0)`
(klasyczne `N = 2` dla `10/[s(s+1)(s+2)]` bierze się w całości z niego).

**Rysunek.** Żeby hodograf domykał się na ekranie, wszystko poza okręgiem
`0,9·R_widoku` jest rzutowane promieniście na ten okrąg: cała nieskończoność
płaszczyzny `G` zwija się w jeden „horyzont”. Wewnątrz horyzontu krzywa jest
narysowana bez żadnych zniekształceń; fragmenty zwinięte rysowane są cienką,
bladą kreską, a łuki wcięcia — przerywaną linią bursztynową, z zachowanym
dokładnym kątem i zwrotem. Etapy są ponumerowane na wykresie tymi samymi
numerami co w tabeli. Bez tego domknięcia krzywa jest otwarta i okrążeń punktu
krytycznego po prostu nie da się policzyć — a to najczęstszy błąd przy
rysowaniu ręcznym.

## Rozkład Bodego na składniki

Wykres Bodego rysuje każdy czynnik osobno, linią przerywaną we własnym kolorze —
tak, jakby ten czynnik występował sam. Pod wykresem wypisane są obie sumy,
`20·log₁₀|G(jω)|` w dB oraz `arg G(jω)` w stopniach, a każdy wyraz jest opatrzony
tym samym numerem i kolorem co odpowiadająca mu krzywa.

Czynniki sprowadzane są do postaci czasowej `(1 + τjω)` używanej na wykładzie, a
stałe wyciągnięte przed nawias zbierane są w jednym składniku `k`. Dla przykładu
z wykładu `G(s) = 5(s+10)/((s−0,2)(s+100))` daje to dokładnie
`k = −2,5`, `+(1 + 0,1jω)`, `−(1 − 5jω)`, `−(1 + 0,01jω)`.

Poprawność rozkładu jest sprawdzana numerycznie: suma składników musi odtworzyć
krzywą wypadkową co do bitu, również dla par zespolonych, biegunów w prawej
półpłaszczyźnie, ujemnego `K` i opóźnienia transportowego.

## Tryb wyjaśnień

Przełącznik **Tryb wyjaśnień** w nagłówku uaktywnia warstwę dydaktyczną. Każda wyliczona
liczba, każdy zaznaczony punkt i każda linia na wykresie stają się klikalne i pokazują:

- co dana wielkość znaczy fizycznie,
- wzór ogólny w notacji z karty wzorów przedmiotu,
- przebieg obliczenia rozbity na czynniki, z podstawionymi bieżącymi wartościami,
- wynik i jego interpretację, wraz z ostrzeżeniami o warunkach stosowalności.

Objęte są między innymi: `K`, `T_d`, `ν`, `P`, `Z`, `N`, `ω_c` (`ω_gc`), `ω_180` (`ω_pc`),
zapas fazy, zapas wzmocnienia `M_g`, przecięcie z osią Re, `k_p`, bieguny i zera układu
otwartego, bieguny układu zamkniętego (z `ζ`, `ω_n`, `M_p` i czasami ustalania), asymptoty
i punkt `δ`, punkty rozejścia się linii, odcinki na osi rzeczywistej, obie krzywe Bodego,
linie odniesienia 0 dB i −180°, pulsacje łamania, punkt krytyczny `(−1, j0)`, obie gałęzie
hodografu, oba łuki wcięcia i okrąg jednostkowy, a także rozkład na `P(ω)` i `Q(ω)`,
rzędy `ν`, `μ`, `d`, współczynnik `c` i kąt łuku wcięcia, asymptota pionowa, punkt
startowy `A = G_o(0)`, obraz dużego łuku domykającego, kąt dojścia do zera oraz oba
dokładne równania pierwiastkowe (`Q(ω) = 0` i `|G_o| = 1`).

W tym trybie wykres linii pierwiastkowych dorysowuje też asymptoty, punkt `δ`, punkty
rozejścia i odcinki na osi rzeczywistej, a wykres Bodego — znaczniki pulsacji łamania.

## Uruchomienie

**Wersja online: https://jerzus.github.io/trzy-plaszczyzny-stabilnosci/**

**Lokalnie** — potrzebny jest dowolny serwer statyczny, bo kod jest podzielony na
moduły ES, a przeglądarki blokują je na `file://`:

```
python -m http.server 8765
```

i otwórz `http://localhost:8765`. Nadal **brak zależności i brak budowania** —
przeglądarka ładuje moduły bezpośrednio.

## Struktura

`index.html` (sama struktura), `styles.css` oraz `src/` — 27 modułów ES ułożonych
w warstwy, bez ani jednego cyklu w grafie zależności:

| warstwa | moduły |
|---|---|
| bez zależności | `complex.js`, `format.js`, `dom.js` |
| matematyka | `poly.js`, `model.js`, `nyquist-pq.js`, `analysis.js`, `routh.js`, `statespace.js`, `blocks.js`, `circuits.js`, `bode-terms.js` |
| rysowanie | `plot-core.js`, `plot-locus.js`, `plot-nyquist.js`, `plot-bode.js`, `fig-common.js`, `fig-block.js`, `fig-sim.js`, `fig-circuit.js` |
| panele | `panel-tf.js`, `panel-nyquist.js`, `panel-routh.js`, `panel-ss.js`, `panel-block.js` |
| wyjaśnienia | `explain.js` (dyspozytor) + `explain-helpers.js` i pięć tablic tematycznych `explain-*.js` |
| wejście | `app.js` — okablowanie, karty, autotest |

Reguła jest jedna: moduł niższej warstwy nigdy nie sięga do wyższej. Dlatego
rysunki dostają stan jako argument (`blockSvg(sel)`, `rlcSchematic(t, vals)`,
`simDiagram(tf)`) zamiast czytać go z panelu, a `adoptTF` nie przerysowuje
interfejsu — robi to wywołujący.

## Co można ustawiać

| Parametr | Zakres |
|---|---|
| wzmocnienie `K` | 0,01 … 1000, ze znakiem |
| rząd astatyzmu `ν` | 0 … 3 |
| opóźnienie transportowe `T_d` | 0 … 2 s |
| bieguny i zera | dowolna liczba, rzeczywiste lub pary sprzężone, włączane pojedynczo |

Reguły geometryczne linii pierwiastkowych (odcinki na osi rzeczywistej, `α = n − m`
asymptot, `δ = (Σpᵢ − Σzᵢ)/(n − m)`, punkty z równania `D(s)N′(s) − D′(s)N(s) = 0`)
liczone są zgodnie z kartą wzorów przedmiotu.

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

Karta Routha–Hurwitza jest niezależną kontrolą tych samych układów: dla
`10/[s(s+1)(s+2)]` tablica daje pierwszą kolumnę `1; 3; −4/3; 10` (dwie zmiany
znaku, `Z = 2`) i przedział stabilności `K ∈ (0, 6)` — dokładnie tak, jak liczy
to instrukcja źródłowa. Karta model stanowy ⟷ transmitancja jest weryfikowana
pełnym cyklem TF → SS → TF (postać sterowalna, potem Faddeev–LeVerrier), który
musi odtworzyć wejściowe współczynniki co do siódmego miejsca po przecinku.

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
