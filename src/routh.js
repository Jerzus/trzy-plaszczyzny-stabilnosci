import { pad } from './format.js';
import { charPolyCoeffs, charPolyOfK } from './model.js';
import { ZEROFRAC, fracDiv, fracMk, fracMul, fracSub, fullRoots, kpTrim } from './poly.js';

/* ---- Routh array for concrete numeric coefficients ---- */
// returns {rows, W, events, firstCol, signs, Z}
export function routhNumeric(cDesc){
  let c=cDesc.slice();
  while(c.length>1 && Math.abs(c[0])<1e-12) c.shift();          // usun zera wiodace
  const n=c.length-1;
  if(n<0) return null;
  const W=Math.max(2,Math.ceil((n+1)/2)+1);
  const mk=arr=>{ const r=arr.slice(); while(r.length<W) r.push(0); return r; };
  let r0=[],r1=[];
  for(let i=0;i<c.length;i+=2) r0.push(c[i]);
  for(let i=1;i<c.length;i+=2) r1.push(c[i]);
  const rows=[mk(r0), mk(r1)];
  const events=[];
  const powOf=idx=>n-idx;
  for(let i=2;i<=n;i++){
    if(rows[i-1].every(v=>Math.abs(v)<1e-9)){
      const pw=powOf(i-2), src=rows[i-2];
      const aux=src.slice();
      const der=[]; for(let j=0;j<aux.length-1;j++){ const p2=pw-2*j; der.push(p2*aux[j]); }
      rows[i-1]=mk(der);
      const auxCoeffs=[]; for(let j=0;j*2<=pw;j++) if(Math.abs(aux[j])>1e-12||j===0) auxCoeffs.push([pw-2*j,aux[j]]);
      events.push({row:i-1, type:'zero-row', auxDeg:pw, auxCoeffs});
    }
    const prev=rows[i-1], prev2=rows[i-2];
    const p0=prev[0];
    let divisor=p0, epsUsed=false;
    if(Math.abs(p0)<1e-9){ divisor = (p0>=0?1:-1)*1e-8; epsUsed=true; }
    const row=[];
    for(let j=0;j<W-1;j++) row.push((p0*(prev2[j+1]??0) - prev2[0]*(prev[j+1]??0))/divisor);
    rows.push(mk(row));
    if(epsUsed) events.push({row:i, type:'eps'});
  }
  const firstCol=rows.map(r=>r[0]);
  const signs=firstCol.map(v=>Math.abs(v)<1e-9?0:(v>0?1:-1));
  let Z=0, lastSign=0;
  for(const sg of signs){ if(sg===0) continue; if(lastSign!==0 && sg!==lastSign) Z++; lastSign=sg; }
  return {rows, W, n, events, firstCol, signs, Z};
}

/* necessary condition: every c_i shares the sign of the leading one */

/* necessary condition: every c_i shares the sign of the leading one */
export function necessaryCheck(cDesc){
  let c=cDesc.slice();
  while(c.length>1 && Math.abs(c[0])<1e-12) c.shift();
  const lead=c[0]>=0?1:-1;
  const items=c.map((v,i)=>({pow:c.length-1-i, val:v, ok: lead*v>1e-9}));
  return {items, allOk: items.every(it=>it.ok), lead};
}

/* ---- Routh array solved symbolically in K, as rational functions ---- */
// ponytail: the symbolic path does not handle the degenerate "all-zero row"
// case (a rare special case) -- evaluating a single K numerically via
// routhNumeric still detects it correctly for the value actually shown.

