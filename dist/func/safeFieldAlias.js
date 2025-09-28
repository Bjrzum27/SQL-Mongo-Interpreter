"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.safeFieldAlias=a;function a(e){return(e.alias||e.name.split(".").slice(-1)[0]).replace(/[^A-Za-z0-9_]/g,"_")}
