import { bodeComponents } from './bode-terms.js';
import { DEG } from './complex.js';
import { $, col } from './dom.js';
import { esc, fmt, pad, sub, sup } from './format.js';
import { S } from './model.js';
import { box, clipR, hotL, hotP, hotReset, prep, ticksFrom } from './plot-core.js';

/* Bode plot. drawBode() lays out the two panels and then calls one step per
   thing drawn on them, so each step stays readable on its own. */

const MONO = '10px "IBM Plex Mono",monospace';
const LABEL = '600 10px "IBM Plex Sans Condensed",sans-serif';

/** Panel rectangles and the shared logarithmic frequency mapping. */
function layout(w, h, A) {
  const narrow = w < 430;
  const L = narrow ? 54 : 66, Rp = narrow ? 10 : 14, T = 12, B = 32;
  const gap = narrow ? 22 : 26;
  const H = (h - T - B - gap) / 2;
  const rm = { x: L, y: T, w: w - L - Rp, h: H };
  const rp = { x: L, y: T + H + gap, w: w - L - Rp, h: H };
  const lgx = Math.log10(A.lo), lgh = Math.log10(A.hi);
  return { rm, rp, lgx, lgh, X: v => rm.x + (Math.log10(v) - lgx) / (lgh - lgx) * rm.w };
}

/** Value range for one bodePanel, padded and clamped, covering components too. */
function range(values, pad, lo, hi) {
  let a = Math.max(Math.min(...values), lo), b = Math.min(Math.max(...values), hi);
  if (b - a < pad) { const c = (a + b) / 2; a = c - pad / 2; b = c + pad / 2; }
  const m = (b - a) * 0.08;
  return { min: a - m, max: b + m };
}

