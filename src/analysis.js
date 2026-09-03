import { C, DEG, cabs, carg, cdiv } from './complex.js';
import { Gof, K, ND, S, expand, resp } from './model.js';
import { polyRoots, polyaddK, polyder, polymul, polyvalC } from './poly.js';

/* ===================== frequency-domain analysis ===================== */
function bisect(f,a,b){ for(let i=0;i<70;i++){ const m=Math.sqrt(a*b); (f(a)*f(m)<=0)? b=m : a=m; } return Math.sqrt(a*b); }

export function analyse(){
  const P=expand('p'), Z=expand('z');
  const mags=[...P,...Z].map(cabs).filter(v=>v>1e-9);
  let lo = mags.length? Math.min(...mags)/100 : 0.01;
  let hi = mags.length? Math.max(...mags)*100 : 100;
  if(S.Td>0) hi=Math.max(hi, 60/S.Td);
  lo=Math.max(1e-4,Math.min(lo,1)); hi=Math.min(1e5,Math.max(hi,10*lo,100));

  const M=900, w=[], mag=[], ph=[];
  for(let i=0;i<M;i++){
    const ww=lo*Math.pow(hi/lo,i/(M-1)); const r=resp(ww);
    w.push(ww); mag.push(r.mag); ph.push(r.ph);
  }
  for(let i=1;i<M;i++){                       // phase unwrapping
    let d=ph[i]-ph[i-1];
    while(d> Math.PI){ph[i]-=2*Math.PI; d=ph[i]-ph[i-1];}
    while(d<-Math.PI){ph[i]+=2*Math.PI; d=ph[i]-ph[i-1];}
  }

  // w_c: |G| = 1, first crossing
  let wc=null, pm=null;
  for(let i=1;i<M;i++){
    if((mag[i-1]-1)*(mag[i]-1)<0){
      wc=bisect(x=>resp(x).mag-1, w[i-1], w[i]);
      const t=(Math.log(wc)-Math.log(w[i-1]))/(Math.log(w[i])-Math.log(w[i-1]));
      let p=(ph[i-1]+t*(ph[i]-ph[i-1]))*DEG;
      pm=180+p; while(pm>180)pm-=360; while(pm<=-180)pm+=360;
      break;
    }
  }
  // w_180: crossing of the negative real axis, worst case (largest |Re|)
  let w180=null, gm=Infinity, reCross=null;
  for(let i=1;i<M;i++){
    const im0=mag[i-1]*Math.sin(ph[i-1]), im1=mag[i]*Math.sin(ph[i]);
    const re1=mag[i]*Math.cos(ph[i]);
    if(im0*im1<0 && re1<0){
      const f=x=>{const r=resp(x); return r.mag*Math.sin(r.ph);};
      const ww=bisect(f,w[i-1],w[i]); const r=resp(ww);
      const re=r.mag*Math.cos(r.ph);
      if(re<0 && (reCross===null || Math.abs(re)>Math.abs(reCross))){ reCross=re; w180=ww; }
    }
  }
  if(reCross!==null) gm=1/Math.abs(reCross);

  /* --- kontur Nyquista --- */
  const wlo=lo/50, whi=hi*20, NP=1400, NA=400;
  const pos=[], neg=[], arc=[];
  for(let i=0;i<NP;i++){ const ww=wlo*Math.pow(whi/wlo,i/(NP-1)); pos.push({w:ww,g:Gof(C(0,ww))}); }
  for(let i=0;i<NP;i++){ const q=pos[NP-1-i]; neg.push({w:-q.w,g:C(q.g.re,-q.g.im)}); }
  for(let i=0;i<NA;i++){ const th=-Math.PI/2+Math.PI*i/(NA-1); arc.push({g:Gof(C(wlo*Math.cos(th),wlo*Math.sin(th)))}); }

  const path=[...neg.map(q=>q.g), ...arc.map(q=>q.g), ...pos.map(q=>q.g)];
  let acc=0, prev=carg(C(path[0].re+1,path[0].im));
  for(let i=1;i<path.length;i++){
    const a=carg(C(path[i].re+1,path[i].im));
    let d=a-prev; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
    acc+=d; prev=a;
  }
  { const a=carg(C(path[0].re+1,path[0].im));   // closing arc at infinity
    let d=a-prev; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; acc+=d; }
  const Ncw=Math.round(-acc/(2*Math.PI));
  const Popen=P.filter(p=>p.re>1e-9).length;
  const Zcl=Ncw+Popen;

  const kp = S.nu===0 ? (()=>{ const g=Gof(C(1e-9,0)); return g.re; })() : Infinity;

  /* ---- root-locus geometry, following the course formula sheet ---- */
  const np=P.length+S.nu, nz=Z.length, alpha=np-nz;
  const sumP=P.reduce((a,q)=>a+q.re,0), sumZ=Z.reduce((a,q)=>a+q.re,0);
  const delta = alpha>0 ? (sumP-sumZ)/alpha : null;                    // pkt 3: δ = (Σp − Σz)/(n−m)
  const asymAng = alpha>0 ? [...Array(alpha)].map((_,i)=>{let a=(2*i+1)*180/alpha; while(a>180)a-=360; return a;}) : [];

  // rule 2: real-axis segments with an odd number of real poles and zeros to their right
  const realCrit=[];
  P.forEach(q=>{ if(Math.abs(q.im)<1e-12) realCrit.push(q.re); });
  Z.forEach(q=>{ if(Math.abs(q.im)<1e-12) realCrit.push(q.re); });
  for(let i=0;i<S.nu;i++) realCrit.push(0);
  realCrit.sort((a,b)=>a-b);
  const segs=[];
  if(realCrit.length){
    const uniq=[...new Set(realCrit.map(v=>+v.toFixed(9)))];
    for(let i=0;i<uniq.length;i++){
      const a=uniq[i], b=(i+1<uniq.length)? uniq[i+1] : null;
      const mid = b===null ? a+1 : (a+b)/2;
      const right = realCrit.filter(v=>v>mid).length;
      if(right%2===1) segs.push([a, b===null? a : b]);
    }
    const left=uniq[0];
    if(realCrit.filter(v=>v>left-1).length%2===1) segs.push([-Infinity,left]);
  }

  // rule 4: breakaway / break-in points from D(s)N'(s) - D'(s)N(s) = 0
  const {N:Np0,D:Dp0}=ND();
  const brk=[];
  {
    const cand=polyRoots(polyaddK(polymul(Dp0,polyder(Np0)), polymul(polyder(Dp0),Np0), -1));
    for(const r of cand){
      if(Math.abs(r.im)>1e-6) continue;                       // real roots only (rule 4)
      const sv=C(r.re,0), nv=polyvalC(Np0,sv), dv=polyvalC(Dp0,sv);
      if(cabs(nv)<1e-12) continue;
      const k=-cdiv(dv,nv).re;                                // k = −D(s)/N(s)
      if(!(k*Math.sign(K())>1e-12)) continue;                 // the gain must lie in the direction being swept
      if(!segs.some(([a,b])=>r.re>=a-1e-6 && r.re<=b+1e-6)) continue;
      brk.push({s:r.re,k});
    }
  }

  // corner frequencies, i.e. reciprocals of the time constants
  const corners=[];
  P.forEach(q=>{const v=cabs(q); if(v>1e-9) corners.push({w:v,kind:'p',c:Math.abs(q.im)>1e-12});});
  Z.forEach(q=>{const v=cabs(q); if(v>1e-9) corners.push({w:v,kind:'z',c:Math.abs(q.im)>1e-12});});

  return {lo,hi,w,mag,ph,wc,pm,w180,gm,reCross,pos,neg,arc,Ncw,P:Popen,Z:Zcl,kp,
          poles:P,zeros:Z, np,nz,alpha,delta,asymAng,segs,brk,corners,sumP,sumZ};
}

/* =====================================================================
   BODE DECOMPOSITION into individual factors, in time-constant form -- the
   same form used in the lecture notes. Every factor (s - r) is rewritten as
   a*(1 + tau*s) with tau = -1/r, and the collected constants 'a' fold into a
   single gain k. That gives:
     20log|G| = 20log|k| - 20*nu*log(w) + SUM +-20log|1 + tau*jw|
     arg G    = arg k    - 90*nu        + SUM +-arg(1 + tau*jw)  - 57.3*w*Td
   ===================================================================== */
