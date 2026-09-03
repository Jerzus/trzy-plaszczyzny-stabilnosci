import { $ } from './dom.js';
import { SUMR, sumSym } from './fig-common.js';
import { fx, sub, sup } from './format.js';

export function simDiagram(tf){
  let den=tf.den.slice(), num=tf.num.slice();
  while(den.length>1 && Math.abs(den[0])<1e-12) den.shift();
  const n=den.length-1;
  if(n<1 || n>4) return {svg:'', note:'Schemat rysowany dla rz\u0119du 1\u20134 \u2014 zmie\u0144 mianownik.'};
  const a=den.map(v=>v/den[0]);
  if(num.length>n+1) num=num.slice(num.length-(n+1));
  while(num.length<n+1) num=[0,...num];
  const b=num.map(v=>v/den[0]);

  const yFwd=54, ySumOut=18, yInt=150, ySumIn=282, yGain=216, yGainF=100;
  const xU=26, xSum=84, xInt0=150, IW=96, IGAP=74;
  const icx=[...Array(n)].map((_,i)=>xInt0+IW/2+i*(IW+IGAP));
  const xOut=icx[n-1]+IW/2+120;
  const W=Math.max(xOut+70, 560), H=326;

  let g='';
  const wire=(d)=>`<path class="w" d="${d}" marker-end="url(#ar3)"/>`;
  const plain=(d)=>`<path class="w" d="${d}"/>`;
  const dim=(d)=>`<path class="w dim" d="${d}" marker-end="url(#ar3)"/>`;
  const gainBox=(x,y,val)=>`<rect class="comp fillbg" x="${x-25}" y="${y-15}" width="50" height="30"/>`
      +`<text x="${x}" y="${y+5}" text-anchor="middle">${fx(val,3)}</text>`;
  // Where signals JOIN there must be a summing junction, not a dot: a dot on a
  // line means one signal branching out, not addition.

  // input summing junction
  g+=`<text x="${xU}" y="${yInt+5}" text-anchor="middle">u</text>`;
  g+=wire(`M ${xU+13} ${yInt} L ${xSum-SUMR-2} ${yInt}`);
  g+=sumSym(xSum,yInt,{l:'+', b:'\u2212'});
  g+=`<text class="sig" x="${xSum+22}" y="${yInt-10}">E(s)</text>`;

  // integrator chain
  let xp=xSum+SUMR;
  for(let i=0;i<n;i++){
    g+=wire(`M ${xp} ${yInt} L ${icx[i]-IW/2-2} ${yInt}`);
    g+=`<rect class="comp fillbg" x="${icx[i]-IW/2}" y="${yInt-27}" width="${IW}" height="54" rx="3"/>`;
    g+=`<text x="${icx[i]}" y="${yInt+6}" text-anchor="middle">1/s</text>`;
    xp=icx[i]+IW/2;
    g+=`<circle class="node" cx="${xp+26}" cy="${yInt}" r="3.6"/>`;
    g+=`<text class="sm" x="${xp+30}" y="${yInt-10}">E/s${i? sup(i+1):''}</text>`;
    if(i<n-1) g+=plain(`M ${xp} ${yInt} L ${xp+26} ${yInt}`);
    else      g+=plain(`M ${xp} ${yInt} L ${xp+26} ${yInt}`);
  }

  // feedback taps: a_i from each integrator output back to the input summer
  for(let i=0;i<n;i++){
    const xn=icx[i]+IW/2+26;
    g+=plain(`M ${xn} ${yInt} L ${xn} ${yGain-15}`);
    g+=gainBox(xn, yGain, a[i+1]);
    g+=plain(`M ${xn} ${yGain+15} L ${xn} ${ySumIn-16}`);
    g+=`<text class="sm" x="${xn+30}" y="${yGain+4}">a${sub(i+1)}</text>`;
  }
  // feedback bus: signal flows leftwards, every join through a summing junction
  const fbX=[...Array(n)].map((_,i)=>icx[i]+IW/2+26).sort((u,v)=>v-u);   // od prawej
  let xfb=fbX[0];
  g+=plain(`M ${xfb} ${ySumIn-16} L ${xfb} ${ySumIn}`);                  // first tap: a plain corner, nothing to sum yet
  for(let i=1;i<fbX.length;i++){
    const x=fbX[i];
    g+=wire(`M ${xfb} ${ySumIn} L ${x+SUMR+2} ${ySumIn}`);               // from the right into the summer
    g+=wire(`M ${x} ${ySumIn-16} L ${x} ${ySumIn-SUMR-2}`);              // from above into the summer
    g+=sumSym(x, ySumIn, {r:'+', t:'+'});
    xfb=x-SUMR;
  }
  g+=plain(`M ${xfb} ${ySumIn} L ${xSum} ${ySumIn}`);
  g+=wire(`M ${xSum} ${ySumIn} L ${xSum} ${yInt+SUMR+2}`);

  // feedforward taps: b_i from each integrator output to the output summer
  const active=[];
  for(let i=0;i<n;i++){
    if(Math.abs(b[i+1])<1e-12) continue;
    const xn=icx[i]+IW/2+26;
    active.push(xn);
    g+=plain(`M ${xn} ${yInt} L ${xn} ${yGainF+15}`);
    g+=gainBox(xn, yGainF, b[i+1]);
    g+=plain(`M ${xn} ${yGainF-15} L ${xn} ${ySumOut+16}`);
    g+=`<text class="sm" x="${xn+30}" y="${yGainF+4}">b${sub(i+1)}</text>`;
  }
  // b0: direct feedthrough from E
  if(Math.abs(b[0])>1e-12){
    const xn=xSum+34;
    active.unshift(xn);
    g+=plain(`M ${xn} ${yInt-16} L ${xn} ${yGainF+15}`);
    g+=gainBox(xn, yGainF, b[0]);
    g+=plain(`M ${xn} ${yGainF-15} L ${xn} ${ySumOut+16}`);
    g+=`<text class="sm" x="${xn+30}" y="${yGainF+4}">b\u2080</text>`;
  }
  // output bus: every further join is its own summing junction
  if(active.length){
    active.sort((u,v)=>u-v);
    let xprev=active[0];
    g+=plain(`M ${xprev} ${ySumOut+16} L ${xprev} ${ySumOut}`);      // first tap: a plain corner, nothing to sum yet
    for(let i=1;i<active.length;i++){
      const x=active[i];
      g+=wire(`M ${xprev} ${ySumOut} L ${x-SUMR-2} ${ySumOut}`);     // from the left into the summer
      g+=wire(`M ${x} ${ySumOut+16} L ${x} ${ySumOut+SUMR+2}`);      // from below into the summer
      g+=sumSym(x, ySumOut, {l:'+', b:'+'});
      xprev=x+SUMR;
    }
    if(active.length===1) g+=plain(`M ${xprev} ${ySumOut} L ${xOut} ${ySumOut}`);
    else                  g+=plain(`M ${xprev} ${ySumOut} L ${xOut} ${ySumOut}`);
    g+=plain(`M ${xOut} ${ySumOut} L ${xOut} ${yInt}`);
    g+=wire(`M ${xOut} ${yInt} L ${xOut+34} ${yInt}`);
  } else {
    g+=wire(`M ${icx[n-1]+IW/2+26} ${yInt} L ${xOut+34} ${yInt}`);
  }
  g+=`<text x="${xOut+48}" y="${yInt+5}">y</text>`;

  return {svg:`<svg class="fig" style="--figw:${W}px" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schemat symulacyjny">`
    +`<defs><marker id="ar3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`
    +`<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)"/></marker></defs>${g}</svg>`,
   note:'Rz\u0105d n = '+n+'. Wsp\u00f3\u0142czynniki w blokach to a\u1d62 (w d\u00f3\u0142, do sumatora wej\u015bciowego, ze znakiem minus) oraz b\u1d62 (w g\u00f3r\u0119, do wyj\u015bcia) po sprowadzeniu mianownika do postaci monicznej. Wyj\u015bcia kolejnych integrator\u00f3w to E/s, E/s\u00b2, \u2026 \u2014 dok\u0142adnie zmienne stanu modelu poni\u017cej.'};
}

/* ---------- simple RLC circuits drawn with real component symbols ---------- */
/* A topology is: series elements along the top branch plus shunt elements on
   the right; the output y is measured across the shunt, which is how it is
   drawn in the lecture. */
