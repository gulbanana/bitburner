import * as lib from 'bs-lib.script';
var target = args[0];
var count = args[1];

lib.secLoop(target, count, function() { grow(target); });
lib.dispatch(target);