/* ---- Routh array solved symbolically in K, as rational functions ---- */
// ponytail: the symbolic path does not handle the degenerate "all-zero row"
// case (a rare special case) -- evaluating a single K numerically via
// routhNumeric still detects it correctly for the value actually shown.
function routhSymbolic(){
  const cK=charPolyOfK();
  const n=cK.length-1;
  const toFrac=([a,b])=>fracMk(kpTrim([b,a]));
  let r0=[],r1=[];
  for(let i=0;i<cK.length;i+=2) r0.push(toFrac(cK[i]));
  for(let i=1;i<cK.length;i+=2) r1.push(toFrac(cK[i]));
  const W=Math.max(2,Math.ceil((n+1)/2)+1);
  const pad=arr=>{ const r=arr.slice(); while(r.length<W) r.push(ZEROFRAC); return r; };
  const rows=[pad(r0), pad(r1)];
  for(let i=2;i<=n;i++){
    const prev=rows[i-1], prev2=rows[i-2];
    const row=[];
    for(let j=0;j<W-1;j++){
      const a=prev[0]||ZEROFRAC, b=prev2[j+1]||ZEROFRAC, c=prev2[0]||ZEROFRAC, d=prev[j+1]||ZEROFRAC;
      const term=fracSub(fracMul(a,b), fracMul(c,d));
      row.push(fracDiv(term,a));
    }
    rows.push(pad(row));
  }
  return {rows, n, W};
}

/* critical K values: the real roots of the numerators of every first-column
   entry of the symbolic array */

function realRootsK(numDesc){
  return fullRoots(numDesc).filter(r=>Math.abs(r.im)<1e-6).map(r=>r.re);
}

function criticalKs(){
  const {rows}=routhSymbolic();
  const ks=[];
  for(const row of rows){
    const f=row[0];
    const num=kpTrim(f.num);
    if(num.length<2) continue;               // stala -> brak zalezno\u015bci od K
    ks.push(...realRootsK(num));
  }
  ks.sort((a,b)=>a-b);
  const uniq=[];
  for(const k of ks) if(!uniq.length || Math.abs(k-uniq[uniq.length-1])>1e-7) uniq.push(k);
  return uniq;
}

/* necessary condition reduced to a single [lo,hi] interval in K */

/* necessary condition reduced to a single [lo,hi] interval in K */
export function necessaryRangeK(){
  const cK=charPolyOfK();
  let lead=cK[0][0]+cK[0][1]*0; // a_n at K=0, used to fix the sign orientation
  // if the leading coefficient itself depends on K, take the orientation from its constant part
  const sgnLead = (cK[0][0]!==0? Math.sign(cK[0][0]) : (cK[0][1]!==0? Math.sign(cK[0][1]) : 1)) || 1;
  let lo=-Infinity, hi=Infinity, impossible=false, impossiblePow=null;
  for(const [a,b] of cK){
    const aa=a*sgnLead, bb=b*sgnLead;              // wymagamy aa+bb*K > 0
    if(Math.abs(bb)<1e-12){
      if(aa<=1e-9){ impossible=true; }
    } else {
      const k0=-aa/bb;
      if(bb>0) lo=Math.max(lo,k0); else hi=Math.min(hi,k0);
    }
  }
  if(lo>hi) impossible=true;
  return {lo,hi,impossible};
}

/* full stability intervals, from the sign-change count sampled inside each
   interval delimited by the critical K values */

export function fullStableRanges(){
  const crit=criticalKs();
  const bounds=[-Infinity, ...crit, Infinity];
  const out=[];
  for(let i=0;i<bounds.length-1;i++){
    const lo=bounds[i], hi=bounds[i+1];
    if(hi-lo<1e-9) continue;
    let mid;
    if(!isFinite(lo) && !isFinite(hi)) mid=0;
    else if(!isFinite(lo)) mid=hi-Math.max(1,Math.abs(hi)*0.5+1);
    else if(!isFinite(hi)) mid=lo+Math.max(1,Math.abs(lo)*0.5+1);
    else mid=(lo+hi)/2;
    const c=charPolyCoeffs(mid);
    const r=routhNumeric(c);
    out.push({lo,hi,mid,Z:r?r.Z:null});
  }
  return out;
}

/* ---------- Routh tab rendering ---------- */
