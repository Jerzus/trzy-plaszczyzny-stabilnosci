import { BD, BLOCK_TYPES, bdPath, computeG, mkBlock } from './blocks.js';
import { $ } from './dom.js';
import { BW, blockSvg } from './fig-block.js';
import { fitFig } from './fig-common.js';
import { esc, fracHtml, fx } from './format.js';
import { K, S } from './model.js';
import { box } from './plot-core.js';

export function bdFromAnalysis(){
  const chain=[]; let gain=K(); const skipped=[];
  for(let i=0;i<S.nu;i++) chain.push(mkBlock('integ'));

  for(const it of S.items.filter(x=>x.on && x.kind==='p')){
    if(Math.abs(it.im)<1e-9){
      const a=-it.re;                                   // czynnik (s + a)
      if(Math.abs(a)<1e-9){ chain.push(mkBlock('integ')); continue; }
      const b=mkBlock('inertia'); b.p.T=1/a; chain.push(b); gain/=a;
    } else {
      const wn=Math.hypot(it.re,it.im);
      const b=mkBlock('osc'); b.p.T=1/wn; b.p.z=-it.re/wn; chain.push(b); gain/=wn*wn;
    }
  }
  for(const it of S.items.filter(x=>x.on && x.kind==='z')){
    if(Math.abs(it.im)<1e-9){
      const a=-it.re;
      if(Math.abs(a)<1e-9){ chain.push(mkBlock('deriv')); continue; }
      const b=mkBlock('lead'); b.p.T=1/a; chain.push(b); gain*=a;
    } else {
      const wn=Math.hypot(it.re,it.im);
      const b=mkBlock('oscz'); b.p.T=1/wn; b.p.z=-it.re/wn; chain.push(b); gain*=wn*wn;
    }
  }
  if(S.Td>0) skipped.push('op\u00f3\u017anienie T_d = '+fx(S.Td)+' s (biblioteka blok\u00f3w nie ma cz\u0142onu e^(\u2212sT))');

  const g=mkBlock('gain'); g.p.k=+gain.toPrecision(12); chain.unshift(g);
  BD.main=chain;
  BD.branch.on=false; BD.fb.on=false;
  BSTATE.sel=null;
  return skipped;
}

/* One summing-junction symbol shared by every diagram: a fixed-radius circle
   with the signs placed next to the incoming arrows, outside the circle --
   the textbook convention, and legible at any figure size. */

/* ---------- block diagram as a draggable SVG figure ---------- */
export const BSTATE={sel:null};               // {path, idx} zaznaczonego bloku

let BDRAG=null, BD_POINTER=false;

const bdSvgEl=()=>$('bdSvg');

