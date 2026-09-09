import { C, cabs } from './complex.js';
import { $, col } from './dom.js';
import { fmt } from './format.js';
import { Gof } from './model.js';
import { clipR, cross, fitAspect, halo, hotL, hotP, hotReset, planeAxes, prep } from './plot-core.js';

/* --- Nyquist ---
   Rysowany tak, jak rysuje sie go recznie: kolejne etapy obchodzenia konturu
   Cauchy'ego, z wcieciem wokol miejsca zerowego w s = 0. Luk wciecia ma
   promien -> nieskonczonosc, wiec prawdziwy obraz lezy calkowicie poza
   kadrem; zamiast go gubic, rysujemy go umownie jako luk tuz przy ramce
   (przerywany), o dokladnie takim kacie, jaki zatacza w rzeczywistosci.
   Bez tego luku krzywa jest otwarta i nie widac okrazen punktu -1. */

/** Numerowany znacznik etapu. */
function badge(ctx, x, y, n, color) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, 7.6, 0, 7);
  ctx.fillStyle = col('--panel'); ctx.globalAlpha = .92; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = color; ctx.font = '600 10px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y + .5);
  ctx.restore();
}

/** Grot strzalki w punkcie (x,y), skierowany pod katem an. */
function arrow(ctx, x, y, an) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(an);
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 3.5); ctx.lineTo(-4, -3.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawNyquist(A) {
  const { ctx, w, h } = prep($('nqCv'));
  const ax = w < 430 ? 28 : 38, r = { x: ax, y: 12, w: w - ax - 12, h: h - 30 };
  const R = A.Rview;
  const rng = fitAspect(r, { xmin: -R, xmax: R, ymin: -R, ymax: R });
  const { X, Y } = planeAxes(ctx, r, rng, ['Re G(jω)', 'Im G(jω)']);
  const pl = A.plan, five = pl.nStages === 5;
  const no = id => { const st = pl.stages.find(s => s.id === id); return st ? st.no : 0; };

  hotReset('nq');
  ctx.save(); clipR(ctx, r);

  /* okrag jednostkowy */
  ctx.setLineDash([2, 3]); ctx.strokeStyle = col('--line'); ctx.lineWidth = 1;
  const ru = Math.abs(X(1) - X(0));
  ctx.beginPath(); ctx.arc(X(0), Y(0), ru, 0, 7); ctx.stroke();
  ctx.setLineDash([]);
  { const cir = []; for (let i = 0; i <= 48; i++) { const t = i / 48 * 2 * Math.PI; cir.push([X(0) + ru * Math.cos(t), Y(0) + ru * Math.sin(t)]); } hotL('nq', cir, 'nq-unit'); }

  /* asymptota pionowa Re = lim P(w), przy w -> 0 */
  if (five && pl.d > 0 && isFinite(pl.asym) && Math.abs(pl.asym) > 1e-9) {
    ctx.strokeStyle = col('--sc1') || col('--muted'); ctx.lineWidth = 1.2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(X(pl.asym), r.y); ctx.lineTo(X(pl.asym), r.y + r.h); ctx.stroke();
    ctx.setLineDash([]);
    hotL('nq', [[X(pl.asym), r.y], [X(pl.asym), r.y + r.h]], 'nq-asym');
    if (X(pl.asym) > r.x + 6 && X(pl.asym) < r.x + r.w - 6) {
      ctx.fillStyle = col('--muted'); ctx.font = '500 9.5px "IBM Plex Sans Condensed",sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('asymptota Re = ' + fmt(pl.asym), X(pl.asym) + 4, r.y + 3);
    }
  }

  /* Krzywe. Poza okregiem o promieniu CL krzywa jest rzutowana promieniscie
     na ten okrag: nieskonczonosc plaszczyzny G zwija sie w jeden okrag, dzieki
     czemu hodograf domyka sie na ekranie i widac okrazenia punktu -1. Odcinki
     zwiniete rysowane sa cienka, blada kreska, zeby nie mylily sie z prawdziwym
     przebiegiem krzywej. Wszystko ponizej CL jest rysowane bez zadnych
     znieksztalcen. */
  const CL = .9 * R;
  const used = [];                       // zajete miejsca, zeby numery sie nie nakladaly
  const inBox = ([x, y]) => x > r.x - 40 && x < r.x + r.w + 40 && y > r.y - 40 && y < r.y + r.h + 40;
  const line = (pts, style, dash, id) => {
    const scr = [], real = [];
    let run = [], runCl = null;
    const flush = () => {
      if (run.length > 1) {
        ctx.save(); ctx.strokeStyle = style;
        if (runCl) { ctx.globalAlpha = .45; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; }
        else { ctx.setLineDash(dash || []); ctx.lineWidth = dash ? 1.3 : 1.9; }
        ctx.beginPath(); run.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.stroke(); ctx.restore();
      }
    };
    for (const g of pts) {
      if (!isFinite(g.re) || !isFinite(g.im)) { flush(); run = []; runCl = null; continue; }
      const m = cabs(g), cl = m > CL, k = cl ? CL / m : 1;
      const p = [X(g.re * k), Y(g.im * k)];
      if (runCl !== null && cl !== runCl) { const keep = run[run.length - 1]; flush(); run = [keep]; }
      runCl = cl; run.push(p);
      if (inBox(p)) { scr.push(p); if (!cl) real.push(p); }
    }
    flush();
    if (id) hotL('nq', scr, id);
    return real.length ? real : scr;
  };

  /* horyzont: okrag, na ktory zwija sie cala nieskonczonosc plaszczyzny G */
  const horizon = (five && pl.d > 0) || A.pos.some(q => cabs(q.g) > CL);
  if (horizon) {
    ctx.save(); ctx.globalAlpha = .8; ctx.setLineDash([1, 4]);
    ctx.strokeStyle = col('--grid'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(X(0), Y(0), Math.abs(X(CL) - X(0)), 0, 7); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = col('--muted'); ctx.font = '500 9.5px "IBM Plex Sans Condensed",sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    const lx = X(0) - 4, ly = Y(CL) + 3;
    ctx.fillText('|G\u2092| \u2192 \u221e', lx, ly);
    used.push([lx - 18, ly + 5]);        // numery etapow omijaja ten podpis
  }

  const sNeg = line(A.neg.map(q => q.g), col('--muted'), [4, 3], 'nq-neg');
  const sPos = line(A.pos.map(q => q.g), col('--accent'), null, 'nq-pos');
  /* prawdziwy obraz luku wciecia: widoczny tylko wtedy, gdy jest skonczony
     (zero w s = 0 zwija luk do punktu zamiast rozdmuchiwac go do nieskonczonosci) */
  const sArcUp = five && pl.d <= 0 ? line(A.arcUp.map(q => q.g), col('--amber'), [5, 3], 'nq-arc-up') : null;
  const sArcDn = five && pl.d <= 0 ? line(A.arcDn.map(q => q.g), col('--amber'), [5, 3], 'nq-arc-dn') : null;

  /* Rozmieszczanie numerow etapow: pierwszy kandydat dostatecznie daleko od
     juz postawionych znacznikow i od krawedzi ramki. */
  const place = (cands, n, color) => {
    for (const p of cands) {
      if (!p) continue;
      if (p[0] < r.x + 14 || p[0] > r.x + r.w - 14 || p[1] < r.y + 14 || p[1] > r.y + r.h - 14) continue;
      if (used.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 24)) continue;
      used.push(p); badge(ctx, p[0], p[1], n, color); return;
    }
  };
  /* kandydaci na galezi: co 6% dlugosci, od najdalszych od srodka */
  const spread = scr => {
    const cx = X(0), cy = Y(0), out = [];
    for (let f = 0; f <= 1.0001; f += .06) out.push(scr[Math.min(scr.length - 1, Math.round(f * (scr.length - 1)))]);
    return out.filter(Boolean).sort((a, b) => Math.hypot(b[0] - cx, b[1] - cy) - Math.hypot(a[0] - cx, a[1] - cy));
  };

  /* Umowny luk wciecia o promieniu -> inf: rysowany dokladnie na okregu CL,
     wiec styka sie z zwinietymi koncami galezi. Kat jest dokladny: -d*90 na
     kazda polowke. */
  const drawIdeal = (a0, a1, id, n) => {
    const M = 72, pts = [];
    for (let i = 0; i <= M; i++) { const a = a0 + (a1 - a0) * i / M; pts.push([X(CL * Math.cos(a)), Y(CL * Math.sin(a))]); }
    ctx.strokeStyle = col('--amber'); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.setLineDash([]);
    hotL('nq', pts, id);
    const mi = Math.floor(M / 2), p0 = pts[mi], p1 = pts[Math.min(M, mi + 2)];
    ctx.fillStyle = col('--amber');
    arrow(ctx, p0[0], p0[1], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
    place([pts[Math.floor(M * .25)], pts[Math.floor(M * .75)], pts[mi]], n, col('--amber'));
  };
  if (five && pl.d > 0) {
    const a0 = pl.c >= 0 ? 0 : Math.PI, sw = pl.d * Math.PI / 2;
    drawIdeal(a0, a0 - sw, 'nq-arc-up', no('nq-arc-up'));      // theta: 0 -> +90
    drawIdeal(a0 + sw, a0, 'nq-arc-dn', no('nq-arc-dn'));      // theta: -90 -> 0
  }

  /* groty na galezi glownej */
  ctx.fillStyle = col('--accent');
  for (const f of [0.25, 0.5, 0.75]) {
    const i = Math.floor(f * (A.pos.length - 1)), a = A.pos[i].g, b = A.pos[i + 3].g;
    if (cabs(a) > CL || cabs(b) > CL) continue;
    arrow(ctx, X(a.re), Y(a.im), Math.atan2(Y(b.im) - Y(a.im), X(b.re) - X(a.re)));
  }

  /* numery etapow na obu galeziach osi urojonej */
  place(spread(sPos), no('nq-pos'), col('--accent'));
  place(spread(sNeg), no('nq-neg'), col('--muted'));
  /* zwiniete luki wciecia sa punktem, wiec numer stawiamy obok niego */
  const near = p => p ? [[p[0] + 17, p[1] - 15], [p[0] - 17, p[1] - 15], [p[0] + 17, p[1] + 15], [p[0] - 17, p[1] + 15]] : [];
  if (sArcUp) place(near(sArcUp[Math.floor(sArcUp.length / 2)]), no('nq-arc-up'), col('--amber'));
  if (sArcDn) place(near(sArcDn[Math.floor(sArcDn.length / 2)]), no('nq-arc-dn'), col('--amber'));

  /* obraz duzego luku domykajacego: punkt (0,j0), gdy n > m */
  if (pl.bigArc) {
    const bx = X(pl.bigArc.re), by = Y(pl.bigArc.im);
    ctx.strokeStyle = col('--good'); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, 7); ctx.stroke();
    hotP('nq', bx, by, 'nq-big', null, 11); halo(ctx, bx, by, 11);
    place([[bx + 17, by - 15], [bx + 17, by + 15], [bx - 17, by - 15], [bx - 17, by + 15]], no('nq-big'), col('--good'));
  }

  /* punkt startowy A = G(0), gdy hodograf zaczyna sie w skonczonosci */
  if (!five && pl.start) {
    const sx = X(pl.start.re), sy = Y(pl.start.im);
    ctx.fillStyle = col('--accent'); ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, 7); ctx.fill();
    hotP('nq', sx, sy, 'nq-A', pl.start); halo(ctx, sx, sy);
    ctx.fillStyle = col('--muted'); ctx.font = '500 10px "IBM Plex Sans Condensed",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('A', sx, sy - 8);
  }

  /* punkt krytyczny */
  ctx.strokeStyle = col('--bad'); ctx.lineWidth = 2; cross(ctx, X(-1), Y(0), 6);
  ctx.fillStyle = col('--bad'); ctx.font = '500 10px "IBM Plex Sans Condensed",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('(−1, j0)', X(-1), Y(0) - 9);
  hotP('nq', X(-1), Y(0), 'nq-crit', null, 11); halo(ctx, X(-1), Y(0), 11);

  /* przeciecia */
  if (A.reCross !== null) {
    ctx.fillStyle = col('--amber'); ctx.beginPath(); ctx.arc(X(A.reCross), Y(0), 3.5, 0, 7); ctx.fill();
    hotP('nq', X(A.reCross), Y(0), 'recross'); halo(ctx, X(A.reCross), Y(0));
  }
  if (A.wc) {
    const g = Gof(C(0, A.wc));
    ctx.fillStyle = col('--accent'); ctx.beginPath(); ctx.arc(X(g.re), Y(g.im), 3.5, 0, 7); ctx.fill();
    hotP('nq', X(g.re), Y(g.im), 'nq-wc', g); halo(ctx, X(g.re), Y(g.im));
  }
  ctx.restore();
}
