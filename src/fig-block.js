import { BD, blkLabel } from './blocks.js';
import { $ } from './dom.js';
import { SUMR, sumSym } from './fig-common.js';
import { esc } from './format.js';

export const BW=104, BH=54, BGAP=32;

export function blockSvg(sel){
  const yM=152, yB=58, yF=254;
  const xU=26, xSum1=84;
  const hasBr=BD.branch.on, hasFb=BD.fb.on;
  const xTap=hasBr? xSum1+42 : xSum1;
  const xM0=xTap+ (hasBr? 34 : 30);
  const main=BD.main, br=BD.branch.chain, fb=BD.fb.chain;

  const cx=(x0,i)=>x0+BW/2+i*(BW+BGAP);
  const mainCx=main.map((_,i)=>cx(xM0,i));
  const mainEnd=main.length? mainCx[main.length-1]+BW/2 : xM0;
  const xSum2=hasBr? mainEnd+50 : mainEnd;
  const xOut=(hasBr? xSum2 : mainEnd)+52;
  const xY=xOut+30;

  // parallel branch, stretched between the pick-off point and the output summer
  const brCx=br.map((_,i)=>cx(xTap+34,i));
  const brEnd=br.length? brCx[br.length-1]+BW/2 : xTap;
  // feedback blocks between xOut and xSum1 (signal flows right to left)
  const fbCx=fb.map((_,i)=>xOut-70-BW/2-i*(BW+BGAP));
  const fbEnd=fb.length? fbCx[fb.length-1]-BW/2 : xOut;

  const W=Math.max(xY+42, brEnd+60, 560), H=306;
  let g='';
  const wire=(d,cls)=>`<path class="w${cls?' '+cls:''}" d="${d}" marker-end="url(#ar2)"/>`;
  const plain=(d)=>`<path class="w" d="${d}"/>`;

  // --- forward path ---
  g+=`<text x="${xU}" y="${yM+5}" text-anchor="middle">u</text>`;
  g+=wire(`M ${xU+14} ${yM} L ${xSum1-17} ${yM}`);
  g+=sumSym(xSum1,yM,{l:'+', b: hasFb? (BD.fb.sign>0?'\u2212':'+') : null});
  let xprev=xSum1+SUMR;
  if(hasBr){
    g+=plain(`M ${xprev} ${yM} L ${xTap} ${yM}`);
    g+=`<circle class="node" cx="${xTap}" cy="${yM}" r="3.6"/>`;
    xprev=xTap;
  }
  main.forEach((b,i)=>{
    g+=wire(`M ${xprev} ${yM} L ${mainCx[i]-BW/2-2} ${yM}`);
    g+=blkG(b,'main',i,mainCx[i],yM,sel);
    xprev=mainCx[i]+BW/2;
  });
  if(hasBr){
    g+=wire(`M ${xprev} ${yM} L ${xSum2-SUMR-2} ${yM}`);
    g+=sumSym(xSum2,yM,{l:'+', t: BD.branch.sign>0?'+':'\u2212'});
    xprev=xSum2+SUMR;
  }
  g+=plain(`M ${xprev} ${yM} L ${xOut} ${yM}`);
  g+=`<circle class="node" cx="${xOut}" cy="${yM}" r="3.6"/>`;
  g+=wire(`M ${xOut} ${yM} L ${xY-12} ${yM}`);
  g+=`<text x="${xY+2}" y="${yM+5}">y</text>`;

  // --- parallel branch, drawn above the forward path ---
  if(hasBr){
    g+=plain(`M ${xTap} ${yM} L ${xTap} ${yB}`);
    let xb=xTap;
    br.forEach((b,i)=>{
      g+=wire(`M ${xb} ${yB} L ${brCx[i]-BW/2-2} ${yB}`);
      g+=blkG(b,'branch',i,brCx[i],yB,sel);
      xb=brCx[i]+BW/2;
    });
    g+=plain(`M ${xb} ${yB} L ${xSum2} ${yB}`);
    g+=wire(`M ${xSum2} ${yB} L ${xSum2} ${yM-SUMR-2}`);
    g+=`<text class="sm" x="${xTap+6}" y="${(yB+yM)/2}">ga\u0142\u0105\u017a r\u00f3wnoleg\u0142a</text>`;
  }

  // --- feedback path, drawn below; signal flows right to left ---
  if(hasFb){
    g+=plain(`M ${xOut} ${yM} L ${xOut} ${yF}`);
    let xf=xOut;
    fb.forEach((b,i)=>{
      g+=wire(`M ${xf} ${yF} L ${fbCx[i]+BW/2+2} ${yF}`);
      g+=blkG(b,'fb',i,fbCx[i],yF,sel);
      xf=fbCx[i]-BW/2;
    });
    g+=plain(`M ${xf} ${yF} L ${xSum1} ${yF}`);
    g+=wire(`M ${xSum1} ${yF} L ${xSum1} ${yM+SUMR+2}`);
    g+=`<text class="sm" x="${xSum1+22}" y="${yF-8}">H(s) \u2014 sprz\u0119\u017cenie ${BD.fb.sign>0?'ujemne':'dodatnie'}</text>`;
  }

  return `<svg class="fig" id="bdSvg" style="--figw:${W}px" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schemat blokowy uk\u0142adu">`
    + `<defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`
    + `<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/></marker></defs>`
    + `<g id="bdIns"></g>${g}</svg>`;
}

function blkG(b,path,i,cxv,cyv,sel){
  const [t1,t2]=blkLabel(b);
  const on=sel && sel.path===path && sel.idx===i;
  return `<g class="blk2${on?' sel':''}" data-path="${path}" data-idx="${i}" data-cx="${cxv}">`
    + `<rect class="body" x="${cxv-BW/2}" y="${cyv-BH/2}" width="${BW}" height="${BH}"/>`
    + `<text x="${cxv}" y="${cyv+(t2?-2:5)}" text-anchor="middle">${esc(t1)}</text>`
    + (t2? `<text class="sm" x="${cxv}" y="${cyv+15}" text-anchor="middle">${esc(t2)}</text>`:'')
    + `</g>`;
}

/* Block dragging. Handles pointer AND mouse events, because some environments
   only emit the latter. Listeners are delegated to the stable container so they
   do not pile up every time the SVG is re-rendered. */
