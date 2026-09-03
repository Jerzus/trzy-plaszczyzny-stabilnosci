import { C, DEG, cabs, carg, cdiv } from './complex.js';
import { Gof, K, ND, S, expand, resp } from './model.js';
import { polyRoots, polyaddK, polyder, polymul, polyvalC } from './poly.js';

/* Frequency-domain analysis. analyse() is the composition of the named steps
   below; each one answers a single question and can be read on its own. */

/** Geometric bisection, for roots of a monotone function of frequency. */
function bisect(f, a, b) {
  for (let i = 0; i < 70; i++) {
    const m = Math.sqrt(a * b);
    (f(a) * f(m) <= 0) ? b = m : a = m;
  }
  return Math.sqrt(a * b);
}

/** A decade range wide enough to show every corner frequency and the delay. */
function sweepRange(P, Z) {
  const mags = [...P, ...Z].map(cabs).filter(v => v > 1e-9);
  let lo = mags.length ? Math.min(...mags) / 100 : 0.01;
  let hi = mags.length ? Math.max(...mags) * 100 : 100;
  if (S.Td > 0) hi = Math.max(hi, 60 / S.Td);
  lo = Math.max(1e-4, Math.min(lo, 1));
  hi = Math.min(1e5, Math.max(hi, 10 * lo, 100));
  return { lo, hi };
}

/** Magnitude and unwrapped phase on a logarithmic grid. */
function sweep(lo, hi, M = 900) {
  const w = [], mag = [], ph = [];
  for (let i = 0; i < M; i++) {
    const ww = lo * Math.pow(hi / lo, i / (M - 1));
    const r = resp(ww);
    w.push(ww); mag.push(r.mag); ph.push(r.ph);
  }
  for (let i = 1; i < M; i++) {           // unwrap: phase must not jump by 2*pi
    let d = ph[i] - ph[i - 1];
    while (d > Math.PI) { ph[i] -= 2 * Math.PI; d = ph[i] - ph[i - 1]; }
    while (d < -Math.PI) { ph[i] += 2 * Math.PI; d = ph[i] - ph[i - 1]; }
  }
  return { w, mag, ph };
}

/** First crossing of |G| = 1, and the phase margin read there. */
function gainCrossover({ w, mag, ph }) {
  for (let i = 1; i < w.length; i++) {
    if ((mag[i - 1] - 1) * (mag[i] - 1) >= 0) continue;
    const wc = bisect(x => resp(x).mag - 1, w[i - 1], w[i]);
    const t = (Math.log(wc) - Math.log(w[i - 1])) / (Math.log(w[i]) - Math.log(w[i - 1]));
    let pm = 180 + (ph[i - 1] + t * (ph[i] - ph[i - 1])) * DEG;
    while (pm > 180) pm -= 360;
    while (pm <= -180) pm += 360;
    return { wc, pm };
  }
  return { wc: null, pm: null };
}

/** Crossing of the negative real axis; the worst one sets the gain margin. */
function phaseCrossover({ w, mag, ph }) {
  let w180 = null, reCross = null;
  for (let i = 1; i < w.length; i++) {
    const im0 = mag[i - 1] * Math.sin(ph[i - 1]);
    const im1 = mag[i] * Math.sin(ph[i]);
    if (!(im0 * im1 < 0 && mag[i] * Math.cos(ph[i]) < 0)) continue;
    const ww = bisect(x => { const r = resp(x); return r.mag * Math.sin(r.ph); }, w[i - 1], w[i]);
    const r = resp(ww);
    const re = r.mag * Math.cos(r.ph);
    if (re < 0 && (reCross === null || Math.abs(re) > Math.abs(reCross))) { reCross = re; w180 = ww; }
  }
  return { w180, reCross, gm: reCross !== null ? 1 / Math.abs(reCross) : Infinity };
}

/** The Cauchy contour and how many times its image encircles (-1, j0). */
function nyquistContour(lo, hi) {
  const wlo = lo / 50, whi = hi * 20, NP = 1400, NA = 400;
  const pos = [], neg = [], arc = [];
  for (let i = 0; i < NP; i++) {
    const ww = wlo * Math.pow(whi / wlo, i / (NP - 1));
    pos.push({ w: ww, g: Gof(C(0, ww)) });
  }
  for (let i = 0; i < NP; i++) {
    const q = pos[NP - 1 - i];
    neg.push({ w: -q.w, g: C(q.g.re, -q.g.im) });
  }
  for (let i = 0; i < NA; i++) {        // indentation around the pole at the origin
    const th = -Math.PI / 2 + Math.PI * i / (NA - 1);
    arc.push({ g: Gof(C(wlo * Math.cos(th), wlo * Math.sin(th))) });
  }

  const path = [...neg.map(q => q.g), ...arc.map(q => q.g), ...pos.map(q => q.g)];
  const ang = p => carg(C(p.re + 1, p.im));
  let acc = 0, prev = ang(path[0]);
  const step = a => { let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; prev = a; };
  for (let i = 1; i < path.length; i++) step(ang(path[i]));
  step(ang(path[0]));                   // closing semicircle at infinity
  return { pos, neg, arc, Ncw: Math.round(-acc / (2 * Math.PI)) };
}

