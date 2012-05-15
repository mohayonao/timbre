/**
 *  timbre / JavaScript Library for Objective Sound Programming
 */
"use strict";

// __BEGIN__
var timbre = {};
timbre.VERSION    = "${VERSION}";
timbre.BUILD      = "${DATE}";
timbre.env        = "";
timbre.platform   = "";
timbre.samplerate = 44100;
timbre.channels   = 2;
timbre.cellsize   = 128;
timbre.streamsize = 1024;
timbre.verbose    = true;
timbre._sys       = timbre;
timbre._global    = {};

// __END__
global.T = global.timbre = timbre;
module.exports = timbre;
