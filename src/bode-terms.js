import { DEG } from './complex.js';
import { fmt, fx, sgn, sup } from './format.js';
import { K, S } from './model.js';

const SLOTS=7;                       // fixed colour order, never cycled

export function bodeComponents(A){
  const w=A.w, N=w.length, comps=[];
  const mk=(o,fdb,fph)=>{
    const db=new Float64Array(N), ph=new Float64Array(N);
    for(let i=0;i<N;i++){ db[i]=fdb(w[i]); ph[i]=fph(w[i]); }
    comps.push(Object.assign(o,{db,ph}));
  };
  // factors first: each one folds its constant into k
  let kb=K(); const fac=[];
  for(const it of S.items.filter(x=>x.on)){
    const sgn = it.kind==='z' ? 1 : -1;
    if(Math.abs(it.im)<1e-9){
      const a=-it.re;
      if(Math.abs(a)<1e-12) continue;          // a root at the origin belongs to s^nu
      kb *= sgn>0 ? a : 1/a;
      fac.push({sgn, order:1, tau:1/a});
    } else {
      const wn=Math.hypot(it.re,it.im), z=-it.re/wn;
      kb *= sgn>0 ? wn*wn : 1/(wn*wn);
      fac.push({sgn, order:2, wn, z});
    }
  }
  // 1) constant gain
  mk({db_:'20log|k|', arg_:'arg k', val:'k = '+fx(kb,4), op:''},
     ()=>20*Math.log10(Math.abs(kb)||1e-300), ()=> kb<0? -180:0);
  // 2) integrators
  if(S.nu) mk({db_:'\u221220\u00b7'+S.nu+'\u00b7log \u03c9', arg_:fmt(-90*S.nu,4)+'\u00b0',
               val:'1/s'+(S.nu>1?sup(S.nu):''), op:'+'},
              ww=>-20*S.nu*Math.log10(ww), ()=>-90*S.nu);
  // 3) first- and second-order factors
  for(const f of fac){
    const op = f.sgn>0? '+' : '\u2212';
    if(f.order===1){
      const t=f.tau, body='1 '+(t<0?'\u2212':'+')+' '+fx(Math.abs(t),3)+'j\u03c9';
      mk({db_:'20log|'+body+'|', arg_:'arg('+body+')', val:body, op},
         ww=>f.sgn*20*Math.log10(Math.hypot(1, ww*t)),
         ww=>f.sgn*Math.atan(ww*t)*DEG);
    } else {
      const body='1 + 2\u00b7'+fx(f.z,3)+'\u00b7(j\u03c9/'+fx(f.wn,3)+') + (j\u03c9/'+fx(f.wn,3)+')\u00b2';
      mk({db_:'20log|'+body+'|', arg_:'arg('+body+')', val:body, op},
         ww=>{const u=ww/f.wn; return f.sgn*20*Math.log10(Math.hypot(1-u*u, 2*f.z*u));},
         ww=>{const u=ww/f.wn; return f.sgn*Math.atan2(2*f.z*u, 1-u*u)*DEG;});
    }
  }
  // 4) transport delay -- contributes nothing to the magnitude
  if(S.Td>0) mk({db_:null, arg_:'\u221257,3\u00b7\u03c9\u00b7'+fx(S.Td,3), val:'e^(\u2212j\u03c9T_d)', op:'+'},
                ()=>0, ww=>-ww*S.Td*DEG);
  comps.forEach((c,i)=>{ c.i=i+1; c.color = i<SLOTS? 'var(--sc'+(i+1)+')' : 'var(--muted)'; });
  return comps;
}

/* ===================== canvas plotting ===================== */