/** Grid, tick labels and rotated axis title. Returns the value->y mapping. */
function bodePanel(ctx, r, ry, unit, A, geo) {
  const { lgx, lgh, X } = geo;
  box(ctx, r);
  const Y = v => r.y + r.h - (v - ry.min) / (ry.max - ry.min) * r.h;
  const tk = ry.deg ? ticksFrom(ry.min, ry.max, [15, 45, 90, 180, 360])
                    : ticksFrom(ry.min, ry.max, [5, 10, 20, 40, 60, 100]);

  ctx.save(); clipR(ctx, r);
  ctx.lineWidth = 1;
  for (let d = Math.floor(lgx); d <= Math.ceil(lgh); d++) {
    for (let m = 1; m < 10; m++) {
      const v = m * Math.pow(10, d);
      if (v < A.lo || v > A.hi) continue;
      const x = Math.round(X(v)) + .5;
      ctx.strokeStyle = col('--grid');
      ctx.globalAlpha = m === 1 ? 1 : .45;
      ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (const t of tk) {
    const y = Math.round(Y(t)) + .5;
    ctx.strokeStyle = Math.abs(t) < 1e-9 ? col('--line') : col('--grid');
    ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
  }
  ctx.restore();

  // restore() also resets fill/font/alignment, so set them again out here --
  // the labels sit left of the bodePanel and must not be clipped
  ctx.font = MONO; ctx.fillStyle = col('--muted');
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of tk) ctx.fillText(fmt(t, 4) + (ry.deg ? '°' : ''), r.x - 6, Y(t));

  ctx.save();
  ctx.translate(11, r.y + r.h / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = LABEL; ctx.fillStyle = col('--muted');
  ctx.fillText(unit, 0, 0);
  ctx.restore();
  return Y;
}

/** Horizontal 0 dB / -180 deg reference line. */
function referenceLine(ctx, r, Y, v, id) {
  const y = Y(v);
  if (y < r.y || y > r.y + r.h) return;
  ctx.save();
  ctx.setLineDash([5, 4]); ctx.strokeStyle = col('--bad');
  ctx.lineWidth = 1.2; ctx.globalAlpha = .8;
  ctx.beginPath(); ctx.moveTo(r.x, y + .5); ctx.lineTo(r.x + r.w, y + .5); ctx.stroke();
  ctx.restore();
  hotL('bd', [[r.x, y], [r.x + r.w, y]], id);
}

/** One polyline over the frequency grid; `dash` marks it as a component. */
function polyline(ctx, r, Y, A, geo, values, color, { dash = false, id = null } = {}) {
  ctx.save(); clipR(ctx, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = dash ? 1.4 : 2;
  if (dash) { ctx.setLineDash([5, 4]); ctx.globalAlpha = .9; }
  ctx.beginPath();
  let up = false; const screen = [];
  for (let i = 0; i < A.w.length; i++) {
    if (!isFinite(values[i])) { up = false; continue; }
    const x = geo.X(A.w[i]), y = Y(values[i]);
    if (!up) { ctx.moveTo(x, y); up = true; } else ctx.lineTo(x, y);
    if (y > r.y - 30 && y < r.y + r.h + 30) screen.push([x, y]);
  }
  ctx.stroke(); ctx.restore();
  if (id) hotL('bd', screen, id);
}

/** Numbered disc at the right edge, tying a component curve to its equation. */
function badge(ctx, r, Y, values, color, text, used) {
  let y = Y(values[values.length - 1]);
  if (!isFinite(y)) return;
  y = Math.max(r.y + 9, Math.min(r.y + r.h - 9, y));
  while (used.some(v => Math.abs(v - y) < 15)) y += 15;
  if (y > r.y + r.h - 9) return;
  used.push(y);
  const x = r.x + r.w - 11;
  ctx.save();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = LABEL;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + .5);
  ctx.restore();
}

/** Dashed vertical marker spanning both panels, for w_c and w_180. */
function verticalMarker(ctx, geo, rm, rp, A, ww, label, color, id) {
  if (!ww || ww < A.lo || ww > A.hi) return;
  const x = Math.round(geo.X(ww)) + .5;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(x, rm.y); ctx.lineTo(x, rp.y + rp.h); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color; ctx.font = LABEL;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(label, x + 4, rm.y + 3);
  ctx.restore();
  hotL('bd', [[x, rm.y], [x, rp.y + rp.h]], id);
}

/** Triangles under the magnitude bodePanel at every corner frequency. */
function cornerMarks(ctx, rm, geo, A) {
  ctx.save(); clipR(ctx, rm);
  for (const c of A.corners) {
    if (c.w < A.lo || c.w > A.hi) continue;
    const x = geo.X(c.w), y = rm.y + rm.h;
    ctx.fillStyle = c.kind === 'p' ? col('--muted') : col('--good');
    ctx.beginPath();
    ctx.moveTo(x, y - 1); ctx.lineTo(x - 4, y + 6); ctx.lineTo(x + 4, y + 6);
    ctx.closePath(); ctx.fill();
    hotP('bd', x, y + 2, 'bd-corner', c, 9);
  }
  ctx.restore();
}

/** A margin drawn as a thick segment with its value beside it. */
function marginBar(ctx, r, x, y1, y2, text, id) {
  ctx.save(); clipR(ctx, r);
  ctx.strokeStyle = col('--good'); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
  ctx.fillStyle = col('--good'); ctx.font = LABEL;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 5, (y1 + y2) / 2);
  ctx.restore();
  hotL('bd', [[x, y1], [x, y2]], id);
}

/** Decade labels along the bottom. */
function frequencyAxis(ctx, geo, rp) {
  ctx.fillStyle = col('--muted'); ctx.font = MONO;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let d = Math.ceil(geo.lgx); d <= Math.floor(geo.lgh); d++) {
    ctx.fillText(d === 0 ? '1' : ('10' + sup(d)), geo.X(Math.pow(10, d)), rp.y + rp.h + 6);
  }
  ctx.font = LABEL; ctx.textAlign = 'right';
  ctx.fillText('ω  [rad/s]', rp.x + rp.w, rp.y + rp.h + 19);
}

/** Whether the simplified Bode criterion may be used at all, in words. */
function criterionNote(A) {
  const minPhase = A.zeros.every(z => z.re <= 1e-9) && S.Td === 0;
  if (A.P === 0 && minPhase) {
    return 'Układ otwarty stabilny (P = 0) i minimalnofazowy — uproszczone kryterium Bodego wolno stosować: '
      + (A.pm === null
        ? 'charakterystyka nie przecina 0 dB, więc ω<sub>c</sub> nie istnieje.'
        : `PM = ${fmt(A.pm)}° ${A.pm > 0 ? '> 0 ⇒ układ zamknięty stabilny.' : '≤ 0 ⇒ układ zamknięty niestabilny.'}`);
  }
  return `<b>Uwaga:</b> P = ${A.P}`
    + (minPhase ? '' : ' i układ nie jest minimalnofazowy (zero w prawej półpłaszczyźnie lub opóźnienie)')
    + ` — uproszczone kryterium Bodego <b>nie obowiązuje</b>. Wiążąca jest liczba okrążeń z hodografu: Z = ${A.Z}.`;
}

