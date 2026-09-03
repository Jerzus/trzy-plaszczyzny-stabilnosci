/* ===================== complex numbers ===================== */
export const C=(re,im=0)=>({re,im});

export const csub=(a,b)=>({re:a.re-b.re, im:a.im-b.im});

export const cmul=(a,b)=>({re:a.re*b.re-a.im*b.im, im:a.re*b.im+a.im*b.re});

export const cdiv=(a,b)=>{const d=b.re*b.re+b.im*b.im; return {re:(a.re*b.re+a.im*b.im)/d, im:(a.im*b.re-a.re*b.im)/d};};

export const cabs=a=>Math.hypot(a.re,a.im);

export const carg=a=>Math.atan2(a.im,a.re);

export const cexp=a=>{const m=Math.exp(a.re); return {re:m*Math.cos(a.im), im:m*Math.sin(a.im)};};

export const DEG=180/Math.PI;

/* ===================== application state ===================== */

export const D2 = 180/Math.PI;
