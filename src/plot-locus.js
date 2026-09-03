import { $, col } from './dom.js';
import { fmt } from './format.js';
import { K, S, charRoots } from './model.js';
import { circ, clipR, cross, fitAspect, halo, hotL, hotP, hotReset, planeAxes, prep } from './plot-core.js';

/* --- root locus --- */
export function drawRootLocus(A){
  const {ctx,w,h}=prep($('rlCv'));
  const ax=w<430?28:38, r={x:ax,y:12,w:w-ax-12,h:h-30};
  const pts=[...A.poles,...A.zeros].map(p=>({x:p.re,y:p.im}));
  const cur=charRoots(K()); cur.forEach(p=>pts.push({x:p.re,y:p.im}));
  let xmin=-2,xmax=1,ymin=-2,ymax=2;
  if(pts.length){
    xmin=Math.min(...pts.map(p=>p.x)); xmax=Math.max(...pts.map(p=>p.x));
    ymin=Math.min(...pts.map(p=>p.y)); ymax=Math.max(...pts.map(p=>p.y));
  }
  const padx=Math.max(1,(xmax-xmin)*0.35), pady=Math.max(1,(ymax-ymin)*0.35);
  const rng=fitAspect(r,{xmin:xmin-padx,xmax:xmax+padx,ymin:ymin-pady,ymax:ymax+pady});
  const {X,Y}=planeAxes(ctx,r,rng,['Re s','Im s']);

  hotReset('rl');
  ctx.save(); clipR(ctx,r);

  // formula sheet rule 2: root-locus segments on the real axis
  ctx.strokeStyle=col('--accent-soft'); ctx.globalAlpha=.55; ctx.lineWidth=5; ctx.lineCap='butt';
  for(const [a,b] of A.segs){
    const xa=X(Math.max(a,rng.xmin-1)), xb=X(Math.min(b,rng.xmax+1));
    ctx.beginPath(); ctx.moveTo(xa,Y(0)); ctx.lineTo(xb,Y(0)); ctx.stroke();
    hotL('rl',[[xa,Y(0)],[xb,Y(0)]],'rl-seg');
  }
  ctx.globalAlpha=1;

  // rule 3: asymptotes meeting the real axis at delta
  if(A.delta!==null && A.alpha>0){
    const span=(rng.xmax-rng.xmin)*2;
    ctx.save(); ctx.setLineDash([6,4]); ctx.strokeStyle=col('--muted'); ctx.lineWidth=1; ctx.globalAlpha=.75;
    for(const ang of A.asymAng){
      const t=ang*Math.PI/180;
      const x1=X(A.delta), y1=Y(0);
      const x2=X(A.delta+span*Math.cos(t)), y2=Y(span*Math.sin(t));
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      hotL('rl',[[x1,y1],[x2,y2]],'rl-asym');
    }
    ctx.restore();
    ctx.fillStyle=col('--muted');
    ctx.beginPath(); ctx.arc(X(A.delta),Y(0),2.5,0,7); ctx.fill();
    hotP('rl',X(A.delta),Y(0),'rl-delta',null,8); halo(ctx,X(A.delta),Y(0),8);
  }

  // path traced by the closed-loop poles as k is swept
  const NK=260, kmax=4*K();
  const locusPts=[];
  for(let i=1;i<=NK;i++){
    const t=i/NK, k=kmax*t*t;
    const rr=charRoots(k);
    ctx.fillStyle=col('--accent-soft'); ctx.globalAlpha=.28+.5*t;
    for(const q of rr){ ctx.beginPath(); ctx.arc(X(q.re),Y(q.im),1.5,0,7); ctx.fill(); }
    if(i%6===0 && rr.length) locusPts.push([X(rr[0].re),Y(rr[0].im)]);
  }
  ctx.globalAlpha=1;
  hotL('rl',locusPts,'rl-locus');

  // rule 4: breakaway / break-in points
  for(const b of A.brk){
    const x=X(b.s), y=Y(0);
    ctx.fillStyle=col('--amber');
    ctx.beginPath(); ctx.rect(x-3.5,y-3.5,7,7); ctx.fill();
    hotP('rl',x,y,'rl-brk',b); halo(ctx,x,y,9);
  }

  ctx.strokeStyle=col('--muted'); ctx.lineWidth=1.4;
  for(const p of A.poles){ cross(ctx,X(p.re),Y(p.im),5); hotP('rl',X(p.re),Y(p.im),'rl-pole',p); halo(ctx,X(p.re),Y(p.im)); }
  for(let i=0;i<S.nu;i++) cross(ctx,X(0),Y(0),5+i*3);
  if(S.nu>0){ hotP('rl',X(0),Y(0),'rl-int',null,10); halo(ctx,X(0),Y(0),10); }
  for(const z of A.zeros){ circ(ctx,X(z.re),Y(z.im),4.5); hotP('rl',X(z.re),Y(z.im),'rl-zero',z); halo(ctx,X(z.re),Y(z.im)); }
  ctx.strokeStyle=col('--bad'); ctx.lineWidth=2;
  for(const q of cur){ cross(ctx,X(q.re),Y(q.im),6); hotP('rl',X(q.re),Y(q.im),'rl-cl',q); halo(ctx,X(q.re),Y(q.im),10); }
  ctx.restore();

  const worst=cur.length? Math.max(...cur.map(q=>q.re)) : NaN;
  $('rlNote').innerHTML = cur.length
    ? `Przy K = ${fmt(K())} bieguny zamknięte: ${cur.map(q=>fmt(q.re,3)+(Math.abs(q.im)>1e-6?(q.im>0?' + j':' − j')+fmt(Math.abs(q.im),3):'')).join(' ; ')}. `
      + `Największa część rzeczywista: ${fmt(worst,3)} — ${worst<0?'wszystkie w lewej półpłaszczyźnie':'co najmniej jeden w prawej półpłaszczyźnie'}.`
    : 'Brak mianownika — dodaj co najmniej jeden biegun albo astatyzm.';
}

/* --- Nyquist --- */