export function drawBode(A) {
  hotReset('bd');
  const { ctx, w, h } = prep($('bdCv'));
  const geo = layout(w, h, A);
  const { rm, rp } = geo;

  const dB = A.mag.map(m => 20 * Math.log10(Math.max(m, 1e-12)));
  const phd = A.ph.map(p => p * DEG);
  const parts = ($('bodeParts') && $('bodeParts').checked) ? bodeComponents(A) : [];

  // the component curves widen the axes, so nothing drawn is cut off
  const spanDb = [...dB.filter(isFinite)], spanPh = [...phd];
  for (const c of parts) {
    if (c.db_ !== null) for (const v of c.db) if (isFinite(v)) spanDb.push(v);
    for (const v of c.ph) if (isFinite(v)) spanPh.push(v);
  }
  const my = range(spanDb, 40, -160, 160), py = range(spanPh, 40, -630, 190);
  my.deg = false; py.deg = true;

  const Ym = bodePanel(ctx, rm, my, 'L(ω) = 20·log₁₀|G(jω)|   [dB]', A, geo);
  const Yp = bodePanel(ctx, rp, py, 'φ(ω) = arg G(jω)   [stopnie]', A, geo);

  referenceLine(ctx, rm, Ym, 0, 'bd-0db');
  referenceLine(ctx, rp, Yp, -180, 'bd-180');

  // Individual factors go underneath: thin and dashed, so the total always reads
  // as the dominant line. Identity comes from the numbered badge and the matching
  // badge in the equations below -- never from colour alone.
  const cssCol = c => col(c.replace('var(', '').replace(')', ''));
  for (const c of parts) {
    if (c.db_ !== null) polyline(ctx, rm, Ym, A, geo, c.db, cssCol(c.color), { dash: true });
    polyline(ctx, rp, Yp, A, geo, c.ph, cssCol(c.color), { dash: true });
  }
  polyline(ctx, rm, Ym, A, geo, dB, col('--accent'), { id: 'bd-mag' });
  polyline(ctx, rp, Yp, A, geo, phd, col('--amber'), { id: 'bd-pha' });

  const usedM = [], usedP = [];
  for (const c of parts) {
    if (c.db_ !== null) badge(ctx, rm, Ym, c.db, cssCol(c.color), String(c.i), usedM);
    badge(ctx, rp, Yp, c.ph, cssCol(c.color), String(c.i), usedP);
  }
  renderBodeTerms(parts);

  verticalMarker(ctx, geo, rm, rp, A, A.wc, 'ω_c ' + fmt(A.wc), col('--accent'), 'wc');
  verticalMarker(ctx, geo, rm, rp, A, A.w180, 'ω_180 ' + fmt(A.w180), col('--bad'), 'w180');
  cornerMarks(ctx, rm, geo, A);

  if (A.wc && A.pm !== null) {
    marginBar(ctx, rp, geo.X(A.wc), Yp(-180), Yp(-180 + A.pm), 'PM ' + fmt(A.pm) + '°', 'pm');
  }
  if (A.w180 && isFinite(A.gm)) {
    const gmDb = 20 * Math.log10(A.gm);
    marginBar(ctx, rm, geo.X(A.w180), Ym(0), Ym(-gmDb), 'GM ' + fmt(gmDb) + ' dB', 'gm');
  }

  frequencyAxis(ctx, geo, rp);
  $('bdNote').innerHTML = criterionNote(A);
}

/* Both sums written out, each term tagged with the same numbered badge and
   colour as its curve, so a line on the plot maps to a term in the equation. */
function renderBodeTerms(parts) {
  const host = $('bodeTerms');
  if (!host) return;
  if (!parts.length) { host.innerHTML = ''; return; }
  const chip = (c, txt) => `<span class="bterm" style="--bc:${c.color}">`
    + (c.op ? `<span class="op">${c.op}</span>` : '')
    + `<span class="idx">${c.i}</span>${esc(txt)}</span>`;
  const dbTerms = parts.filter(c => c.db_ !== null).map(c => chip(c, c.db_)).join('');
  const argTerms = parts.map(c => chip(c, c.arg_)).join('');
  host.innerHTML =
      `<div class="bterm-row"><span class="lhs">20·log₁₀|G(jω)| [dB] =</span>${dbTerms}</div>`
    + `<div class="bterm-row"><span class="lhs">arg G(jω) [stopnie] =</span>${argTerms}</div>`
    + `<p class="bterm-legend">Każdy składnik jest narysowany osobno linią przerywaną w swoim kolorze — tak, `
    + `jakby występował sam. Numer w kółku przy prawej krawędzi wykresu wskazuje, która krzywa `
    + `odpowiada któremu wyrażeniu. Linia ciągła to suma wszystkich składników, czyli właściwa `
    + `charakterystyka. Czynniki są sprowadzone do postaci (1 + τjω), a stałe wyciągnięte przed `
    + `nawias zebrane są w składniku k.</p>`;
}