/** Real-axis segments: rule 2 of the formula sheet (odd count to the right). */
function realAxisSegments(P, Z) {
  const crit = [];
  P.forEach(q => { if (Math.abs(q.im) < 1e-12) crit.push(q.re); });
  Z.forEach(q => { if (Math.abs(q.im) < 1e-12) crit.push(q.re); });
  for (let i = 0; i < S.nu; i++) crit.push(0);
  crit.sort((a, b) => a - b);
  if (!crit.length) return [];

  const segs = [], uniq = [...new Set(crit.map(v => +v.toFixed(9)))];
  for (let i = 0; i < uniq.length; i++) {
    const a = uniq[i], b = (i + 1 < uniq.length) ? uniq[i + 1] : null;
    const mid = b === null ? a + 1 : (a + b) / 2;
    if (crit.filter(v => v > mid).length % 2 === 1) segs.push([a, b === null ? a : b]);
  }
  if (crit.filter(v => v > uniq[0] - 1).length % 2 === 1) segs.push([-Infinity, uniq[0]]);
  return segs;
}

/** Breakaway points: rule 4, D(s)N'(s) - D'(s)N(s) = 0, keeping only the roots
    that lie on a valid segment and correspond to a gain in the swept direction. */
function breakawayPoints(segs) {
  const { N, D } = ND();
  const cand = polyRoots(polyaddK(polymul(D, polyder(N)), polymul(polyder(D), N), -1));
  const out = [];
  for (const r of cand) {
    if (Math.abs(r.im) > 1e-6) continue;
    const sv = C(r.re, 0), nv = polyvalC(N, sv), dv = polyvalC(D, sv);
    if (cabs(nv) < 1e-12) continue;
    const k = -cdiv(dv, nv).re;
    if (!(k * Math.sign(K()) > 1e-12)) continue;
    if (!segs.some(([a, b]) => r.re >= a - 1e-6 && r.re <= b + 1e-6)) continue;
    out.push({ s: r.re, k });
  }
  return out;
}

/** Asymptotes, centroid, segments, breakaways and corner frequencies. */
function locusGeometry(P, Z) {
  const np = P.length + S.nu, nz = Z.length, alpha = np - nz;
  const sumP = P.reduce((a, q) => a + q.re, 0);
  const sumZ = Z.reduce((a, q) => a + q.re, 0);
  const delta = alpha > 0 ? (sumP - sumZ) / alpha : null;
  const asymAng = alpha > 0
    ? [...Array(alpha)].map((_, i) => { let a = (2 * i + 1) * 180 / alpha; while (a > 180) a -= 360; return a; })
    : [];
  const segs = realAxisSegments(P, Z);

  const corners = [];
  P.forEach(q => { const v = cabs(q); if (v > 1e-9) corners.push({ w: v, kind: 'p', c: Math.abs(q.im) > 1e-12 }); });
  Z.forEach(q => { const v = cabs(q); if (v > 1e-9) corners.push({ w: v, kind: 'z', c: Math.abs(q.im) > 1e-12 }); });

  return { np, nz, alpha, sumP, sumZ, delta, asymAng, segs, brk: breakawayPoints(segs), corners };
}

export function analyse() {
  const P = expand('p'), Z = expand('z');
  const { lo, hi } = sweepRange(P, Z);
  const curve = sweep(lo, hi);

  const { wc, pm } = gainCrossover(curve);
  const { w180, reCross, gm } = phaseCrossover(curve);
  const { pos, neg, arc, Ncw } = nyquistContour(lo, hi);

  const Popen = P.filter(p => p.re > 1e-9).length;
  const kp = S.nu === 0 ? Gof(C(1e-9, 0)).re : Infinity;

  return {
    lo, hi, ...curve,
    wc, pm, w180, gm, reCross,
    pos, neg, arc, Ncw, P: Popen, Z: Ncw + Popen, kp,
    poles: P, zeros: Z,
    ...locusGeometry(P, Z),
  };
}
