import { C, cabs, carg, cdiv, cexp, cmul, csub } from './complex.js';
import { fullRoots, polyRoots, polymul } from './poly.js';

/* ===================== application state ===================== */
export const S={
  Kmag:10, Kneg:false, nu:0, Td:0, zoom:1,
  items:[{kind:'p',re:-1,im:0,on:true},{kind:'p',re:-2,im:0,on:true}]
};

export const K=()=>S.Kneg? -S.Kmag : S.Kmag;

export function expand(kind){
  const out=[];
  for(const it of S.items) if(it.on && it.kind===kind){
    out.push(C(it.re,it.im));
    if(Math.abs(it.im)>1e-12) out.push(C(it.re,-it.im));
  }
  return out;
}

/* G_o(s), exact, including the transport delay */

/* G_o(s), exact, including the transport delay */
export function Gof(s){
  let num=C(K(),0);
  for(const z of expand('z')) num=cmul(num,csub(s,z));
  let den=C(1,0);
  for(const p of expand('p')) den=cmul(den,csub(s,p));
  for(let i=0;i<S.nu;i++) den=cmul(den,s);
  let g=cdiv(num,den);
  if(S.Td>0) g=cmul(g,cexp(C(-S.Td*s.re,-S.Td*s.im)));
  return g;
}

/* magnitude and continuous phase for w>0; phase as a sum of per-factor
   contributions, following Appendix B of the course notes */

export function resp(w){
  const s=C(0,w);
  let mag=Math.abs(K()), ph=(K()<0?-Math.PI:0) - S.nu*Math.PI/2 - S.Td*w;
  for(const z of expand('z')){const d=csub(s,z); mag*=cabs(d); ph+=carg(d);}
  for(const p of expand('p')){const d=csub(s,p); const m=cabs(d); mag/= (m||1e-300); ph-=carg(d);}
  mag/=Math.pow(w,S.nu);
  return {mag,ph};
}

/* ===================== polynomials ===================== */

export function polyFrom(kind){           // real coefficients, highest power first
  let p=[1];
  for(const it of S.items) if(it.on && it.kind===kind){
    p = Math.abs(it.im)>1e-12
      ? polymul(p,[1,-2*it.re, it.re*it.re+it.im*it.im])
      : polymul(p,[1,-it.re]);
  }
  return p;
}

export function ND(){
  let N=polyFrom('z'), D=polyFrom('p');
  for(let i=0;i<S.nu;i++) D=polymul(D,[1,0]);
  return {N,D};
}

/* characteristic equation D(s) + k*N(s); delay via a first-order Pade */

/* characteristic equation D(s) + k*N(s); delay via a first-order Pade */
export function charRoots(k){
  let N=polyFrom('z'), D=polyFrom('p');
  for(let i=0;i<S.nu;i++) D=polymul(D,[1,0]);
  if(S.Td>0){ N=polymul(N,[-S.Td/2,1]); D=polymul(D,[S.Td/2,1]); }
  const zerosPad=D.length-N.length;
  const Np=zerosPad>=0? new Array(zerosPad).fill(0).concat(N) : N;
  const Dp=zerosPad<0? new Array(-zerosPad).fill(0).concat(D) : D;
  const L=Math.max(Np.length,Dp.length);
  const poly=new Array(L).fill(0);
  for(let i=0;i<L;i++) poly[i]=(Dp[i]||0)+k*(Np[i]||0);
  return polyRoots(poly);
}


/* =====================================================================
   ROUTH-HURWITZ: necessary condition, the array for the current K, and the
   stable K intervals (solved symbolically, treating K as a free real
   parameter).
   ===================================================================== */

/* Characteristic polynomial D(s)+K*N(s), using the same first-order Pade
   delay approximation as the rest of the app (charRoots). Consistent, but
   NOT exact once Td>0 -- the UI shows a banner saying so. */

export function charPolyCoeffs(k){
  let N=polyFrom('z'), D=polyFrom('p');
  for(let i=0;i<S.nu;i++) D=polymul(D,[1,0]);
  if(S.Td>0){ N=polymul(N,[-S.Td/2,1]); D=polymul(D,[S.Td/2,1]); }
  const L=Math.max(N.length,D.length);
  const Np=N.length<L? new Array(L-N.length).fill(0).concat(N): N;
  const Dp=D.length<L? new Array(L-D.length).fill(0).concat(D): D;
  return Dp.map((d,i)=>d+k*(Np[i]||0));
}
/* same thing, but as pairs [a_i,b_i] so that c_i(K) = a_i + b_i*K */

/* same thing, but as pairs [a_i,b_i] so that c_i(K) = a_i + b_i*K */
export function charPolyOfK(){
  let N=polyFrom('z'), D=polyFrom('p');
  for(let i=0;i<S.nu;i++) D=polymul(D,[1,0]);
  if(S.Td>0){ N=polymul(N,[-S.Td/2,1]); D=polymul(D,[S.Td/2,1]); }
  const L=Math.max(N.length,D.length);
  const Np=N.length<L? new Array(L-N.length).fill(0).concat(N): N;
  const Dp=D.length<L? new Array(L-D.length).fill(0).concat(D): D;
  return Dp.map((d,i)=>[d, Np[i]||0]);
}

/* ---- minimal polynomial arithmetic in K, highest power first ---- */

export function adoptTF(Ndesc,Ddesc){
  let N=Ndesc.slice(), D=Ddesc.slice();
  while(N.length>1 && Math.abs(N[0])<1e-12) N.shift();
  while(D.length>1 && Math.abs(D[0])<1e-12) D.shift();
  if(D.every(v=>Math.abs(v)<1e-12)){ alert('Mianownik wypadkowej transmitancji jest zerowy \u2014 sprawd\u017a schemat.'); return false; }
  const leadN = N.every(v=>Math.abs(v)<1e-12) ? 0 : N[0];
  const leadD = D[0];
  const Kval = leadD!==0 ? leadN/leadD : 0;
  let Dc=D.slice(), nu=0;
  while(Dc.length>1 && Math.abs(Dc[Dc.length-1])<1e-9){ Dc.pop(); nu++; }
  const poles = Dc.length>1 ? polyRoots(Dc) : [];
  const zeros = leadN!==0 ? fullRoots(N) : [];
  const mkItems=(arr,kind)=>{
    const items=[], used=new Array(arr.length).fill(false);
    arr.forEach((r,i)=>{
      if(used[i]) return;
      if(Math.abs(r.im)<1e-7){ items.push({kind,re:r.re,im:0,on:true}); used[i]=true; return; }
      const j=arr.findIndex((r2,k)=>!used[k]&&k!==i&&Math.abs(r2.re-r.re)<1e-6&&Math.abs(r2.im+r.im)<1e-6);
      items.push({kind,re:r.re,im:Math.abs(r.im),on:true});
      used[i]=true; if(j>=0) used[j]=true;
    });
    return items;
  };
  if(nu>3){ alert('Uk\u0142ad ma '+nu+' biegun\u00f3w w zerze \u2014 panel obs\u0142uguje astatyzm do rz\u0119du 3. Ograniczono do 3.'); nu=3; }
  S.items=[...mkItems(poles,'p'), ...mkItems(zeros,'z')];
  S.Kmag=Math.max(Math.abs(Kval),1e-6); S.Kneg=Kval<0;
  S.nu=nu; S.Td=0;
  return true;
}
