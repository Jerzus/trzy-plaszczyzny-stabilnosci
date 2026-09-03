import { fmt, fx } from './format.js';
import { K, S } from './model.js';

/* Charakterystyki Bodego. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

export const ENTRIES = {
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
