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

/* ---------- block diagram as a draggable SVG figure ---------- */
