/**
 * worker/exports
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.platform = "web";
timbre._global  = worker;

// __END__
