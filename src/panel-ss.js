import { RLC_DEF, RLC_TOPOS, RLC_UNIT } from './circuits.js';
import { C } from './complex.js';
import { $, col } from './dom.js';
import { rlcSchematic } from './fig-circuit.js';
import { fitFig } from './fig-common.js';
import { simDiagram } from './fig-sim.js';
import { esc, fracHtml, fx } from './format.js';
import { polymul } from './poly.js';
import { ssToTF, tfToSS } from './statespace.js';

/* ---------- panel state ---------- */
export const SSM={ A:[[0,1],[-4,-3]], B:[0,1], C:[4,0], D:0, tf:{num:[0,4], den:[1,3,4]} };

function parseNums(str){ return str.split(/[,\s]+/).filter(x=>x.length).map(Number).filter(v=>!Number.isNaN(v)); }

function renderMatrixGrid(){
  const n=SSM.A.length;
  // Each label stays glued to its own matrix, so a row that wraps on a narrow
  // screen breaks between matrices and never between "D =" and its field.
  let html='<div class="mtx-block"><div class="mtx-pair"><span class="mtx-lbl">A =</span>';
  html+=`<div class="mtx-grid" style="grid-template-columns:repeat(${n},1fr)">`;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) html+=`<input type="number" step="0.1" value="${SSM.A[i][j]}" data-m="A" data-i="${i}" data-j="${j}">`;
  html+='</div></div>';
  html+='<div class="mtx-pair"><span class="mtx-lbl">B =</span><div class="mtx-col" style="grid-template-columns:1fr">';
  for(let i=0;i<n;i++) html+=`<input type="number" step="0.1" value="${SSM.B[i]}" data-m="B" data-i="${i}">`;
  html+='</div></div></div>';
  html+='<div class="mtx-block"><div class="mtx-pair"><span class="mtx-lbl">C =</span>';
  html+=`<div class="mtx-grid" style="grid-template-columns:repeat(${n},1fr)">`;
  for(let j=0;j<n;j++) html+=`<input type="number" step="0.1" value="${SSM.C[j]}" data-m="C" data-i="0" data-j="${j}">`;
  html+='</div></div>';
  html+=`<div class="mtx-pair"><span class="mtx-lbl">D =</span><div class="mtx-scalar"><input type="number" step="0.1" value="${SSM.D}" data-m="D"></div></div>`;
  html+='</div>';
  $('ssMatrixGrid').innerHTML=html;
  $('ssMatrixGrid').querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const v=parseFloat(inp.value)||0, m=inp.dataset.m;
      if(m==='A') SSM.A[+inp.dataset.i][+inp.dataset.j]=v;
      else if(m==='B') SSM.B[+inp.dataset.i]=v;
      else if(m==='C') SSM.C[+inp.dataset.j]=v;
      else SSM.D=v;
      syncFromSS();
    });
  });
}

function syncFromSS(){
  const G=ssToTF(SSM.A, SSM.B, SSM.C, SSM.D);
  SSM.tf=G;
  $('tfNum').value = G.num.map(v=>fx(v,4)).join(', ');
  $('tfDen').value = G.den.map(v=>fx(v,4)).join(', ');
  renderSSPreview();
}

export function syncFromTF(){
  const num=parseNums($('tfNum').value), den=parseNums($('tfDen').value);
  if(!den.length || den.every(v=>Math.abs(v)<1e-12)){ $('ssNote').textContent='Mianownik nie mo\u017ce by\u0107 zerowy.'; return; }
  SSM.tf={num,den};
  const ss=tfToSS(num,den);
  if(ss){
    SSM.A=ss.A; SSM.B=ss.B; SSM.C=ss.C; SSM.D=ss.D;
    setOrderButtons(ss.A.length);
    renderMatrixGrid();
  }
  renderSSPreview();
}

