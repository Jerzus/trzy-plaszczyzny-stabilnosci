import { ssToTF, tfToSS } from './statespace.js';
import { fullStableRanges, routhNumeric } from './routh.js';
import { bodeComponents } from './bode-terms.js';
import { analyse } from './analysis.js';
import { BD, BLOCK_TYPES, bdPath, computeG, mkBlock } from './blocks.js';
import { RLC_TOPOS } from './circuits.js';
import { $ } from './dom.js';
import { EXP_LABEL, showExp } from './explain.js';
import { fmt, fx } from './format.js';
import { K, S, adoptTF, charPolyCoeffs, polyFrom } from './model.js';
import { BSTATE, bdFromAnalysis, initBlockDrag, refreshBlock } from './panel-block.js';
import { refreshRouth } from './panel-routh.js';
import { RLC_SEL, SSM, applyRlc, renderRlcDiagram, renderRlcParams, resetOrder, setOrderButtons, setRlcTopology, syncFromTF } from './panel-ss.js';
import { renderTF } from './panel-tf.js';
import { drawBode } from './plot-bode.js';
import { EX, hotHit } from './plot-core.js';
import { drawRootLocus } from './plot-locus.js';
import { drawNyquist } from './plot-nyquist.js';
import { polymul } from './poly.js';

function renderPZ(){
  $('pzList').innerHTML='';
  S.items.forEach((it,i)=>{
    const row=document.createElement('div');
    row.className='pz-row'+(it.on?'':' off');
    row.innerHTML=
      `<label class="chk" style="justify-content:center"><input type="checkbox" ${it.on?'checked':''} data-a="on" data-i="${i}" title="włącz / wyłącz"></label>`
      +`<button class="kind" data-a="kind" data-i="${i}" title="zamień biegun ⇄ zero">${it.kind==='p'?'biegun':'zero'}</button>`
      +`<input type="number" step="0.1" value="${it.re}" data-a="re" data-i="${i}" aria-label="część rzeczywista">`
      +`<input type="number" step="0.1" value="${it.im}" data-a="im" data-i="${i}" aria-label="część urojona">`
      +`<button class="icon" data-a="del" data-i="${i}" title="usuń" aria-label="usuń">×</button>`;
    $('pzList').appendChild(row);
  });
}
$('pzList').addEventListener('input',e=>{
  const t=e.target, i=+t.dataset.i, a=t.dataset.a; if(a===undefined) return;
  if(a==='on') S.items[i].on=t.checked;
  if(a==='re') S.items[i].re=parseFloat(t.value)||0;
  if(a==='im') S.items[i].im=Math.abs(parseFloat(t.value)||0);
  if(a==='on') renderPZ();
  refresh();
});
$('pzList').addEventListener('click',e=>{
  const t=e.target.closest('button'); if(!t) return;
  const i=+t.dataset.i;
  if(t.dataset.a==='del') S.items.splice(i,1);
  if(t.dataset.a==='kind') S.items[i].kind = S.items[i].kind==='p'?'z':'p';
  renderPZ(); refresh();
});
$('addPole').onclick=()=>{S.items.push({kind:'p',re:-5,im:0,on:true}); renderPZ(); refresh();};
$('addZero').onclick=()=>{S.items.push({kind:'z',re:-3,im:0,on:true}); renderPZ(); refresh();};

const kFromSlider=v=>Math.pow(10,v/100);

const sliderFromK=k=>Math.round(100*Math.log10(k));
$('kSlider').oninput=e=>{S.Kmag=+kFromSlider(+e.target.value).toPrecision(3); refresh();};
$('kNeg').onchange=e=>{S.Kneg=e.target.checked; refresh();};
$('tdSlider').oninput=e=>{S.Td=+e.target.value/100; refresh();};
$('zoom').oninput=e=>{S.zoom=Math.pow(10,+e.target.value/100); refresh();};
$('nuSeg').onclick=e=>{
  const b=e.target.closest('button'); if(!b) return;
  S.nu=+b.dataset.nu;
  [...$('nuSeg').children].forEach(x=>x.setAttribute('aria-pressed', x===b));
  refresh();
};

