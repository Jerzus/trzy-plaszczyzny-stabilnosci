import { C, D2, cabs, carg } from './complex.js';
import { fmt, fx, polyToHtml } from './format.js';
import { K, S } from './model.js';

/* Hodograf Nyquista. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

const ep = k => k === 1 ? '\u03b5' : '\u03b5^' + k;

/* Obie polowki wciecia roznia sie tylko zakresem kata theta, wiec opis
   powstaje z jednego szablonu. */
function arcEntry(half) {
  const up = half === 'górna';
  return (A, d, ctx) => {
    const p = A.plan;
    return {kind:'Kontur', title:(up? 'Górny' : 'Dolny')+' łuk wcięcia wokół s = 0',
      what:'Kontur Cauchy’ego nie może przechodzić przez biegun ani przez miejsce zerowe funkcji, więc punkt s = 0 omijamy półokręgiem s = ε·e^(jθ) przy ε → 0 — przechodzimy nieskończenie blisko, ale po stronie prawej półpłaszczyzny, dzięki czemu biegun w zerze zostaje NA ZEWNĄTRZ konturu i nie wlicza się do P. '
        + (up? 'Ta połówka biegnie od s = +ε na osi rzeczywistej do s = +jε i jest pierwszym etapem rysowania.'
             : 'Ta połówka biegnie od s = −jε z powrotem do s = +ε i zamyka cały kontur.'),
      formula:['w otoczeniu zera:  Gₒ(s) ≈ c · s^(−d),  d = ν − μ',
               'Gₒ(ε·e^(jθ)) = c·ε^(−d)·e^(−jdθ)',
               up? 'θ: 0° → +90°  ⇒  Δarg = −d·90°' : 'θ: −90° → 0°  ⇒  Δarg = −d·90°'],
      steps:[['ν, μ, d', p.nu+', '+p.mu+', '+fmt(p.d)],
             ['c', fx(p.c)],
             ['promień obrazu', p.d>0? '|c|/'+ep(p.d)+' → ∞' : (p.d<0? '|c|·'+ep(-p.d)+' → 0' : fx(Math.abs(p.c)))],
             ['kąt tej połówki', fmt(-p.d*90,4)+'°'],
             ['kąt całego wcięcia', fmt(-p.d*180,4)+'°'],
             ['strona ominięcia', 'prawa półpłaszczyzna ⇒ biegun wykluczony z wnętrza konturu']],
      result:'łuk o promieniu '+(p.d>0? '→ ∞' : (p.d<0? '→ 0' : fx(Math.abs(p.c))))+', '+fmt(-p.d*90,4)+'°',
      note:'Na wykresie łuk o promieniu nieskończonym rysowany jest umownie tuż przy ramce (przerywana linia bursztynowa) — z zachowaniem dokładnego kąta i zwrotu. Bez niego krzywa byłaby otwarta i okrążeń nie dałoby się policzyć: to właśnie ten łuk daje N = 2 w klasycznym 10/[s(s+1)(s+2)].'};
  };
}

