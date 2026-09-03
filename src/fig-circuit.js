import { RLC_UNIT } from './circuits.js';
import { $ } from './dom.js';
import { esc, fx } from './format.js';

/* one component symbol; (cx,cy) is its centre, vertical rotates it by 90 deg */
function compSym(kind, cx, cy, vertical, valTxt){
  const rot = vertical? ` transform="rotate(90 ${cx} ${cy})"` : '';
  let body='';
  if(kind==='R'){
    body = `<rect class="comp fillbg" x="${cx-19}" y="${cy-8}" width="38" height="16"/>`;
  } else if(kind==='L'){
    let d=`M ${cx-20} ${cy}`;
    for(let i=0;i<4;i++) d+=` a 5 5 0 0 1 10 0`;
    body = `<path class="comp" d="${d}"/><path class="comp" d="M ${cx-20} ${cy} L ${cx-20} ${cy} M ${cx+20} ${cy} L ${cx+20} ${cy}"/>`;
  } else {
    body = `<path class="comp" d="M ${cx-4} ${cy-11} L ${cx-4} ${cy+11} M ${cx+4} ${cy-11} L ${cx+4} ${cy+11}"/>`
         + `<path class="comp" d="M ${cx-20} ${cy} L ${cx-4} ${cy} M ${cx+4} ${cy} L ${cx+20} ${cy}"/>`;
  }
  const lx = vertical? cx+30 : cx;
  const ly = vertical? cy+4  : cy-20;
  const anch = vertical? 'start' : 'middle';
  return `<g${rot}>${body}</g>`
       + `<text x="${lx}" y="${ly}" text-anchor="${anch}">${kind}</text>`
       + `<text class="sm" x="${lx}" y="${ly+13}" text-anchor="${anch}">${valTxt}</text>`;
}

export function rlcSchematic(t, vals){
  const yT=52, yB=168;
  const xL=54;                                  // lewe zaciski
  const step=88;
  const sx=t.series.map((_,i)=>xL+64+i*step);   // srodki elementow szeregowych
  const xJ=(sx.length? sx[sx.length-1]+52 : xL+64);   // wezel prawy
  const shx=t.shunt.map((_,i)=>xJ+i*94);
  const xR=(shx[shx.length-1])+92;              // prawe zaciski
  const W=xR+96, H=232;

  let g='';
  // source u1 on the left
  g+=`<circle class="node" cx="${xL}" cy="${yT}" r="3.4"/><circle class="node" cx="${xL}" cy="${yB}" r="3.4"/>`;
  g+=`<path class="w" d="M ${xL} ${yT+8} L ${xL} ${yB-8}"/>`;
  g+=`<path class="w" d="M ${xL-16} ${yB-14} L ${xL-16} ${yT+14}" marker-end="url(#arw)"/>`;
  g+=`<text x="${xL-24}" y="${(yT+yB)/2+5}" text-anchor="end">u\u2081</text>`;

  // top branch: source -> series elements -> node
  let xPrev=xL;
  t.series.forEach((k,i)=>{
    g+=`<path class="w" d="M ${xPrev} ${yT} L ${sx[i]-20} ${yT}"/>`;
    g+=compSym(k, sx[i], yT, false, fx(vals[k],3)+' '+RLC_UNIT[k]);
    xPrev=sx[i]+20;
  });
  g+=`<path class="w" d="M ${xPrev} ${yT} L ${xR} ${yT}"/>`;
  // bottom branch
  g+=`<path class="w" d="M ${xL} ${yB} L ${xR} ${yB}"/>`;

  // shunt elements
  t.shunt.forEach((k,i)=>{
    const x=shx[i];
    g+=`<path class="w" d="M ${x} ${yT} L ${x} ${(yT+yB)/2-20}"/>`;
    g+=compSym(k, x, (yT+yB)/2, true, fx(vals[k],3)+' '+RLC_UNIT[k]);
    g+=`<path class="w" d="M ${x} ${(yT+yB)/2+20} L ${x} ${yB}"/>`;
    if(t.shunt.length>1 || t.series.length){
      g+=`<circle class="node" cx="${x}" cy="${yT}" r="3.2"/><circle class="node" cx="${x}" cy="${yB}" r="3.2"/>`;
    }
  });

  // measurement highlight and the u2 output terminals
  const xa=shx[0]-38, xb=shx[shx.length-1]+58;
  g+=`<rect class="tapbox" x="${xa}" y="${yT-14}" width="${xb-xa}" height="${yB-yT+28}" rx="6"/>`;
  g+=`<circle class="node" cx="${xR}" cy="${yT}" r="3.4"/><circle class="node" cx="${xR}" cy="${yB}" r="3.4"/>`;
  g+=`<path class="w" d="M ${xR+16} ${yB-14} L ${xR+16} ${yT+14}" marker-end="url(#arw)"/>`;
  g+=`<text class="sig" x="${xR+24}" y="${(yT+yB)/2+5}">u\u2082 = y</text>`;

  return `<svg class="fig" style="--figw:${W}px" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schemat obwodu ${esc(t.label)}">`
       + `<defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">`
       + `<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/></marker></defs>${g}</svg>`;
}
