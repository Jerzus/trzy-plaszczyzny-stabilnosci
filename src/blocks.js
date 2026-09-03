import { fx } from './format.js';
import { K } from './model.js';
import { kpAdd, polymul } from './poly.js';

export const BLOCK_TYPES = {
  gain:    {label:'Wzmocnienie',      short:'K',        params:[{key:'k',label:'K',def:2,step:0.1}],
            tf:pr=>({num:[pr.k], den:[1]})},
  integ:   {label:'Ca\u0142kowanie',       short:'1/s',      params:[],
            tf:()=>({num:[1], den:[1,0]})},
  inertia: {label:'Inercja',          short:'1/(Ts+1)', params:[{key:'T',label:'T',def:1,step:0.1}],
            tf:pr=>({num:[1], den:[pr.T,1]})},
  lead:    {label:'Cz\u0142on r\u00f3\u017cniczkuj\u0105cy', short:'(Ts+1)',   params:[{key:'T',label:'T',def:1,step:0.1}],
            tf:pr=>({num:[pr.T,1], den:[1]})},
  deriv:   {label:'R\u00f3\u017cniczkowanie', short:'s',        params:[],
            tf:()=>({num:[1,0], den:[1]})},
  osc:     {label:'Cz\u0142on II rz\u0119du',    short:'1/(T\u00b2s\u00b2+2\u03b6Ts+1)',
            params:[{key:'T',label:'T',def:1,step:0.05},{key:'z',label:'\u03b6',def:0.5,step:0.05}],
            tf:pr=>({num:[1], den:[pr.T*pr.T, 2*pr.z*pr.T, 1]})},
  oscz:    {label:'Czw\u00f3rnik II rz\u0119du (licznik)', short:'T\u00b2s\u00b2+2\u03b6Ts+1',
            params:[{key:'T',label:'T',def:1,step:0.05},{key:'z',label:'\u03b6',def:0.5,step:0.05}],
            tf:pr=>({num:[pr.T*pr.T, 2*pr.z*pr.T, 1], den:[1]})},
};

let BLK_ID=1;

export const mkBlock=type=>{
  const def={}; BLOCK_TYPES[type].params.forEach(pp=>def[pp.key]=pp.def);
  return {id:BLK_ID++, type, p:def};
};

export const BD={
  main:[mkBlock('gain'), mkBlock('inertia')],
  branch:{on:false, sign:1, chain:[mkBlock('gain')]},
  fb:{on:false, sign:1, chain:[mkBlock('gain')]},
};

function tfOfChain(chain){
  let num=[1], den=[1];
  for(const b of chain){
    const t=BLOCK_TYPES[b.type].tf(b.p);
    num=polymul(num,t.num); den=polymul(den,t.den);
  }
  return {num,den};
}

const fAdd=(f,g,sign)=>({num:kpAdd(polymul(f.num,g.den), polymul(g.num,f.den).map(v=>v*sign)), den:polymul(f.den,g.den)});

export function computeG(){
  let G=tfOfChain(BD.main);
  if(BD.branch.on) G=fAdd(G, tfOfChain(BD.branch.chain), BD.branch.sign);
  if(BD.fb.on){
    const H=tfOfChain(BD.fb.chain);
    const num=polymul(G.num,H.den);
    const den=kpAdd(polymul(G.den,H.den), polymul(G.num,H.num).map(v=>v*BD.fb.sign));
    G={num,den};
  }
  return G;
}

/* Decompose the Analysis tab transfer function into library blocks:
   G_o(s) = K * PROD(s-z_i) / ( s^nu * PROD(s-p_i) )
   Every factor is normalised to (Ts+1) or (T^2 s^2 + 2zT s + 1), and the
   constants pulled out along the way are collected into a single gain block. */

export const bdPath=k=> k==='main'? BD.main : (k==='branch'? BD.branch.chain : BD.fb.chain);

export function blkLabel(b){
  const t=BLOCK_TYPES[b.type];
  if(b.type==='gain')    return [ 'K', 'K = '+fx(b.p.k,3) ];
  if(b.type==='integ')   return [ '1/s', '' ];
  if(b.type==='inertia') return [ '1/(Ts+1)', 'T = '+fx(b.p.T,3) ];
  if(b.type==='deriv')   return [ 's', '' ];
  if(b.type==='osc')     return [ '1/(T\u00b2s\u00b2+2\u03b6Ts+1)', 'T = '+fx(b.p.T,3)+' , \u03b6 = '+fx(b.p.z,3) ];
  if(b.type==='oscz')    return [ 'T\u00b2s\u00b2+2\u03b6Ts+1', 'T = '+fx(b.p.T,3)+' , \u03b6 = '+fx(b.p.z,3) ];
  return [ 'Ts+1', 'T = '+fx(b.p.T,3) ];
}
