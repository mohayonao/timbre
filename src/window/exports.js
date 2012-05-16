/**
 * window/exports
 */
"use strict";

var timbre = require("../timbre");
var window = {};
// __BEGIN__

timbre.platform = "web";
timbre._global  = window;

window.T = timbre;

// __END__
