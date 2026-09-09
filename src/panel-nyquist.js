import { $ } from './dom.js';
import { esc, fmt, fracHtml, fx, polyToHtml } from './format.js';
import { S } from './model.js';

/* Karta "Hodograf krok po kroku": rozdzielenie G(jw) na P(w) i Q(w) przez
   pomnozenie przez sprzezenie mianownika, wynikajace z tego wielkosci
   charakterystyczne i podzial konturu Cauchy'ego na etapy. Wszystko z
   arytmetyki wielomianow, wiec liczby sa dokladne, nie odczytane z siatki. */

const box = (lead, num, den) => '<div class="pq-line" data-ex="nq-pq" tabindex="0" role="button">'
  + fracHtml(num, den, lead, 'ω') + '</div>';

const poly = (c, lab) => '<span class="pq-poly">' + esc(polyToHtml(c, lab, 'ω')) + '</span>';

export function renderNyquistPanel(A) {
  const pl = A.plan;

  /* --- 1. rozdzielenie na czesc rzeczywista i urojona --- */
  const head = '<div class="pq-line pq-lead" data-ex="nq-pq" tabindex="0" role="button">Gₒ(jω) = '
    + '<span class="stack"><span>A(ω) + jB(ω)</span><span>C(ω) + jD(ω)</span></span>'
    + ' · <span class="stack"><span>C(ω) − jD(ω)</span><span>C(ω) − jD(ω)</span></span>'
    + ' = P(ω) + jQ(ω)</div>';

  $('pqDerive').innerHTML = head
    + '<div class="pq-grid">'
    + poly(pl.A, 'A(ω)') + poly(pl.B, 'B(ω)')
    + poly(pl.Cc, 'C(ω)') + poly(pl.Dd, 'D(ω)')
    + '</div>'
    + '<div class="pq-line pq-def">P(ω) = [A·C + B·D] / (C² + D²)&nbsp;&nbsp;&nbsp;Q(ω) = [B·C − A·D] / (C² + D²)</div>'
    + box('P(ω) = ', pl.Pn, pl.den)
    + box('Q(ω) = ', pl.Qn, pl.den)
    + (pl.exact ? ''
      : '<div class="pq-warn">T<sub>d</sub> = ' + fx(S.Td) + ' s: opóźnienie nie jest wielomianem, więc powyższe P i Q opisują samą część wymierną. '
      + 'Pełne G<sub>o</sub>(jω) = [P + jQ]·e<sup>−jωT<sub>d</sub></sup>, czyli ten sam moduł obrócony o −ωT<sub>d</sub>. '
      + 'Moduł się nie zmienia, więc ω<sub>c</sub> poniżej pozostaje dokładne; ω<sub>180</sub> — nie.</div>');

  /* --- 2. wielkosci wyliczone z P i Q --- */
  const rootTxt = (arr, f) => arr.length ? arr.map(f).join('<br>') : '—';
  const rows = [
    ['ν · μ · d = ν − μ', `${pl.nu} · ${pl.mu} · ${fmt(pl.d)}`, 'nq-order'],
    ['liczba etapów', String(pl.nStages), 'nq-stages'],
    ['c = lim s<sup>d</sup>·Gₒ(s)', fx(pl.c), 'nq-c'],
    ['kąt łuku wcięcia', pl.nStages === 5 ? fmt(-pl.d * 180, 4) + '°' : '—', 'nq-arcang'],
    ['asymptota Re = lim P(ω)', pl.nStages === 5 && pl.d > 0 ? fmt(pl.asym, 4) : '—', 'nq-asym'],
    ['punkt startowy A = Gₒ(0)', pl.nStages === 3 && pl.start ? '(' + fx(pl.start.re) + ' , j' + fx(pl.start.im) + ')' : '∞', 'nq-A'],
    ['n − m, kąt dojścia do zera', `${pl.relDeg} , ${fmt(-90 * pl.relDeg, 4)}°`, 'nq-reldeg'],
    ['obraz dużego łuku', pl.bigArc ? '(' + fx(pl.bigArc.re) + ' , j' + fx(pl.bigArc.im) + ')' : '∞', 'nq-big'],
    ['Q(ω) = 0  →  ω, P(ω)', rootTxt(pl.reCrossAll, q => fx(q.w) + ' → ' + fx(q.P)), 'nq-qroots'],
    ['|Gₒ| = 1  →  ω<sub>c</sub>, PM', rootTxt(pl.unitAll, q => fx(q.w) + ' → ' + fmt(q.pm, 4) + '°'), 'nq-wcroots'],
  ];
  $('pqFacts').innerHTML = rows.map(([a, b, id]) =>
    `<div data-ex="${id}" tabindex="0" role="button"><dt>${a}</dt><dd>${b}</dd></div>`).join('');

  /* --- 3. etapy konturu --- */
  $('stageTable').innerHTML =
    '<thead><tr><th>etap</th><th>odcinek konturu</th><th>parametryzacja</th><th>obraz w płaszczyźnie Gₒ</th></tr></thead><tbody>'
    + pl.stages.map(st =>
      `<tr data-ex="${st.id}" tabindex="0" role="button"><td class="rowlab">${st.no}. ${esc(st.name)}</td>`
      + `<td>${esc(st.s)}</td><td>${esc(st.par)}</td><td class="wide">${esc(st.img)}</td></tr>`).join('')
    + '</tbody>';

  const q = pl.reCrossAll.filter(v => v.P < 0);
  $('pqNote').innerHTML =
    'Kolejność etapów jest kolejnością obchodzenia konturu, zaczynając od s = +ε na osi rzeczywistej. '
    + (pl.nStages === 5
      ? 'Wcięcie jest konieczne, bo kontur Cauchy’ego nie może przechodzić przez miejsce zerowe funkcji ani jej bieguna — omija je łukiem o promieniu ε → 0, przechodząc nieskończenie blisko punktu (0, j0), ale po stronie prawej półpłaszczyzny.'
      : 'Wcięcie nie jest potrzebne — Gₒ(s) jest w s = 0 skończone i różne od zera, więc kontur przechodzi przez początek układu bez omijania.')
    + (q.length ? ' Ujemną półoś rzeczywistą krzywa tnie ' + q.length + '× — najgorsze przecięcie ' + fx(Math.min(...q.map(v => v.P))) + ' decyduje o zapasie wzmocnienia.' : '');
}