const PRESETS=[
  {t:'10 / [(s+1)(s+2)]', d:'wzorzec z instrukcji — PM 55,9°, GM ∞',
   s:{Kmag:10,Kneg:false,nu:0,Td:0,items:[{kind:'p',re:-1,im:0,on:true},{kind:'p',re:-2,im:0,on:true}]}},
  {t:'10 / [s(s+1)(s+2)]', d:'ten sam obiekt z integratorem — Z = 2',
   s:{Kmag:10,Kneg:false,nu:1,Td:0,items:[{kind:'p',re:-1,im:0,on:true},{kind:'p',re:-2,im:0,on:true}]}},
  {t:'−1 / [s(s−1)]', d:'P = 1 — uproszczony Bode kłamie',
   s:{Kmag:1,Kneg:true,nu:1,Td:0,items:[{kind:'p',re:1,im:0,on:true}]}},
  {t:'2 / (s+1)³', d:'trzy inercje — faza sięga −270°',
   s:{Kmag:2,Kneg:false,nu:0,Td:0,items:[{kind:'p',re:-1,im:0,on:true},{kind:'p',re:-1,im:0,on:true},{kind:'p',re:-1,im:0,on:true}]}},
  {t:'1 / [s(s+1)] · e^(−0,5s)', d:'opóźnienie transportowe zjada zapas fazy',
   s:{Kmag:1,Kneg:false,nu:1,Td:0.5,items:[{kind:'p',re:-1,im:0,on:true}]}},
  {t:'20(s+1) / [s(s²+2s+16)]', d:'para zespolona plus zero korekcyjne',
   s:{Kmag:20,Kneg:false,nu:1,Td:0,items:[{kind:'z',re:-1,im:0,on:true},{kind:'p',re:-1,im:3.873,on:true}]}},
];
$('presets').innerHTML=PRESETS.map((p,i)=>`<button data-i="${i}">${p.t}<small>${p.d}</small></button>`).join('');
$('presets').onclick=e=>{
  const b=e.target.closest('button'); if(!b) return;
  const p=PRESETS[+b.dataset.i];
  Object.assign(S,JSON.parse(JSON.stringify(p.s)));
  syncControls(); renderPZ(); refresh();
};

function syncControls(){
  $('kSlider').value=sliderFromK(S.Kmag);
  $('kNeg').checked=S.Kneg;
  $('tdSlider').value=Math.round(S.Td*100);
  [...$('nuSeg').children].forEach(x=>x.setAttribute('aria-pressed', +x.dataset.nu===S.nu));
}

let LAST=null;

function refresh(){
  $('kOut').textContent=fmt(K());
  $('nuOut').textContent=S.nu;
  $('tdOut').textContent=fmt(S.Td)+' s';
  $('zoomOut').textContent=fmt(S.zoom,2)+'×';
  const A=analyse(); LAST=A;
  renderTF(A); drawRootLocus(A); drawNyquist(A); drawBode(A);
}

let pending=0;
new ResizeObserver(()=>{cancelAnimationFrame(pending); pending=requestAnimationFrame(refresh);}).observe(document.body);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',refresh);
new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

document.documentElement.lang='pl';

/* ---------- explanation mode: toggle, click handling, dialog ---------- */
$('bodeParts').onchange=()=>refresh();
$('explainBtn').onclick=()=>{
  EX.on=!EX.on;
  document.body.classList.toggle('explain',EX.on);
  $('explainBtn').setAttribute('aria-pressed',EX.on);
  $('expHint').hidden=!EX.on;
  refresh();
};
$('expClose').onclick=()=>$('expDlg').close();
$('expDlg').addEventListener('click',e=>{ if(e.target===$('expDlg')) $('expDlg').close(); });

document.addEventListener('click',e=>{
  if(!EX.on||!LAST) return;
  const t=e.target.closest('[data-ex]');
  if(t) showExp(t.dataset.ex, LAST);
});
document.addEventListener('keydown',e=>{
  if(!EX.on||!LAST) return;
  if(e.key!=='Enter'&&e.key!==' ') return;
  const t=e.target.closest&&e.target.closest('[data-ex]');
  if(!t) return;
  e.preventDefault(); showExp(t.dataset.ex, LAST);
});

