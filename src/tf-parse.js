import { kpAdd, polymul } from './poly.js';

/* Parser transmitancji wpisywanej z klawiatury: dowolne wyrażenie wymierne
   zmiennej s, np. "(s+3)/((s+2)(s+3)(s+4))" albo "(2s^2+3s+1)/(s^3+4s^2+5s)".

   Wynikiem jest para wielomianów o współczynnikach rzeczywistych, najwyższa
   potęga pierwsza — dokładnie taka, jaką przyjmuje adoptTF. Arytmetyka idzie
   na funkcjach wymiernych (para licznik/mianownik), więc dodawanie ułamków
   i potęgi ujemne wychodzą dokładnie, bez dzielenia wielomianów.

   Jedno odstępstwo od zwykłego pierwszeństwa działań: mnożenie przez
   sąsiedztwo wiąże MOCNIEJ niż zapisane wprost / — "1/s(s+1)" znaczy
   1/[s(s+1)], a nie (1/s)(s+1). Tak zapisuje się transmitancje na kartce
   i tak czyta je większość kalkulatorów symbolicznych. */

const trim = c => { let i = 0; while (i < c.length - 1 && Math.abs(c[i]) < 1e-12) i++; return c.slice(i); };
const isZero = c => c.every(v => Math.abs(v) < 1e-12);

/* funkcja wymierna jako {n, d} */
const R = (n, d) => ({ n: trim(n), d: trim(d || [1]) });
const neg = c => c.map(v => -v);
const radd = (x, y) => R(kpAdd(polymul(x.n, y.d), polymul(y.n, x.d)), polymul(x.d, y.d));
const rsub = (x, y) => R(kpAdd(polymul(x.n, y.d), neg(polymul(y.n, x.d))), polymul(x.d, y.d));
const rmul = (x, y) => R(polymul(x.n, y.n), polymul(x.d, y.d));
const rdiv = (x, y) => R(polymul(x.n, y.d), polymul(x.d, y.n));

/* ---------- tokenizacja ---------- */
const NUM = /^[0-9]+(?:[.,][0-9]+)?(?:[eE][+-]?[0-9]+)?/;

function lex(src) {
  const t = [];
  let i = 0;
  const norm = src.replace(/[−–—]/g, '-').replace(/[·×•]/g, '*');
  while (i < norm.length) {
    const ch = norm[i];
    if (/\s/.test(ch)) { i++; continue; }
    const m = norm.slice(i).match(NUM);
    if (m) { t.push({ k: 'num', v: parseFloat(m[0].replace(',', '.')), i }); i += m[0].length; continue; }
    if (ch === 's' || ch === 'S') { t.push({ k: 's', i }); i++; continue; }
    if ('+-*/^()'.includes(ch)) { t.push({ k: ch, i }); i++; continue; }
    throw { msg: 'nieznany znak „' + ch + '”', at: i };
  }
  return t;
}

/* ---------- gramatyka ----------
   expr := jd (('+'|'-') jd)*
   jd   := jux (('*'|'/') jux)*
   jux  := factor+                     mnożenie przez sąsiedztwo
   factor := unary ('^' int)?
   unary  := ('+'|'-')* atom
   atom   := liczba | s | '(' expr ')'                                    */
function parseTokens(t) {
  let p = 0;
  const peek = () => t[p];
  const eat = k => (t[p] && t[p].k === k) ? t[p++] : null;
  const startsFactor = () => { const q = peek(); return q && (q.k === 'num' || q.k === 's' || q.k === '('); };

  function atom() {
    const q = peek();
    if (!q) throw { msg: 'niespodziewany koniec wyrażenia', at: -1 };
    if (q.k === 'num') { p++; return R([q.v]); }
    if (q.k === 's') { p++; return R([1, 0]); }
    if (q.k === '(') {
      p++;
      const e = expr();
      if (!eat(')')) throw { msg: 'brak nawiasu zamykającego', at: q.i };
      return e;
    }
    throw { msg: 'oczekiwano liczby, s albo nawiasu', at: q.i };
  }
  function unary() {
    let sign = 1;
    for (;;) { if (eat('-')) sign = -sign; else if (eat('+')) ; else break; }
    const a = atom();
    return sign < 0 ? R(neg(a.n), a.d) : a;
  }
  function factor() {
    let b = unary();
    if (eat('^')) {
      let sg = 1;
      for (;;) { if (eat('-')) sg = -sg; else if (eat('+')) ; else break; }
      const e = eat('num');
      if (!e || !Number.isInteger(e.v)) throw { msg: 'wykładnik musi być liczbą całkowitą', at: e ? e.i : -1 };
      if (e.v > 24) throw { msg: 'wykładnik większy niż 24', at: e.i };
      let o = R([1]);
      for (let k = 0; k < e.v; k++) o = rmul(o, b);
      b = sg < 0 ? rdiv(R([1]), o) : o;
    }
    return b;
  }
  function jux() {                       // ciąg czynników bez operatora
    let o = factor();
    while (startsFactor()) o = rmul(o, factor());
    return o;
  }
  function jd() {
    let o = jux();
    for (;;) {
      if (eat('*')) o = rmul(o, jux());
      else if (eat('/')) { const y = jux(); if (isZero(y.n)) throw { msg: 'dzielenie przez zero', at: -1 }; o = rdiv(o, y); }
      else break;
    }
    return o;
  }
  function expr() {
    let o = jd();
    for (;;) {
      if (eat('+')) o = radd(o, jd());
      else if (eat('-')) o = rsub(o, jd());
      else break;
    }
    return o;
  }

  const out = expr();
  if (p < t.length) throw { msg: 'nadmiarowy znak', at: t[p].i };
  return out;
}

/** Zwraca {num, den} albo {error} — bez wyjątków na zewnątrz. */
export function parseTF(src) {
  if (!String(src).trim()) return { error: 'puste wyrażenie' };
  let r;
  try { r = parseTokens(lex(String(src))); }
  catch (e) { return { error: (e && e.msg ? e.msg : 'błąd składni') + (e && e.at >= 0 ? ' (poz. ' + (e.at + 1) + ')' : '') }; }
  const num = trim(r.n), den = trim(r.d);
  if (isZero(den)) return { error: 'mianownik jest zerem' };
  if (isZero(num)) return { error: 'licznik jest zerem' };
  let nu = 0, d = den.slice();
  while (d.length > 1 && Math.abs(d[d.length - 1]) < 1e-9) { d.pop(); nu++; }
  if (nu > 3) return { error: 'astatyzm rzędu ' + nu + ' — panel obsługuje do 3' };
  return { num, den };
}

/** Wielomian jako tekst do wpisania z powrotem w pole, np. "s^2 + 3s + 2". */
export function polyToText(c) {
  const n = c.length - 1, out = [];
  c.forEach((v, i) => {
    if (Math.abs(v) < 1e-12 && n > 0) return;
    const pw = n - i, a = Math.abs(v), one = Math.abs(a - 1) < 1e-12;
    const sgn = out.length ? (v < 0 ? ' - ' : ' + ') : (v < 0 ? '-' : '');
    const body = pw === 0 ? String(+a.toPrecision(6))
      : (one ? '' : String(+a.toPrecision(6))) + 's' + (pw > 1 ? '^' + pw : '');
    out.push(sgn + body);
  });
  return out.join('') || '0';
}
