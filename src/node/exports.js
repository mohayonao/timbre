/**
 * node/exports
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.platform = "node";
timbre.global  = global;

module.exports = timbre;

// __END__
