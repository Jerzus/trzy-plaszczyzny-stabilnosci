import { esc, fx } from './format.js';
import { MECH_UNIT } from './circuits.js';

/* Rysunek układu mechanicznego translacyjnego, w tej samej konwencji co
   schemat obwodu: element -> symbol -> podpis z wartością, wyjście
   zaznaczone przerywaną ramką. Analogia siła–napięcie (impedancyjna):
   m ↔ L, b ↔ R, 1/k ↔ C, siła ↔ napięcie, prędkość ↔ prąd. */

/** Utwierdzenie: pionowa kreska z kreskowaniem, jak podpora w mechanice. */
function wall(x, y1, y2) {
  let h = '';
  for (let y = y1; y < y2 - 2; y += 13) h += `M ${x} ${y + 13} L ${x - 11} ${y} `;
  return `<path class="w" d="M ${x} ${y1} L ${x} ${y2}"/><path class="w dim" d="${h}"/>`;
}

/** Sprężyna: zygzak o n wierzchołkach, z prostymi odcinkami na końcach. */
function spring(x1, x2, y, n = 6) {
  const lead = 16, seg = (x2 - x1 - 2 * lead) / (2 * n), h = 11;
  let d = `M ${x1} ${y} L ${x1 + lead} ${y}`;
  for (let i = 0; i < 2 * n; i++) d += ` L ${(x1 + lead + seg * (i + .5)).toFixed(1)} ${y + (i % 2 ? h : -h)}`;
  return d + ` L ${x2 - lead} ${y} L ${x2} ${y}` ;
}

/** Tłumik: cylinder przymocowany po lewej, tłok na trzonie od prawej. */
function damper(x1, x2, y) {
  const cx = (x1 + x2) / 2, cw = 38, ch = 22;
  const l = cx - cw / 2, r = cx + cw / 2;
  return `<path class="w" d="M ${x1} ${y} L ${l} ${y}"/>`
    + `<path class="comp" d="M ${r} ${y - ch / 2} L ${l} ${y - ch / 2} L ${l} ${y + ch / 2} L ${r} ${y + ch / 2}"/>`
    + `<path class="comp" d="M ${cx + 4} ${y - ch / 2 + 3} L ${cx + 4} ${y + ch / 2 - 3}"/>`
    + `<path class="w" d="M ${cx + 4} ${y} L ${x2} ${y}"/>`;
}

export function mechSchematic(t, vals) {
  const f = t.fig;
  const yC = 116, yS = yC - 40, yD = yC + 40;       // sprężyna wyżej, tłumik niżej
  const xA = 60;                                    // lewa kotwica (utwierdzenie albo podstawa)
  const xM = 300;                                   // lewa krawędź masy
  const mw = f.mass ? 86 : 14, mh = f.mass ? 96 : 118;
  const xR = xM + mw;
  const W = xR + 240, H = 250;
  const lab = (k, x, y) => `<text x="${x}" y="${y}" text-anchor="middle">${k}</text>`
    + `<text class="sm" x="${x}" y="${y + 14}" text-anchor="middle">${fx(vals[k], 3)} ${MECH_UNIT[k]}</text>`;

  let g = '';
  // lewa kotwica
  if (f.left === 'wall') {
    g += wall(xA, yC - 78, yC + 78);
  } else {
    g += `<rect class="comp fillbg" x="${xA - 16}" y="${yC - 78}" width="16" height="156"/>`;
    g += `<path class="w" d="M ${xA - 8} ${yC + 104} L ${xA + 46} ${yC + 104}" marker-end="url(#arwm)"/>`;
    g += `<text class="sig" x="${xA - 12}" y="${yC + 122}">u — wymuszenie podstawy</text>`;
  }

  // elementy równoległe między kotwicą a masą
  const rows = { k: yS, b: yD };
  for (const el of f.par) {
    if (el === 'k') { g += `<path class="comp" d="${spring(xA, xM, yS)}"/>`; g += lab('k', (xA + xM) / 2, yS - 34); }
    else { g += damper(xA, xM, yD); g += lab('b', (xA + xM) / 2, yD + 30); }
  }
  // pionowe łączniki przy kotwicy i przy masie
  const ys = f.par.map(e => rows[e]);
  const yTop = Math.min(...ys), yBot = Math.max(...ys);
  if (f.par.length > 1) {
    g += `<path class="w" d="M ${xA} ${yTop} L ${xA} ${yBot}"/>`;
    g += `<path class="w" d="M ${xM} ${yTop} L ${xM} ${yBot}"/>`;
  }

  // masa albo sam węzeł, do którego przyłożona jest siła
  if (f.mass) {
    g += `<rect class="comp fillbg" x="${xM}" y="${yC - mh / 2}" width="${mw}" height="${mh}" rx="3"/>`;
    g += `<text x="${xM + mw / 2}" y="${yC - 2}" text-anchor="middle">m</text>`;
    g += `<text class="sm" x="${xM + mw / 2}" y="${yC + 14}" text-anchor="middle">${fx(vals.m, 3)} ${MECH_UNIT.m}</text>`;
  } else {
    g += `<rect class="comp fillbg" x="${xM - 5}" y="${yC - mh / 2}" width="10" height="${mh}"/>`;
    g += `<text class="sm" x="${xM}" y="${yC + mh / 2 + 26}" text-anchor="middle">węzeł bez masy</text>`;
  }

  // wymuszenie siłą po prawej
  if (f.in === 'F') {
    g += `<path class="w" d="M ${xR} ${yC} L ${xR + 84} ${yC}" marker-end="url(#arwm)"/>`;
    g += `<text class="sig" x="${xR + 92}" y="${yC + 5}">F = u</text>`;
  }

  // współrzędna wyjściowa
  const yx = yC - mh / 2 - 30;
  g += `<path class="w dim" d="M ${xM + mw / 2} ${yC - mh / 2 - 6} L ${xM + mw / 2} ${yx - 10}"/>`;
  g += `<path class="w" d="M ${xM + mw / 2} ${yx} L ${xM + mw / 2 + 62} ${yx}" marker-end="url(#arwm)"/>`;
  g += `<text class="sig" x="${xM + mw / 2 + 70}" y="${yx + 5}">${f.out === 'v' ? 'v = ẋ = y' : 'x = y'}</text>`;
  g += `<rect class="tapbox" x="${xM - 14}" y="${yC - mh / 2 - 14}" width="${mw + 28}" height="${mh + 28}" rx="6"/>`;

  return `<svg class="fig" style="--figw:${W}px" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Układ mechaniczny ${esc(t.label)}">`
    + `<defs><marker id="arwm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">`
    + `<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/></marker></defs>${g}</svg>`;
}
