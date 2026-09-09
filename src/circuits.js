import { C } from './complex.js';

export const RLC_TOPOS={
  rlc_c:{group:'Obwody elektryczne', kind:'rlc', label:'Szeregowy RLC \u2014 wyj\u015bcie na C (dolnoprzepustowy II rz.)',
    series:['R','L'], shunt:['C'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[0,1/Cv],[-1/L,-R/L]], B:[0,1/L], C:[1,0], D:0}),
    eq:'G(s) = 1 / (LCs\u00b2 + RCs + 1)'},
  rlc_r:{group:'Obwody elektryczne', kind:'rlc', label:'Szeregowy RLC \u2014 wyj\u015bcie na R (pasmowoprzepustowy)',
    series:['L','C'], shunt:['R'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[0,1/Cv],[-1/L,-R/L]], B:[0,1/L], C:[0,R], D:0}),
    eq:'G(s) = RCs / (LCs\u00b2 + RCs + 1)'},
  rlc_l:{group:'Obwody elektryczne', kind:'rlc', label:'Szeregowy RLC \u2014 wyj\u015bcie na L (g\u00f3rnoprzepustowy II rz.)',
    series:['R','C'], shunt:['L'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[0,1/Cv],[-1/L,-R/L]], B:[0,1/L], C:[-1,-R], D:1}),
    eq:'G(s) = LCs\u00b2 / (LCs\u00b2 + RCs + 1)'},
  l_cr:{group:'Obwody elektryczne', kind:'rlc', label:'L szeregowo, C \u2225 R \u2014 przyk\u0142ad z wyk\u0142adu',
    series:['L'], shunt:['C','R'], params:['R','L','C'],
    build:(R,L,Cv)=>({A:[[-1/(R*Cv),1/Cv],[-1/L,0]], B:[0,1/L], C:[1,0], D:0}),
    eq:'G(s) = R / (RLCs\u00b2 + Ls + R)'},
  rc_lp:{group:'Obwody elektryczne', kind:'rlc', label:'RC \u2014 wyj\u015bcie na C (dolnoprzepustowy I rz.)',
    series:['R'], shunt:['C'], params:['R','C'],
    build:(R,Cv)=>({A:[[-1/(R*Cv)]], B:[1/(R*Cv)], C:[1], D:0}),
    eq:'G(s) = 1 / (RCs + 1)'},
  rc_hp:{group:'Obwody elektryczne', kind:'rlc', label:'RC \u2014 wyj\u015bcie na R (g\u00f3rnoprzepustowy I rz.)',
    series:['C'], shunt:['R'], params:['R','C'],
    build:(R,Cv)=>({A:[[-1/(R*Cv)]], B:[1/(R*Cv)], C:[-1], D:1}),
    eq:'G(s) = RCs / (RCs + 1)'},
  rl_lp:{group:'Obwody elektryczne', kind:'rlc', label:'RL \u2014 wyj\u015bcie na R (dolnoprzepustowy I rz.)',
    series:['L'], shunt:['R'], params:['R','L'],
    build:(R,L)=>({A:[[-R/L]], B:[1/L], C:[R], D:0}),
    eq:'G(s) = R / (Ls + R)'},
};


/* ------------------------------------------------------------------
   Układy mechaniczne translacyjne. Analogia siła–napięcie: m ↔ L,
   b ↔ R, 1/k ↔ C, F ↔ u, prędkość ↔ prąd. Te same równania, ta sama
   transmitancja, inne symbole na rysunku.
   ------------------------------------------------------------------ */
const MECH = {
  m_bk_x:{label:'Masa + sprężyna + tłumik — wymuszenie siłą, wyjście położenie',
    fig:{left:'wall', par:['k','b'], mass:true, in:'F', out:'x'}, params:['m','b','k'],
    build:(m,b,k)=>({A:[[0,1],[-k/m,-b/m]], B:[0,1/m], C:[1,0], D:0}),
    eq:'G(s) = X(s)/F(s) = 1 / (ms² + bs + k)',
    law:'II zasada dynamiki: m·ẍ = F − b·ẋ − k·x'},
  m_bk_v:{label:'Masa + sprężyna + tłumik — wyjście prędkość (pasmowoprzepustowy)',
    fig:{left:'wall', par:['k','b'], mass:true, in:'F', out:'v'}, params:['m','b','k'],
    build:(m,b,k)=>({A:[[0,1],[-k/m,-b/m]], B:[0,1/m], C:[0,1], D:0}),
    eq:'G(s) = V(s)/F(s) = s / (ms² + bs + k)',
    law:'to samo równanie ruchu, mierzona jest prędkość v = ẋ zamiast położenia'},
  m_b_x:{label:'Masa + tłumik, bez sprężyny — astatyzm rzędu 1',
    fig:{left:'wall', par:['b'], mass:true, in:'F', out:'x'}, params:['m','b'],
    build:(m,b)=>({A:[[0,1],[0,-b/m]], B:[0,1/m], C:[1,0], D:0}),
    eq:'G(s) = X(s)/F(s) = 1 / [s(ms + b)]',
    law:'m·ẍ = F − b·ẋ — brak sprężyny, więc położenie nie ma położenia równowagi: biegun w s = 0'},
  bk_x:{label:'Sprężyna + tłumik bez masy — człon inercyjny I rzędu',
    fig:{left:'wall', par:['k','b'], mass:false, in:'F', out:'x'}, params:['b','k'],
    build:(b,k)=>({A:[[-k/b]], B:[1/b], C:[1], D:0}),
    eq:'G(s) = X(s)/F(s) = 1 / (bs + k)',
    law:'równowaga sił w węźle bez masy: b·ẋ + k·x = F. Odpowiednik obwodu RC'},
  base_x:{label:'Zawieszenie — wymuszenie kinematyczne podstawy, wyjście położenie masy',
    fig:{left:'base', par:['k','b'], mass:true, in:'u', out:'x'}, params:['m','b','k'],
    build:(m,b,k)=>({A:[[0,1],[-k/m,-b/m]], B:[0,1], C:[k/m,b/m], D:0}),
    eq:'G(s) = X(s)/U(s) = (bs + k) / (ms² + bs + k)',
    law:'m·ẍ = k·(u − x) + b·(u̇ − ẋ) — zero w −k/b bierze się z tłumika między podstawą a masą'},
};
for(const [k,v] of Object.entries(MECH)) RLC_TOPOS[k] = Object.assign({group:'Układy mechaniczne', kind:'mech'}, v);

export const MECH_UNIT={m:'kg', b:'N·s/m', k:'N/m'};

export const RLC_DEF={R:1, L:1, C:1, m:1, b:1, k:1};

export const RLC_UNIT={R:'\u03a9', L:'H', C:'F', m:'kg', b:'N\u00b7s/m', k:'N/m'};
