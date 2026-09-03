import { magTerms, phTerms } from './explain-helpers.js';
import { fmt, fx } from './format.js';
import { K, S } from './model.js';

/* Zapasy stabilnosci, przeciecia i uchyb. One entry per clickable quantity: it receives the analysis
   result A, whatever the hotspot carried in d, and ctx with the counts
   shared by several entries. */

export const ENTRIES = {
  'wc'(A, d, ctx) {
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
  },
  'pm'(A, d, ctx) {
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
  },
  'w180'(A, d, ctx) {
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
  },
  'gm'(A, d, ctx) {
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
  },
  'recross'(A, d, ctx) {
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
  },
  'N'(A, d, ctx) {
  return {kind:'Kryterium Nyquista', title:'N \u2014 liczba okr\u0105\u017ce\u0144 punktu (\u22121, j0)',
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
  },
  'kp'(A, d, ctx) {
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
    /* ---------------- root locus ---------------- */
  },
};
ENTRIES['gmdb'] = ENTRIES['gm'];
