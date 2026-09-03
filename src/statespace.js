import { C } from './complex.js';

function matI(n){ return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0)); }

function matMul(A,B){
  const n=A.length, k=B.length, m=B[0]?B[0].length:0;
  const R=Array.from({length:n},()=>new Array(m).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<m;j++){ let sum=0; for(let t=0;t<k;t++) sum+=A[i][t]*B[t][j]; R[i][j]=sum; }
  return R;
}

function matAddScaled(A,c,I){ return A.map((row,i)=>row.map((v,j)=>v+c*I[i][j])); }

function trace(A){ let t=0; for(let i=0;i<A.length;i++) t+=A[i][i]; return t; }

function matVec(A,v){ return A.map(row=>row.reduce((acc,a,j)=>acc+a*v[j],0)); }

function dot(u,v){ return u.reduce((acc,x,i)=>acc+x*v[i],0); }

function faddeevLeVerrier(A){
  const n=A.length, I=matI(n);
  let Mk=I; const Ms=[Mk]; const c=[1];
  for(let k=1;k<=n;k++){
    const AMk=matMul(A,Mk);
    const ck=-trace(AMk)/k;
    c.push(ck);
    Mk=matAddScaled(AMk, ck, I);
    if(k<n) Ms.push(Mk);
  }
  return {c, Ms};
}

export function ssToTF(A,B,Cr,D){
  const n=A.length;
  if(n===0) return {num:[D], den:[1]};
  const {c,Ms}=faddeevLeVerrier(A);
  const numFromAdj = Ms.map(Mk=>dot(Cr, matVec(Mk,B)));
  const Nfull=new Array(n+1).fill(0);
  for(let k=0;k<n;k++) Nfull[k+1]=numFromAdj[k];
  const Dp=c.map(v=>v*D);
  const num=Nfull.map((v,i)=>v+Dp[i]);
  return {num, den:c};
}

export function tfToSS(numIn,denIn){
  let den=denIn.slice();
  while(den.length>1 && Math.abs(den[0])<1e-12) den.shift();
  const n=den.length-1;
  if(n<1) return null;
  const a=den.map(v=>v/den[0]);
  let num=numIn.slice();
  if(num.length>n+1) num=num.slice(num.length-(n+1));   // ponytail: proper systems only; any improper part is truncated
  while(num.length<n+1) num=[0,...num];
  const b=num.map(v=>v/den[0]);
  const A=Array.from({length:n},()=>new Array(n).fill(0));
  for(let i=0;i<n-1;i++) A[i][i+1]=1;
  for(let j=0;j<n;j++) A[n-1][j]=-a[n-j];
  const B=new Array(n).fill(0); B[n-1]=1;
  const D=b[0];
  const Cr=new Array(n);
  for(let j=0;j<n;j++) Cr[j]=b[n-j]-D*a[n-j];
  return {A,B,C:Cr,D};
}

/* ---------- panel state ---------- */
