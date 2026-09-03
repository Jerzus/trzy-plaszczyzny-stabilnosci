import { C, D2, cabs, carg, csub } from './complex.js';
import { $ } from './dom.js';
import { esc, fmt, fx, rowsHtml, sgn } from './format.js';
import { K, S, expand } from './model.js';

/* label for a factor (jw - r), written the way it is on the exercise sheets */
function facLab(r){
  if(Math.abs(r.im)<1e-12){
    const a=-r.re;
    if(Math.abs(a)<1e-12) return 'j\u03c9';
    return '(j\u03c9 ' + sgn(a) + ' ' + fx(Math.abs(a)) + ')';
  }
  return '(j\u03c9 \u2212 (' + fx(r.re) + ' ' + sgn(r.im) + ' j' + fx(Math.abs(r.im)) + '))';
}

function polLab(r){
  if(Math.abs(r.im)<1e-12){
    const a=-r.re;
    if(Math.abs(a)<1e-12) return 's';
    return '(s ' + sgn(a) + ' ' + fx(Math.abs(a)) + ')';
  }
  return '(s\u00b2 ' + sgn(-2*r.re) + ' ' + fx(Math.abs(2*r.re)) + 's ' + sgn(r.re*r.re+r.im*r.im) + ' ' + fx(r.re*r.re+r.im*r.im) + ')';
}

/* magnitude split into factors: |G| = |K| * PROD|jw-z| / (w^nu * PROD|jw-p|) */

/* magnitude split into factors: |G| = |K| * PROD|jw-z| / (w^nu * PROD|jw-p|) */
function magTerms(w){
  const rows=[], s=C(0,w);
  let v=Math.abs(K()); rows.push(['|K|', fx(v)]);
  for(const z of expand('z')){ const m=cabs(csub(s,z)); v*=m; rows.push(['|'+facLab(z)+'|', fx(m)]); }
  if(S.nu){ const m=Math.pow(w,S.nu); v/=m; rows.push(['1 / \u03c9^'+S.nu, fx(1/m)]); }
  for(const q of expand('p')){ const m=cabs(csub(s,q)); v/=m; rows.push(['1 / |'+facLab(q)+'|', fx(1/m)]); }
  return {rows, val:v};
}
/* phase split into factors: arg G = arg K - 90*nu - 57.3*w*Td + SUM arg(jw-z) - SUM arg(jw-p) */

/* phase split into factors: arg G = arg K - 90*nu - 57.3*w*Td + SUM arg(jw-z) - SUM arg(jw-p) */
function phTerms(w){
  const rows=[], s=C(0,w);
  let v=0;
  if(K()<0){ v-=180; rows.push(['K < 0', '\u2212180,00\u00b0']); }
  if(S.nu){ v-=90*S.nu; rows.push(['1 / s^'+S.nu, fmt(-90*S.nu,4)+'\u00b0']); }
  if(S.Td>0){ const t=-S.Td*w*D2; v+=t; rows.push(['e^(\u2212'+fx(S.Td)+'s)', fmt(t,4)+'\u00b0']); }
  for(const z of expand('z')){ const a=carg(csub(s,z))*D2; v+=a; rows.push(['arg '+facLab(z), fmt(a,4)+'\u00b0']); }
  for(const q of expand('p')){ const a=-carg(csub(s,q))*D2; v+=a; rows.push(['\u2212arg '+facLab(q), fmt(a,4)+'\u00b0']); }
  return {rows, val:v};
}

/* second-order metrics for a closed-loop pole pair, per the formula sheet */
function poleMetrics(q){
  const wn=cabs(q), zeta = wn>0 ? -q.re/wn : 0;
  const o={wn,zeta};
  if(zeta>0 && zeta<1){
    o.Mp = Math.exp(-Math.PI*zeta/Math.sqrt(1-zeta*zeta));
    o.tp = Math.PI/(wn*Math.sqrt(1-zeta*zeta));
    o.tn = 1.8/wn;
    o.t1 = 4.6/(zeta*wn); o.t2 = 4/(zeta*wn); o.t5 = 3/(zeta*wn);
    if(zeta<0.707){ o.wr = wn*Math.sqrt(1-2*zeta*zeta); o.Mr = 1/(2*zeta*Math.sqrt(1-zeta*zeta)); }
  }
  return o;
}

