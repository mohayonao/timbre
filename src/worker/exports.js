/**
 * worker/exports
 */
"use strict";

var timbre = require("../timbre");
var worker = {};
// __BEGIN__

worker.onmessage = function(e) {
    var func = worker.actions[e.data.action];
    if (func !== undefined) func(e.data);
};

timbre.platform = "web";
timbre.context  = worker;

// __END__
