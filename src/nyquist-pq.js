import { C, D2, carg } from './complex.js';
import { fx } from './format.js';
import { Gof, K, ND, S } from './model.js';
import { kpAdd, polyRoots, polymul } from './poly.js';

/* =====================================================================
   Hodograf liczony tak, jak liczy sie go recznie: najpierw rozdzielenie
   G(jw) na czesc rzeczywista P(w) i urojona Q(w) przez pomnozenie licznika
   i mianownika przez sprzezenie mianownika, potem podzial konturu
   Cauchy'ego na etapy.

   Wszystko ponizej jest arytmetyka wielomianow o wspolczynnikach
   rzeczywistych, w zmiennej w (omega), zapisywanych - jak w reszcie
   projektu - od najwyzszej potegi. Brak metod numerycznych oznacza, ze
   w_180 i asymptota wychodza dokladnie, a nie z przeszukiwania siatki.
   Opoznienie transportowe NIE jest wielomianem, wiec ta czesc dotyczy
   samej transmitancji wymiernej (patrz flaga .exact).
   ===================================================================== */

const psub = (a, b) => kpAdd(a, b.map(v => -v));

/** Wartosc wielomianu (schemat Hornera), wspolczynniki malejaco. */
export const pev = (c, w) => { let r = 0; for (const a of c) r = r * w + a; return r; };

/** Podstawienie s = jw do wielomianu rzeczywistego.
    j^k cykluje 1, j, -1, -j, wiec potegi parzyste tworza czesc rzeczywista,
    nieparzyste - urojona, z naprzemiennym znakiem. Zwraca dwa wielomiany
    rzeczywiste w zmiennej w, indeksowane tak samo jak wejscie. */
export function subJw(c) {
  const n = c.length - 1;
  const re = new Array(n + 1).fill(0), im = new Array(n + 1).fill(0);
  c.forEach((a, i) => {
    switch ((n - i) & 3) {            // (n-i) to potega s przy tym wspolczynniku
      case 0: re[i] += a; break;
      case 1: im[i] += a; break;
      case 2: re[i] -= a; break;
      default: im[i] -= a;
    }
  });
  return { re, im };
}

/** Najnizsza niezerowa potega wielomianu: {k, a} takie, ze c(w) ~ a*w^k przy w -> 0. */
function lowest(c) {
  const n = c.length - 1;
  for (let i = n; i >= 0; i--) if (Math.abs(c[i]) > 1e-12) return { k: n - i, a: c[i] };
  return { k: 0, a: 0 };
}

/** Granica ilorazu dwoch wielomianow przy w -> 0, z samych najnizszych potęg. */
export function limAt0(num, den) {
  const a = lowest(num), b = lowest(den);
  if (Math.abs(a.a) < 1e-300 || Math.abs(b.a) < 1e-300) return 0;
  if (a.k > b.k) return 0;
  if (a.k === b.k) return a.a / b.a;
  return (a.a / b.a) > 0 ? Infinity : -Infinity;
}

/** Dodatnie pierwiastki rzeczywiste wielomianu, posortowane rosnaco. */
function posRoots(c) {
  const t = c.slice();
  while (t.length > 1 && Math.abs(t[0]) < 1e-12) t.shift();
  if (t.length < 2) return [];
  const out = [];
  for (const r of polyRoots(t)) {
    if (Math.abs(r.im) > 1e-6 * (1 + Math.abs(r.re))) continue;
    if (!(r.re > 1e-7)) continue;
    if (out.some(v => Math.abs(v - r.re) < 1e-6 * (1 + r.re))) continue;
    out.push(r.re);
  }
  return out.sort((a, b) => a - b);
}

/* ---------------------------------------------------------------------
   P(w) i Q(w)
   G(jw) = L(jw)/M(jw) = (A + jB)/(Cc + jDd)
         = (A + jB)(Cc - jDd) / (Cc^2 + Dd^2)
   P = (A*Cc + B*Dd)/den ,  Q = (B*Cc - A*Dd)/den ,  den = Cc^2 + Dd^2
   --------------------------------------------------------------------- */
