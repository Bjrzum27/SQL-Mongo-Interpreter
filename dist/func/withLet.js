"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.withLet=u;let n=0;function u(t,r){const e=`val${n++}`;return{$let:{vars:{[e]:t},in:r("$$"+e)}}}
