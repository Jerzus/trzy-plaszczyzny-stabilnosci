import { $ } from './dom.js';
import { esc, fmtK, fx, polyToHtml, sup } from './format.js';
import { K, S, charPolyCoeffs } from './model.js';
import { fullStableRanges, necessaryCheck, necessaryRangeK, routhNumeric } from './routh.js';

export function refreshRouth(A){
  $('routhTdWarn').hidden = !(S.Td>0);

  const cNow = charPolyCoeffs(K());
  $('routhPolyBox').innerHTML = '<span class="lead">'+esc(polyToHtml(cNow,'D(s) + K\u00b7N(s), K='+fx(K())))+' = 0</span>';

  const nec = necessaryCheck(cNow);
  $('routhCoeffs').innerHTML = '<div class="coef-row">'+nec.items.map(it=>
    `<div class="coef-chip ${it.ok?'ok':'bad'}"><span class="lbl">s${it.pow===0?'⁰':sup(it.pow)}</span><b>${fx(it.val)}</b></div>`
  ).join('')+'</div>';
  $('routhNecVerdict').innerHTML = nec.allOk
    ? '<span class="verdict ok">warunek konieczny spe\u0142niony \u2014 stabilno\u015b\u0107 mo\u017cliwa, ale jeszcze nie potwierdzona</span>'
    : '<span class="verdict no">warunek konieczny NIE spe\u0142niony \u2014 uk\u0142ad na pewno niestabilny, dalsza tabelka jest zbyteczna</span>';

  // What the array is for: once the necessary condition fails, stability is
  // already settled, and the array only answers HOW MANY roots sit in the RHP.
  $('routhTableTitle').textContent = nec.allOk
    ? 'Tablica Routha dla bie\u017c\u0105cego K'
    : 'Tablica Routha \u2014 ile pierwiastk\u00f3w le\u017cy w prawej p\u00f3\u0142p\u0142aszczy\u017anie';
  $('routhTableRole').innerHTML = nec.allOk
    ? '<div class="role-note open">Warunek konieczny przeszed\u0142, ale to <b>za ma\u0142o</b>, \u017ceby orzec stabilno\u015b\u0107. '
      + 'Rozstrzyga dopiero liczba zmian znaku w pierwszej kolumnie poni\u017cej.</div>'
    : '<div class="role-note settled">Stabilno\u015b\u0107 zosta\u0142a ju\u017c rozstrzygni\u0119ta wy\u017cej: warunek konieczny nie jest spe\u0142niony, wi\u0119c uk\u0142ad '
      + '<b>na pewno jest niestabilny</b> \u2014 tablicy nie trzeba budowa\u0107, \u017ceby to wiedzie\u0107. '
      + 'Poni\u017cej jest ona nadal wa\u017cna i przydatna, ale odpowiada teraz na w\u0119\u017csze pytanie: '
      + '<b>ile dok\u0142adnie</b> pierwiastk\u00f3w le\u017cy w prawej p\u00f3\u0142p\u0142aszczy\u017anie. '
      + 'Kryterium Routha nie wymaga spe\u0142nienia warunku koniecznego \u2014 zliczanie zmian znaku dzia\u0142a dla dowolnych znak\u00f3w wsp\u00f3\u0142czynnik\u00f3w.</div>';

  const rt = routhNumeric(cNow);
  if(rt){
    const rows=rt.rows, W=rt.W, n=rt.n;
    let html='<table class="routh-table"><thead><tr><th></th>'+
      Array.from({length:W},(_,j)=>`<th>kol. ${j+1}</th>`).join('')+'</tr></thead><tbody>';
    let lastSign=0;
    rows.forEach((row,i)=>{
      const pw=n-i;
      const ev=rt.events.filter(e=>e.row===i);
      const isEps=ev.some(e=>e.type==='eps'), isZeroFix=ev.some(e=>e.type==='zero-row');
      html+=`<tr><td class="rowlab">s${pw===0?'⁰':sup(pw)}</td>`;
      row.forEach((v,j)=>{
        const sg = Math.abs(v)<1e-9?0:(v>0?1:-1);
        let cls='';
        if(j===0){
          cls = sg>0?'sign-pos':(sg<0?'sign-neg':'');
          if(sg!==0 && lastSign!==0 && sg!==lastSign) cls+=' sign-flip';
          if(sg!==0) lastSign=sg;
        }
        const epsHere = j===0 && isEps;
        html+=`<td class="${j===0?'piv '+cls:''}${epsHere?' eps':''}">${epsHere?'\u03b5\u2248':''}${fx(v,4)}</td>`;
      });
      html+='</tr>';
      if(isZeroFix){
        const e=ev.find(x=>x.type==='zero-row');
        const auxTxt = e.auxCoeffs.map(([pw2,cf])=>fx(cf)+'s'+(pw2===0?'':sup(pw2))).join(' + ');
        html+=`<tr><td></td><td colspan="${W}" style="text-align:left; color:var(--amber); font-family:'IBM Plex Sans',sans-serif; font-size:11.5px; white-space:normal; padding:4px 12px">wiersz zerowy \u2014 wielomian pomocniczy A(s) = ${esc(auxTxt)}, u\u017cyto jego pochodnej do kontynuacji tabeli (pierwiastki A(s) le\u017c\u0105 symetrycznie wzgl\u0119dem pocz\u0105tku uk\u0142adu)</td></tr>`;
      }
    });
    html+='</tbody></table>';
    $('routhTableBox').innerHTML=html;

    const crossOk = Math.abs(rt.Z - A.Z) < 0.5;
    $('routhVerdictBox').innerHTML =
      (rt.Z===0
        ? `<span class="verdict ok">Z = 0 \u2014 wszystkie pierwiastki w lewej p\u00f3\u0142p\u0142aszczy\u017anie, uk\u0142ad zamkni\u0119ty stabilny</span>`
        : `<span class="verdict no">Z = ${rt.Z} \u2014 tyle zmian znaku w pierwszej kolumnie, tyle pierwiastk\u00f3w w prawej p\u00f3\u0142p\u0142aszczy\u017anie</span>`)
      + `<span style="font-size:12px; color:${crossOk?'var(--muted)':'var(--bad)'}">Kontrola wzgl\u0119dem konturu Nyquista (karta Analiza): Z\u2099\u1d67\u2071 = ${A.Z} \u2014 ${crossOk?'zgodne.':'ROZBIE\u017bNO\u015a\u0106 \u2014 sprawd\u017a T_d (Pad\u00e9 zniekszta\u0142ca wielomian) albo epsilon-podstawienie w wierszu zerowym.'}</span>`;
    $('routhNote').textContent = 'Kolumny bez wpisu (puste miejsce po prawej) licz jako zera. Migaj\u0105ca strza\u0142ka przy pierwszej kolumnie oznacza zmian\u0119 znaku.';
  } else {
    $('routhTableBox').innerHTML='<p class="note">Wielomian sta\u0142y \u2014 brak dynamiki do zbadania.</p>';
    $('routhVerdictBox').innerHTML='';
  }

  // stable K intervals
  const necR = necessaryRangeK();
  $('routhRangeRole').innerHTML = nec.allOk
    ? ''
    : '<div class="role-note open">Bie\u017c\u0105ce K odpad\u0142o w warunku koniecznym, ale to <b>nie znaczy, \u017ce sekcja jest bezu\u017cyteczna</b> \u2014 '
      + 'w\u0142a\u015bnie teraz jest najbardziej przydatna: pokazuje, czy jak\u0105kolwiek warto\u015bci\u0105 wzmocnienia da si\u0119 ten uk\u0142ad ustabilizowa\u0107.</div>';
  $('routhRangeSummary').innerHTML =
    `<div><dt>warunek konieczny (szybki, niewystarczaj\u0105cy)</dt><dd>${necR.impossible? 'niespe\u0142nialny dla \u017cadnego K' : '('+fmtK(necR.lo)+' , '+fmtK(necR.hi)+')'}</dd></div>`;

  const full = fullStableRanges();
  const stable = full.filter(r=>r.Z===0);
  $('routhRangeSummary').innerHTML +=
    `<div><dt>pe\u0142ny warunek (konieczny i wystarczaj\u0105cy)</dt><dd>${stable.length? stable.map(r=>'('+fmtK(r.lo)+' , '+fmtK(r.hi)+')').join(' \u222a ') : 'brak \u2014 uk\u0142ad niestabilny dla ka\u017cdego K'}</dd></div>`;

  const allBounds=[...new Set(full.flatMap(r=>[r.lo,r.hi]).filter(isFinite))].sort((a,b)=>a-b);
  const finite = allBounds.length? allBounds : [-1,1];
  const span = Math.max(1, finite[finite.length-1]-finite[0]);
  const axLo = finite[0]-span*0.25, axHi=finite[finite.length-1]+span*0.25;
  const X = v=>{ const t=(v-axLo)/(axHi-axLo); return 4+t*92; };
  let axis = '<div class="axis-k"><div class="track"></div>';
  if(axLo<0 && axHi>0) axis += `<div class="zero" style="left:${X(0)}%"></div>`;
  stable.forEach(r=>{
    const lo = isFinite(r.lo)? X(r.lo) : 0, hi = isFinite(r.hi)? X(r.hi) : 100;
    axis += `<div class="seg" style="left:${lo}%; width:${Math.max(0.6,hi-lo)}%"></div>`;
  });
  allBounds.forEach(b=>{ axis += `<div class="pt" style="left:${X(b)}%" title="K=${fx(b)}"></div>`; });
  axis += '</div>';

  const list = full.map(r=>{
    const label = (isFinite(r.lo)?fx(r.lo):(r.lo>0?'+\u221e':'\u2212\u221e')) + ' \u2026 ' + (isFinite(r.hi)?fx(r.hi):(r.hi>0?'+\u221e':'\u2212\u221e'));
    return `<div class="rng-line ${r.Z===0?'stable':''}"><span class="k-int">K \u2208 (${label})</span>`
      + `<span class="zbadge">${r.Z===0?'stabilny, Z = 0':'niestabilny, Z = '+r.Z}</span></div>`;
  }).join('');
  $('routhIntervals').innerHTML = axis + '<div class="rng-list" style="margin-top:10px">'+(list||'<span class="note">brak punkt\u00f3w krytycznych \u2014 znak pierwszej kolumny sta\u0142y dla wszystkich K.</span>')+'</div>';
}


/* =====================================================================
   BLOCK DIAGRAM: a reorderable forward path, a parallel branch and a
   feedback path. Every block carries its own (num,den); a series connection
   multiplies polynomials, while the parallel and feedback connections use
   the standard block-algebra reduction formulas.
   ===================================================================== */
