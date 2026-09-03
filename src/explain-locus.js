import { cabs } from './complex.js';
import { polLab, poleMetrics } from './explain-helpers.js';
import { fmt, fx, sgn } from './format.js';
import { K, S } from './model.js';

/* Linie pierwiastkowe. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

export const ENTRIES = {
  'rl-pole'(A, d, ctx) {
  return {kind:'Linie pierwiastkowe', title:'Biegun uk\u0142adu otwartego',
      what:'Pierwiastek mianownika G\u2092(s). Linie pierwiastkowe startuj\u0105 w biegunach otwartych przy k = 0 \u2014 dla zerowego wzmocnienia bieguny uk\u0142adu zamkni\u0119tego pokrywaj\u0105 si\u0119 z otwartymi.',
      formula:['k = 0  \u21d2  D(s) = 0  \u21d2  s = p\u1d62'],
      steps:[['po\u0142o\u017cenie', fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):'')],
             ['czynnik w mianowniku', polLab(d)],
             ['sta\u0142a czasowa T = 1/|p|', Math.abs(cabs(d))>1e-12? fx(1/cabs(d))+' s':'\u221e'],
             ['pulsacja \u0142amania 1/T', fx(cabs(d))+' rad/s'],
             ['wk\u0142ad do fazy (\u03c9: 0 \u2192 \u221e)', d.re<0? '0\u00b0 \u2192 \u221290\u00b0' : '\u2212180\u00b0 \u2192 \u221290\u00b0 (biegun w prawej p\u00f3\u0142p\u0142aszczy\u017anie)'],
             ['wk\u0142ad do L(\u03c9)', '0 dB do \u03c9 = '+fx(cabs(d))+', potem \u221220 dB/dek']],
      result:'p = '+fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):''),
      note: d.re>0 ? 'Ten biegun le\u017cy w prawej p\u00f3\u0142p\u0142aszczy\u017anie, wi\u0119c wlicza si\u0119 do P i wyklucza uproszczone kryterium Bodego.' : 'Biegun stabilny \u2014 nie wlicza si\u0119 do P.'};
  },
  'rl-zero'(A, d, ctx) {
  return {kind:'Linie pierwiastkowe', title:'Zero uk\u0142adu otwartego',
      what:'Pierwiastek licznika G\u2092(s). Linie pierwiastkowe ko\u0144cz\u0105 si\u0119 w zerach przy k \u2192 \u221e. Zer jest m, biegun\u00f3w n, wi\u0119c \u03b1 = n \u2212 m ga\u0142\u0119zi nie ma dok\u0105d p\u00f3j\u015b\u0107 i ucieka do niesko\u0144czono\u015bci wzd\u0142u\u017c asymptot.',
      formula:['k \u2192 \u221e  \u21d2  N(s) = 0  \u21d2  s = z\u1d62'],
      steps:[['po\u0142o\u017cenie', fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):'')],
             ['czynnik w liczniku', polLab(d)],
             ['pulsacja \u0142amania', fx(cabs(d))+' rad/s'],
             ['wk\u0142ad do fazy (\u03c9: 0 \u2192 \u221e)', d.re<0? '0\u00b0 \u2192 +90\u00b0' : '+180\u00b0 \u2192 +90\u00b0 (zero w prawej p\u00f3\u0142p\u0142aszczy\u017anie)'],
             ['wk\u0142ad do L(\u03c9)', '0 dB do \u03c9 = '+fx(cabs(d))+', potem +20 dB/dek']],
      result:'z = '+fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):''),
      note: d.re>0 ? 'Zero w prawej p\u00f3\u0142p\u0142aszczy\u017anie czyni uk\u0142ad NIEMINIMALNOFAZOWYM: modu\u0142 ro\u015bnie, ale faza maleje. Uproszczone kryterium Bodego przestaje obowi\u0105zywa\u0107.' : 'Zero stabilne \u2014 dodaje faz\u0119, wi\u0119c poprawia zapas. Na tym polega dzia\u0142anie sterownika typu LEAD.'};
  },
  'rl-int'(A, d, ctx) {
  return {kind:'Linie pierwiastkowe', title:'Biegun wielokrotny w s = 0 (integrator)',
      what:'Astatyzm rz\u0119du \u03bd oznacza \u03bd biegun\u00f3w w pocz\u0105tku uk\u0142adu. Na p\u0142aszczy\u017anie s to punkt startowy \u03bd ga\u0142\u0119zi linii pierwiastkowych.',
      formula:['1/s^\u03bd ,  \u03bd = '+S.nu],
      steps:[['liczba ga\u0142\u0119zi startuj\u0105cych z s = 0', String(S.nu)],
             ['wk\u0142ad do fazy', (-90*S.nu)+'\u00b0 (sta\u0142y)'],
             ['nachylenie L przy \u03c9 \u2192 0', (-20*S.nu)+' dB/dek']],
      result:'s = 0, krotno\u015b\u0107 '+S.nu,
      note:'Biegun w zerze le\u017cy na konturze Nyquista, wi\u0119c kontur trzeba wok\u00f3\u0142 niego wci\u0105\u0107 ma\u0142ym p\u00f3\u0142okr\u0119giem. Wybieraj\u0105c omini\u0119cie od strony prawej p\u00f3\u0142p\u0142aszczyzny wykluczamy go z wn\u0119trza konturu \u2014 dlatego nie wlicza si\u0119 do P.'};
  },
  'rl-cl'(A, d, ctx) {
      const M=poleMetrics(d);
      const st=[['po\u0142o\u017cenie', fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):'')],
                ['\u03c9\u2099 = |s|', fx(M.wn)+' rad/s'],
                ['\u03b6 = \u2212Re s / |s|', fx(M.zeta)]];
      if(M.Mp!==undefined){
        st.push(['M_p = e^(\u2212\u03c0\u03b6/\u221a(1\u2212\u03b6\u00b2))', fmt(M.Mp*100,3)+' %']);
        st.push(['t_p = \u03c0/(\u03c9\u2099\u221a(1\u2212\u03b6\u00b2))', fx(M.tp)+' s']);
        st.push(['t\u2099 = 1,8/\u03c9\u2099', fx(M.tn)+' s']);
        st.push(['t_R2% = 4/(\u03b6\u03c9\u2099)', fx(M.t2)+' s']);
        st.push(['t_R5% = 3/(\u03b6\u03c9\u2099)', fx(M.t5)+' s']);
        if(M.wr!==undefined){ st.push(['\u03c9_r = \u03c9\u2099\u221a(1\u22122\u03b6\u00b2)', fx(M.wr)+' rad/s']);
                              st.push(['M_r = 1/(2\u03b6\u221a(1\u2212\u03b6\u00b2))', fx(M.Mr)]); }
      } else if(Math.abs(d.im)<1e-9){
        st.push(['charakter', d.re<0? 'biegun rzeczywisty \u2192 odpowied\u017a aperiodyczna, bez przeregulowania' : 'biegun rzeczywisty w prawej p\u00f3\u0142p\u0142aszczy\u017anie \u2192 rozbie\u017cno\u015b\u0107']);
        if(d.re<0) st.push(['sta\u0142a czasowa T = 1/|s|', fx(1/Math.abs(d.re))+' s']);
      }
      return {kind:'Linie pierwiastkowe', title:'Biegun uk\u0142adu ZAMKNI\u0118TEGO przy bie\u017c\u0105cym K',
        what:'Pierwiastek r\u00f3wnania charakterystycznego D(s) + K\u00b7N(s) = 0 dla wzmocnienia ustawionego suwakiem. To on rz\u0105dzi odpowiedzi\u0105 czasow\u0105 uk\u0142adu zamkni\u0119tego. Wsp\u00f3\u0142czynnik t\u0142umienia \u03b6 i pulsacja naturalna \u03c9\u2099 odczytane z jego po\u0142o\u017cenia daj\u0105 przeregulowanie i czasy z karty wzor\u00f3w.',
        formula:['D(s) + K\u00b7N(s) = 0',
                 '\u03c9\u2099 = |s| ,  \u03b6 = \u2212Re s / |s| = cos(k\u0105ta od ujemnej p\u00f3\u0142osi Re)',
                 'M_p = e^(\u2212\u03c0\u03b6 / \u221a(1\u2212\u03b6\u00b2))  ,  t_R2% = 4/(\u03b6\u03c9\u2099)'],
        steps: st,
        result:'s = '+fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):'')+'   (\u03b6 = '+fx(M.zeta)+', \u03c9\u2099 = '+fx(M.wn)+')',
        note: d.re<0 ? 'Re s < 0 \u2014 sk\u0142adowa zanika. Czas ustalania zale\u017cy od |Re s|: t_R2% \u2248 4/|Re s|.' : 'Re s \u2265 0 \u2014 ta sk\u0142adowa NIE zanika. Uk\u0142ad zamkni\u0119ty jest niestabilny.'};
  },
  'rl-locus'(A, d, ctx) {
  return {kind:'Linie pierwiastkowe', title:'Tor biegun\u00f3w zamkni\u0119tych',
      what:'Miejsce geometryczne pierwiastk\u00f3w r\u00f3wnania charakterystycznego, gdy parametr k przebiega warto\u015bci od 0 do \u221e. Ga\u0142\u0119zi jest n \u2014 tyle, ile biegun\u00f3w uk\u0142adu otwartego \u2014 i s\u0105 symetryczne wzgl\u0119dem osi liczb rzeczywistych, bo wsp\u00f3\u0142czynniki wielomianu s\u0105 rzeczywiste.',
      formula:['1 + k\u00b7N(s)/D(s) = 0   \u21d4   D(s) + k\u00b7N(s) = 0',
               'warunek k\u0105ta:  arg[N(s)/D(s)] = \u2212180\u00b0(2q+1)',
               'warunek modu\u0142u:  k = \u2212D(s)/N(s) = 1/|G\u2092(s)|'],
      steps:[['liczba ga\u0142\u0119zi n', String(A.np)],
             ['start (k = 0)','bieguny uk\u0142adu otwartego'],
             ['koniec (k \u2192 \u221e)', A.nz? (A.nz+' ga\u0142\u0119zi w zerach, '+A.alpha+' do niesko\u0144czono\u015bci') : 'wszystkie do niesko\u0144czono\u015bci'],
             ['bie\u017c\u0105ce K', fx(K())],
             ['przemiatanie na wykresie','k od 0 do 4K']],
      result:'n = '+A.np+' ga\u0142\u0119zi',
      note:'Jasno\u015b\u0107 punktu koduje warto\u015b\u0107 k: im ja\u015bniejszy, tym mniejsze wzmocnienie. Czerwone krzy\u017cyki to po\u0142o\u017cenie dla K ustawionego suwakiem.'};
  },
  'rl-seg'(A, d, ctx) {
  return {kind:'Linie pierwiastkowe', title:'Odcinek linii na osi liczb rzeczywistych',
      what:'Regu\u0142a 2 z karty wzor\u00f3w. Linie pierwiastkowe pokrywaj\u0105 si\u0119 z osi\u0105 liczb rzeczywistych na tych jej odcinkach, od kt\u00f3rych NA PRAWO suma liczby rzeczywistych zer i biegun\u00f3w jest nieparzysta.',
      formula:['odcinek nale\u017cy do linii  \u21d4  #{ rzeczywiste z\u1d62 , p\u1d62 na prawo } jest nieparzysta'],
      steps: A.segs.length ? A.segs.map(g=>['odcinek', (g[0]===-Infinity?'\u2212\u221e':fx(g[0]))+'  \u2026  '+fx(g[1])])
                           : [['odcinki','brak']],
      result: A.segs.length+' odcinek/odcink\u00f3w na osi Re',
      note:'Regu\u0142a wynika wprost z warunku k\u0105ta: dla punktu na osi rzeczywistej ka\u017cdy czynnik le\u017c\u0105cy na lewo wnosi 0\u00b0, a ka\u017cdy le\u017c\u0105cy na prawo \u2014 180\u00b0. Suma da nieparzyst\u0105 wielokrotno\u015b\u0107 180\u00b0 tylko przy nieparzystej liczbie czynnik\u00f3w po prawej.'};
  },
  'rl-asym'(A, d, ctx) {
      if(A.delta===null) return {kind:'Linie pierwiastkowe', title:'Asymptoty', what:'Brak asymptot \u2014 wszystkie ga\u0142\u0119zie ko\u0144cz\u0105 si\u0119 w zerach sko\u0144czonych.',
        formula:['\u03b1 = n \u2212 m = 0'], steps:[['\u03b1','0']], result:'brak asymptot', note:''};
      const tab={1:'180\u00b0',2:'\u221290\u00b0, 90\u00b0',3:'\u221260\u00b0, 60\u00b0, 180\u00b0'};
      return {kind:'Linie pierwiastkowe', title:'Asymptoty i punkt \u03b4',
        what:'Regu\u0142a 3 z karty wzor\u00f3w. Do niesko\u0144czono\u015bci ucieka \u03b1 = n \u2212 m ga\u0142\u0119zi. Robi\u0105 to wzd\u0142u\u017c prostych o ustalonych k\u0105tach, przecinaj\u0105cych o\u015b liczb rzeczywistych w jednym wsp\u00f3lnym punkcie \u03b4 \u2014 \u015brodku ci\u0119\u017cko\u015bci biegun\u00f3w pomniejszonym o \u015brodek ci\u0119\u017cko\u015bci zer.',
        formula:['\u03b1 = n \u2212 m',
                 '\u03b4 = ( \u03a3p\u1d62 \u2212 \u03a3z\u1d62 ) / ( n \u2212 m )',
                 'k\u0105ty asymptot: (2q+1)\u00b7180\u00b0/\u03b1 ,  q = 0,1,\u2026,\u03b1\u22121'],
        steps:[['n (bieguny)', String(A.np)], ['m (zera)', String(A.nz)], ['\u03b1 = n \u2212 m', String(A.alpha)],
               ['\u03a3p\u1d62', fx(A.sumP)+(S.nu?'  (bieguny w zerze wnosz\u0105 0)':'')],
               ['\u03a3z\u1d62', fx(A.sumZ)],
               ['\u03b4 = ('+fx(A.sumP)+' \u2212 '+fx(A.sumZ)+') / '+A.alpha, fx(A.delta)],
               ['k\u0105ty (tablica z karty)', tab[A.alpha] || A.asymAng.map(a=>fmt(a,4)+'\u00b0').join(', ')]],
        result:'\u03b4 = '+fx(A.delta)+' ,  \u03b1 = '+A.alpha+' asymptot',
        note:'Bieguny i zera zespolone wchodz\u0105 do sum parami sprz\u0119\u017conymi, wi\u0119c cz\u0119\u015bci urojone si\u0119 znosz\u0105 i \u03b4 zawsze wychodzi rzeczywiste.'};
  },
  'rl-brk'(A, d, ctx) {
  return {kind:'Linie pierwiastkowe', title:'Punkt rozej\u015bcia / schodzenia si\u0119 linii',
      what:'Regu\u0142a 4 z karty wzor\u00f3w. Miejsce, w kt\u00f3rym dwie ga\u0142\u0119zie spotykaj\u0105 si\u0119 na osi rzeczywistej i schodz\u0105 z niej w p\u0142aszczyzn\u0119 zespolon\u0105 (albo odwrotnie). Odpowiada biegunowi podw\u00f3jnemu uk\u0142adu zamkni\u0119tego, czyli granicy mi\u0119dzy odpowiedzi\u0105 aperiodyczn\u0105 a oscylacyjn\u0105.',
      formula:['D(s)\u00b7N\u2032(s) \u2212 D\u2032(s)\u00b7N(s) = 0',
               'wzmocnienie w tym punkcie:  k\u2080 = \u2212D(s\u2080)/N(s\u2080)'],
      steps:[['s\u2080', fx(d.s)], ['k\u2080 = \u2212D(s\u2080)/N(s\u2080)', fx(d.k)],
             ['bie\u017c\u0105ce K', fx(K())],
             ['charakter odpowiedzi', Math.abs(K())<Math.abs(d.k)? 'K < k\u2080 \u2192 bieguny rzeczywiste, brak przeregulowania' : 'K > k\u2080 \u2192 bieguny zespolone, odpowied\u017a z przeregulowaniem']],
      result:'s\u2080 = '+fx(d.s)+'  przy  k\u2080 = '+fx(d.k),
      note:'UWAGA z karty wzor\u00f3w: nie wszystkie pierwiastki r\u00f3wnania D N\u2032 \u2212 D\u2032 N = 0 le\u017c\u0105 na liniach pierwiastkowych. Pokazywane s\u0105 tylko te, kt\u00f3re le\u017c\u0105 na odcinku dopuszczonym regu\u0142\u0105 2 i dla kt\u00f3rych k\u2080 wychodzi dodatnie. Po przekroczeniu k\u2080 cz\u0119\u015b\u0107 rzeczywista biegun\u00f3w cz\u0119sto przestaje si\u0119 zmienia\u0107 \u2014 dalsze zwi\u0119kszanie wzmocnienia nie przyspiesza uk\u0142adu, tylko zwi\u0119ksza przeregulowanie.'};
    /* ---------------- Bode ---------------- */
  },
};
ENTRIES['rl-delta'] = ENTRIES['rl-asym'];
