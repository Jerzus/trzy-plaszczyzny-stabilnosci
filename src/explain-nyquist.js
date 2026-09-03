import { C, D2, cabs, carg } from './complex.js';
import { fmt, fx } from './format.js';
import { K, S } from './model.js';

/* Hodograf Nyquista. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

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
  'nq-arc'(A, d, ctx) {
  return {kind:'Hodograf', title:'\u0141uk wci\u0119cia wok\u00f3\u0142 bieguna w zerze',
      what:'Kontur Cauchy\u2019ego nie mo\u017ce przechodzi\u0107 przez biegun, wi\u0119c biegun w s = 0 omijamy ma\u0142ym p\u00f3\u0142okr\u0119giem s = \u03b5e^(j\u03b8), \u03b5 \u2192 0, \u03b8 od \u221290\u00b0 do +90\u00b0. Obrazem tego p\u00f3\u0142okr\u0119gu jest \u0142uk o promieniu d\u0105\u017c\u0105cym do niesko\u0144czono\u015bci, kt\u00f3ry domyka hodograf \u2014 i to w\u0142a\u015bnie on wnosi okr\u0105\u017cenia.',
      formula:['w otoczeniu zera:  G\u2092(s) \u2248 c / s^\u03bd',
               'G\u2092(\u03b5e^(j\u03b8)) = (c/\u03b5^\u03bd)\u00b7e^(\u2212j\u03bd\u03b8)',
               '\u03b8: \u221290\u00b0 \u2192 +90\u00b0  \u21d2  arg maleje o \u03bd\u00b7180\u00b0 (zgodnie ze wskaz\u00f3wkami)'],
      steps:[['\u03bd', String(S.nu)],
             ['k\u0105t zataczany przez \u0142uk', (S.nu*180)+'\u00b0 CW'],
             ['promie\u0144','\u2192 \u221e'],
             ['wybrana strona omini\u0119cia','od strony prawej p\u00f3\u0142p\u0142aszczyzny \u21d2 biegun WYKLUCZONY z wn\u0119trza konturu']],
      result:'\u0142uk o promieniu \u221e, '+(S.nu*180)+'\u00b0 zgodnie z ruchem wskaz\u00f3wek',
      note:'To dlatego biegun w zerze nie wlicza si\u0119 do P. Jednocze\u015bnie ten \u0142uk potrafi samodzielnie wygenerowa\u0107 okr\u0105\u017cenia punktu \u22121 \u2014 klasyczny przypadek 10/[s(s+1)(s+2)], gdzie N = 2 bierze si\u0119 w\u0142a\u015bnie z p\u0119tli domykanej przez \u0142uk.'};
  },
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
};
