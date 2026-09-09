import { bodeComponents } from './bode-terms.js';
import { fmt, fx } from './format.js';
import { K, S } from './model.js';

/* Charakterystyki Bodego. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

export const ENTRIES = {
  /* Pojedynczy skladnik rozkladu: ktory to element ulamka transmitancji i co
     dokladnie robi z modulem oraz z faza, i w ktorym miejscu osi pulsacji. */
  'bterm'(A, d, ctx) {
    const parts = bodeComponents(A);
    const c = parts[(+d.bi || 1) - 1];
    if (!c) return null;
    const m = c.meta || {};
    // wkład tego składnika w pulsacji odcięcia
    const iAt = w => { let b = 0; for (let i = 1; i < A.w.length; i++) if (Math.abs(Math.log(A.w[i] / w)) < Math.abs(Math.log(A.w[b] / w))) b = i; return b; };
    const atWc = A.wc ? (() => { const i = iAt(A.wc); return [['wkład do L(ω) w ω_c = ' + fx(A.wc), fmt(c.db[i], 4) + ' dB'],
      ['wkład do fazy w ω_c', fmt(c.ph[i], 4) + '°']]; })() : [];

    if (m.kind === 'k') {
      return {kind:'Składnik Bodego', title:'Składnik ' + c.i + ': stałe wzmocnienie k = ' + fx(m.k),
        what:'To nie jest osobny nawias w transmitancji. Powstaje ze zwinięcia wszystkiego, co stałe: wzmocnienia K oraz liczb wyciąganych przed nawias przy sprowadzaniu każdego czynnika do postaci (1 + τjω) — bo (s + a) = a·(1 + s/a), więc każdy biegun oddaje do k dzielnik a, a każde zero mnożnik a.',
        formula:['k = K · Π aᵢ (zera) / Π aⱼ (bieguny)', 'L_k = 20·log₁₀|k| = const', 'arg k = 0° dla k > 0,  −180° dla k < 0'],
        steps:[['k', fx(m.k)], ['20·log₁₀|k|', fmt(20 * Math.log10(Math.abs(m.k)), 4) + ' dB'],
               ['wkład do fazy', (m.k < 0 ? '−180°' : '0°') + ' — na całej osi ω'], ...atWc],
        result:'pozioma linia ' + fmt(20 * Math.log10(Math.abs(m.k)), 4) + ' dB, faza ' + (m.k < 0 ? '−180°' : '0°'),
        note:'Zmiana k podnosi albo obniża CAŁĄ charakterystykę amplitudową o stałą liczbę decybeli, nie ruszając ani jednej pulsacji łamania i nie zmieniając kształtu fazy. Przesuwa za to ω_c wzdłuż istniejącego przebiegu — i dlatego samo zwiększanie wzmocnienia zjada zapas fazy.'};
    }
    if (m.kind === 'nu') {
      return {kind:'Składnik Bodego', title:'Składnik ' + c.i + ': integratory 1/s' + (m.nu > 1 ? '^' + m.nu : ''),
        what:'Czynnik s^ν stojący w MIANOWNIKU transmitancji — astatyzm rzędu ν. Każdy integrator dzieli przez jω, co w module oznacza dzielenie przez ω, a w fazie stałe przesunięcie o −90°.',
        formula:['1/(jω)^ν', 'L = −20·ν·log₁₀ ω  [dB]', 'arg = −90°·ν = const'],
        steps:[['ν', String(m.nu)],
               ['nachylenie modułu', fmt(-20 * m.nu, 4) + ' dB/dekadę — na całej osi ω'],
               ['przez 0 dB przy', 'ω = 1 rad/s (sam ten składnik)'],
               ['wkład do fazy', fmt(-90 * m.nu, 4) + '° — stały, niezależny od ω'], ...atWc],
        result:'prosta ' + fmt(-20 * m.nu, 4) + ' dB/dek, faza ' + fmt(-90 * m.nu, 4) + '°',
        note:'Integrator jako jedyny czynnik zmienia nachylenie już od ω → 0, bez żadnej pulsacji łamania. Faza jest przez niego zjedzona raz na zawsze: przy ν = 2 zaczynamy od −180°, czyli od samego punktu krytycznego, i każdy kolejny biegun natychmiast wpycha hodograf w okrążenie.'};
    }
    if (m.kind === 'ord1') {
      const zero = m.sgn > 0, nmf = m.tau < 0;
      const slope = zero ? '+20' : '−20', dph = zero ? (nmf ? '−90°' : '+90°') : (nmf ? '+90°' : '−90°');
      const half = zero ? (nmf ? '−45°' : '+45°') : (nmf ? '+45°' : '−45°');
      return {kind:'Składnik Bodego', title:'Składnik ' + c.i + ': ' + (zero ? 'zero' : 'biegun') + ' w s = ' + fx(m.root) + (nmf ? ' (prawa półpłaszczyzna)' : ''),
        what:'Czynnik (1 + ' + fx(m.tau, 3) + 'jω) w ' + (zero ? 'LICZNIKU' : 'MIANOWNIKU') + ' transmitancji, czyli '
          + (zero ? 'zero' : 'biegun') + ' w punkcie s = ' + fx(m.root) + '. Stała czasowa T = ' + fx(Math.abs(m.tau), 3) + ' s. '
          + 'Wszystko dzieje się wokół jednej pulsacji — pulsacji łamania ω_ł = 1/T = ' + fx(m.wb, 3) + ' rad/s.',
        formula:['|1 + jωT| = √(1 + (ωT)²)  ⇒  L = ' + (zero ? '+' : '−') + '20·log₁₀√(1 + (ωT)²)',
                 'arg = ' + (zero ? '+' : '−') + 'arctg(ωT)',
                 'ω ≪ ω_ł:  L ≈ 0 dB, faza ≈ 0°',
                 'ω ≫ ω_ł:  L ≈ ' + slope + '·log₁₀(ω/ω_ł) dB, faza ≈ ' + dph],
        steps:[['miejsce w ułamku', zero ? 'licznik → podbija' : 'mianownik → tłumi'],
               ['pulsacja łamania ω_ł', fx(m.wb, 4) + ' rad/s  (T = ' + fx(Math.abs(m.tau), 4) + ' s)'],
               ['moduł poniżej ω_ł', '≈ 0 dB — składnik nic nie robi'],
               ['moduł powyżej ω_ł', slope + ' dB/dekadę'],
               ['moduł dokładnie w ω_ł', (zero ? '+3' : '−3') + ' dB względem asymptot (to jedyne miejsce, gdzie łamana kłamie)'],
               ['faza: start ω → 0', '0°'],
               ['faza w 0,1·ω_ł = ' + fx(m.wb / 10, 3), (zero ? (nmf ? '−' : '+') : (nmf ? '+' : '−')) + '5,7°'],
               ['faza w ω_ł', half + ' — dokładnie połowa całej zmiany'],
               ['faza w 10·ω_ł = ' + fx(m.wb * 10, 3), (zero ? (nmf ? '−' : '+') : (nmf ? '+' : '−')) + '84,3°'],
               ['faza: koniec ω → ∞', dph], ...atWc],
        result:(zero ? 'zero' : 'biegun') + ' w ' + fx(m.root) + ': ' + slope + ' dB/dek powyżej ' + fx(m.wb, 3) + ' rad/s, faza 0° → ' + dph,
        note: nmf
          ? 'UWAGA: pierwiastek leży w PRAWEJ półpłaszczyźnie (T < 0). Moduł zachowuje się identycznie jak dla lustrzanego czynnika stabilnego — z samego wykresu amplitudowego nie da się tego wykryć. Faza natomiast idzie w przeciwną stronę i to ona zjada zapas. Właśnie dlatego uproszczone kryterium Bodego zawodzi dla układów nieminimalnofazowych.'
          : 'Przejście rozciąga się na dwie dekady: od 0,1·ω_ł do 10·ω_ł. Dlatego ' + (zero ? 'zero' : 'biegun') + ' oddalony nawet dziesięciokrotnie od ω_c wciąż wpływa na zapas fazy — to najczęściej pomijany efekt przy szacowaniu „na oko”.'};
    }
    if (m.kind === 'ord2') {
      const zero = m.sgn > 0, res = m.z < 0.707 && m.z > 0;
      const wr = res ? m.wn * Math.sqrt(1 - 2 * m.z * m.z) : null;
      const Mr = res ? 1 / (2 * m.z * Math.sqrt(1 - m.z * m.z)) : null;
      return {kind:'Składnik Bodego', title:'Składnik ' + c.i + ': para sprzężona w ' + (zero ? 'liczniku' : 'mianowniku') + ', ω_n = ' + fx(m.wn, 3),
        what:'Nierozkładalny czynnik drugiego stopnia — para biegunów (albo zer) zespolonych sprzężonych. Odpowiada członowi oscylacyjnemu o pulsacji własnej ω_n = ' + fx(m.wn, 3) + ' rad/s i tłumieniu względnym ζ = ' + fx(m.z, 3) + '.',
        formula:['1 + 2ζ(jω/ω_n) + (jω/ω_n)²',
                 'ω ≪ ω_n:  L ≈ 0 dB',
                 'ω ≫ ω_n:  L ≈ ' + (zero ? '+' : '−') + '40·log₁₀(ω/ω_n) dB',
                 res ? 'rezonans:  ω_r = ω_n√(1 − 2ζ²),  M_r = 1/(2ζ√(1 − ζ²))' : 'ζ ≥ 0,707 → brak wierzchołka rezonansowego'],
        steps:[['miejsce w ułamku', zero ? 'licznik' : 'mianownik'],
               ['ω_n', fx(m.wn, 4) + ' rad/s'], ['ζ', fx(m.z, 4)],
               ['nachylenie powyżej ω_n', (zero ? '+40' : '−40') + ' dB/dekadę'],
               ['faza w ω_n', (zero ? '+90°' : '−90°') + ' — połowa zmiany'],
               ['faza całkowita', (zero ? '+180°' : '−180°') + ' — dwa razy tyle co czynnik I rzędu'],
               ...(res ? [['ω_r (szczyt rezonansu)', fx(wr, 4) + ' rad/s'],
                          ['M_r', fx(Mr, 4) + ' = ' + fmt(20 * Math.log10(Mr), 4) + ' dB']]
                       : [['rezonans', 'brak — ζ ≥ 0,707']]),
               ...atWc],
        result:'ω_n = ' + fx(m.wn, 3) + ', ζ = ' + fx(m.z, 3) + ' → ' + (zero ? '+40' : '−40') + ' dB/dek, faza 0° → ' + (zero ? '+180°' : '−180°'),
        note:'Im mniejsze ζ, tym wyższy i węższy szczyt rezonansowy i tym gwałtowniej przeskakuje faza — przy ζ → 0 przejście przez ±180° robi się niemal skokowe, a asymptoty łamane stają się bezużyteczne. To jest ta sama para biegunów, którą na liniach pierwiastkowych widać jako punkt o kącie arccos ζ od osi rzeczywistej.'};
    }
    return {kind:'Składnik Bodego', title:'Składnik ' + c.i + ': opóźnienie transportowe e^(−jωT_d)',
      what:'Czynnik e^(−T_d·s) mnożący całą transmitancję. Nie jest ułamkiem ani wielomianem — nie ma ani zer, ani biegunów, więc nie zmienia modułu ani o jeden decybel. Zabiera wyłącznie fazę, i to bez ograniczenia.',
      formula:['|e^(−jωT_d)| = 1  ⇒  L = 0 dB dla każdej ω',
               'arg = −ω·T_d [rad] = −57,3·ω·T_d [°]'],
      steps:[['T_d', fx(m.Td, 4) + ' s'],
             ['wkład do modułu', '0 dB — na całej osi ω'],
             ['wkład do fazy przy ω = 1', fmt(-57.2958 * m.Td, 4) + '°'],
             ['przy ω = 10', fmt(-572.958 * m.Td, 4) + '°'],
             ['faza = −180° przy', fx(Math.PI / m.Td, 4) + ' rad/s'], ...atWc],
      result:'0 dB, faza −57,3·ω·' + fx(m.Td, 3) + '° — liniowo malejąca',
      note:'Na osi logarytmicznej liniowa zależność od ω wygląda jak krzywa opadająca coraz stromiej. Opóźnienie jest najgroźniejszym składnikiem: nie widać go na charakterystyce amplitudowej, a fazę odbiera bez końca. Dlatego przy T_d > 0 zapas fazy trzeba sprawdzać zawsze, a linie pierwiastkowe wymagają aproksymacji Padégo.'};
  },

  'bd-mag'(A, d, ctx) {
  return {kind:'Charakterystyka Bodego', title:'L(\u03c9) \u2014 charakterystyka amplitudowa',
      what:'Modu\u0142 transmitancji widmowej w decybelach, na logarytmicznej osi pulsacji. Logarytm zamienia mno\u017cenie czynnik\u00f3w na dodawanie, dlatego wykres sk\u0142ada si\u0119 z odcink\u00f3w prostych o nachyleniach b\u0119d\u0105cych wielokrotno\u015bci\u0105 20 dB/dek.',
      formula:['L(\u03c9) = 20\u00b7log\u2081\u2080 |G\u2092(j\u03c9)|',
               'L(\u03c9) = 20log|K| + \u03a3 20log|j\u03c9 \u2212 z\u1d62| \u2212 20\u03bd\u00b7log \u03c9 \u2212 \u03a3 20log|j\u03c9 \u2212 p\u1d62|'],
      steps:[['nachylenie startowe (\u03c9 \u2192 0)', (-20*S.nu)+' dB/dek'],
             ['poziom pocz\u0105tkowy', S.nu? 'ro\u015bnie do \u221e' : '20\u00b7log\u2081\u2080 k_p = '+fmt(20*Math.log10(Math.abs(A.kp)),4)+' dB'],
             ['nachylenie ko\u0144cowe (\u03c9 \u2192 \u221e)', (-20*(A.np-A.nz))+' dB/dek'],
             ['za ka\u017cdym biegunem','\u221220 dB/dek'], ['za ka\u017cdym zerem','+20 dB/dek'],
             ['poprawka w pulsacji \u0142amania','\u22123 dB (biegun) / +3 dB (zero)']],
      result: A.wc? 'przecina 0 dB przy \u03c9_c = '+fx(A.wc)+' rad/s' : 'nie przecina 0 dB',
      note:'Konstrukcja asymptotyczna: pulsacje \u0142amania to odwrotno\u015bci sta\u0142ych czasowych 1/T. Zaznaczone s\u0105 tr\u00f3jk\u0105tami pod wykresem \u2014 kliknij dowolny, \u017ceby zobaczy\u0107 jego wk\u0142ad.'};
  },
  'bd-pha'(A, d, ctx) {
  return {kind:'Charakterystyka Bodego', title:'\u03c6(\u03c9) \u2014 charakterystyka fazowa',
      what:'Argument transmitancji widmowej. Faza jest addytywna: sumuje si\u0119 wk\u0142ady wszystkich czynnik\u00f3w. Wykres jest rozwini\u0119ty w spos\u00f3b ci\u0105g\u0142y \u2014 nie wolno u\u017cywa\u0107 samego arctg(Q/P), bo kalkulator zwraca wynik tylko z przedzia\u0142u (\u221290\u00b0, 90\u00b0).',
      formula:['\u03c6(\u03c9) = arg G\u2092(j\u03c9) = arg K \u2212 90\u00b0\u03bd \u2212 57,3\u00b7\u03c9T_d + \u03a3 arg(j\u03c9 \u2212 z\u1d62) \u2212 \u03a3 arg(j\u03c9 \u2212 p\u1d62)'],
      steps:[['\u03c6(\u03c9 \u2192 0)', fmt(-90*S.nu + (K()<0?-180:0),4)+'\u00b0'],
             ['\u03c6(\u03c9 \u2192 \u221e)', S.Td>0? '\u2192 \u2212\u221e (op\u00f3\u017anienie)' : fmt(-90*(A.np-A.nz)+(K()<0?-180:0),4)+'\u00b0'],
             ['w ka\u017cdej pulsacji \u0142amania','\u00b145\u00b0 od danego czynnika'],
             ['liczba sk\u0142adnik\u00f3w sumy', String(A.poles.length+A.zeros.length+(S.nu?1:0)+(S.Td>0?1:0)+(K()<0?1:0))]],
      result: A.w180? 'przecina \u2212180\u00b0 przy \u03c9\u2081\u2088\u2080 = '+fx(A.w180)+' rad/s' : 'nie osi\u0105ga \u2212180\u00b0',
      note:'Kontrola: faza powinna male\u0107 monotonicznie. Je\u015bli gdzie\u015b ro\u015bnie, musi to pochodzi\u0107 od zera w liczniku. Liczba sk\u0142adnik\u00f3w sumy musi si\u0119 zgadza\u0107 z l_p + l_z, plus jeden za integrator.'};
  },
  'bd-0db'(A, d, ctx) {
  return {kind:'Linia odniesienia', title:'Linia 0 dB',
      what:'Poziom, na kt\u00f3rym modu\u0142 transmitancji otwartej wynosi dok\u0142adnie 1. Sygna\u0142 obiega p\u0119tl\u0119 bez zmiany amplitudy. Przeci\u0119cie tej linii wyznacza pulsacj\u0119 \u03c9_c, w kt\u00f3rej odczytuje si\u0119 zapas fazy.',
      formula:['L = 0 dB  \u21d4  |G\u2092(j\u03c9)| = 1'],
      steps:[['20\u00b7log\u2081\u2080(1)','0 dB'], ['przeci\u0119cie', A.wc? '\u03c9_c = '+fx(A.wc)+' rad/s':'brak']],
      result:'|G\u2092| = 1', note:'Pasmo, w kt\u00f3rym L(\u03c9) > 0 dB, jest jedynym, w kt\u00f3rym licz\u0105 si\u0119 przej\u015bcia fazy przez \u2212180\u00b0 w uog\u00f3lnionym kryterium Bodego (kryterium przej\u015b\u0107).'};
  },
  'bd-180'(A, d, ctx) {
  return {kind:'Linia odniesienia', title:'Linia \u2212180\u00b0',
      what:'Faza, przy kt\u00f3rej sygna\u0142 wraca do w\u0119z\u0142a sumacyjnego w przeciwfazie. Ujemne sprz\u0119\u017cenie zwrotne staje si\u0119 dodatnie. Przeci\u0119cie tej linii wyznacza \u03c9\u2081\u2088\u2080, gdzie odczytuje si\u0119 zapas wzmocnienia.',
      formula:['\u03c6 = \u2212180\u00b0  \u21d4  G\u2092(j\u03c9) le\u017cy na ujemnej p\u00f3\u0142osi rzeczywistej'],
      steps:[['przeci\u0119cie', A.w180? '\u03c9\u2081\u2088\u2080 = '+fx(A.w180)+' rad/s':'brak'],
             ['|G\u2092| w tym punkcie', A.w180? fx(1/A.gm) : '\u2014'],
             ['warunek stabilno\u015bci (P = 0)','|G\u2092(j\u03c9\u2081\u2088\u2080)| < 1']],
      result:'\u03c6 = \u2212180\u00b0',
      note:'Kryterium przej\u015b\u0107 (wersja uog\u00f3lniona, dzia\u0142a te\u017c dla P \u2260 0): licz przej\u015bcia fazy przez \u2212180\u00b0 tylko w pasmach, gdzie L(\u03c9) > 0 dB. Przej\u015bcie w g\u00f3r\u0119 to N\u208a, w d\u00f3\u0142 to N\u208b, a warunkiem stabilno\u015bci jest N\u208a \u2212 N\u208b = P/2.'};
  },
  'bd-corner'(A, d, ctx) {
  return {kind:'Charakterystyka Bodego', title:'Pulsacja \u0142amania',
      what:'Pulsacja r\u00f3wna odwrotno\u015bci sta\u0142ej czasowej czynnika. W tym miejscu asymptota charakterystyki amplitudowej zmienia nachylenie, a czynnik wnosi dok\u0142adnie po\u0142ow\u0119 swojego docelowego przesuni\u0119cia fazy.',
      formula:['\u03c9_\u0142 = 1/T = |p\u1d62|  (albo |z\u1d62|)',
               'arctg(\u03c9/a) = 45\u00b0  dla  \u03c9 = a'],
      steps:[['\u017ar\u00f3d\u0142o', d.kind==='p'? (d.c?'para biegun\u00f3w zespolonych':'biegun rzeczywisty') : (d.c?'para zer zespolonych':'zero rzeczywiste')],
             ['\u03c9_\u0142', fx(d.w)+' rad/s'],
             ['sta\u0142a czasowa T = 1/\u03c9_\u0142', fx(1/d.w)+' s'],
             ['zmiana nachylenia L', d.kind==='p'? (d.c?'\u221240 dB/dek':'\u221220 dB/dek') : (d.c?'+40 dB/dek':'+20 dB/dek')],
             ['faza w tym punkcie', d.kind==='p'? (d.c?'\u221290\u00b0':'\u221245\u00b0') : (d.c?'+90\u00b0':'+45\u00b0')],
             ['poprawka do asymptoty', d.kind==='p'? '\u22123 dB':'+3 dB'],
             ['warto\u015bci pomocnicze','arctg(\u03c9/a): 5,7\u00b0 dla \u03c9 = 0,1a ; 45\u00b0 dla \u03c9 = a ; 84,3\u00b0 dla \u03c9 = 10a']],
      result:'\u03c9_\u0142 = '+fx(d.w)+' rad/s  (T = '+fx(1/d.w)+' s)',
      note:'Przej\u015bcie fazy rozci\u0105ga si\u0119 na dwie dekady: od 0,1\u00b7\u03c9_\u0142 do 10\u00b7\u03c9_\u0142. Dlatego biegun po\u0142o\u017cony nawet dziesi\u0119\u0107 razy dalej ni\u017c \u03c9_c wci\u0105\u017c zjada cz\u0119\u015b\u0107 zapasu fazy.'};
    /* ---------------- Nyquist ---------------- */
  },
};
