import { col } from './dom.js';
import { fmt } from './format.js';

export function prep(cv){
  const dpr=window.devicePixelRatio||1;
  const w=cv.clientWidth||600, h=cv.clientHeight||300;
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  const ctx=cv.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  return {ctx,w,h};
}

export function ticksFrom(a,b,cands){
  for(const st of cands){
    if((b-a)/st<=7){ const o=[]; for(let v=Math.ceil(a/st)*st; v<=b+1e-9; v+=st) o.push(+v.toFixed(6)); return o; }
  }
  const st=cands[cands.length-1], o=[];
  for(let v=Math.ceil(a/st)*st; v<=b+1e-9; v+=st) o.push(+v.toFixed(6));
  return o;
}

function ticks(a,b,n){
  const span=(b-a)/Math.max(1,n);
  if(!(span>0)) return [a];
  const mag=Math.pow(10,Math.floor(Math.log10(span))), nn=span/mag;
  const step=(nn<1.5?1:nn<3?2:nn<7?5:10)*mag, out=[];
  for(let v=Math.ceil(a/step)*step; v<=b+step*1e-9; v+=step) out.push(Math.abs(v)<step/1e6?0:v);
  return out;
}

export function box(ctx,r){ ctx.fillStyle=col('--plot-bg'); ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.strokeStyle=col('--line'); ctx.lineWidth=1; ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1); }

export function clipR(ctx,r){ ctx.beginPath(); ctx.rect(r.x,r.y,r.w,r.h); ctx.clip(); }

/* --- complex plane, shared by the root locus and the Nyquist plot --- */

/* --- complex plane, shared by the root locus and the Nyquist plot --- */
export function planeAxes(ctx,r,rng,labels){
  const X=v=>r.x+(v-rng.xmin)/(rng.xmax-rng.xmin)*r.w;
  const Y=v=>r.y+r.h-(v-rng.ymin)/(rng.ymax-rng.ymin)*r.h;
  box(ctx,r);
  ctx.save(); clipR(ctx,r);
  ctx.strokeStyle=col('--grid'); ctx.lineWidth=1;
  ctx.font='10px "IBM Plex Mono", monospace'; ctx.fillStyle=col('--muted');
  for(const t of ticks(rng.xmin,rng.xmax,7)){
    const x=Math.round(X(t))+.5; ctx.beginPath(); ctx.moveTo(x,r.y); ctx.lineTo(x,r.y+r.h); ctx.stroke();
  }
  for(const t of ticks(rng.ymin,rng.ymax,5)){
    const y=Math.round(Y(t))+.5; ctx.beginPath(); ctx.moveTo(r.x,y); ctx.lineTo(r.x+r.w,y); ctx.stroke();
  }
  ctx.strokeStyle=col('--line'); ctx.lineWidth=1.4;
  const y0=Math.round(Y(0))+.5, x0=Math.round(X(0))+.5;
  ctx.beginPath(); ctx.moveTo(r.x,y0); ctx.lineTo(r.x+r.w,y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0,r.y); ctx.lineTo(x0,r.y+r.h); ctx.stroke();
  ctx.textAlign='center'; ctx.textBaseline='top';
  for(const t of ticks(rng.xmin,rng.xmax,7)) if(Math.abs(t)>1e-9) ctx.fillText(fmt(t,2),X(t),y0+4);
  ctx.textAlign='left'; ctx.textBaseline='middle';
  for(const t of ticks(rng.ymin,rng.ymax,5)) if(Math.abs(t)>1e-9) ctx.fillText(fmt(t,2),x0+5,Y(t));
  ctx.restore();
  ctx.fillStyle=col('--muted'); ctx.font='500 10px "IBM Plex Sans Condensed", sans-serif';
  ctx.textAlign='right'; ctx.textBaseline='bottom'; ctx.fillText(labels[0],r.x+r.w-4,r.y+r.h-4);
  ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(labels[1],r.x+5,r.y+4);
  return {X,Y};
}

export function fitAspect(r,rng){
  const cx=(rng.xmin+rng.xmax)/2, cy=(rng.ymin+rng.ymax)/2;
  const s=Math.max((rng.xmax-rng.xmin)/2/r.w,(rng.ymax-rng.ymin)/2/r.h);
  return {xmin:cx-s*r.w, xmax:cx+s*r.w, ymin:cy-s*r.h, ymax:cy+s*r.h};
}

export function cross(ctx,x,y,s){ ctx.beginPath(); ctx.moveTo(x-s,y-s); ctx.lineTo(x+s,y+s); ctx.moveTo(x-s,y+s); ctx.lineTo(x+s,y-s); ctx.stroke(); }

export function circ(ctx,x,y,s){ ctx.beginPath(); ctx.arc(x,y,s,0,7); ctx.stroke(); }

/* ---- registry of clickable regions, used by the explanation mode ---- */

/* ---- registry of clickable regions, used by the explanation mode ---- */
export const EX={on:false};

const HOT={rl:{p:[],l:[]}, nq:{p:[],l:[]}, bd:{p:[],l:[]}};

export const hotReset=k=>{HOT[k]={p:[],l:[]};};

export const hotP=(k,x,y,id,d,rad)=>{ if(EX.on) HOT[k].p.push({x,y,id,d,r:rad||10}); };

export const hotL=(k,pts,id,d)=>{ if(EX.on && pts.length>1) HOT[k].l.push({pts,id,d}); };

function segDist(px,py,a,b){
  const dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy;
  let t = L? ((px-a[0])*dx+(py-a[1])*dy)/L : 0;
  t=Math.max(0,Math.min(1,t));
  return Math.hypot(px-(a[0]+t*dx), py-(a[1]+t*dy));
}

export function hotHit(k,x,y){
  let best=null, bd=1e9;
  for(const q of HOT[k].p){ const d=Math.hypot(q.x-x,q.y-y); if(d<q.r && d<bd){bd=d;best=q;} }
  if(best) return best;
  bd=11;
  for(const L of HOT[k].l) for(let i=1;i<L.pts.length;i++){
    const d=segDist(x,y,L.pts[i-1],L.pts[i]);
    if(d<bd){bd=d;best=L;}
  }
  return best;
}
/* faint halo marking a point as clickable */

/* faint halo marking a point as clickable */
export function halo(ctx,x,y,rad){
  if(!EX.on) return;
  ctx.save(); ctx.globalAlpha=.4; ctx.setLineDash([1.5,2.5]);
  ctx.strokeStyle=col('--accent'); ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(x,y,rad||9,0,7); ctx.stroke(); ctx.restore();
}

/* --- root locus --- */
