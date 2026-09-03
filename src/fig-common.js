import { $ } from './dom.js';
import { sgn } from './format.js';

export const SUMR=15;

export function sumSym(x,y,sg){
  let o=`<circle class="sumc" cx="${x}" cy="${y}" r="${SUMR}"/>`;
  if(sg.l) o+=`<text class="sgn" x="${x-SUMR-3}" y="${y-6}" text-anchor="end">${sg.l}</text>`;
  if(sg.r) o+=`<text class="sgn" x="${x+SUMR+3}" y="${y-6}">${sg.r}</text>`;
  if(sg.t) o+=`<text class="sgn" x="${x+5}" y="${y-SUMR-4}">${sg.t}</text>`;
  if(sg.b) o+=`<text class="sgn" x="${x+5}" y="${y+SUMR+13}">${sg.b}</text>`;
  return o;
}

/* Every figure lays out on a fixed grid with rows reserved for the parallel
   branch, the feedback path and the b-taps — and most systems draw none of
   them, so the SVG is mostly empty air. Crop it to what was actually drawn.
   Needs a laid-out element: getBBox is empty while the tab panel is hidden. */
export function fitFig(box){
  const svg=box.querySelector('svg.fig');
  if(!svg) return;
  let b; try{ b=svg.getBBox(); }catch{ return; }
  if(!b.width || !b.height) return;
  const p=12, w=Math.ceil(b.width+2*p), h=Math.ceil(b.height+2*p);
  svg.setAttribute('viewBox', `${b.x-p} ${b.y-p} ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.style.setProperty('--figw', w+'px');
}
