import { ENTRIES as PARAMS } from './explain-params.js';
import { ENTRIES as MARGINS } from './explain-margins.js';
import { ENTRIES as LOCUS } from './explain-locus.js';
import { ENTRIES as BODE } from './explain-bode.js';
import { ENTRIES as NYQUIST } from './explain-nyquist.js';
import { $ } from './dom.js';
import { esc, rowsHtml } from './format.js';
import { K, S } from './model.js';

const ENTRIES = Object.assign({}, PARAMS, MARGINS, LOCUS, BODE, NYQUIST);

export function EXPLAIN(id, A, d){
  const entry = ENTRIES[id];
  if(!entry) return null;
  const ctx = {
    nz: A.zeros.length,
    np: A.poles.length + S.nu,
    Go: 'G\u2092(s) = K \u00b7 \u03a0(s \u2212 z\u1d62) / ( s^\u03bd \u00b7 \u03a0(s \u2212 p\u1d62) ) \u00b7 e^(\u2212T_d s)',
  };
  return entry(A, d, ctx);
}

export const EXP_LABEL={
  'rl-pole':'Biegun układu otwartego', 'rl-zero':'Zero układu otwartego',
  'rl-cl':'Biegun układu zamkniętego — ζ, ωₙ, przeregulowanie',
  'rl-locus':'Tor biegunów zamkniętych', 'rl-asym':'Asymptoty', 'rl-delta':'Punkt δ',
  'rl-brk':'Punkt rozejścia się linii', 'rl-seg':'Odcinek na osi Re (reguła nieparzystości)',
  'rl-int':'Biegun w zerze (integrator)',
  'bd-mag':'L(ω) — charakterystyka amplitudowa', 'bd-pha':'φ(ω) — charakterystyka fazowa',
  'bterm':'Składnik rozkładu Bodego',
  'bd-0db':'Linia 0 dB', 'bd-180':'Linia −180°', 'bd-corner':'Pulsacja łamania',
  'wc':'ω_c — pulsacja odcięcia amplitudowego', 'w180':'ω₁₈₀ — pulsacja odcięcia fazowego',
  'pm':'Zapas fazy', 'gm':'Zapas wzmocnienia',
  'nq-crit':'Punkt krytyczny (−1, j0)', 'nq-pos':'Gałąź ω > 0', 'nq-neg':'Gałąź lustrzana',
  'nq-arc':'Łuk wcięcia', 'nq-unit':'Okrąg jednostkowy', 'nq-wc':'Punkt przy ω_c',
  'recross':'Przecięcie z osią Re',
  'nq-arc-up':'Górny łuk wcięcia (etap 1)', 'nq-arc-dn':'Dolny łuk wcięcia (etap 5)',
  'nq-big':'Duży łuk domykający R → ∞', 'nq-asym':'Asymptota pionowa Re = lim P(ω)',
  'nq-A':'Punkt startowy A = G(0)', 'nq-pq':'Rozkład na P(ω) i Q(ω)',
  'nq-order':'ν, μ i rząd zachowania w s = 0', 'nq-stages':'Etapy konturu Cauchy’ego',
  'nq-c':'Współczynnik c łuku wcięcia', 'nq-arcang':'Kąt łuku wcięcia',
  'nq-criterion':'Kryterium Z = N + P',
  'nq-phi0':'φ₀ — kąt położenia startu (= start fazy Bodego)',
  'nq-exit':'Kąt wyjścia hodografu przy ω → 0⁺',
  'nq-reldeg':'Kąt dojścia do zera', 'nq-qroots':'Q(ω) = 0 — przecięcia z osią Re',
  'nq-wcroots':'|G| = 1 — przecięcia z okręgiem jednostkowym'
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


