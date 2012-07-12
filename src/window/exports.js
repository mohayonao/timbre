/**
 * window/exports
 */
"use strict";

var timbre = require("../timbre");
var window = {};
// __BEGIN__

timbre.platform = "web";
timbre.context  = window;

// start message
(function() {
    var x = [];
    x.push("timbre.js "  + timbre.VERSION);
    if (timbre.env === "webkit") {
        x.push(" on WebAudioAPI");
    } else if (timbre.env === "moz") {
        x.push(" on AudioDataAPI");
    }
    console.log(x.join(""));
}());

window.timbre = window.T = timbre;

// __END__
