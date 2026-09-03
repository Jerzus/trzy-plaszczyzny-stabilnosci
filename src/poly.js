import { C, cabs, cdiv, cmul, csub } from './complex.js';

/* ===================== polynomials ===================== */
export const polymul=(a,b)=>{const r=new Array(a.length+b.length-1).fill(0);
  for(let i=0;i<a.length;i++) for(let j=0;j<b.length;j++) r[i+j]+=a[i]*b[j];
  return r;};

export function polyvalC(c,s){let r=C(0,0); for(const k of c){ r=cmul(r,s); r.re+=k; } return r;}

export function polyRoots(a){
  let c=a.slice();
  while(c.length>1 && Math.abs(c[0])<1e-14) c.shift();
  while(c.length>1 && Math.abs(c[c.length-1])<1e-14) c.pop();   // roots at the origin
  const n=c.length-1;
  if(n<1) return [];
  c=c.map(v=>v/c[0]);
  const seed=C(0.4,0.9); let cur=C(1,0); const r=[];
  for(let i=0;i<n;i++){ r.push({re:cur.re,im:cur.im}); cur=cmul(cur,seed); }
  for(let it=0; it<300; it++){
    let mx=0;
    for(let i=0;i<n;i++){
      let den=C(1,0);
      for(let j=0;j<n;j++) if(j!==i) den=cmul(den,csub(r[i],r[j]));
      if(cabs(den)<1e-300) continue;
      const d=cdiv(polyvalC(c,r[i]),den);
      r[i]=csub(r[i],d); mx=Math.max(mx,cabs(d));
    }
    if(mx<1e-13) break;
  }
  return r;
}
// Same as polyRoots, but recovers roots exactly at zero (s=0, K=0, ...) which
// polyRoots silently drops when it trims a vanishing constant term.

// Same as polyRoots, but recovers roots exactly at zero (s=0, K=0, ...) which
// polyRoots silently drops when it trims a vanishing constant term.
export function fullRoots(coeffsDesc){
  let c=coeffsDesc.slice();
  while(c.length>1 && Math.abs(c[0])<1e-12) c.shift();
  const roots=[];
  while(c.length>1 && Math.abs(c[c.length-1])<1e-9){ c.pop(); roots.push(C(0,0)); }
  if(c.length>1) roots.push(...polyRoots(c));
  return roots;
}

export const polyder=c=>{const n=c.length-1; return n<1?[0]:c.slice(0,-1).map((v,i)=>v*(n-i));};

export const polyaddK=(D,N,k)=>{const L=Math.max(D.length,N.length),o=new Array(L).fill(0);
  for(let i=0;i<L;i++) o[L-1-i]=(D[D.length-1-i]||0)+k*(N[N.length-1-i]||0); return o;};

/* numerator and denominator without the delay approximation, for the
   geometric root-locus rules */

/* ---- minimal polynomial arithmetic in K, highest power first ---- */
export const kpAdd=(a,b)=>{const L=Math.max(a.length,b.length),o=new Array(L).fill(0);
  for(let i=0;i<a.length;i++) o[L-a.length+i]+=a[i];
  for(let i=0;i<b.length;i++) o[L-b.length+i]+=b[i];
  return o;};

const kpSub=(a,b)=>kpAdd(a,b.map(v=>-v));

export const kpTrim=a=>{let i=0; while(i<a.length-1 && Math.abs(a[i])<1e-12) i++; return a.slice(i);};

const kpEval=(a,x)=>{let r=0; for(const c of a) r=r*x+c; return r;};

/* rational function of K as {num,den}; den defaults to [1] */

/* rational function of K as {num,den}; den defaults to [1] */
export const fracMk=(num,den)=>({num, den:den||[1]});

export const fracMul=(f,g)=>fracMk(polymul(f.num,g.num), polymul(f.den,g.den));

export const fracSub=(f,g)=>fracMk(kpSub(polymul(f.num,g.den), polymul(g.num,f.den)), polymul(f.den,g.den));

export const fracDiv=(f,g)=>fracMk(polymul(f.num,g.den), polymul(f.den,g.num));

export const ZEROFRAC=fracMk([0]);

/* ---- Routh array for concrete numeric coefficients ---- */
// returns {rows, W, events, firstCol, signs, Z}
