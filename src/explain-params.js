import { D2 } from './complex.js';
import { fmt, fx, sgn } from './format.js';
import { K, S } from './model.js';

/* Parametry transmitancji i kryterium Nyquista. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

export const ENTRIES = {
  'K'(A, d, ctx) {
  return {kind:'Parametr transmitancji', title:'K \u2014 wzmocnienie uk\u0142adu otwartego',
      what:'Sta\u0142y mno\u017cnik transmitancji po sprowadzeniu wszystkich czynnik\u00f3w do postaci (s + a). Skaluje modu\u0142 jednakowo na ka\u017cdej pulsacji, czyli przesuwa ca\u0142\u0105 charakterystyk\u0119 amplitudow\u0105 Bodego w pionie. Fazy nie zmienia \u2014 chyba \u017ce jest ujemne, wtedy dok\u0142ada sta\u0142e \u2212180\u00b0.',
      formula:[ctx.Go],
      steps:[['K', fx(K())], ['20\u00b7log\u2081\u2080|K|', fmt(20*Math.log10(Math.abs(K())),4)+' dB'],
             ['arg K', (K()<0?'\u2212180\u00b0':'0\u00b0')]],
      result:'K = '+fx(K()),
      note:'Normalizacja znaku: czynnik (10 \u2212 s) zapisujemy jako \u2212(s \u2212 10), a minus w\u0119druje do K. Bez tego faza wychodzi przesuni\u0119ta o 180\u00b0.'};
  },
  'Td'(A, d, ctx) {
  return {kind:'Parametr transmitancji', title:'T_d \u2014 op\u00f3\u017anienie transportowe',
      what:'Czyste przesuni\u0119cie sygna\u0142u w czasie. Z tablicy transformat: \u2112[f(t \u2212 T\u2080)] = F(s)\u00b7e^(\u2212T\u2080s). Modu\u0142u nie rusza, bo |e^(\u2212j\u03c9T_d)| = 1, ale odbiera faz\u0119 proporcjonalnie do pulsacji \u2014 i to bez ograniczenia.',
      formula:['e^(\u2212j\u03c9T_d) : |\u00b7| = 1 ,  arg = \u2212\u03c9T_d [rad] = \u221257,3\u00b7\u03c9T_d [\u00b0]'],
      steps: S.Td>0 ? [['T_d', fx(S.Td)+' s'],
          ['ubytek fazy przy \u03c9 = 1', fmt(-S.Td*D2,4)+'\u00b0'],
          A.wc? ['ubytek fazy przy \u03c9_c = '+fx(A.wc), fmt(-S.Td*A.wc*D2,4)+'\u00b0'] : ['\u03c9_c','brak przeci\u0119cia 0 dB']]
        : [['T_d','0 s \u2014 op\u00f3\u017anienie wy\u0142\u0105czone']],
      result:'T_d = '+fx(S.Td)+' s',
      note:'Op\u00f3\u017anienie zawsze pogarsza zapas fazy i nigdy nie poprawia modu\u0142u. Nie da si\u0119 go zapisa\u0107 wielomianem, dlatego na liniach pierwiastkowych jest przybli\u017cone aproksymacj\u0105 Pad\u00e9go: e^(\u2212T_d s) \u2248 (1 \u2212 T_d s/2)/(1 + T_d s/2).'};
  },
  'nu'(A, d, ctx) {
  return {kind:'Parametr transmitancji', title:'\u03bd \u2014 rz\u0105d astatyzmu',
      what:'Krotno\u015b\u0107 bieguna w punkcie s = 0, czyli liczba integrator\u00f3w w torze otwartym. Decyduje o nachyleniu startowym charakterystyki amplitudowej, o fazie pocz\u0105tkowej i o tym, czy uk\u0142ad zamkni\u0119ty ma uchyb ustalony.',
      formula:['1/(j\u03c9)^\u03bd :  |\u00b7| = 1/\u03c9^\u03bd ,  arg = \u221290\u00b0\u00b7\u03bd'],
      steps:[['\u03bd', String(S.nu)],
             ['nachylenie L(\u03c9) przy \u03c9 \u2192 0', (-20*S.nu)+' dB/dek'],
             ['arg G\u2092(j0)', (-90*S.nu)+'\u00b0' + (K()<0?' \u2212 180\u00b0 (K < 0)':'')],
             ['uchyb po\u0142o\u017ceniowy', S.nu===0? 'e(\u221e) = 1/(1+k_p) \u2260 0' : 'e(\u221e) = 0']],
      result:'\u03bd = '+S.nu,
      note:'Biegun w zerze nie wlicza si\u0119 do P. Kontur Nyquista omija go ma\u0142ym p\u00f3\u0142okr\u0119giem od strony prawej p\u00f3\u0142p\u0142aszczyzny, wi\u0119c le\u017cy poza wn\u0119trzem konturu. Zamiast tego wnosi \u0142uk o niesko\u0144czonym promieniu, zataczaj\u0105cy \u03bd\u00b7180\u00b0 zgodnie z ruchem wskaz\u00f3wek.'};
  },
  'lzlp'(A, d, ctx) {
  return {kind:'Struktura', title:'l_z / l_p \u2014 liczba zer i biegun\u00f3w',
      what:'Stopie\u0144 licznika m i mianownika n transmitancji otwartej. Ich r\u00f3\u017cnica rz\u0105dzi zachowaniem na obu kra\u0144cach pasma i liczb\u0105 ga\u0142\u0119zi linii pierwiastkowych uciekaj\u0105cych do niesko\u0144czono\u015bci.',
      formula:['arg G\u2092(j\u221e) = \u221290\u00b0\u00b7(l_p \u2212 l_z)', '\u03b1 = n \u2212 m  \u2014 liczba asymptot linii pierwiastkowych'],
      steps:[['l_z = m', String(ctx.nz)], ['l_p = n', String(ctx.np)+(S.nu?' (w tym '+S.nu+' w zerze)':'')],
             ['l_p \u2212 l_z', String(ctx.np-ctx.nz)],
             ['faza ko\u0144cowa', fmt(-90*(ctx.np-ctx.nz),4)+'\u00b0'+(K()<0?' + 180\u00b0 (K < 0)':'')],
             ['opadanie L(\u03c9) przy \u03c9 \u2192 \u221e', (-20*(ctx.np-ctx.nz))+' dB/dek']],
      result:'l_z = '+ctx.nz+' , l_p = '+ctx.np,
      note:'Przy l_p > l_z hodograf ko\u0144czy w punkcie (0, j0). K\u0105t doj\u015bcia do zera to w\u0142a\u015bnie \u221290\u00b0\u00b7(l_p \u2212 l_z) \u2014 bez niego nie wiadomo, z kt\u00f3rej strony krzywa wchodzi do pocz\u0105tku uk\u0142adu.'};
  },
  'P'(A, d, ctx) {
  return {kind:'Kryterium Nyquista', title:'P \u2014 bieguny otwarte w prawej p\u00f3\u0142p\u0142aszczy\u017anie',
      what:'Liczba pierwiastk\u00f3w mianownika G\u2092(s) o cz\u0119\u015bci rzeczywistej dodatniej. To jedyna wielko\u015b\u0107 w kryterium Nyquista, kt\u00f3rej nie odczytuje si\u0119 z wykresu \u2014 trzeba j\u0105 policzy\u0107 z samej transmitancji, przed narysowaniem czegokolwiek.',
      formula:['P = #{ p\u1d62 : Re p\u1d62 > 0 }'],
      steps: A.poles.length ? A.poles.map(q=>['p = '+fx(q.re)+(Math.abs(q.im)>1e-9?(' '+sgn(q.im)+' j'+fx(Math.abs(q.im))):''),
              q.re>1e-9? 'Re > 0 \u2192 liczy si\u0119' : 'Re \u2264 0 \u2192 nie liczy si\u0119'])
          : [['brak biegun\u00f3w sko\u0144czonych','\u2014']],
      result:'P = '+A.P,
      note:'Bieguny w s = 0 s\u0105 wykluczone przez wci\u0119cie konturu i do P si\u0119 nie wliczaj\u0105. Gdy P \u2260 0, uproszczone kryterium Bodego przestaje obowi\u0105zywa\u0107 \u2014 i milcz\u0105co k\u0142amie.'};
  },
  'Z'(A, d, ctx) {
  return {kind:'Kryterium Nyquista', title:'Z \u2014 bieguny zamkni\u0119te w prawej p\u00f3\u0142p\u0142aszczy\u017anie',
      what:'Liczba pierwiastk\u00f3w r\u00f3wnania charakterystycznego 1 + G\u2092(s) = 0 le\u017c\u0105cych w prawej p\u00f3\u0142p\u0142aszczy\u017anie. Uk\u0142ad zamkni\u0119ty jest stabilny dok\u0142adnie wtedy, gdy Z = 0. Wielko\u015b\u0107 bierze si\u0119 z zasady argumentu Cauchy\u2019ego zastosowanej do F(s) = 1 + G\u2092(s) na konturze Nyquista.',
      formula:['N = Z_F \u2212 P_F   (zasada argumentu)', 'F(s) = 1 + L(s)/M(s) = [M(s) + L(s)] / M(s)',
               'bieguny F = bieguny otwarte \u21d2 P_F = P', 'zera F = bieguny zamkni\u0119te \u21d2 Z_F = Z',
               '\u21d2  Z = N + P'],
      steps:[['N \u2014 okr\u0105\u017cenia (\u22121, j0) zgodnie z ruchem wskaz\u00f3wek', String(A.Ncw)],
             ['P \u2014 bieguny otwarte, Re > 0', String(A.P)],
             ['Z = N + P', String(A.Z)]],
      result: A.Z===0 ? 'Z = 0 \u2192 uk\u0142ad zamkni\u0119ty STABILNY' : 'Z = '+A.Z+' \u2192 uk\u0142ad zamkni\u0119ty NIESTABILNY',
      note:'Okr\u0105\u017cenia liczymy wok\u00f3\u0142 punktu (\u22121, j0), a nie wok\u00f3\u0142 zera, bo kre\u015blenie 1 + G\u2092 oznacza\u0142oby przesuni\u0119cie ca\u0142ego hodografu o +1. Zamiast przesuwa\u0107 krzyw\u0105, przesuwamy punkt odniesienia. Kontrol\u0105 niezale\u017cn\u0105 od rysunku jest kryterium Routha\u2013Hurwitza zastosowane do wielomianu D(s) + K\u00b7N(s).'};
    /* ---------------- stability margins and crossings ---------------- */
  },
};
ENTRIES['verdict'] = ENTRIES['Z'];
