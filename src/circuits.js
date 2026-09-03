import { C } from './complex.js';

export const RLC_TOPOS={
  rlc_c:{label:'Szeregowy RLC \u2014 wyj\u015bcie na C (dolnoprzepustowy II rz.)',
    series:['R','L'], shunt:['C'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[0,1/Cv],[-1/L,-R/L]], B:[0,1/L], C:[1,0], D:0}),
    eq:'G(s) = 1 / (LCs\u00b2 + RCs + 1)'},
  rlc_r:{label:'Szeregowy RLC \u2014 wyj\u015bcie na R (pasmowoprzepustowy)',
    series:['L','C'], shunt:['R'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[0,1/Cv],[-1/L,-R/L]], B:[0,1/L], C:[0,R], D:0}),
    eq:'G(s) = RCs / (LCs\u00b2 + RCs + 1)'},
  rlc_l:{label:'Szeregowy RLC \u2014 wyj\u015bcie na L (g\u00f3rnoprzepustowy II rz.)',
    series:['R','C'], shunt:['L'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[0,1/Cv],[-1/L,-R/L]], B:[0,1/L], C:[-1,-R], D:1}),
    eq:'G(s) = LCs\u00b2 / (LCs\u00b2 + RCs + 1)'},
  l_cr:{label:'L szeregowo, C \u2225 R \u2014 przyk\u0142ad z wyk\u0142adu',
    series:['L'], shunt:['C','R'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[-1/(R*Cv),1/Cv],[-1/L,0]], B:[0,1/L], C:[1,0], D:0}),
    eq:'G(s) = R / (RLCs\u00b2 + Ls + R)'},
  rc_lp:{label:'RC \u2014 wyj\u015bcie na C (dolnoprzepustowy I rz.)',
    series:['R'], shunt:['C'], params:['R','C'],
    build:(R,Cv)=>({A:[[-1/(R*Cv)]], B:[1/(R*Cv)], C:[1], D:0}),
    eq:'G(s) = 1 / (RCs + 1)'},
  rc_hp:{label:'RC \u2014 wyj\u015bcie na R (g\u00f3rnoprzepustowy I rz.)',
    series:['C'], shunt:['R'], params:['R','C'],
    build:(R,Cv)=>({A:[[-1/(R*Cv)]], B:[1/(R*Cv)], C:[-1], D:1}),
    eq:'G(s) = RCs / (RCs + 1)'},
  rl_lp:{label:'RL \u2014 wyj\u015bcie na R (dolnoprzepustowy I rz.)',
    series:['L'], shunt:['R'], params:['R','L'],
    build:(R,L)=>({A:[[-R/L]], B:[1/L], C:[R], D:0}),
    eq:'G(s) = R / (Ls + R)'},
};

export const RLC_DEF={R:1, L:1, C:1};

export const RLC_UNIT={R:'\u03a9', L:'H', C:'F'};
