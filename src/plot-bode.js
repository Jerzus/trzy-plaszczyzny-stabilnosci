import { bodeComponents } from './bode-terms.js';
import { DEG } from './complex.js';
import { $, col } from './dom.js';
import { esc, fmt, pad, sub, sup } from './format.js';
import { S } from './model.js';
import { box, clipR, hotL, hotP, hotReset, prep, ticksFrom } from './plot-core.js';

/* --- Bode --- */
export function drawBode(A){
  hotReset('bd');
  const {ctx,w,h}=prep($('bdCv'));
  const narrow=w<430, L=narrow?54:66, Rp=narrow?10:14, T=12, B=32, gap=narrow?22:26;
  const H=(h-T-B-gap)/2;
  const rm={x:L,y:T,w:w-L-Rp,h:H}, rp={x:L,y:T+H+gap,w:w-L-Rp,h:H};
  const lgx=Math.log10(A.lo), lgh=Math.log10(A.hi);
  const X=v=>rm.x+(Math.log10(v)-lgx)/(lgh-lgx)*rm.w;

  const dB=A.mag.map(m=>20*Math.log10(Math.max(m,1e-12)));
  const phd=A.ph.map(p=>p*DEG);
  const yr=(arr,pad,lo,hi)=>{let a=Math.max(Math.min(...arr),lo),b=Math.min(Math.max(...arr),hi);
    if(b-a<pad){const c=(a+b)/2;a=c-pad/2;b=c+pad/2;}
    const m=(b-a)*0.08; return {min:a-m,max:b+m};};
  const parts = ($('bodeParts') && $('bodeParts').checked) ? bodeComponents(A) : [];
  const spanDb=[...dB.filter(isFinite)], spanPh=[...phd];
  for(const c of parts){
    if(c.db_!==null) for(const v of c.db) if(isFinite(v)) spanDb.push(v);
    for(const v of c.ph) if(isFinite(v)) spanPh.push(v);
  }
  const my=yr(spanDb,40,-160,160), py=yr(spanPh,40,-630,190);

  const panel=(r,ry,unit)=>{
    box(ctx,r);
    const Y=v=>r.y+r.h-(v-ry.min)/(ry.max-ry.min)*r.h;
    ctx.save(); clipR(ctx,r);
    ctx.strokeStyle=col('--grid'); ctx.lineWidth=1;
    for(let d=Math.floor(lgx); d<=Math.ceil(lgh); d++){
      for(let m=1;m<10;m++){
        const v=m*Math.pow(10,d); if(v<A.lo||v>A.hi) continue;
        const x=Math.round(X(v))+.5;
        ctx.globalAlpha=m===1?1:.45;
        ctx.beginPath(); ctx.moveTo(x,r.y); ctx.lineTo(x,r.y+r.h); ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
    ctx.font='10px "IBM Plex Mono",monospace'; ctx.fillStyle=col('--muted');
    ctx.textAlign='right'; ctx.textBaseline='middle';
    const tk=ry.deg? ticksFrom(ry.min,ry.max,[15,45,90,180,360])
                   : ticksFrom(ry.min,ry.max,[5,10,20,40,60,100]);
    for(const t of tk){
      const y=Math.round(Y(t))+.5;
      ctx.strokeStyle = Math.abs(t)<1e-9? col('--line') : col('--grid');
      ctx.beginPath(); ctx.moveTo(r.x,y); ctx.lineTo(r.x+r.w,y); ctx.stroke();
    }
    ctx.restore();
    ctx.font='10px "IBM Plex Mono",monospace';
    ctx.fillStyle=col('--muted');
    ctx.textAlign='right'; ctx.textBaseline='middle';
    for(const t of tk) ctx.fillText(fmt(t,4)+(ry.deg?'°':''),r.x-6,Y(t));
    ctx.save(); ctx.translate(11,r.y+r.h/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='600 10px "IBM Plex Sans Condensed",sans-serif'; ctx.fillStyle=col('--muted');
    ctx.fillText(unit,0,0); ctx.restore();
    return Y;
  };

  my.deg=false; py.deg=true;
  const Ym=panel(rm,my,'L(ω) = 20·log₁₀|G(jω)|   [dB]');
  const Yp=panel(rp,py,'φ(ω) = arg G(jω)   [stopnie]');

  // reference lines
  const ref=(r,Y,v,id)=>{ const y=Y(v);
    if(y<r.y||y>r.y+r.h) return;
    ctx.save(); ctx.setLineDash([5,4]); ctx.strokeStyle=col('--bad'); ctx.lineWidth=1.2; ctx.globalAlpha=.8;
    ctx.beginPath(); ctx.moveTo(r.x,y+.5); ctx.lineTo(r.x+r.w,y+.5); ctx.stroke(); ctx.restore();
    hotL('bd',[[r.x,y],[r.x+r.w,y]],id); };
  ref(rm,Ym,0,'bd-0db'); ref(rp,Yp,-180,'bd-180');

  // curves
  const curve=(r,Y,arr,color,id)=>{
    ctx.save(); clipR(ctx,r);
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
    let up=false; const scr=[];
    for(let i=0;i<A.w.length;i++){
      if(!isFinite(arr[i])){up=false;continue;}
      const x=X(A.w[i]), y=Y(arr[i]);
      if(!up){ctx.moveTo(x,y);up=true;} else ctx.lineTo(x,y);
      if(y>r.y-30&&y<r.y+r.h+30) scr.push([x,y]);
    }
    ctx.stroke(); ctx.restore();
    hotL('bd',scr,id);
  };
  // individual factors: thin and dashed, so the total always reads as the
  // dominant line. Identity is carried by the numbered badge at the right edge
  // and by the matching badge in the equations below -- never by colour alone.
  const partCurve=(r,Y,arr,color)=>{
    ctx.save(); clipR(ctx,r);
    ctx.strokeStyle=color; ctx.lineWidth=1.4; ctx.setLineDash([5,4]); ctx.globalAlpha=.9;
    ctx.beginPath(); let up=false;
    for(let i=0;i<A.w.length;i++){
      if(!isFinite(arr[i])){up=false;continue;}
      const x=X(A.w[i]), y=Y(arr[i]);
      if(!up){ctx.moveTo(x,y);up=true;} else ctx.lineTo(x,y);
    }
    ctx.stroke(); ctx.restore();
  };
  const badge=(r,Y,arr,color,txt,used)=>{
    let y=Y(arr[arr.length-1]);
    if(!isFinite(y)) return;
    y=Math.max(r.y+9, Math.min(r.y+r.h-9, y));
    while(used.some(v=>Math.abs(v-y)<15)) y+=15;
    if(y>r.y+r.h-9) return;
    used.push(y);
    const x=r.x+r.w-11;
    ctx.save();
    ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,8,0,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='600 10px "IBM Plex Sans Condensed",sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt,x,y+.5);
    ctx.restore();
  };
  const cssCol=c=>col(c.replace('var(','').replace(')',''));
  for(const c of parts){
    if(c.db_!==null) partCurve(rm,Ym,c.db,cssCol(c.color));
    partCurve(rp,Yp,c.ph,cssCol(c.color));
  }
  curve(rm,Ym,dB,col('--accent'),'bd-mag');
  curve(rp,Yp,phd,col('--amber'),'bd-pha');
  const usedM=[], usedP=[];
  for(const c of parts){
    if(c.db_!==null) badge(rm,Ym,c.db,cssCol(c.color),String(c.i),usedM);
    badge(rp,Yp,c.ph,cssCol(c.color),String(c.i),usedP);
  }
  renderBodeTerms(parts);

  // vertical markers
  const vline=(ww,label,color,id)=>{
    if(!ww||ww<A.lo||ww>A.hi) return;
    const x=Math.round(X(ww))+.5;
    ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=1.2; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(x,rm.y); ctx.lineTo(x,rp.y+rp.h); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=color; ctx.font='600 10px "IBM Plex Sans Condensed",sans-serif';
    ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(label,x+4,rm.y+3);
    ctx.restore();
    hotL('bd',[[x,rm.y],[x,rp.y+rp.h]],id);
  };
  vline(A.wc,'ω_c '+fmt(A.wc),col('--accent'),'wc');
  vline(A.w180,'ω_180 '+fmt(A.w180),col('--bad'),'w180');

  // corner frequencies, i.e. reciprocals of the time constants
  ctx.save(); clipR(ctx,rm);
  for(const c of A.corners){
    if(c.w<A.lo||c.w>A.hi) continue;
    const x=X(c.w), y=rm.y+rm.h;
    ctx.fillStyle=c.kind==='p'? col('--muted') : col('--good');
    ctx.beginPath(); ctx.moveTo(x,y-1); ctx.lineTo(x-4,y+6); ctx.lineTo(x+4,y+6); ctx.closePath(); ctx.fill();
    hotP('bd',x,y+2,'bd-corner',c,9);
  }
  ctx.restore();

  // phase margin as a vertical segment at w_c
  if(A.wc && A.pm!==null){
    const x=X(A.wc), y1=Yp(-180), y2=Yp(-180+A.pm);
    ctx.save(); clipR(ctx,rp); ctx.strokeStyle=col('--good'); ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x,y2); ctx.stroke();
    ctx.fillStyle=col('--good'); ctx.font='600 10px "IBM Plex Sans Condensed",sans-serif';
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('PM '+fmt(A.pm)+'°',x+5,(y1+y2)/2);
    ctx.restore();
    hotL('bd',[[x,y1],[x,y2]],'pm');
  }
  // gain margin as a vertical segment at w_180
  if(A.w180 && isFinite(A.gm)){
    const x=X(A.w180), y1=Ym(0), y2=Ym(-20*Math.log10(A.gm));
    ctx.save(); clipR(ctx,rm); ctx.strokeStyle=col('--good'); ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x,y2); ctx.stroke();
    ctx.fillStyle=col('--good'); ctx.font='600 10px "IBM Plex Sans Condensed",sans-serif';
    ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('GM '+fmt(20*Math.log10(A.gm))+' dB',x+5,(y1+y2)/2);
    ctx.restore();
    hotL('bd',[[x,y1],[x,y2]],'gm');
  }

  // frequency axis
  ctx.fillStyle=col('--muted'); ctx.font='10px "IBM Plex Mono",monospace';
  ctx.textAlign='center'; ctx.textBaseline='top';
  for(let d=Math.ceil(lgx); d<=Math.floor(lgh); d++){
    const v=Math.pow(10,d);
    ctx.fillText(d===0?'1':('10'+sup(d)), X(v), rp.y+rp.h+6);
  }
  ctx.font='600 10px "IBM Plex Sans Condensed",sans-serif';
  ctx.textAlign='right'; ctx.fillText('ω  [rad/s]', rp.x+rp.w, rp.y+rp.h+19);

  const minPhase = A.zeros.every(z=>z.re<=1e-9) && S.Td===0;
  $('bdNote').innerHTML =
    (A.P===0 && minPhase
      ? `Układ otwarty stabilny (P = 0) i minimalnofazowy — uproszczone kryterium Bodego wolno stosować: `
        + (A.pm===null? 'charakterystyka nie przecina 0 dB, więc ω<sub>c</sub> nie istnieje.'
           : `PM = ${fmt(A.pm)}° ${A.pm>0?'> 0 ⇒ układ zamknięty stabilny.':'≤ 0 ⇒ układ zamknięty niestabilny.'}`)
      : `<b>Uwaga:</b> P = ${A.P}${minPhase?'':' i układ nie jest minimalnofazowy (zero w prawej półpłaszczyźnie lub opóźnienie)'} — uproszczone kryterium Bodego <b>nie obowiązuje</b>. Wiążąca jest liczba okrążeń z hodografu: Z = ${A.Z}.`);
}
/* Both sums written out, each term tagged with the same numbered badge and
   colour as its curve, so a line on the plot maps to a term in the equation. */

function renderBodeTerms(parts){
  const box=$('bodeTerms'); if(!box) return;
  if(!parts.length){ box.innerHTML=''; return; }
  const chip=(c,txt)=>`<span class="bterm" style="--bc:${c.color}">`
    + (c.op? `<span class="op">${c.op}</span>`:'')
    + `<span class="idx">${c.i}</span>${esc(txt)}</span>`;
  const dbTerms=parts.filter(c=>c.db_!==null).map(c=>chip(c,c.db_)).join('');
  const argTerms=parts.map(c=>chip(c,c.arg_)).join('');
  box.innerHTML =
      `<div class="bterm-row"><span class="lhs">20·log₁₀|G(jω)| [dB] =</span>${dbTerms}</div>`
    + `<div class="bterm-row"><span class="lhs">arg G(jω) [stopnie] =</span>${argTerms}</div>`
    + `<p class="bterm-legend">Każdy składnik jest narysowany osobno linią przerywaną w swoim kolorze — tak, `
    + `jakby występował sam. Numer w kółku przy prawej krawędzi wykresu wskazuje, która krzywa `
    + `odpowiada któremu wyrażeniu. Linia ciągła to suma wszystkich składników, czyli właściwa `
    + `charakterystyka. Czynniki są sprowadzone do postaci (1 + τjω), a stałe wyciągnięte przed `
    + `nawias zebrane są w składniku k.</p>`;
}