export function pqForm() {
  const { N, D } = ND();
  const num = N.map(v => v * K());                 // K wchodzi do licznika
  const { re: A, im: B } = subJw(num);
  const { re: Cc, im: Dd } = subJw(D);
  const den = kpAdd(polymul(Cc, Cc), polymul(Dd, Dd));
  const Pn = kpAdd(polymul(A, Cc), polymul(B, Dd));
  const Qn = psub(polymul(B, Cc), polymul(A, Dd));
  // |L|^2 - |M|^2 : zeruje sie dokladnie tam, gdzie |G| = 1 (czyli w w_c)
  const magEq = psub(kpAdd(polymul(A, A), polymul(B, B)), den);
  return { A, B, Cc, Dd, Pn, Qn, den, magEq, num, D };
}

/** Rzad zera transmitancji w s = 0: mu zer w liczniku, nu biegunow w mianowniku. */
export function originOrder() {
  const mu = S.items.filter(it => it.on && it.kind === 'z'
    && Math.abs(it.re) < 1e-12 && Math.abs(it.im) < 1e-12).length;
  return { nu: S.nu, mu, d: S.nu - mu };
}

/* ---------------------------------------------------------------------
   Pelny opis rysowania: P, Q, etapy konturu, punkty charakterystyczne.
   --------------------------------------------------------------------- */
export function nyquistPlan() {
  const f = pqForm();
  const { nu, mu, d } = originOrder();
  const exact = !(S.Td > 0);

  // c = lim s^d G(s) : staly wspolczynnik zachowania w otoczeniu zera.
  const ln = lowest(f.num), ld = lowest(f.D);
  const c = Math.abs(ld.a) > 1e-300 ? ln.a / ld.a : 0;

  const degN = (() => { const t = f.num.slice(); let i = 0; while (i < t.length - 1 && Math.abs(t[i]) < 1e-12) i++; return t.length - 1 - i; })();
  const degD = (() => { const t = f.D.slice(); let i = 0; while (i < t.length - 1 && Math.abs(t[i]) < 1e-12) i++; return t.length - 1 - i; })();
  const relDeg = degD - degN;                       // n - m

  const asym = limAt0(f.Pn, f.den);                 // asymptota pionowa Re = lim P
  const qLim = limAt0(f.Qn, f.den);

  /* Kat polozenia poczatku hodografu i kierunek, w ktorym krzywa z niego
     wychodzi. To dwie rozne rzeczy: G(jw) ~ c*(jw)^(-d), wiec argument
     phi0 = arg c - d*90 nie zalezy od w -- caly niskoczestotliwosciowy
     fragment lezy na jednej polprostej -- natomiast modul |c|*w^(-d) jest
     monotoniczny. Rozniczkowanie po w mnozy e^(j*phi0) przez liczbe
     rzeczywista -d*|c|*w^(-d-1): ujemna dla d > 0, czyli obrot o 180
     stopni (punkt sunie po polprostej DO srodka), dodatnia dla d < 0
     (ucieka od srodka, kierunek zgodny z phi0).
     Dla d = 0 modul jest skonczony i o kierunku decyduje pierwszy wyraz
     rozwiniecia: G ~ c(1 + jw*SIGMA), czyli dG/dw = j*c*SIGMA = j*Q'(0) --
     wyjscie prostopadle do promienia, w gore albo w dol zaleznie od znaku. */
  const nrm = a => { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };
  const phi0 = nrm((c < 0 ? 180 : 0) - d * 90);
  const qSlope = limAt0(f.Qn, f.den.concat([0]));   // lim Q(w)/w = Q'(0)
  let exitAng = d > 0 ? nrm(phi0 + 180) : d < 0 ? phi0
    : (isFinite(qSlope) && Math.abs(qSlope) > 1e-12 ? Math.sign(qSlope) * 90 : null);
  if (exitAng === null) {                           // wyraz liniowy znika: licz numerycznie
    const w0 = 1e-4, g1 = Gof(C(0, w0)), g2 = Gof(C(0, 2 * w0));
    exitAng = nrm(carg(C(g2.re - g1.re, g2.im - g1.im)) * D2);
  }
  const exitKind = d > 0 ? 'do środka' : d < 0 ? 'od środka' : 'prostopadle';
  const P0 = pev(f.Pn, 0), Q0 = pev(f.Qn, 0), den0 = pev(f.den, 0);
  const start = Math.abs(den0) > 1e-300 ? C(P0 / den0, Q0 / den0) : null;

  // Wartosc obrazu duzego luku: 0 gdy n > m, iloraz wspolczynnikow gdy n = m.
  const bigArc = relDeg > 0 ? C(0, 0)
    : relDeg === 0 ? C(f.num[0] / f.D[0], 0) : null;

  // Przeciecia z osia Re: dokladne pierwiastki Q(w) = 0.
  const reCrossAll = posRoots(f.Qn).map(w => ({ w, P: pev(f.Pn, w) / pev(f.den, w) }));
  // Przeciecia z okregiem jednostkowym: |L|^2 = |M|^2. Opoznienie nie zmienia
  // modulu, wiec te pierwiastki sa dokladne takze przy Td > 0.
  const unitAll = posRoots(f.magEq).map(w => {
    const g = Gof(C(0, w));
    let pm = 180 + carg(g) * D2;
    while (pm > 180) pm -= 360;
    while (pm <= -180) pm += 360;
    return { w, pm, g };
  });

  const stages = buildStages({ nu, mu, d, c, relDeg, start, asym, bigArc });

  return { ...f, nu, mu, d, c, degN, degD, relDeg, exact,
           asym, qLim, phi0, qSlope, exitAng, exitKind,
           start, bigArc, reCrossAll, unitAll, stages,
           nStages: stages.length };
}