const wireCanvas=(cv,key)=>{
  const at=e=>{ const r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
  cv.addEventListener('click',e=>{
    if(!EX.on||!LAST) return;
    const [x,y]=at(e), hit=hotHit(key,x,y);
    if(hit) showExp(hit.id, LAST, hit.d);
  });
  cv.addEventListener('mousemove',e=>{
    if(!EX.on){ cv.style.cursor=''; cv.title=''; return; }
    const [x,y]=at(e), hit=hotHit(key,x,y);
    cv.style.cursor = hit? 'pointer':'crosshair';
    cv.title = hit? (EXP_LABEL[hit.id]||'kliknij, aby zobaczyć obliczenia') : '';
  });
};
wireCanvas($('rlCv'),'rl'); wireCanvas($('nqCv'),'nq'); wireCanvas($('bdCv'),'bd');

const tgl=$('ctlToggle');
tgl.onclick=()=>{
  const open=document.body.classList.toggle('ctl-open');
  tgl.setAttribute('aria-expanded',open);
  $('ctlLabel').textContent=open?'Zamknij panel':'Sterowanie';
};

/* ---------- tabs (views) ---------- */

/* ---------- tabs (views) ---------- */
const TABS=['analiza','routh','block','ss'];

let CUR_TAB='analiza';

function setTab(name){
  if(!TABS.includes(name)) return;
  CUR_TAB=name;
  TABS.forEach(t=>{
    $('tabpanel-'+t).classList.toggle('active', t===name);
    $('tabbtn-'+t).setAttribute('aria-selected', String(t===name));
  });
  const showRail = (name==='analiza'||name==='routh');
  $('shellAnalysis').style.display = showRail? '' : 'none';
  document.body.classList.toggle('ctl-open', false);
  $('ctlToggle').style.display = showRail? '' : 'none';
  // The explanation mode only does anything on the Analysis tab, which is where
  // the clickable values and plot hotspots live. Elsewhere the button is hidden
  // and the mode switches itself off.
  const canExplain = (name==='analiza');
  $('explainBtn').style.display = canExplain? '' : 'none';
  if(EX.on){
    EX.on=false;
    document.body.classList.remove('explain');
    $('explainBtn').setAttribute('aria-pressed','false');
    $('expHint').hidden=true;
    if($('expDlg').open) $('expDlg').close();
  }
  if(name==='routh') refreshRouth(LAST || analyse());
  if(name==='block' && typeof refreshBlock==='function') refreshBlock();
  if(name==='ss' && typeof refreshSS==='function') refreshSS();
  window.scrollTo(0,0);
}
document.querySelectorAll('.tabbar button[data-tab]').forEach(b=>{
  b.addEventListener('click',()=>setTab(b.dataset.tab));
});

$('rlcTopo').innerHTML = Object.entries(RLC_TOPOS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
$('rlcTopo').value=RLC_SEL.key;
$('rlcTopo').onchange=()=>setRlcTopology($('rlcTopo').value);
renderRlcParams(); renderRlcDiagram();

$('ssOrder').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; resetOrder(+b.dataset.n); setOrderButtons(+b.dataset.n); };
$('tfNum').addEventListener('change',syncFromTF);
$('tfDen').addEventListener('change',syncFromTF);
$('ssFromAnalysis').onclick=()=>{
  const D=polyFrom('p'); let Dfull=D.slice(); for(let i=0;i<S.nu;i++) Dfull=polymul(Dfull,[1,0]);
  const N=polyFrom('z').map(v=>v*K());
  $('tfNum').value=N.map(v=>fx(v,4)).join(', ');
  $('tfDen').value=Dfull.map(v=>fx(v,4)).join(', ');
  syncFromTF();
};
$('ssApply').onclick=()=>{ if(adoptTF(SSM.tf.num, SSM.tf.den)){ renderPZ(); syncControls(); refresh(); setTab('analiza'); } };
applyRlc();

initBlockDrag();
$('bdFromAn').onclick=()=>{
  const skipped=bdFromAnalysis(); refreshBlock();
  $('bdNoteBox').textContent = (skipped.length? 'Pomini\u0119to: '+skipped.join('; ')+'. ' : '')
    + $('bdNoteBox').textContent;
};
$('addType').innerHTML = Object.entries(BLOCK_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
$('addBlkBtn').onclick=()=>{
  const where=$('addWhere').value;
  bdPath(where).push(mkBlock($('addType').value));
  if(where==='branch' && !BD.branch.on){ BD.branch.on=true; $('branchOn').checked=true; }
  if(where==='fb' && !BD.fb.on){ BD.fb.on=true; $('fbOn').checked=true; }
  BSTATE.sel={path:where, idx:bdPath(where).length-1};
  refreshBlock();
};
$('branchOn').onchange=()=>{ BD.branch.on=$('branchOn').checked; refreshBlock(); };
$('fbOn').onchange=()=>{ BD.fb.on=$('fbOn').checked; refreshBlock(); };
$('branchSign').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; BD.branch.sign=+b.dataset.v;
  [...$('branchSign').children].forEach(x=>x.setAttribute('aria-pressed', x===b)); refreshBlock(); };
$('fbSign').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; BD.fb.sign=+b.dataset.v;
  [...$('fbSign').children].forEach(x=>x.setAttribute('aria-pressed', x===b)); refreshBlock(); };
