import { C, D2, cabs, carg, csub } from './complex.js';
import { fmt, fx, sgn } from './format.js';
import { K, S, expand } from './model.js';

/* Helpers shared by the explanation tables: how a factor is written on the
   exercise sheets, how the magnitude and phase split into per-factor
   contributions, and the second-order metrics of a closed-loop pole pair. */

/* label for a factor (jw - r), written the way it is on the exercise sheets */
function facLab(r){
  if(Math.abs(r.im)<1e-12){
    const a=-r.re;
    if(Math.abs(a)<1e-12) return 'j\u03c9';
    return '(j\u03c9 ' + sgn(a) + ' ' + fx(Math.abs(a)) + ')';
  }
  return '(j\u03c9 \u2212 (' + fx(r.re) + ' ' + sgn(r.im) + ' j' + fx(Math.abs(r.im)) + '))';
}

export function polLab(r){
  if(Math.abs(r.im)<1e-12){
    const a=-r.re;
    if(Math.abs(a)<1e-12) return 's';
    return '(s ' + sgn(a) + ' ' + fx(Math.abs(a)) + ')';
  }
  return '(s\u00b2 ' + sgn(-2*r.re) + ' ' + fx(Math.abs(2*r.re)) + 's ' + sgn(r.re*r.re+r.im*r.im) + ' ' + fx(r.re*r.re+r.im*r.im) + ')';
}

/* magnitude split into factors: |G| = |K| * PROD|jw-z| / (w^nu * PROD|jw-p|) */

/* magnitude split into factors: |G| = |K| * PROD|jw-z| / (w^nu * PROD|jw-p|) */

/* magnitude split into factors: |G| = |K| * PROD|jw-z| / (w^nu * PROD|jw-p|) */
export function magTerms(w){
  const rows=[], s=C(0,w);
  let v=Math.abs(K()); rows.push(['|K|', fx(v)]);
  for(const z of expand('z')){ const m=cabs(csub(s,z)); v*=m; rows.push(['|'+facLab(z)+'|', fx(m)]); }
  if(S.nu){ const m=Math.pow(w,S.nu); v/=m; rows.push(['1 / \u03c9^'+S.nu, fx(1/m)]); }
  for(const q of expand('p')){ const m=cabs(csub(s,q)); v/=m; rows.push(['1 / |'+facLab(q)+'|', fx(1/m)]); }
  return {rows, val:v};
}
/* phase split into factors: arg G = arg K - 90*nu - 57.3*w*Td + SUM arg(jw-z) - SUM arg(jw-p) */

/* phase split into factors: arg G = arg K - 90*nu - 57.3*w*Td + SUM arg(jw-z) - SUM arg(jw-p) */

/* phase split into factors: arg G = arg K - 90*nu - 57.3*w*Td + SUM arg(jw-z) - SUM arg(jw-p) */
export function phTerms(w){
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

/* second-order metrics for a closed-loop pole pair, per the formula sheet */
export function poleMetrics(q){
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

/* Every explanation is a record, so the collection is a lookup table rather
   than control flow. Entries live in explain-*.js, one file per subject. */