/* Etapy w kolejnosci obchodzenia konturu, zaczynajac od s = +eps na osi
   rzeczywistej: gorny luk wciecia, os urojona w gore, duzy luk domykajacy,
   os urojona z powrotem, dolny luk wciecia. Bez miejsca zerowego w s = 0
   wciecie nie jest potrzebne i zostaja trzy etapy. */
/** ε albo ε^k — wykładnik 1 pisany jest bez potęgi. */
const epsPow = k => k === 1 ? 'ε' : 'ε^' + k;

function buildStages({ nu, mu, d, c, relDeg, start, asym, bigArc }) {
  const indent = nu > 0 || mu > 0;
  const swept = -d * 90;                              // kat na jeden luk eps
  const bigTxt = relDeg > 0 ? 'punkt (0, j0) — cały łuk zwija się do jednego punktu'
    : relDeg === 0 ? 'punkt (' + fx(bigArc ? bigArc.re : 0) + ', j0)'
      : 'ucieka do nieskończoności (m > n, transmitancja niewłaściwa)';

  const S1 = {
    id: 'nq-arc-up', name: 'górny łuk wcięcia',
    s: 's = ε·e^(jθ),  ε → 0',
    par: 'θ: 0° → +90°',
    img: d > 0 ? 'łuk o promieniu |c|/' + epsPow(d) + ' → ∞, arg maleje o ' + Math.abs(swept) + '°'
      : d < 0 ? 'łuk o promieniu |c|·' + epsPow(-d) + ' → 0, arg rośnie o ' + Math.abs(swept) + '°'
        : 'punkt stały c (zero i biegun w s = 0 znoszą się)',
    kind: 'arc'
  };
  const S5 = { ...S1, id: 'nq-arc-dn', name: 'dolny łuk wcięcia', par: 'θ: −90° → 0°' };
  const SP = {
    id: 'nq-pos', name: 'oś urojona w górę',
    s: 's = jω', par: indent ? 'ω: 0⁺ → +∞' : 'ω: 0 → +∞',
    img: 'gałąź główna P(ω) + jQ(ω)' + (indent && isFinite(asym) ? ', start wzdłuż asymptoty Re = ' + fx(asym) : ''),
    kind: 'branch'
  };
  const SB = {
    id: 'nq-big', name: 'duży łuk domykający',
    s: 's = R·e^(jθ),  R → ∞', par: 'θ: +90° → −90°', img: bigTxt, kind: 'big'
  };
  const SN = {
    id: 'nq-neg', name: 'oś urojona z powrotem',
    s: 's = jω', par: indent ? 'ω: −∞ → 0⁻' : 'ω: −∞ → 0',
    img: 'odbicie lustrzane gałęzi głównej względem osi Re', kind: 'branch'
  };

  const list = indent ? [S1, SP, SB, SN, S5] : [SP, SB, SN];
  return list.map((st, i) => ({ ...st, no: i + 1 }));
}
