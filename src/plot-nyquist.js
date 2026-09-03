import { C, cabs } from './complex.js';
import { $, col } from './dom.js';
import { fmt } from './format.js';
import { Gof, S } from './model.js';
import { clipR, cross, fitAspect, halo, hotL, hotP, hotReset, planeAxes, prep } from './plot-core.js';

/* --- Nyquist --- */
export function drawNyquist(A){
  const {ctx,w,h}=prep($('nqCv'));
  const ax=w<430?28:38, r={x:ax,y:12,w:w-ax-12,h:h-30};
  let R=2.5;
  if(A.reCross!==null) R=Math.max(R,1.4*Math.abs(A.reCross));
  if(S.nu===0 && isFinite(A.kp)) R=Math.max(R,1.3*Math.abs(A.kp));
  R/=S.zoom;
  const rng=fitAspect(r,{xmin:-R,xmax:R,ymin:-R,ymax:R});
  const {X,Y}=planeAxes(ctx,r,rng,['Re G(jω)','Im G(jω)']);

  hotReset('nq');
  ctx.save(); clipR(ctx,r);
  ctx.setLineDash([2,3]); ctx.strokeStyle=col('--line'); ctx.lineWidth=1;
  const ru=Math.abs(X(1)-X(0));
  ctx.beginPath(); ctx.arc(X(0),Y(0),ru,0,7); ctx.stroke();
  ctx.setLineDash([]);
  { const cir=[]; for(let i=0;i<=48;i++){const t=i/48*2*Math.PI; cir.push([X(0)+ru*Math.cos(t),Y(0)+ru*Math.sin(t)]);} hotL('nq',cir,'nq-unit'); }

  const line=(pts,style,dash,id)=>{
    ctx.strokeStyle=style; ctx.lineWidth=dash?1.3:1.9; ctx.setLineDash(dash||[]);
    ctx.beginPath(); let up=false; const scr=[];
    for(const g of pts){
      if(!isFinite(g.re)||!isFinite(g.im)||cabs(g)>1e7){up=false;continue;}
      const x=X(g.re), y=Y(g.im);
      if(!up){ctx.moveTo(x,y);up=true;} else ctx.lineTo(x,y);
      if(x>r.x-40&&x<r.x+r.w+40&&y>r.y-40&&y<r.y+r.h+40) scr.push([x,y]);
    }
    ctx.stroke(); ctx.setLineDash([]);
    if(id) hotL('nq',scr,id);
  };
  line(A.neg.map(q=>q.g), col('--muted'), [4,3], 'nq-neg');
  line(A.arc.map(q=>q.g), col('--amber'), [5,3], 'nq-arc');
  line(A.pos.map(q=>q.g), col('--accent'), null, 'nq-pos');

  // arrowheads on the w>0 branch
  ctx.fillStyle=col('--accent');
  for(const f of [0.25,0.5,0.75]){
    const i=Math.floor(f*(A.pos.length-1)), a=A.pos[i].g, b=A.pos[i+3].g;
    if(cabs(a)>1e6||cabs(b)>1e6) continue;
    const x=X(a.re), y=Y(a.im), an=Math.atan2(Y(b.im)-y,X(b.re)-x);
    ctx.save(); ctx.translate(x,y); ctx.rotate(an);
    ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(-4,3.5); ctx.lineTo(-4,-3.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // critical point
  ctx.strokeStyle=col('--bad'); ctx.lineWidth=2; cross(ctx,X(-1),Y(0),6);
  ctx.fillStyle=col('--bad'); ctx.font='500 10px "IBM Plex Sans Condensed",sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText('(−1, j0)',X(-1),Y(0)-9);
  hotP('nq',X(-1),Y(0),'nq-crit',null,11); halo(ctx,X(-1),Y(0),11);
  // crossings
  if(A.reCross!==null){
    ctx.fillStyle=col('--amber'); ctx.beginPath(); ctx.arc(X(A.reCross),Y(0),3.5,0,7); ctx.fill();
    hotP('nq',X(A.reCross),Y(0),'recross'); halo(ctx,X(A.reCross),Y(0));
  }
  if(A.wc){ const g=Gof(C(0,A.wc));
    ctx.fillStyle=col('--accent'); ctx.beginPath(); ctx.arc(X(g.re),Y(g.im),3.5,0,7); ctx.fill();
    hotP('nq',X(g.re),Y(g.im),'nq-wc',g); halo(ctx,X(g.re),Y(g.im)); }
  ctx.restore();

  $('nqNote').innerHTML =
    `Okrążenia punktu (−1, j0): <b>N = ${A.Ncw}</b> (dodatnie = zgodnie z ruchem wskazówek). `
    + `Bieguny otwarte w prawej półpłaszczyźnie: <b>P = ${A.P}</b>. `
    + `Stąd <b>Z = N + P = ${A.Z}</b>` + (A.Z===0? ' — brak biegunów zamkniętych w prawej półpłaszczyźnie.' : ` — tyle biegunów układu zamkniętego leży w prawej półpłaszczyźnie.`)
    + (A.reCross!==null? ` Przecięcie z osią Re: ${fmt(A.reCross)} przy ω = ${fmt(A.w180)} rad/s.` : ' Krzywa nie tnie ujemnej półosi rzeczywistej, więc GM = ∞.');
}

/* --- Bode --- */