function renderSSPreview(){
  $('ssTfPreview').innerHTML = fracHtml(SSM.tf.num, SSM.tf.den, 'G(s) = ');
  const sim=simDiagram(SSM.tf);
  $('simDiagram').innerHTML = sim.svg || '<p class="note" style="padding:8px 12px">'+esc(sim.note)+'</p>';
  fitFig($('simDiagram'));
  $('simNote').textContent = sim.svg? sim.note : '';
  const trimmed=SSM.tf.den.slice(); while(trimmed.length>1 && Math.abs(trimmed[0])<1e-12) trimmed.shift();
  $('ssNote').textContent = 'Rz\u0105d n = '+(trimmed.length-1)+'. Model stanowy (postać sterowalna) i transmitancja s\u0105 teraz sp\u00f3jne.';
}

export function setOrderButtons(n){
  [...$('ssOrder').children].forEach(b=>b.setAttribute('aria-pressed', String(+b.dataset.n===n)));
}

export function resetOrder(n){
  // default stable system of order n: (s+1)^n denominator, constant numerator
  let den=[1];
  for(let i=0;i<n;i++) den=polymul(den,[1,1]);
  const num=[den[den.length-1]];  // K dobrane tak, by G(0)=1
  const ss=tfToSS(num,den);
  SSM.A=ss.A; SSM.B=ss.B; SSM.C=ss.C; SSM.D=ss.D;
  SSM.tf={num,den};
  $('tfNum').value=num.map(v=>fx(v,4)).join(', ');
  $('tfDen').value=den.map(v=>fx(v,4)).join(', ');
  renderMatrixGrid(); renderSSPreview();
}


/* ---------- simulation diagram: integrator chain built from G(s) ---------- */
/* G(s) = (b0 s^n + b1 s^(n-1) + ... + bn) / (s^n + a1 s^(n-1) + ... + an)
   E = U - (a1/s + a2/s^2 + ... + an/s^n)E ,  Y = (b0 + b1/s + ... + bn/s^n)E   */

export const RLC_SEL={key:'rlc_c'};

/* one component symbol; (cx,cy) is its centre, vertical rotates it by 90 deg */

export function renderRlcParams(){
  const t=RLC_TOPOS[RLC_SEL.key];
  $('rlcParams').innerHTML = t.params.map(k=>
    `<div class="coef-chip"><span class="lbl">${k} [${RLC_UNIT[k]}]</span><input type="number" step="0.1" min="0.01" value="${RLC_DEF[k]}" data-p="${k}" style="width:64px; background:transparent; border:0; font:inherit; color:inherit"></div>`
  ).join('');
  $('rlcParams').querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input',()=>{ RLC_DEF[inp.dataset.p]=parseFloat(inp.value)||0.01; applyRlc(); });
  });
}

export function renderRlcDiagram(){
  const t=RLC_TOPOS[RLC_SEL.key];
  $('rlcDiagram').innerHTML = rlcSchematic(t, RLC_DEF);
  fitFig($('rlcDiagram'));
  $('rlcNote').innerHTML = 'Wz\u00f3r z r\u00f3wna\u0144 obwodu: <b>'+esc(t.eq)+'</b>. '
    + 'Przerywana ramka pokazuje, na czym mierzone jest wyj\u015bcie y \u2014 st\u0105d bior\u0105 si\u0119 macierze C i D poni\u017cej.';
}

export function setRlcTopology(key){ RLC_SEL.key=key; renderRlcParams(); renderRlcDiagram(); applyRlc(); }

export function applyRlc(){
  const t=RLC_TOPOS[RLC_SEL.key];
  const vals=t.params.map(k=>Math.max(1e-6,RLC_DEF[k]||1e-6));
  const ss=t.build(...vals);
  SSM.A=ss.A; SSM.B=ss.B; SSM.C=ss.C; SSM.D=ss.D;
  setOrderButtons(ss.A.length);
  renderMatrixGrid();
  syncFromSS();
}

/* ===================== frequency-domain analysis ===================== */