function EXPLAIN(id, A, d){
  const nz=A.zeros.length, np=A.poles.length+S.nu;
  const Go = 'G\u2092(s) = K \u00b7 \u03a0(s \u2212 z\u1d62) / ( s^\u03bd \u00b7 \u03a0(s \u2212 p\u1d62) ) \u00b7 e^(\u2212T_d s)';

  switch(id){

  /* ---------------- transfer-function parameters ---------------- */
  case 'K': return {kind:'Parametr transmitancji', title:'K \u2014 wzmocnienie uk\u0142adu otwartego',
    what:'Sta\u0142y mno\u017cnik transmitancji po sprowadzeniu wszystkich czynnik\u00f3w do postaci (s + a). Skaluje modu\u0142 jednakowo na ka\u017cdej pulsacji, czyli przesuwa ca\u0142\u0105 charakterystyk\u0119 amplitudow\u0105 Bodego w pionie. Fazy nie zmienia \u2014 chyba \u017ce jest ujemne, wtedy dok\u0142ada sta\u0142e \u2212180\u00b0.',
    formula:[Go],
    steps:[['K', fx(K())], ['20\u00b7log\u2081\u2080|K|', fmt(20*Math.log10(Math.abs(K())),4)+' dB'],
           ['arg K', (K()<0?'\u2212180\u00b0':'0\u00b0')]],
    result:'K = '+fx(K()),
    note:'Normalizacja znaku: czynnik (10 \u2212 s) zapisujemy jako \u2212(s \u2212 10), a minus w\u0119druje do K. Bez tego faza wychodzi przesuni\u0119ta o 180\u00b0.'};

  case 'Td': return {kind:'Parametr transmitancji', title:'T_d \u2014 op\u00f3\u017anienie transportowe',
    what:'Czyste przesuni\u0119cie sygna\u0142u w czasie. Z tablicy transformat: \u2112[f(t \u2212 T\u2080)] = F(s)\u00b7e^(\u2212T\u2080s). Modu\u0142u nie rusza, bo |e^(\u2212j\u03c9T_d)| = 1, ale odbiera faz\u0119 proporcjonalnie do pulsacji \u2014 i to bez ograniczenia.',
    formula:['e^(\u2212j\u03c9T_d) : |\u00b7| = 1 ,  arg = \u2212\u03c9T_d [rad] = \u221257,3\u00b7\u03c9T_d [\u00b0]'],
    steps: S.Td>0 ? [['T_d', fx(S.Td)+' s'],
        ['ubytek fazy przy \u03c9 = 1', fmt(-S.Td*D2,4)+'\u00b0'],
        A.wc? ['ubytek fazy przy \u03c9_c = '+fx(A.wc), fmt(-S.Td*A.wc*D2,4)+'\u00b0'] : ['\u03c9_c','brak przeci\u0119cia 0 dB']]
      : [['T_d','0 s \u2014 op\u00f3\u017anienie wy\u0142\u0105czone']],
    result:'T_d = '+fx(S.Td)+' s',
    note:'Op\u00f3\u017anienie zawsze pogarsza zapas fazy i nigdy nie poprawia modu\u0142u. Nie da si\u0119 go zapisa\u0107 wielomianem, dlatego na liniach pierwiastkowych jest przybli\u017cone aproksymacj\u0105 Pad\u00e9go: e^(\u2212T_d s) \u2248 (1 \u2212 T_d s/2)/(1 + T_d s/2).'};

  case 'nu': return {kind:'Parametr transmitancji', title:'\u03bd \u2014 rz\u0105d astatyzmu',
    what:'Krotno\u015b\u0107 bieguna w punkcie s = 0, czyli liczba integrator\u00f3w w torze otwartym. Decyduje o nachyleniu startowym charakterystyki amplitudowej, o fazie pocz\u0105tkowej i o tym, czy uk\u0142ad zamkni\u0119ty ma uchyb ustalony.',
    formula:['1/(j\u03c9)^\u03bd :  |\u00b7| = 1/\u03c9^\u03bd ,  arg = \u221290\u00b0\u00b7\u03bd'],
    steps:[['\u03bd', String(S.nu)],
           ['nachylenie L(\u03c9) przy \u03c9 \u2192 0', (-20*S.nu)+' dB/dek'],
           ['arg G\u2092(j0)', (-90*S.nu)+'\u00b0' + (K()<0?' \u2212 180\u00b0 (K < 0)':'')],
           ['uchyb po\u0142o\u017ceniowy', S.nu===0? 'e(\u221e) = 1/(1+k_p) \u2260 0' : 'e(\u221e) = 0']],
    result:'\u03bd = '+S.nu,
    note:'Biegun w zerze nie wlicza si\u0119 do P. Kontur Nyquista omija go ma\u0142ym p\u00f3\u0142okr\u0119giem od strony prawej p\u00f3\u0142p\u0142aszczyzny, wi\u0119c le\u017cy poza wn\u0119trzem konturu. Zamiast tego wnosi \u0142uk o niesko\u0144czonym promieniu, zataczaj\u0105cy \u03bd\u00b7180\u00b0 zgodnie z ruchem wskaz\u00f3wek.'};

  case 'lzlp': return {kind:'Struktura', title:'l_z / l_p \u2014 liczba zer i biegun\u00f3w',
    what:'Stopie\u0144 licznika m i mianownika n transmitancji otwartej. Ich r\u00f3\u017cnica rz\u0105dzi zachowaniem na obu kra\u0144cach pasma i liczb\u0105 ga\u0142\u0119zi linii pierwiastkowych uciekaj\u0105cych do niesko\u0144czono\u015bci.',
    formula:['arg G\u2092(j\u221e) = \u221290\u00b0\u00b7(l_p \u2212 l_z)', '\u03b1 = n \u2212 m  \u2014 liczba asymptot linii pierwiastkowych'],
    steps:[['l_z = m', String(nz)], ['l_p = n', String(np)+(S.nu?' (w tym '+S.nu+' w zerze)':'')],
           ['l_p \u2212 l_z', String(np-nz)],
           ['faza ko\u0144cowa', fmt(-90*(np-nz),4)+'\u00b0'+(K()<0?' + 180\u00b0 (K < 0)':'')],
           ['opadanie L(\u03c9) przy \u03c9 \u2192 \u221e', (-20*(np-nz))+' dB/dek']],
    result:'l_z = '+nz+' , l_p = '+np,
    note:'Przy l_p > l_z hodograf ko\u0144czy w punkcie (0, j0). K\u0105t doj\u015bcia do zera to w\u0142a\u015bnie \u221290\u00b0\u00b7(l_p \u2212 l_z) \u2014 bez niego nie wiadomo, z kt\u00f3rej strony krzywa wchodzi do pocz\u0105tku uk\u0142adu.'};

  case 'P': return {kind:'Kryterium Nyquista', title:'P \u2014 bieguny otwarte w prawej p\u00f3\u0142p\u0142aszczy\u017anie',
    what:'Liczba pierwiastk\u00f3w mianownika G\u2092(s) o cz\u0119\u015bci rzeczywistej dodatniej. To jedyna wielko\u015b\u0107 w kryterium Nyquista, kt\u00f3rej nie odczytuje si\u0119 z wykresu \u2014 trzeba j\u0105 policzy\u0107 z samej transmitancji, przed narysowaniem czegokolwiek.',
    formula:['P = #{ p\u1d62 : Re p\u1d62 > 0 }'],
    steps: A.poles.length ? A.poles.map(q=>['p = '+fx(q.re)+(Math.abs(q.im)>1e-9?(' '+sgn(q.im)+' j'+fx(Math.abs(q.im))):''),
            q.re>1e-9? 'Re > 0 \u2192 liczy si\u0119' : 'Re \u2264 0 \u2192 nie liczy si\u0119'])
        : [['brak biegun\u00f3w sko\u0144czonych','\u2014']],
    result:'P = '+A.P,
    note:'Bieguny w s = 0 s\u0105 wykluczone przez wci\u0119cie konturu i do P si\u0119 nie wliczaj\u0105. Gdy P \u2260 0, uproszczone kryterium Bodego przestaje obowi\u0105zywa\u0107 \u2014 i milcz\u0105co k\u0142amie.'};

  case 'Z': case 'verdict': return {kind:'Kryterium Nyquista', title:'Z \u2014 bieguny zamkni\u0119te w prawej p\u00f3\u0142p\u0142aszczy\u017anie',
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
  case 'wc': {
    if(!A.wc) return {kind:'Zapas stabilno\u015bci', title:'\u03c9_c \u2014 pulsacja odci\u0119cia amplitudowego',
      what:'Pulsacja, przy kt\u00f3rej modu\u0142 transmitancji otwartej spada dok\u0142adnie do 1, czyli L(\u03c9) przecina lini\u0119 0 dB. W notatkach z wyk\u0142adu oznaczana \u03c9_gc (gain crossover).',
      formula:['|G\u2092(j\u03c9_c)| = 1   \u21d4   L(\u03c9_c) = 20\u00b7log\u2081\u2080|G\u2092(j\u03c9_c)| = 0 dB'],
      steps:[['przeci\u0119cie z 0 dB','nie wyst\u0119puje w badanym pa\u015bmie']],
      result:'\u03c9_c nie istnieje',
      note:'Bez przeci\u0119cia z 0 dB zapas fazy jest nieokre\u015blony. Charakterystyka le\u017cy w ca\u0142o\u015bci powy\u017cej albo poni\u017cej 0 dB.'};
    const m=magTerms(A.wc);
    return {kind:'Zapas stabilno\u015bci', title:'\u03c9_c \u2014 pulsacja odci\u0119cia amplitudowego',
      what:'Pulsacja, przy kt\u00f3rej modu\u0142 transmitancji otwartej spada dok\u0142adnie do 1, czyli charakterystyka amplitudowa przecina lini\u0119 0 dB. W notatkach z wyk\u0142adu: \u03c9_gc. To w tym punkcie odczytuje si\u0119 zapas fazy, a na hodografie Nyquista jest to przeci\u0119cie z okr\u0119giem jednostkowym.',
      formula:['|G\u2092(j\u03c9_c)| = 1',
               '|G\u2092(j\u03c9)| = |K| \u00b7 \u03a0|j\u03c9 \u2212 z\u1d62|  /  ( \u03c9^\u03bd \u00b7 \u03a0|j\u03c9 \u2212 p\u1d62| )'],
      steps: m.rows.concat([['iloczyn = |G\u2092(j\u03c9_c)|', fx(m.val)]]),
      result:'\u03c9_c = '+fx(A.wc)+' rad/s',
      note:'Na \u0107wiczeniach r\u00f3wnanie |G(j\u03c9)| = 1 rozwi\u0105zuje si\u0119 po podniesieniu obu stron do kwadratu i podstawieniu x = \u03c9\u00b2 \u2014 to likwiduje pierwiastki i zostawia wielomian w x. Tutaj pierwiastek jest znajdowany numerycznie metod\u0105 bisekcji na log \u03c9.'};
  }

  case 'pm': {
    if(A.pm===null) return {kind:'Zapas stabilno\u015bci', title:'PM \u2014 zapas fazy',
      what:'Ile stopni fazy mo\u017cna jeszcze straci\u0107 przy pulsacji \u03c9_c, zanim uk\u0142ad zamkni\u0119ty utraci stabilno\u015b\u0107.',
      formula:['PM = 180\u00b0 + arg G\u2092(j\u03c9_c)'],
      steps:[['\u03c9_c','nie istnieje \u2192 zapas fazy nieokre\u015blony']],
      result:'PM \u2014 nieokre\u015blony', note:'Charakterystyka amplitudowa nie przecina 0 dB.'};
    const t=phTerms(A.wc);
    return {kind:'Zapas stabilno\u015bci', title:'PM \u2014 zapas fazy',
      what:'Odleg\u0142o\u015b\u0107 fazy od \u2212180\u00b0 w pulsacji odci\u0119cia amplitudowego \u03c9_c. M\u00f3wi, ile dodatkowego op\u00f3\u017anienia fazowego uk\u0142ad zniesie, zanim punkt pracy trafi w (\u22121, j0). Na wykresie Bodego to pionowy odst\u0119p charakterystyki fazowej od linii \u2212180\u00b0 w \u03c9_c; na hodografie \u2014 k\u0105t mi\u0119dzy ujemn\u0105 p\u00f3\u0142osi\u0105 Re a promieniem do punktu przeci\u0119cia z okr\u0119giem jednostkowym.',
      formula:['PM = 180\u00b0 + arg G\u2092(j\u03c9_c)',
               'arg G\u2092(j\u03c9) = arg K \u2212 90\u00b0\u03bd \u2212 57,3\u00b7\u03c9T_d + \u03a3 arg(j\u03c9 \u2212 z\u1d62) \u2212 \u03a3 arg(j\u03c9 \u2212 p\u1d62)'],
      steps: [['\u03c9_c', fx(A.wc)+' rad/s']].concat(t.rows).concat([
              ['suma = arg G\u2092(j\u03c9_c)', fmt(t.val,4)+'\u00b0'],
              ['PM = 180\u00b0 + ('+fmt(t.val,4)+'\u00b0)', fmt(A.pm,4)+'\u00b0']]),
      result:'PM = '+fmt(A.pm,4)+'\u00b0',
      note: (A.P===0 && A.zeros.every(z=>z.re<=1e-9) && S.Td===0)
        ? 'P = 0 i uk\u0142ad jest minimalnofazowy, wi\u0119c wolno u\u017cy\u0107 uproszczonego kryterium Bodego: PM > 0 \u21d4 uk\u0142ad zamkni\u0119ty stabilny. '+(A.pm>0?'Tutaj PM > 0 \u2014 stabilny.':'Tutaj PM \u2264 0 \u2014 niestabilny.')
        : 'UWAGA: P = '+A.P+', a uk\u0142ad '+((A.zeros.every(z=>z.re<=1e-9)&&S.Td===0)?'':'nie ')+'jest minimalnofazowy. Uproszczone kryterium Bodego tutaj NIE obowi\u0105zuje \u2014 dodatni zapas fazy nie dowodzi stabilno\u015bci. Wi\u0105\u017c\u0105cy jest bilans okr\u0105\u017ce\u0144: Z = '+A.Z+'.'};
  }

  case 'w180': {
    if(!A.w180) return {kind:'Zapas stabilno\u015bci', title:'\u03c9\u2081\u2088\u2080 \u2014 pulsacja odci\u0119cia fazowego',
      what:'Pulsacja, przy kt\u00f3rej faza osi\u0105ga \u2212180\u00b0, czyli hodograf przecina ujemn\u0105 p\u00f3\u0142o\u015b rzeczywist\u0105. W notatkach: \u03c9_pc (phase crossover).',
      formula:['arg G\u2092(j\u03c9\u2081\u2088\u2080) = \u2212180\u00b0   \u21d4   Im G\u2092(j\u03c9\u2081\u2088\u2080) = 0  przy  Re G\u2092 < 0'],
      steps:[['przeci\u0119cie z ujemn\u0105 p\u00f3\u0142osi\u0105 Re','brak w badanym pa\u015bmie']],
      result:'\u03c9\u2081\u2088\u2080 nie istnieje \u2192 GM = \u221e',
      note:'\u017beby faza dosz\u0142a do \u2212180\u00b0, potrzeba co najmniej trzech biegun\u00f3w albo integratora z dwiema inercjami. Uk\u0142ad I i II rz\u0119du bez zer i bez astatyzmu zawsze ma GM = \u221e.'};
    const t=phTerms(A.w180), m=magTerms(A.w180);
    return {kind:'Zapas stabilno\u015bci', title:'\u03c9\u2081\u2088\u2080 \u2014 pulsacja odci\u0119cia fazowego',
      what:'Pulsacja, przy kt\u00f3rej faza osi\u0105ga \u2212180\u00b0. Hodograf przecina wtedy ujemn\u0105 p\u00f3\u0142o\u015b rzeczywist\u0105, a na wykresie Bodego charakterystyka fazowa tnie lini\u0119 \u2212180\u00b0. W notatkach oznaczana \u03c9_pc. To tutaj odczytuje si\u0119 zapas wzmocnienia.',
      formula:['arg G\u2092(j\u03c9\u2081\u2088\u2080) = \u2212180\u00b0',
               'r\u00f3wnowa\u017cnie: Q(\u03c9\u2081\u2088\u2080) = Im G\u2092(j\u03c9\u2081\u2088\u2080) = 0  przy  P(\u03c9\u2081\u2088\u2080) = Re G\u2092 < 0'],
      steps: t.rows.concat([['suma = arg G\u2092(j\u03c9\u2081\u2088\u2080)', fmt(t.val,4)+'\u00b0'],
              ['|G\u2092(j\u03c9\u2081\u2088\u2080)|', fx(m.val)],
              ['Re G\u2092(j\u03c9\u2081\u2088\u2080)', fx(A.reCross)]]),
      result:'\u03c9\u2081\u2088\u2080 = '+fx(A.w180)+' rad/s',
      note:'Analitycznie warunek rozwi\u0105zuje si\u0119 ze wzoru na tangens sumy: arctg a + arctg b = arctg[(a+b)/(1 \u2212 ab)]. Suma daje 180\u00b0 wtedy, gdy a + b = 0 przy ab > 1.'};
  }

  case 'gm': case 'gmdb': {
    if(!isFinite(A.gm)) return {kind:'Zapas stabilno\u015bci', title:'GM \u2014 zapas wzmocnienia',
      what:'Ile razy mo\u017cna zwi\u0119kszy\u0107 wzmocnienie, zanim hodograf trafi w punkt (\u22121, j0).',
      formula:['GM = 1 / |G\u2092(j\u03c9\u2081\u2088\u2080)|'],
      steps:[['\u03c9\u2081\u2088\u2080','brak \u2192 krzywa nie tnie ujemnej p\u00f3\u0142osi Re']],
      result:'GM = \u221e', note:'Zapas wzmocnienia jest nieograniczony \u2014 \u017cadne zwi\u0119kszenie K nie doprowadzi do przeci\u0119cia punktu krytycznego przy tej strukturze.'};
    return {kind:'Zapas stabilno\u015bci', title:'GM \u2014 zapas wzmocnienia (M_g)',
      what:'Ile razy wolno pomno\u017cy\u0107 wzmocnienie, zanim hodograf przejdzie przez punkt (\u22121, j0). Geometrycznie to odwrotno\u015b\u0107 odleg\u0142o\u015bci punktu przeci\u0119cia z osi\u0105 Re od pocz\u0105tku uk\u0142adu. Na wykresie Bodego: ile decybeli brakuje charakterystyce amplitudowej do 0 dB w pulsacji \u03c9\u2081\u2088\u2080.',
      formula:['GM = 1 / |G\u2092(j\u03c9\u2081\u2088\u2080)| = 1 / |Re G\u2092(j\u03c9\u2081\u2088\u2080)|',
               'M_g = 20\u00b7log\u2081\u2080 GM = \u2212L(\u03c9\u2081\u2088\u2080)  [dB]'],
      steps:[['\u03c9\u2081\u2088\u2080', fx(A.w180)+' rad/s'],
             ['Re G\u2092(j\u03c9\u2081\u2088\u2080)', fx(A.reCross)],
             ['GM = 1 / |'+fx(A.reCross)+'|', fx(A.gm)],
             ['M_g = 20\u00b7log\u2081\u2080('+fx(A.gm)+')', fmt(20*Math.log10(A.gm),4)+' dB']],
      result:'GM = '+fx(A.gm)+'   (M_g = '+fmt(20*Math.log10(A.gm),4)+' dB)',
      note: A.gm>1
        ? 'GM > 1, czyli przeci\u0119cie le\u017cy na PRAWO od \u22121 (bli\u017cej zera). Punkt krytyczny nie jest okr\u0105\u017cany przez t\u0119 ga\u0142\u0105\u017a.'
        : 'GM < 1, czyli przeci\u0119cie le\u017cy na LEWO od \u22121. Punkt krytyczny jest okr\u0105\u017cany \u2014 zapasy formalnie nie istniej\u0105, a uk\u0142ad zamkni\u0119ty jest niestabilny.'};
  }

  case 'recross': {
    if(A.reCross===null) return {kind:'Punkt charakterystyczny', title:'Przeci\u0119cie z osi\u0105 liczb rzeczywistych',
      what:'Punkt, w kt\u00f3rym hodograf tnie o\u015b Re.', formula:['Q(\u03c9) = Im G\u2092(j\u03c9) = 0'],
      steps:[['rozwi\u0105zania dodatnie','brak']], result:'brak przeci\u0119cia \u2192 GM = \u221e', note:''};
    return {kind:'Punkt charakterystyczny', title:'Przeci\u0119cie hodografu z osi\u0105 liczb rzeczywistych',
      what:'Punkt, w kt\u00f3rym cz\u0119\u015b\u0107 urojona transmitancji widmowej zeruje si\u0119 przy ujemnej cz\u0119\u015bci rzeczywistej. To najwa\u017cniejszy punkt ca\u0142ego hodografu \u2014 jego po\u0142o\u017cenie wzgl\u0119dem \u22121 rozstrzyga o zapasie wzmocnienia i, przy P = 0, o stabilno\u015bci.',
      formula:['Q(\u03c9) = Im G\u2092(j\u03c9) = 0  \u21d2  \u03c9\u2081\u2088\u2080', 'punkt = ( P(\u03c9\u2081\u2088\u2080) , j0 ) , gdzie P(\u03c9) = Re G\u2092(j\u03c9)'],
      steps:[['\u03c9\u2081\u2088\u2080 z warunku Q = 0', fx(A.w180)+' rad/s'],
             ['P(\u03c9\u2081\u2088\u2080) = Re G\u2092', fx(A.reCross)],
             ['po\u0142o\u017cenie wzgl\u0119dem \u22121', Math.abs(A.reCross)<1 ? 'na PRAWO od \u22121' : 'na LEWO od \u22121'],
             ['GM = 1/|P(\u03c9\u2081\u2088\u2080)|', fx(A.gm)]],
      result:'( '+fx(A.reCross)+' , j0 )  przy \u03c9 = '+fx(A.w180)+' rad/s',
      note:'Wersja uproszczona kryterium (dzia\u0142a tylko przy P = 0): uk\u0142ad zamkni\u0119ty jest stabilny wtedy, gdy to przeci\u0119cie le\u017cy na prawo od \u22121, czyli bli\u017cej pocz\u0105tku uk\u0142adu.'};
  }

  case 'N': return {kind:'Kryterium Nyquista', title:'N \u2014 liczba okr\u0105\u017ce\u0144 punktu (\u22121, j0)',
    what:'Ile razy pe\u0142ny hodograf owija si\u0119 wok\u00f3\u0142 punktu krytycznego, liczone zgodnie z ruchem wskaz\u00f3wek zegara (przeciwnie \u2014 warto\u015b\u0107 ujemna). Liczy si\u0119 obraz ca\u0142ego konturu Cauchy\u2019ego: ga\u0142\u0105\u017a dla \u03c9 > 0, jej lustrzane odbicie dla \u03c9 < 0 oraz \u0142uk wci\u0119cia wok\u00f3\u0142 biegun\u00f3w na osi urojonej.',
    formula:['N = \u2212(1/2\u03c0) \u00b7 \u0394 arg [ 1 + G\u2092(s) ]  po pe\u0142nym konturze',
             'Z = N + P'],
    steps:[['odcinek I \u2014 o\u015b j\u03c9 w g\u00f3r\u0119','zwyk\u0142y hodograf'],
           ['odcinek II \u2014 wielki p\u00f3\u0142okr\u0105g','punkt (0, j0), bo l_p > l_z'],
           ['odcinek III \u2014 o\u015b j\u03c9 w d\u00f3\u0142','odbicie I wzgl\u0119dem osi Re'],
           ['odcinek IV \u2014 wci\u0119cie wok\u00f3\u0142 s = 0', S.nu? '\u0142uk o promieniu \u221e, '+(S.nu*180)+'\u00b0 CW' : 'brak (\u03bd = 0)'],
           ['przyrost argumentu \u0142\u0105cznie', String(A.Ncw)+'\u00b7(\u22122\u03c0)']],
    result:'N = '+A.Ncw,
    note:'Metoda liczy przyrost argumentu numerycznie, wi\u0119c dzia\u0142a tak samo dla uk\u0142ad\u00f3w z biegunami w prawej p\u00f3\u0142p\u0142aszczy\u017anie, z zerami nieminimalnofazowymi i z op\u00f3\u017anieniem \u2014 czyli tam, gdzie regu\u0142y kciukowe zawodz\u0105.'};

  case 'kp': {
    if(S.nu>0) return {kind:'Jako\u015b\u0107 regulacji', title:'Wzmocnienie statyczne i uchyb ustalony',
      what:'Warto\u015b\u0107, do jakiej d\u0105\u017cy G\u2092(s) przy s \u2192 0, decyduje o uchybie ustalonym uk\u0142adu zamkni\u0119tego przy wymuszeniu skokowym.',
      formula:['k_p = lim(s\u21920) G\u2092(s)', 'e(\u221e) = 1 / (1 + k_p)'],
      steps:[['\u03bd = '+S.nu+' \u2192 integrator w torze','k_p = \u221e'], ['e(\u221e) = 1/(1+\u221e)','0']],
      result:'k_p = \u221e  \u2192  e(\u221e) = 0',
      note:'Astatyzm rz\u0119du \u03bd \u2265 1 zeruje uchyb po\u0142o\u017ceniowy. Cen\u0105 s\u0105 sta\u0142e \u221290\u00b0 fazy, kt\u00f3re zjadaj\u0105 zapas.'};
    return {kind:'Jako\u015b\u0107 regulacji', title:'k_p \u2014 wzmocnienie statyczne i uchyb po\u0142o\u017ceniowy',
      what:'Wzmocnienie toru otwartego dla sygna\u0142u sta\u0142ego. Na wykresie Bodego to p\u0142aski odcinek po lewej stronie, o wysoko\u015bci 20\u00b7log\u2081\u2080 k_p. Wprost przelicza si\u0119 na uchyb ustalony uk\u0142adu zamkni\u0119tego przy skoku jednostkowym.',
      formula:['k_p = lim(s\u21920) G\u2092(s) = G\u2092(0)', 'e(\u221e) = 1 / (1 + k_p)', 'L(\u03c9\u21920) = 20\u00b7log\u2081\u2080 k_p'],
      steps:[['k_p = G\u2092(0)', fx(A.kp)],
             ['20\u00b7log\u2081\u2080 k_p', fmt(20*Math.log10(Math.abs(A.kp)),4)+' dB'],
             ['e(\u221e) = 1/(1 + '+fx(A.kp)+')', fx(1/(1+A.kp))]],
      result:'k_p = '+fx(A.kp)+'  \u2192  e(\u221e) = '+fx(1/(1+A.kp)),
      note:'Wi\u0119ksze k_p to mniejszy uchyb, ale te\u017c wy\u017cej po\u0142o\u017cona charakterystyka amplitudowa, wi\u0119ksze \u03c9_c i mniejszy zapas fazy. To jest klasyczny kompromis dok\u0142adno\u015b\u0107 \u2013 stabilno\u015b\u0107.'};
  }

  /* ---------------- root locus ---------------- */
  case 'rl-pole': return {kind:'Linie pierwiastkowe', title:'Biegun uk\u0142adu otwartego',
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

  case 'rl-zero': return {kind:'Linie pierwiastkowe', title:'Zero uk\u0142adu otwartego',
    what:'Pierwiastek licznika G\u2092(s). Linie pierwiastkowe ko\u0144cz\u0105 si\u0119 w zerach przy k \u2192 \u221e. Zer jest m, biegun\u00f3w n, wi\u0119c \u03b1 = n \u2212 m ga\u0142\u0119zi nie ma dok\u0105d p\u00f3j\u015b\u0107 i ucieka do niesko\u0144czono\u015bci wzd\u0142u\u017c asymptot.',
    formula:['k \u2192 \u221e  \u21d2  N(s) = 0  \u21d2  s = z\u1d62'],
    steps:[['po\u0142o\u017cenie', fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):'')],
           ['czynnik w liczniku', polLab(d)],
           ['pulsacja \u0142amania', fx(cabs(d))+' rad/s'],
           ['wk\u0142ad do fazy (\u03c9: 0 \u2192 \u221e)', d.re<0? '0\u00b0 \u2192 +90\u00b0' : '+180\u00b0 \u2192 +90\u00b0 (zero w prawej p\u00f3\u0142p\u0142aszczy\u017anie)'],
           ['wk\u0142ad do L(\u03c9)', '0 dB do \u03c9 = '+fx(cabs(d))+', potem +20 dB/dek']],
    result:'z = '+fx(d.re)+(Math.abs(d.im)>1e-9?(' '+sgn(d.im)+' j'+fx(Math.abs(d.im))):''),
    note: d.re>0 ? 'Zero w prawej p\u00f3\u0142p\u0142aszczy\u017anie czyni uk\u0142ad NIEMINIMALNOFAZOWYM: modu\u0142 ro\u015bnie, ale faza maleje. Uproszczone kryterium Bodego przestaje obowi\u0105zywa\u0107.' : 'Zero stabilne \u2014 dodaje faz\u0119, wi\u0119c poprawia zapas. Na tym polega dzia\u0142anie sterownika typu LEAD.'};

  case 'rl-int': return {kind:'Linie pierwiastkowe', title:'Biegun wielokrotny w s = 0 (integrator)',
    what:'Astatyzm rz\u0119du \u03bd oznacza \u03bd biegun\u00f3w w pocz\u0105tku uk\u0142adu. Na p\u0142aszczy\u017anie s to punkt startowy \u03bd ga\u0142\u0119zi linii pierwiastkowych.',
    formula:['1/s^\u03bd ,  \u03bd = '+S.nu],
    steps:[['liczba ga\u0142\u0119zi startuj\u0105cych z s = 0', String(S.nu)],
           ['wk\u0142ad do fazy', (-90*S.nu)+'\u00b0 (sta\u0142y)'],
           ['nachylenie L przy \u03c9 \u2192 0', (-20*S.nu)+' dB/dek']],
    result:'s = 0, krotno\u015b\u0107 '+S.nu,
    note:'Biegun w zerze le\u017cy na konturze Nyquista, wi\u0119c kontur trzeba wok\u00f3\u0142 niego wci\u0105\u0107 ma\u0142ym p\u00f3\u0142okr\u0119giem. Wybieraj\u0105c omini\u0119cie od strony prawej p\u00f3\u0142p\u0142aszczyzny wykluczamy go z wn\u0119trza konturu \u2014 dlatego nie wlicza si\u0119 do P.'};

  case 'rl-cl': {
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
  }

  case 'rl-locus': return {kind:'Linie pierwiastkowe', title:'Tor biegun\u00f3w zamkni\u0119tych',
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

  case 'rl-seg': return {kind:'Linie pierwiastkowe', title:'Odcinek linii na osi liczb rzeczywistych',
    what:'Regu\u0142a 2 z karty wzor\u00f3w. Linie pierwiastkowe pokrywaj\u0105 si\u0119 z osi\u0105 liczb rzeczywistych na tych jej odcinkach, od kt\u00f3rych NA PRAWO suma liczby rzeczywistych zer i biegun\u00f3w jest nieparzysta.',
    formula:['odcinek nale\u017cy do linii  \u21d4  #{ rzeczywiste z\u1d62 , p\u1d62 na prawo } jest nieparzysta'],
    steps: A.segs.length ? A.segs.map(g=>['odcinek', (g[0]===-Infinity?'\u2212\u221e':fx(g[0]))+'  \u2026  '+fx(g[1])])
                         : [['odcinki','brak']],
    result: A.segs.length+' odcinek/odcink\u00f3w na osi Re',
    note:'Regu\u0142a wynika wprost z warunku k\u0105ta: dla punktu na osi rzeczywistej ka\u017cdy czynnik le\u017c\u0105cy na lewo wnosi 0\u00b0, a ka\u017cdy le\u017c\u0105cy na prawo \u2014 180\u00b0. Suma da nieparzyst\u0105 wielokrotno\u015b\u0107 180\u00b0 tylko przy nieparzystej liczbie czynnik\u00f3w po prawej.'};

  case 'rl-asym': case 'rl-delta': {
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
  }

  case 'rl-brk': return {kind:'Linie pierwiastkowe', title:'Punkt rozej\u015bcia / schodzenia si\u0119 linii',
    what:'Regu\u0142a 4 z karty wzor\u00f3w. Miejsce, w kt\u00f3rym dwie ga\u0142\u0119zie spotykaj\u0105 si\u0119 na osi rzeczywistej i schodz\u0105 z niej w p\u0142aszczyzn\u0119 zespolon\u0105 (albo odwrotnie). Odpowiada biegunowi podw\u00f3jnemu uk\u0142adu zamkni\u0119tego, czyli granicy mi\u0119dzy odpowiedzi\u0105 aperiodyczn\u0105 a oscylacyjn\u0105.',
    formula:['D(s)\u00b7N\u2032(s) \u2212 D\u2032(s)\u00b7N(s) = 0',
             'wzmocnienie w tym punkcie:  k\u2080 = \u2212D(s\u2080)/N(s\u2080)'],
    steps:[['s\u2080', fx(d.s)], ['k\u2080 = \u2212D(s\u2080)/N(s\u2080)', fx(d.k)],
           ['bie\u017c\u0105ce K', fx(K())],
           ['charakter odpowiedzi', Math.abs(K())<Math.abs(d.k)? 'K < k\u2080 \u2192 bieguny rzeczywiste, brak przeregulowania' : 'K > k\u2080 \u2192 bieguny zespolone, odpowied\u017a z przeregulowaniem']],
    result:'s\u2080 = '+fx(d.s)+'  przy  k\u2080 = '+fx(d.k),
    note:'UWAGA z karty wzor\u00f3w: nie wszystkie pierwiastki r\u00f3wnania D N\u2032 \u2212 D\u2032 N = 0 le\u017c\u0105 na liniach pierwiastkowych. Pokazywane s\u0105 tylko te, kt\u00f3re le\u017c\u0105 na odcinku dopuszczonym regu\u0142\u0105 2 i dla kt\u00f3rych k\u2080 wychodzi dodatnie. Po przekroczeniu k\u2080 cz\u0119\u015b\u0107 rzeczywista biegun\u00f3w cz\u0119sto przestaje si\u0119 zmienia\u0107 \u2014 dalsze zwi\u0119kszanie wzmocnienia nie przyspiesza uk\u0142adu, tylko zwi\u0119ksza przeregulowanie.'};

  /* ---------------- Bode ---------------- */
  case 'bd-mag': return {kind:'Charakterystyka Bodego', title:'L(\u03c9) \u2014 charakterystyka amplitudowa',
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

  case 'bd-pha': return {kind:'Charakterystyka Bodego', title:'\u03c6(\u03c9) \u2014 charakterystyka fazowa',
    what:'Argument transmitancji widmowej. Faza jest addytywna: sumuje si\u0119 wk\u0142ady wszystkich czynnik\u00f3w. Wykres jest rozwini\u0119ty w spos\u00f3b ci\u0105g\u0142y \u2014 nie wolno u\u017cywa\u0107 samego arctg(Q/P), bo kalkulator zwraca wynik tylko z przedzia\u0142u (\u221290\u00b0, 90\u00b0).',
    formula:['\u03c6(\u03c9) = arg G\u2092(j\u03c9) = arg K \u2212 90\u00b0\u03bd \u2212 57,3\u00b7\u03c9T_d + \u03a3 arg(j\u03c9 \u2212 z\u1d62) \u2212 \u03a3 arg(j\u03c9 \u2212 p\u1d62)'],
    steps:[['\u03c6(\u03c9 \u2192 0)', fmt(-90*S.nu + (K()<0?-180:0),4)+'\u00b0'],
           ['\u03c6(\u03c9 \u2192 \u221e)', S.Td>0? '\u2192 \u2212\u221e (op\u00f3\u017anienie)' : fmt(-90*(A.np-A.nz)+(K()<0?-180:0),4)+'\u00b0'],
           ['w ka\u017cdej pulsacji \u0142amania','\u00b145\u00b0 od danego czynnika'],
           ['liczba sk\u0142adnik\u00f3w sumy', String(A.poles.length+A.zeros.length+(S.nu?1:0)+(S.Td>0?1:0)+(K()<0?1:0))]],
    result: A.w180? 'przecina \u2212180\u00b0 przy \u03c9\u2081\u2088\u2080 = '+fx(A.w180)+' rad/s' : 'nie osi\u0105ga \u2212180\u00b0',
    note:'Kontrola: faza powinna male\u0107 monotonicznie. Je\u015bli gdzie\u015b ro\u015bnie, musi to pochodzi\u0107 od zera w liczniku. Liczba sk\u0142adnik\u00f3w sumy musi si\u0119 zgadza\u0107 z l_p + l_z, plus jeden za integrator.'};

  case 'bd-0db': return {kind:'Linia odniesienia', title:'Linia 0 dB',
    what:'Poziom, na kt\u00f3rym modu\u0142 transmitancji otwartej wynosi dok\u0142adnie 1. Sygna\u0142 obiega p\u0119tl\u0119 bez zmiany amplitudy. Przeci\u0119cie tej linii wyznacza pulsacj\u0119 \u03c9_c, w kt\u00f3rej odczytuje si\u0119 zapas fazy.',
    formula:['L = 0 dB  \u21d4  |G\u2092(j\u03c9)| = 1'],
    steps:[['20\u00b7log\u2081\u2080(1)','0 dB'], ['przeci\u0119cie', A.wc? '\u03c9_c = '+fx(A.wc)+' rad/s':'brak']],
    result:'|G\u2092| = 1', note:'Pasmo, w kt\u00f3rym L(\u03c9) > 0 dB, jest jedynym, w kt\u00f3rym licz\u0105 si\u0119 przej\u015bcia fazy przez \u2212180\u00b0 w uog\u00f3lnionym kryterium Bodego (kryterium przej\u015b\u0107).'};

  case 'bd-180': return {kind:'Linia odniesienia', title:'Linia \u2212180\u00b0',
    what:'Faza, przy kt\u00f3rej sygna\u0142 wraca do w\u0119z\u0142a sumacyjnego w przeciwfazie. Ujemne sprz\u0119\u017cenie zwrotne staje si\u0119 dodatnie. Przeci\u0119cie tej linii wyznacza \u03c9\u2081\u2088\u2080, gdzie odczytuje si\u0119 zapas wzmocnienia.',
    formula:['\u03c6 = \u2212180\u00b0  \u21d4  G\u2092(j\u03c9) le\u017cy na ujemnej p\u00f3\u0142osi rzeczywistej'],
    steps:[['przeci\u0119cie', A.w180? '\u03c9\u2081\u2088\u2080 = '+fx(A.w180)+' rad/s':'brak'],
           ['|G\u2092| w tym punkcie', A.w180? fx(1/A.gm) : '\u2014'],
           ['warunek stabilno\u015bci (P = 0)','|G\u2092(j\u03c9\u2081\u2088\u2080)| < 1']],
    result:'\u03c6 = \u2212180\u00b0',
    note:'Kryterium przej\u015b\u0107 (wersja uog\u00f3lniona, dzia\u0142a te\u017c dla P \u2260 0): licz przej\u015bcia fazy przez \u2212180\u00b0 tylko w pasmach, gdzie L(\u03c9) > 0 dB. Przej\u015bcie w g\u00f3r\u0119 to N\u208a, w d\u00f3\u0142 to N\u208b, a warunkiem stabilno\u015bci jest N\u208a \u2212 N\u208b = P/2.'};

  case 'bd-corner': return {kind:'Charakterystyka Bodego', title:'Pulsacja \u0142amania',
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
  case 'nq-crit': return {kind:'Punkt krytyczny', title:'(\u22121, j0) \u2014 punkt krytyczny',
    what:'Punkt, w kt\u00f3rym 1 + G\u2092(s) = 0, czyli miejsce zerowe r\u00f3wnania charakterystycznego uk\u0142adu zamkni\u0119tego. Gdyby hodograf przez niego przechodzi\u0142, uk\u0142ad zamkni\u0119ty mia\u0142by biegun dok\u0142adnie na osi urojonej \u2014 by\u0142by na granicy stabilno\u015bci, w niegasn\u0105cych oscylacjach.',
    formula:['1 + G\u2092(j\u03c9) = 0  \u21d4  G\u2092(j\u03c9) = \u22121 = 1\u2220180\u00b0'],
    steps:[['modu\u0142','|G\u2092| = 1  \u2192 sygna\u0142 wraca bez t\u0142umienia'],
           ['faza','arg G\u2092 = \u2212180\u00b0  \u2192 wraca w przeciwfazie'],
           ['odleg\u0142o\u015b\u0107 hodografu od tego punktu', A.reCross!==null? 'w \u03c9\u2081\u2088\u2080 wynosi '+fx(Math.abs(-1-A.reCross)) : 'krzywa nie tnie osi Re'],
           ['okr\u0105\u017cenia N', String(A.Ncw)], ['Z = N + P', String(A.Z)]],
    result: A.Z===0? 'punkt nie jest okr\u0105\u017cany \u2192 uk\u0142ad stabilny' : 'punkt jest okr\u0105\u017cany \u2192 Z = '+A.Z,
    note:'Okr\u0105\u017cenia liczymy wok\u00f3\u0142 (\u22121, j0), a nie wok\u00f3\u0142 zera, poniewa\u017c rysowanie 1 + G\u2092 oznacza\u0142oby przesuni\u0119cie ca\u0142ej krzywej o +1. Zamiast przesuwa\u0107 krzyw\u0105, przesuwamy punkt odniesienia.'};

  case 'nq-pos': return {kind:'Hodograf', title:'Ga\u0142\u0105\u017a g\u0142\u00f3wna: \u03c9 od 0\u207a do \u221e',
    what:'Obraz odcinka konturu Nyquista biegn\u0105cego w g\u00f3r\u0119 po osi urojonej, s = j\u03c9. To ten sam zbi\u00f3r danych, kt\u00f3ry rysuje charakterystyki Bodego \u2014 tylko przedstawiony we wsp\u00f3\u0142rz\u0119dnych zespolonych zamiast dw\u00f3ch wykres\u00f3w.',
    formula:['G\u2092(j\u03c9) = P(\u03c9) + jQ(\u03c9)',
             '|G\u2092| = \u221a(P\u00b2 + Q\u00b2) ,  \u03c6 = arg(P + jQ)'],
    steps:[['start \u03c9 \u2192 0\u207a', S.nu? 'ucieka do niesko\u0144czono\u015bci wzd\u0142u\u017c asymptoty' : 'punkt A = ('+fx(A.kp)+' , j0)'],
           ['kierunek startu', 'znak Q dla ma\u0142ego \u03c9 decyduje, czy krzywa idzie w d\u00f3\u0142 czy w g\u00f3r\u0119'],
           ['koniec \u03c9 \u2192 \u221e', A.np>A.nz? 'punkt C = (0, j0)' : 'punkt sko\u0144czony'],
           ['k\u0105t doj\u015bcia do zera', fmt(-90*(A.np-A.nz),4)+'\u00b0']],
    result:'\u03c9: 0\u207a \u2192 \u221e',
    note:'Strza\u0142ki pokazuj\u0105 kierunek rosn\u0105cej pulsacji. Punkt przeci\u0119cia tej ga\u0142\u0119zi z okr\u0119giem jednostkowym to \u03c9_c, a z ujemn\u0105 p\u00f3\u0142osi\u0105 rzeczywist\u0105 \u2014 \u03c9\u2081\u2088\u2080.'};

  case 'nq-neg': return {kind:'Hodograf', title:'Ga\u0142\u0105\u017a lustrzana: \u03c9 od \u2212\u221e do 0\u207b',
    what:'Obraz odcinka konturu biegn\u0105cego w g\u00f3r\u0119 od \u2212j\u221e. Poniewa\u017c wsp\u00f3\u0142czynniki transmitancji s\u0105 rzeczywiste, zachodzi G\u2092(\u2212j\u03c9) = konjugat G\u2092(j\u03c9) \u2014 ta ga\u0142\u0105\u017a jest dok\u0142adnym odbiciem lustrzanym ga\u0142\u0119zi g\u0142\u00f3wnej wzgl\u0119dem osi liczb rzeczywistych.',
    formula:['G\u2092(\u2212j\u03c9) = sprz\u0119\u017cenie G\u2092(j\u03c9)   \u21d2   P(\u2212\u03c9) = P(\u03c9) , Q(\u2212\u03c9) = \u2212Q(\u03c9)'],
    steps:[['P(\u03c9)','funkcja parzysta'], ['Q(\u03c9)','funkcja nieparzysta'],
           ['konstrukcja','odbij ga\u0142\u0105\u017a g\u0142\u00f3wn\u0105 wzgl\u0119dem osi Re']],
    result:'odbicie lustrzane ga\u0142\u0119zi g\u0142\u00f3wnej',
    note:'Ta ga\u0142\u0105\u017a jest niezb\u0119dna do policzenia okr\u0105\u017ce\u0144 \u2014 kryterium Nyquista wymaga obrazu PE\u0141NEGO konturu zamkni\u0119tego, a nie samej po\u0142owy dla \u03c9 > 0.'};

  case 'nq-arc': return {kind:'Hodograf', title:'\u0141uk wci\u0119cia wok\u00f3\u0142 bieguna w zerze',
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

  case 'nq-unit': return {kind:'Linia odniesienia', title:'Okr\u0105g jednostkowy',
    what:'Zbi\u00f3r punkt\u00f3w o module 1. Miejsce, w kt\u00f3rym hodograf go przecina, wyznacza pulsacj\u0119 \u03c9_c. K\u0105t mi\u0119dzy ujemn\u0105 p\u00f3\u0142osi\u0105 rzeczywist\u0105 a promieniem poprowadzonym do tego przeci\u0119cia jest zapasem fazy.',
    formula:['|G\u2092(j\u03c9)| = 1', 'PM = 180\u00b0 + arg G\u2092(j\u03c9_c)'],
    steps:[['przeci\u0119cie', A.wc? '\u03c9_c = '+fx(A.wc)+' rad/s' : 'brak'],
           ['PM', A.pm===null? '\u2014' : fmt(A.pm,4)+'\u00b0']],
    result:'|G\u2092| = 1', note:'Punkt krytyczny (\u22121, j0) le\u017cy dok\u0142adnie na tym okr\u0119gu \u2014 to punkt o module 1 i fazie \u2212180\u00b0.'};

  case 'nq-wc': return {kind:'Punkt charakterystyczny', title:'Punkt hodografu przy \u03c9 = \u03c9_c',
    what:'Miejsce, w kt\u00f3rym hodograf przecina okr\u0105g jednostkowy. K\u0105t, o jaki ten punkt jest oddalony od punktu krytycznego wzd\u0142u\u017c okr\u0119gu, to zapas fazy.',
    formula:['|G\u2092(j\u03c9_c)| = 1', 'PM = 180\u00b0 + arg G\u2092(j\u03c9_c)'],
    steps:[['\u03c9_c', fx(A.wc)+' rad/s'],
           ['Re G\u2092(j\u03c9_c)', fx(d.re)], ['Im G\u2092(j\u03c9_c)', fx(d.im)],
           ['|G\u2092|', fx(cabs(d))],
           ['arg G\u2092', fmt(carg(d)*D2,4)+'\u00b0'],
           ['PM = 180\u00b0 + arg', fmt(A.pm,4)+'\u00b0']],
    result:'( '+fx(d.re)+' , j'+fx(d.im)+' )',
    note:'Im bli\u017cej ten punkt le\u017cy punktu (\u22121, j0), tym mniejszy zapas fazy i tym bardziej oscylacyjna odpowied\u017a uk\u0142adu zamkni\u0119tego.'};

  default: return null;
  }
}

export const EXP_LABEL={
  'rl-pole':'Biegun układu otwartego', 'rl-zero':'Zero układu otwartego',
  'rl-cl':'Biegun układu zamkniętego — ζ, ωₙ, przeregulowanie',
  'rl-locus':'Tor biegunów zamkniętych', 'rl-asym':'Asymptoty', 'rl-delta':'Punkt δ',
  'rl-brk':'Punkt rozejścia się linii', 'rl-seg':'Odcinek na osi Re (reguła nieparzystości)',
  'rl-int':'Biegun w zerze (integrator)',
  'bd-mag':'L(ω) — charakterystyka amplitudowa', 'bd-pha':'φ(ω) — charakterystyka fazowa',
  'bd-0db':'Linia 0 dB', 'bd-180':'Linia −180°', 'bd-corner':'Pulsacja łamania',
  'wc':'ω_c — pulsacja odcięcia amplitudowego', 'w180':'ω₁₈₀ — pulsacja odcięcia fazowego',
  'pm':'Zapas fazy', 'gm':'Zapas wzmocnienia',
  'nq-crit':'Punkt krytyczny (−1, j0)', 'nq-pos':'Gałąź ω > 0', 'nq-neg':'Gałąź lustrzana',
  'nq-arc':'Łuk wcięcia', 'nq-unit':'Okrąg jednostkowy', 'nq-wc':'Punkt przy ω_c',
  'recross':'Przecięcie z osią Re'
};

/* ---------- explanation dialog rendering ---------- */

/* ---------- explanation dialog rendering ---------- */
export function showExp(id, A, d){
  const e = EXPLAIN(id, A, d);
  if(!e) return;
  $('expKind').textContent = e.kind;
  $('expTitle').textContent = e.title;
  let html = '<p>'+esc(e.what)+'</p>';
  if(e.formula && e.formula.length)
    html += '<div class="exp-sec">Wz\u00f3r</div><div class="exp-f">'+e.formula.map(esc).join('\n')+'</div>';
  if(e.steps && e.steps.length)
    html += '<div class="exp-sec">Przebieg obliczenia dla bie\u017c\u0105cych ustawie\u0144</div><div class="exp-steps">'
          + rowsHtml(e.steps) + '</div>';
  if(e.result) html += '<div class="exp-sec">Wynik</div><div class="exp-res">'+esc(e.result)+'</div>';
  if(e.note) html += '<div class="exp-note">'+esc(e.note)+'</div>';
  $('expBody').innerHTML = html;
  $('expDlg').showModal();
}

/* ===================== UI wiring ===================== */
