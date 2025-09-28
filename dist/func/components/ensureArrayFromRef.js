"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ensureArrayFromRef=r;function r(e){return{$cond:[{$eq:[e,null]},[],{$cond:[{$isArray:e},e,[e]]}]}}
