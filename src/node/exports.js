/**
 * node/exports
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.platform = "node";
timbre._global  = global;

module.exports = timbre;

// __END__
