/**
 * node/exports
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.platform = "node";
timbre.context  = global;

module.exports = timbre;

// __END__