$('bdApply').onclick=()=>{
  const G=computeG();
  if(adoptTF(G.num, G.den)){ renderPZ(); syncControls(); refresh(); setTab('analiza'); }
};
refreshBlock();

renderPZ(); syncControls(); refresh();
setTab('analiza');

/* ============ self-test against the worked examples in the course notes ============ */
(function selftest(){
  const snap=JSON.stringify(S);
  const near=(a,b,t,n)=>{const ok=Math.abs(a-b)<t; console.assert(ok,`selftest ${n}: ${a} ≠ ${b}`); return ok;};
  let ok=true;
  // 10/[(s+1)(s+2)] : w_c = 2.759 ; PM = 55.9 deg ; GM = inf ; Z = 0
  Object.assign(S,{Kmag:10,Kneg:false,nu:0,Td:0,items:[{kind:'p',re:-1,im:0,on:true},{kind:'p',re:-2,im:0,on:true}]});
  let A=analyse();
  ok&=near(A.wc,2.759,0.01,'wc');
  ok&=near(A.pm,55.9,0.2,'PM');
  ok&=near(A.Z,0,0.1,'Z');
  ok&=near(A.kp,5,0.01,'kp');
  // 10/[s(s+1)(s+2)] : w_180 = sqrt(2) ; Re = -1.67 ; w_c = 1.80 ; PM = -13 deg ; Z = 2
  S.nu=1; A=analyse();
  ok&=near(A.w180,Math.SQRT2,0.005,'w180');
  ok&=near(A.reCross,-1.667,0.01,'Re(w180)');
  ok&=near(A.wc,1.80,0.02,'wc astat');
  ok&=near(A.pm,-13,0.5,'PM astat');
  ok&=near(A.Z,2,0.1,'Z astat');
  // 1/[s(1-s)] = -1/[s(s-1)] : P = 1, Z = 1
  Object.assign(S,{Kmag:1,Kneg:true,nu:1,Td:0,items:[{kind:'p',re:1,im:0,on:true}]});
  A=analyse();
  ok&=near(A.P,1,0.1,'P nieminimalnofazowy');
  ok&=near(A.Z,1,0.1,'Z nieminimalnofazowy');
  Object.assign(S,JSON.parse(snap)); renderPZ(); syncControls(); refresh();
  console.log(ok? 'selftest: OK — zgodne z Dodatkiem H instrukcji' : 'selftest: BŁĄD, patrz asercje wyżej');
})();



/* Debug handle. Module scope is private, which is the point, but a console
   session (and the browser-side checks) still need a way in. */
window.ISD = { S, BD, SSM, EX, analyse, refresh, setTab, K, charPolyCoeffs,
               routhNumeric, fullStableRanges, computeG, bodeComponents,
               ssToTF, tfToSS, adoptTF, bdFromAnalysis, refreshBlock,
               renderPZ, syncControls, get LAST(){ return LAST; } };