export const ENTRIES = {
  'nq-crit'(A, d, ctx) {
  return {kind:'Punkt krytyczny', title:'(\u22121, j0) \u2014 punkt krytyczny',
      what:'Punkt, w kt\u00f3rym 1 + G\u2092(s) = 0, czyli miejsce zerowe r\u00f3wnania charakterystycznego uk\u0142adu zamkni\u0119tego. Gdyby hodograf przez niego przechodzi\u0142, uk\u0142ad zamkni\u0119ty mia\u0142by biegun dok\u0142adnie na osi urojonej \u2014 by\u0142by na granicy stabilno\u015bci, w niegasn\u0105cych oscylacjach.',
      formula:['1 + G\u2092(j\u03c9) = 0  \u21d4  G\u2092(j\u03c9) = \u22121 = 1\u2220180\u00b0'],
      steps:[['modu\u0142','|G\u2092| = 1  \u2192 sygna\u0142 wraca bez t\u0142umienia'],
             ['faza','arg G\u2092 = \u2212180\u00b0  \u2192 wraca w przeciwfazie'],
             ['odleg\u0142o\u015b\u0107 hodografu od tego punktu', A.reCross!==null? 'w \u03c9\u2081\u2088\u2080 wynosi '+fx(Math.abs(-1-A.reCross)) : 'krzywa nie tnie osi Re'],
             ['okr\u0105\u017cenia N', String(A.Ncw)], ['Z = N + P', String(A.Z)]],
      result: A.Z===0? 'punkt nie jest okr\u0105\u017cany \u2192 uk\u0142ad stabilny' : 'punkt jest okr\u0105\u017cany \u2192 Z = '+A.Z,
      note:'Okr\u0105\u017cenia liczymy wok\u00f3\u0142 (\u22121, j0), a nie wok\u00f3\u0142 zera, poniewa\u017c rysowanie 1 + G\u2092 oznacza\u0142oby przesuni\u0119cie ca\u0142ej krzywej o +1. Zamiast przesuwa\u0107 krzyw\u0105, przesuwamy punkt odniesienia.'};
  },
  'nq-pos'(A, d, ctx) {
  return {kind:'Hodograf', title:'Ga\u0142\u0105\u017a g\u0142\u00f3wna: \u03c9 od 0\u207a do \u221e',
      what:'Obraz odcinka konturu Nyquista biegn\u0105cego w g\u00f3r\u0119 po osi urojonej, s = j\u03c9. To ten sam zbi\u00f3r danych, kt\u00f3ry rysuje charakterystyki Bodego \u2014 tylko przedstawiony we wsp\u00f3\u0142rz\u0119dnych zespolonych zamiast dw\u00f3ch wykres\u00f3w.',
      formula:['G\u2092(j\u03c9) = P(\u03c9) + jQ(\u03c9)',
               '|G\u2092| = \u221a(P\u00b2 + Q\u00b2) ,  \u03c6 = arg(P + jQ)'],
      steps:[['start \u03c9 \u2192 0\u207a', S.nu? 'ucieka do niesko\u0144czono\u015bci wzd\u0142u\u017c asymptoty' : 'punkt A = ('+fx(A.kp)+' , j0)'],
             ['kierunek startu', 'znak Q dla ma\u0142ego \u03c9 decyduje, czy krzywa idzie w d\u00f3\u0142 czy w g\u00f3r\u0119'],
             ['koniec \u03c9 \u2192 \u221e', A.np>A.nz? 'punkt C = (0, j0)' : 'punkt sko\u0144czony'],
             ['k\u0105t doj\u015bcia do zera', fmt(-90*(A.np-A.nz),4)+'\u00b0']],
      result:'\u03c9: 0\u207a \u2192 \u221e',
      note:'Strza\u0142ki pokazuj\u0105 kierunek rosn\u0105cej pulsacji. Punkt przeci\u0119cia tej ga\u0142\u0119zi z okr\u0119giem jednostkowym to \u03c9_c, a z ujemn\u0105 p\u00f3\u0142osi\u0105 rzeczywist\u0105 \u2014 \u03c9\u2081\u2088\u2080.'};
  },
  'nq-neg'(A, d, ctx) {
  return {kind:'Hodograf', title:'Ga\u0142\u0105\u017a lustrzana: \u03c9 od \u2212\u221e do 0\u207b',
      what:'Obraz odcinka konturu biegn\u0105cego w g\u00f3r\u0119 od \u2212j\u221e. Poniewa\u017c wsp\u00f3\u0142czynniki transmitancji s\u0105 rzeczywiste, zachodzi G\u2092(\u2212j\u03c9) = konjugat G\u2092(j\u03c9) \u2014 ta ga\u0142\u0105\u017a jest dok\u0142adnym odbiciem lustrzanym ga\u0142\u0119zi g\u0142\u00f3wnej wzgl\u0119dem osi liczb rzeczywistych.',
      formula:['G\u2092(\u2212j\u03c9) = sprz\u0119\u017cenie G\u2092(j\u03c9)   \u21d2   P(\u2212\u03c9) = P(\u03c9) , Q(\u2212\u03c9) = \u2212Q(\u03c9)'],
      steps:[['P(\u03c9)','funkcja parzysta'], ['Q(\u03c9)','funkcja nieparzysta'],
             ['konstrukcja','odbij ga\u0142\u0105\u017a g\u0142\u00f3wn\u0105 wzgl\u0119dem osi Re']],
      result:'odbicie lustrzane ga\u0142\u0119zi g\u0142\u00f3wnej',
      note:'Ta ga\u0142\u0105\u017a jest niezb\u0119dna do policzenia okr\u0105\u017ce\u0144 \u2014 kryterium Nyquista wymaga obrazu PE\u0141NEGO konturu zamkni\u0119tego, a nie samej po\u0142owy dla \u03c9 > 0.'};
  },
  'nq-arc-up': arcEntry('górna'),
  'nq-arc-dn': arcEntry('dolna'),
  'nq-arc': arcEntry('górna'),
  'nq-unit'(A, d, ctx) {
  return {kind:'Linia odniesienia', title:'Okr\u0105g jednostkowy',
      what:'Zbi\u00f3r punkt\u00f3w o module 1. Miejsce, w kt\u00f3rym hodograf go przecina, wyznacza pulsacj\u0119 \u03c9_c. K\u0105t mi\u0119dzy ujemn\u0105 p\u00f3\u0142osi\u0105 rzeczywist\u0105 a promieniem poprowadzonym do tego przeci\u0119cia jest zapasem fazy.',
      formula:['|G\u2092(j\u03c9)| = 1', 'PM = 180\u00b0 + arg G\u2092(j\u03c9_c)'],
      steps:[['przeci\u0119cie', A.wc? '\u03c9_c = '+fx(A.wc)+' rad/s' : 'brak'],
             ['PM', A.pm===null? '\u2014' : fmt(A.pm,4)+'\u00b0']],
      result:'|G\u2092| = 1', note:'Punkt krytyczny (\u22121, j0) le\u017cy dok\u0142adnie na tym okr\u0119gu \u2014 to punkt o module 1 i fazie \u2212180\u00b0.'};
  },
  'nq-wc'(A, d, ctx) {
  return {kind:'Punkt charakterystyczny', title:'Punkt hodografu przy \u03c9 = \u03c9_c',
      what:'Miejsce, w kt\u00f3rym hodograf przecina okr\u0105g jednostkowy. K\u0105t, o jaki ten punkt jest oddalony od punktu krytycznego wzd\u0142u\u017c okr\u0119gu, to zapas fazy.',
      formula:['|G\u2092(j\u03c9_c)| = 1', 'PM = 180\u00b0 + arg G\u2092(j\u03c9_c)'],
      steps:[['\u03c9_c', fx(A.wc)+' rad/s'],
             ['Re G\u2092(j\u03c9_c)', fx(d.re)], ['Im G\u2092(j\u03c9_c)', fx(d.im)],
             ['|G\u2092|', fx(cabs(d))],
             ['arg G\u2092', fmt(carg(d)*D2,4)+'\u00b0'],
             ['PM = 180\u00b0 + arg', fmt(A.pm,4)+'\u00b0']],
      result:'( '+fx(d.re)+' , j'+fx(d.im)+' )',
      note:'Im bli\u017cej ten punkt le\u017cy punktu (\u22121, j0), tym mniejszy zapas fazy i tym bardziej oscylacyjna odpowied\u017a uk\u0142adu zamkni\u0119tego.'};
  },

  /* ---- rozbicie na P(w) i Q(w) ---- */
  'nq-pq'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Rozkład G(jω)', title:'P(ω) i Q(ω) — część rzeczywista i urojona',
      what:'Pierwszy krok ręcznego rysowania hodografu. Po podstawieniu s = jω mianownik jest liczbą zespoloną, więc nie widać wprost, gdzie leży punkt krzywej. Mnożymy licznik i mianownik przez sprzężenie mianownika: mianownik staje się rzeczywisty (|M|² = C² + D²), a licznik rozpada się na dwie części rzeczywiste — P i Q.',
      formula:['Gₒ(jω) = (A + jB) / (C + jD)',
               '(A + jB)(C − jD) / [(C + jD)(C − jD)] = (A + jB)(C − jD) / (C² + D²)',
               'P(ω) = (A·C + B·D) / (C² + D²)',
               'Q(ω) = (B·C − A·D) / (C² + D²)'],
      steps:[['A(ω)', polyToHtml(p.A,'','ω')], ['B(ω)', polyToHtml(p.B,'','ω')],
             ['C(ω)', polyToHtml(p.Cc,'','ω')], ['D(ω)', polyToHtml(p.Dd,'','ω')],
             ['licznik P', polyToHtml(p.Pn,'','ω')], ['licznik Q', polyToHtml(p.Qn,'','ω')],
             ['mianownik C² + D²', polyToHtml(p.den,'','ω')]],
      result:'Gₒ(jω) = P(ω) + jQ(ω)',
      note:'A i C to części parzyste (potęgi ω⁰, ω², …), B i D nieparzyste — bo jᵏ cykluje 1, j, −1, −j. Stąd P jest funkcją parzystą, a Q nieparzystą, co jest formalnym powodem, dla którego gałąź dla ω < 0 jest lustrzanym odbiciem gałęzi dla ω > 0.'};
  },
  'nq-order'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Kontur', title:'ν, μ i rząd zachowania w s = 0',
      what:'Liczba etapów rysowania zależy tylko od tego, czy Gₒ(s) ma miejsce zerowe w punkcie s = 0 — w mianowniku (biegun, ν) albo w liczniku (zero, μ). Jeśli ma, kontur Cauchy’ego nie może przez ten punkt przejść i trzeba go ominąć wcięciem, co dokłada dwa etapy.',
      formula:['Gₒ(s) ≈ c · s^(−d) w otoczeniu zera,  d = ν − μ'],
      steps:[['ν — bieguny w s = 0', String(p.nu)], ['μ — zera w s = 0', String(p.mu)],
             ['d = ν − μ', fmt(p.d)],
             ['wcięcie potrzebne?', (p.nu>0||p.mu>0)? 'tak' : 'nie'],
             ['liczba etapów', String(p.nStages)]],
      result: p.nStages+' etapy/etapów',
      note:'Uwaga na przypadek d = 0 przy ν = μ > 0: wcięcie nadal jest konieczne (biegun leży na konturze), ale obraz łuku nie ucieka do nieskończoności — zwija się do punktu c.'};
  },
  'nq-stages'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Kontur', title:'Etapy obchodzenia konturu Cauchy’ego',
      what:'Kontur zamknięty w płaszczyźnie s, obiegany zgodnie z ruchem wskazówek zegara, obejmujący całą prawą półpłaszczyznę. Zaczynamy od s = +ε na osi rzeczywistej i wracamy do tego samego punktu. Każdy odcinek konturu daje jeden fragment hodografu.',
      formula: p.stages.map(st => st.no+'. '+st.name+':  '+st.s+',  '+st.par),
      steps: p.stages.map(st => [st.no+'. '+st.name, st.img]),
      result: p.nStages===5? 'pięć etapów (wcięcie wokół s = 0)' : 'trzy etapy (bez wcięcia)',
      note:'Kryterium Nyquista wymaga obrazu PEŁNEGO konturu zamkniętego. Pominięcie łuku domykającego jest najczęstszym błędem — bez niego krzywa jest otwarta i okrążeń punktu (−1, j0) po prostu nie da się policzyć.'};
  },
  'nq-c'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Kontur', title:'Współczynnik c łuku wcięcia',
      what:'Stała, która opisuje zachowanie transmitancji tuż przy s = 0. Bierze się ją z najniższych potęg licznika i mianownika: pozostałe czynniki przy s → 0 dążą do swoich wartości w zerze.',
      formula:['c = lim(s→0) s^d · Gₒ(s)',
               'Gₒ(ε·e^(jθ)) ≈ c · ε^(−d) · e^(−jdθ)'],
      steps:[['d', fmt(p.d)], ['c', fx(p.c)],
             ['znak c', p.c>=0? 'dodatni → łuk startuje na dodatniej półosi Re' : 'ujemny → łuk startuje na ujemnej półosi Re'],
             ['promień obrazu łuku', p.d>0? '|c|/'+ep(p.d)+' → ∞' : (p.d<0? '|c|·'+ep(-p.d)+' → 0' : '|c| = '+fx(Math.abs(p.c)))]],
      result:'c = '+fx(p.c),
      note:'Dla ν = 1 współczynnik c jest po prostu wzmocnieniem prędkościowym K_v = lim s·Gₒ(s), tym samym, które w Bodem wyznacza położenie asymptoty niskoczęstotliwościowej.'};
  },
  'nq-arcang'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Kontur', title:'Kąt zataczany przez łuk wcięcia',
      what:'Wcięcie przebiega po półokręgu s = ε·e^(jθ) od θ = −90° do +90°, czyli po stronie prawej półpłaszczyzny — biegun w zerze zostaje NA ZEWNĄTRZ konturu i dlatego nie wlicza się do P. Obraz tego półokręgu obraca się d razy szybciej i w przeciwną stronę.',
      formula:['arg Gₒ(ε·e^(jθ)) = arg c − d·θ',
               'θ: −90° → +90°  (łącznie 180°)',
               'Δarg = −d·180°'],
      steps:[['d', fmt(p.d)], ['kąt łuku', fmt(-p.d*180,4)+'°'],
             ['zwrot', p.d>0? 'zgodnie z ruchem wskazówek' : (p.d<0? 'przeciwnie do ruchu wskazówek' : 'brak obrotu')],
             ['górna połówka (θ: 0 → +90°)', fmt(-p.d*90,4)+'°'],
             ['dolna połówka (θ: −90° → 0)', fmt(-p.d*90,4)+'°']],
      result:'łuk zatacza '+fmt(-p.d*180,4)+'°',
      note:'To ten łuk potrafi samodzielnie wygenerować okrążenia punktu −1 — klasyczny przypadek 10/[s(s+1)(s+2)], w którym N = 2 bierze się właśnie z pętli domykanej przez łuk.'};
  },
  'nq-asym'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Linia odniesienia', title:'Asymptota pionowa Re = lim P(ω)',
      what:'Przy ν ≥ 1 moduł Gₒ rośnie do nieskończoności, gdy ω → 0, ale część rzeczywista dąży do wartości skończonej. Hodograf ucieka więc równolegle do osi urojonej wzdłuż pionowej prostej — to pierwsza rzecz, którą rysuje się na kartce, zanim postawi się jakikolwiek punkt krzywej.',
      formula:['Re = lim(ω→0) P(ω) = lim(ω→0) licznik P(ω) / (C² + D²)',
               'iloraz najniższych potęg ω obu wielomianów',
               'dla ν = 1:  Re = −K_v · Σ Tᵢ'],
      steps:[['licznik P(ω)', polyToHtml(p.Pn,'','ω')],
             ['mianownik', polyToHtml(p.den,'','ω')],
             ['granica przy ω → 0', fmt(p.asym,5)],
             ['granica Q(ω)', p.qLim===Infinity? '+∞' : (p.qLim===-Infinity? '−∞' : fmt(p.qLim,4))]],
      result: isFinite(p.asym)? 'asymptota Re = '+fmt(p.asym,5) : 'brak skończonej asymptoty pionowej',
      note:'Dla ν ≥ 2 granica P też ucieka do nieskończoności i pionowej asymptoty nie ma — hodograf wchodzi w nieskończoność pod kątem −ν·90°. Opóźnienie transportowe nie zmienia tej granicy: e^(−jωT_d) → 1 przy ω → 0, więc asymptota pozostaje dokładna także dla T_d > 0.'};
  },
  'nq-A'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Punkt charakterystyczny', title:'Punkt startowy A = Gₒ(0)',
      what:'Przy braku miejsca zerowego w s = 0 hodograf zaczyna się w punkcie skończonym, na osi rzeczywistej (bo Gₒ(0) ma zerową część urojoną przy rzeczywistych współczynnikach). Jest to wzmocnienie statyczne układu otwartego.',
      formula:['A = Gₒ(0) = P(0) + jQ(0) = k_p'],
      steps:[['P(0)', p.start? fx(p.start.re) : '—'],
             ['Q(0)', p.start? fx(p.start.im) : '—'],
             ['k_p', isFinite(A.kp)? fx(A.kp) : '∞'],
             ['uchyb statyczny e_ss = 1/(1+k_p)', isFinite(A.kp)? fx(1/(1+A.kp)) : '0']],
      result: p.start? '( '+fx(p.start.re)+' , j'+fx(p.start.im)+' )' : 'w nieskończoności',
      note:'Im dalej ten punkt leży od zera, tym większe wzmocnienie statyczne i tym mniejszy uchyb ustalony — ale i tym bliżej punktu krytycznego przebiega dalsza część krzywej.'};
  },
  'nq-big'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Kontur', title:'Duży łuk domykający, R → ∞',
      what:'Odcinek konturu biegnący po półokręgu o promieniu R → ∞ przez prawą półpłaszczyznę, od +j∞ do −j∞. Dla transmitancji ściśle właściwej (n > m) moduł Gₒ maleje jak R^(m−n), więc CAŁY ten łuk odwzorowuje się w jeden punkt: początek układu.',
      formula:['|Gₒ(R·e^(jθ))| ≈ |K| · R^(m−n)  →  0  dla n > m',
               'kąt dojścia do zera: −90°·(n − m)'],
      steps:[['stopień licznika m', String(p.degN)], ['stopień mianownika n', String(p.degD)],
             ['n − m', String(p.relDeg)],
             ['obraz łuku', p.bigArc? '( '+fx(p.bigArc.re)+' , j'+fx(p.bigArc.im)+' )' : 'ucieka do nieskończoności'],
             ['kąt dojścia', fmt(-90*p.relDeg,4)+'°']],
      result: p.bigArc? 'punkt ( '+fx(p.bigArc.re)+' , j'+fx(p.bigArc.im)+' )' : 'niewłaściwa transmitancja',
      note:'Dla n = m łuk odwzorowuje się w punkt bₘ/aₙ na osi rzeczywistej, a nie w zero. Przy opóźnieniu transportowym e^(−T_d s) na tym łuku Re s > 0, więc czynnik ten dodatkowo tłumi — punkt pozostaje w zerze.'};
  },
  'nq-phi0'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Hodograf', title:'φ₀ — kąt położenia startu hodografu',
      what:'Argument punktu, od którego zaczyna się hodograf: w którą stronę od początku układu leży ten punkt. Dokładnie ta sama liczba, od której startuje charakterystyka fazowa Bodego — Bode rysuje przecież arg Gₒ(jω), a to jest jego wartość dla ω → 0. Uwaga: to NIE jest kierunek, w którym krzywa z tego punktu wychodzi (patrz „kąt wyjścia”).',
      formula:['w otoczeniu zera:  Gₒ(jω) ≈ c·(jω)^(−d),  d = ν − μ',
               '1/j = −j = e^(−j90°)   ⇒   φ₀ = arg c − d·90°',
               'arg c = 0° dla c > 0,  180° dla c < 0'],
      steps:[['d = ν − μ', fmt(p.d)], ['c', fx(p.c)],
             ['arg c', (p.c<0? '180°  (c ujemne)' : '0°  (c dodatnie)')],
             ['−d·90°', fmt(-p.d*90,4)+'°'],
             ['φ₀', fmt(p.phi0,4)+'°'],
             ['start fazy Bodego', fmt(p.phi0,4)+'°  (ta sama liczba)']],
      result:'φ₀ = '+fmt(p.phi0,4)+'°',
      note:'Znak c zbiera w sobie wszystkie źródła przesunięcia o 180°: ujemne K oraz każdy RZECZYWISTY biegun lub zero w prawej półpłaszczyźnie, bo czynnik (jω − p) w ω = 0 równa się −p, czyli dla p > 0 jest liczbą ujemną. Para zespolona sprzężona w prawej półpłaszczyźnie daje (−z)(−z̄) = |z|² > 0, więc nie wnosi nic. To jest właśnie „minus wyciągnięty z czynników” z rozkładu Bodego: (s − 3) = −3·(1 − s/3).'};
  },
  'nq-exit'(A, d, ctx) {
    const p = A.plan;
    const rows = p.d !== 0
      ? [['moduł |Gₒ| = |c|·ω^(−d)', p.d>0? 'maleje, gdy ω rośnie' : 'rośnie, gdy ω rośnie'],
         ['dGₒ/dω = e^(jφ₀)·(−d·|c|·ω^(−d−1))', p.d>0? 'czynnik rzeczywisty UJEMNY ⇒ obrót o 180°' : 'czynnik rzeczywisty DODATNI ⇒ bez obrotu'],
         ['φ₀', fmt(p.phi0,4)+'°'],
         ['kąt wyjścia = φ₀ '+(p.d>0?'+ 180°':'+ 0°'), fmt(p.exitAng,4)+'°']]
      : [['P(ω) parzysta ⇒ P′(0)', '0'],
         ['Q(ω) nieparzysta ⇒ Q′(0)', fx(p.qSlope)],
         ['dGₒ/dω = j·Q′(0)', 'liczba czysto urojona'],
         ['kąt wyjścia', fmt(p.exitAng,4)+'°  ('+(p.exitAng>0?'w górę':'w dół')+')']];
    return {kind:'Hodograf', title:'Kąt wyjścia hodografu przy ω → 0⁺',
      what:'Kierunek, w którym krzywa posuwa się przy rosnącej pulsacji — styczna do hodografu w jego początku. To co innego niż φ₀: φ₀ mówi, GDZIE leży punkt startowy, a kąt wyjścia — DOKĄD od niego jedziemy. Dla układu z astatyzmem te dwa kąty różnią się dokładnie o 180°.',
      formula: p.d!==0
        ? ['Gₒ(jω) ≈ |c|·ω^(−d)·e^(jφ₀)   — argument stały, moduł zmienny',
           'dGₒ/dω = e^(jφ₀) · d/dω[ |c|·ω^(−d) ] = e^(jφ₀)·( −d·|c|·ω^(−d−1) )',
           'mnożenie przez liczbę rzeczywistą ujemną = obrót o 180°',
           'kąt wyjścia = φ₀ + 180°   (dla d > 0)']
        : ['Gₒ(jω) ≈ c·(1 + jω·Σ),  Σ = Στ_z − Στ_p',
           'dGₒ/dω|₀ = j·c·Σ = j·Q′(0)   — czysto urojona',
           'kąt wyjścia = ±90°, znak jak znak Q′(0)'],
      steps: rows,
      result: fmt(p.exitAng,4)+'°'+(p.d>0? '  (φ₀ + 180°)' : ''),
      note: p.d>0
        ? 'Geometrycznie: przy d > 0 początek hodografu leży nieskończenie daleko na półprostej o kącie φ₀ i sunie po niej DO ŚRODKA. Jadąc po promieniu w stronę zera, ma się wektor prędkości dokładnie przeciwny do wektora położenia — i to jest całe źródło tych 180°, żadna dodatkowa reguła. Suma stałych czasowych przesuwa tylko asymptotę w bok, kierunku nie zmienia.'
        : (p.d<0
          ? 'Przy d < 0 moduł rośnie z ω, więc punkt UCIEKA od zera wzdłuż tej samej półprostej — wektor prędkości jest równoległy do wektora położenia i przesunięcia o 180° nie ma.'
          : 'Przy d = 0 moduł jest skończony, więc powyższe rozumowanie nie działa. Decyduje parzystość: P jest funkcją parzystą (pochodna w zerze znika), Q nieparzystą — dlatego krzywa opuszcza punkt startowy prostopadle do promienia. W postaci czasowej Q′(0) = k_p·(Στ_z − Στ_p); to ta sama suma stałych czasowych, która przy ν = 1 wyznacza położenie asymptoty pionowej.')};
  },
  'nq-reldeg'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Hodograf', title:'Kąt dojścia hodografu do początku układu',
      what:'Przy ω → ∞ o kształcie krzywej decyduje wyłącznie różnica stopni n − m: każdy nadmiarowy biegun dokłada −90° fazy. Krzywa wchodzi do zera stycznie do tego kierunku.',
      formula:['arg Gₒ(jω) → −90°·(n − m)  przy ω → ∞'],
      steps:[['m (stopień licznika)', String(p.degN)], ['n (stopień mianownika)', String(p.degD)],
             ['n − m', String(p.relDeg)], ['kąt dojścia', fmt(-90*p.relDeg,4)+'°'],
             ['ćwiartka dojścia', ['I','IV','III','II'][((p.relDeg%4)+4)%4]]],
      result:fmt(-90*p.relDeg,4)+'°',
      note:'Opóźnienie transportowe łamie tę regułę: e^(−jωT_d) obraca fazę bez ograniczenia, więc hodograf wchodzi do zera spiralą o nieskończonej liczbie zwojów.'};
  },
  'nq-qroots'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Wynik dokładny', title:'Q(ω) = 0 — przecięcia z osią rzeczywistą',
      what:'Hodograf tnie oś rzeczywistą dokładnie tam, gdzie znika część urojona. Ponieważ Q jest ilorazem wielomianów, wystarczy przyrównać do zera jego licznik — to daje ω₁₈₀ jako pierwiastek równania algebraicznego, bez żadnego przeszukiwania siatki.',
      formula:['Q(ω) = 0  ⇔  B(ω)·C(ω) − A(ω)·D(ω) = 0',
               'GM = 1 / |P(ω₁₈₀)|'],
      steps:[['licznik Q(ω)', polyToHtml(p.Qn,'','ω')],
             ...(p.reCrossAll.length? p.reCrossAll.map(q=>['ω = '+fx(q.w)+' → P', fx(q.P)+(q.P<0?'  (ujemna półoś)':'  (dodatnia półoś)')])
                                    : [['pierwiastki dodatnie','brak — krzywa nie tnie osi Re']]),
             ['ω₁₈₀ przyjęte do GM', A.w180!==null? fx(A.w180) : '—'],
             ['GM', isFinite(A.gm)? fx(A.gm)+' ('+fmt(20*Math.log10(A.gm),4)+' dB)' : '∞']],
      result: p.reCrossAll.length? p.reCrossAll.map(q=>fx(q.w)).join(', ')+' rad/s' : 'brak przecięć',
      note: p.exact? 'Wartości są dokładne — to pierwiastki wielomianu, a nie odczyt z siatki częstotliwości.'
                   : 'Uwaga: przy T_d > 0 to są przecięcia samej części wymiernej. Pełna faza zawiera jeszcze −ωT_d, więc rzeczywiste ω₁₈₀ jest inne — bierze je bisekcja na dokładnym Gₒ(jω).'};
  },
  'nq-wcroots'(A, d, ctx) {
    const p = A.plan;
    return {kind:'Wynik dokładny', title:'|Gₒ(jω)| = 1 — przecięcia z okręgiem jednostkowym',
      what:'Zamiast szukać ω_c numerycznie, przyrównujemy kwadraty modułów licznika i mianownika. Podniesienie do kwadratu usuwa pierwiastek i zostaje zwykłe równanie wielomianowe w ω.',
      formula:['|Gₒ(jω)|² = (A² + B²) / (C² + D²) = 1',
               'A² + B² − (C² + D²) = 0',
               'PM = 180° + arg Gₒ(jω_c)'],
      steps:[['A² + B² − C² − D²', polyToHtml(p.magEq,'','ω')],
             ...(p.unitAll.length? p.unitAll.map(q=>['ω_c = '+fx(q.w)+' → PM', fmt(q.pm,4)+'°'])
                                 : [['pierwiastki dodatnie','brak — krzywa nie tnie okręgu jednostkowego']]),
             ['ω_c przyjęte do PM', A.wc? fx(A.wc) : '—']],
      result: p.unitAll.length? p.unitAll.map(q=>fx(q.w)).join(', ')+' rad/s' : 'brak przecięć',
      note:'Moduł nie zależy od opóźnienia (|e^(−jωT_d)| = 1), więc te pierwiastki są dokładne także przy T_d > 0 — zmienia się tylko odczytany w nich zapas fazy.'};
  },
};