function bdToSvg(cx,cy){
  const svg=bdSvgEl(); if(!svg) return {x:0,y:0};
  const pt=svg.createSVGPoint(); pt.x=cx; pt.y=cy;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function bdStart(target,cx,cy){
  const gEl=target && target.closest && target.closest('g.blk2');
  if(!gEl) return;
  BDRAG={path:gEl.dataset.path, idx:+gEl.dataset.idx, el:gEl, moved:false, startX:cx, dest:undefined};
}

function bdMove(cx,cy){
  if(!BDRAG) return;
  if(!BDRAG.moved){
    if(Math.abs(cx-BDRAG.startX)<5) return;
    BDRAG.moved=true; BDRAG.el.classList.add('drag');
  }
  const svg=bdSvgEl(); if(!svg) return;
  const p=bdToSvg(cx,cy);
  const peers=[...svg.querySelectorAll('g.blk2[data-path="'+BDRAG.path+'"]')];
  let dest=peers.length;
  for(let i=0;i<peers.length;i++){ if(p.x < +peers[i].dataset.cx){ dest=i; break; } }
  BDRAG.dest=dest;
  const marker=$('bdIns');
  if(marker && peers.length){
    const last=dest>=peers.length;
    const ref=peers[last? peers.length-1 : dest];
    const x=(+ref.dataset.cx)+(last? BW/2+16 : -BW/2-16);
    const y=+ref.querySelector('rect').getAttribute('y');
    marker.innerHTML='<line class="ins" x1="'+x+'" y1="'+(y-10)+'" x2="'+x+'" y2="'+(y+BH+10)+'"/>';
  }
}

function bdEnd(){
  if(!BDRAG) return;
  const d=BDRAG; BDRAG=null;
  const marker=$('bdIns'); if(marker) marker.innerHTML='';
  d.el.classList.remove('drag');
  if(d.moved && d.dest!==undefined){
    const arr=bdPath(d.path);
    const item=arr.splice(d.idx,1)[0];
    const dest=d.dest>d.idx? d.dest-1 : d.dest;
    arr.splice(dest,0,item);
    BSTATE.sel={path:d.path, idx:dest};
  } else {
    BSTATE.sel={path:d.path, idx:d.idx};      // a click without movement means select, not reorder
  }
  refreshBlock();
}

export function initBlockDrag(){
  const host=$('bdiagView');
  host.addEventListener('pointerdown',e=>{ BD_POINTER=true; bdStart(e.target,e.clientX,e.clientY); });
  window.addEventListener('pointermove',e=>{ if(BDRAG) bdMove(e.clientX,e.clientY); });
  window.addEventListener('pointerup',()=>{ if(BDRAG) bdEnd(); });
  host.addEventListener('mousedown',e=>{ if(BD_POINTER) return; bdStart(e.target,e.clientX,e.clientY); });
  window.addEventListener('mousemove',e=>{ if(BDRAG && !BD_POINTER) bdMove(e.clientX,e.clientY); });
  window.addEventListener('mouseup',()=>{ if(BDRAG && !BD_POINTER) bdEnd(); });
}

function renderBdSel(){
  const box=$('bdSel');
  if(!BSTATE.sel){ box.innerHTML='<span class="empty">Kliknij blok na schemacie, \u017ceby zmieni\u0107 jego typ albo warto\u015b\u0107.</span>'; return; }
  const arr=bdPath(BSTATE.sel.path), b=arr[BSTATE.sel.idx];
  if(!b){ BSTATE.sel=null; return renderBdSel(); }
  const where={main:'\u015bcie\u017cka w prz\u00f3d', branch:'ga\u0142\u0105\u017a r\u00f3wnoleg\u0142a', fb:'sprz\u0119\u017cenie zwrotne'}[BSTATE.sel.path];
  const def=BLOCK_TYPES[b.type];
  let h=`<span class="ttl">${esc(def.label)}</span><span class="sm" style="color:var(--muted); font-size:11.5px">${where}</span>`;
  h+=`<select id="bdType">`+Object.entries(BLOCK_TYPES).map(([k,v])=>
        `<option value="${k}"${k===b.type?' selected':''}>${esc(v.label)}</option>`).join('')+`</select>`;
  h+=def.params.map(pp=>`<label style="font-size:12px; color:var(--muted)">${esc(pp.label)} <input type="number" step="${pp.step}" value="${b.p[pp.key]}" data-k="${pp.key}"></label>`).join('');
  h+=`<button class="del" id="bdDel" type="button">usu\u0144 blok</button>`;
  box.innerHTML=h;
  $('bdType').onchange=()=>{ arr[BSTATE.sel.idx]=mkBlock($('bdType').value); refreshBlock(); };
  box.querySelectorAll('input[type=number]').forEach(inp=>{
    inp.addEventListener('input',()=>{ b.p[inp.dataset.k]=parseFloat(inp.value)||0; refreshBlock(); });
  });
  $('bdDel').onclick=()=>{ arr.splice(BSTATE.sel.idx,1); BSTATE.sel=null; refreshBlock(); };
}

export function refreshBlock(){
  $('bdiagView').innerHTML = blockSvg(BSTATE.sel);
  fitFig($('bdiagView'));
  renderBdSel();
  const G=computeG();
  $('bdTfBox').innerHTML = fracHtml(G.num, G.den, 'G(s) = ');
  const trimmed=G.den.slice(); while(trimmed.length>1 && Math.abs(trimmed[0])<1e-12) trimmed.shift();
  $('bdNoteBox').textContent = trimmed.length<=1
    ? 'Mianownik sta\u0142y \u2014 dodaj blok ca\u0142kuj\u0105cy albo inercj\u0119, \u017ceby uk\u0142ad mia\u0142 bieguny.'
    : 'Rz\u0105d mianownika: '+(trimmed.length-1)+'. \u201eZastosuj do analizy\u201d przenosi bieguny, zera i K do kart Analiza oraz Routh\u2013Hurwitz.';
}


/* =====================================================================
   STATE SPACE <-> TRANSFER FUNCTION (SISO) plus simple RLC circuits.
   TF -> SS: controllable canonical (companion) form.
   SS -> TF: Faddeev-LeVerrier, which yields the characteristic polynomial
   and the numerator together using only matrix add/multiply.
   ===================================================================== */
