import { $ } from './dom.js';
import { fmt, sub, sup } from './format.js';
import { K, S } from './model.js';

/* ===================== transfer-function panel ===================== */
function factorText(list){
  const out=[];
  list.forEach((it,i)=>{
    if(!it.on) return;
    if(Math.abs(it.im)>1e-12){
      const b=-2*it.re, c=it.re*it.re+it.im*it.im;
      out.push(`(s² ${b<0?'−':'+'} ${fmt(Math.abs(b))}s ${c<0?'−':'+'} ${fmt(Math.abs(c))})`);
    } else {
      const a=-it.re;
      out.push(a===0? '(s)' : `(s ${a<0?'−':'+'} ${fmt(Math.abs(a))})`);
    }
  });
  return out;
}

export function renderTF(A){
  const zi=S.items.filter(x=>x.kind==='z'), pi=S.items.filter(x=>x.kind==='p');
  const zt=factorText(zi), pt=factorText(pi);
  const lead=[];
  lead.push(fmt(K()));
  if(S.Td>0) lead.push(`e^(−${fmt(S.Td)}s)`);
  const num=(zt.length? zt.join('') : '1');
  const den=(S.nu>0? (S.nu===1?'s':'s'+sup(S.nu)) : '') + (pt.length? pt.join('') : (S.nu>0?'':'1'));
  $('tfBox').innerHTML =
    `<span class="lead">G<sub>o</sub>(s) = ${lead.join(' · ')} ·</span>`
    + `<span class="stack"><span>${num}</span><span>${den||'1'}</span></span>`;

  $('factBox').innerHTML = [
    ['K', fmt(K()), 'K'],
    ['T<sub>d</sub>', fmt(S.Td)+' s', 'Td'],
    ['ν', String(S.nu), 'nu'],
    ['l<sub>z</sub> / l<sub>p</sub>', `${A.zeros.length} / ${A.poles.length+S.nu}`, 'lzlp'],
    ['P', String(A.P), 'P'],
    ['Z', String(A.Z), 'Z'],
  ].map(([a,b,id])=>`<div class="fact" data-ex="${id}" tabindex="0" role="button"><b>${b}</b><span>${a}</span></div>`).join('');

  $('verdictBox').innerHTML = A.Z===0
    ? `<span class="verdict ok" data-ex="verdict" tabindex="0" role="button">Układ zamknięty stabilny · Z = 0</span>`
    : `<span class="verdict no" data-ex="verdict" tabindex="0" role="button">Niestabilny · Z = ${A.Z} ${A.Z===1?'biegun':'bieguny/biegunów'} w prawej półpłaszczyźnie</span>`;

  const gmdb = isFinite(A.gm)? fmt(20*Math.log10(A.gm))+' dB' : '∞';
  const rows=[
    ['ω<sub>c</sub>', A.wc? fmt(A.wc)+' rad/s':'brak', 'wc'],
    ['zapas fazy PM', A.pm===null? '—' : fmt(A.pm)+'°', 'pm'],
    ['ω<sub>180</sub>', A.w180? fmt(A.w180)+' rad/s':'brak', 'w180'],
    ['zapas wzm. GM', isFinite(A.gm)? fmt(A.gm):'∞', 'gm'],
    ['GM w dB', gmdb, 'gmdb'],
    ['przecięcie osi Re', A.reCross!==null? fmt(A.reCross):'brak', 'recross'],
    ['okrążenia N', String(A.Ncw), 'N'],
    [S.nu===0?'k<sub>p</sub> (uchyb 1/(1+k<sub>p</sub>))':'wzm. statyczne', S.nu===0? `${fmt(A.kp)} → e(∞) = ${fmt(1/(1+A.kp))}` : '∞ → e(∞) = 0', 'kp'],
  ];
  $('readout').innerHTML = rows.map(([a,b,id])=>`<div data-ex="${id}" tabindex="0" role="button"><dt>${a}</dt><dd>${b}</dd></div>`).join('');
}


/* =====================================================================
   EXPLANATION MODE: what a number means, which formula it comes from and how
   it was computed. Notation follows the course formula sheet and the lecture
   notes (omega_gc / omega_pc / M_g).
   ===================================================================== */
