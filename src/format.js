import { $ } from './dom.js';

/* ---------- Routh tab rendering ---------- */
export function fmtK(v){ return isFinite(v)? fx(v) : (v>0?'+\u221e':'\u2212\u221e'); }

export function polyToHtml(c,label,v0){
  const n=c.length-1, parts=[], x=v0||'s';
  c.forEach((v,i)=>{
    if(Math.abs(v)<1e-12 && n>0) return;
    const pw=n-i, sgn = parts.length? (v<0?' \u2212 ':' + ') : (v<0?'\u2212':'');
    const av=fx(Math.abs(v));
    const one = Math.abs(Math.abs(v)-1)<1e-9;   // znak jest juz w sgn, wiec |v| = 1 -> sam symbol
    const term = pw===0? av : (pw===1? (one?x:av+x) : (one?x+sup(pw):av+x+sup(pw)));
    parts.push(sgn+term);
  });
  return (label?label+' = ':'')+(parts.join('')||'0');
}

export function fracHtml(numDesc,denDesc,leadLabel,v0){
  const numS = polyToHtml(numDesc,'',v0) || '0';
  const denS = polyToHtml(denDesc,'',v0) || '1';
  return `<span class="lead">${esc(leadLabel)}</span><span class="stack"><span>${esc(numS)}</span><span>${esc(denS)}</span></span>`;
}

/* Push a computed G(s)=N(s)/D(s) into the K / nu / poles-zeros representation
   that the Analysis and Routh-Hurwitz tabs consume. */

export function fmt(v,d=3){
  if(v===null||v===undefined||typeof v!=='number'||Number.isNaN(v)) return '—';
  if(v===Infinity) return '∞'; if(v===-Infinity) return '−∞';
  if(!isFinite(v)) return '—';
  const a=Math.abs(v);
  if(a>0 && (a<1e-3||a>=1e5)) return v.toExponential(1).replace('.',',').replace('e','·10^');
  const s=(+v.toPrecision(d)).toString();
  return s.replace('-','−').replace('.',',');
}

export const sup=d=>String(d).replace('-','⁻').replace(/[0-9]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);

export const sub=d=>String(d).replace('-','₋').replace(/[0-9]/g,c=>'₀₁₂₃₄₅₆₇₈₉'[+c]);

/* ===================== transfer-function panel ===================== */

export const sgn = v => v<0 ? '\u2212' : '+';

export const fx = (v,d) => fmt(v,d||4);

/* label for a factor (jw - r), written the way it is on the exercise sheets */

export const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export const rowsHtml = rows => rows.map(r=>'<span>'+esc(pad(r[0],34))+' = '+esc(r[1])+'</span>').join('');

export function pad(t,n){ return t.length>=n? t : t+' '.repeat(n-t.length); }

/* second-order metrics for a closed-loop pole pair, per the formula sheet */
