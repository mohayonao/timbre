tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];

    var audio = T("audio", "/audio/sample.ogg", true).load(function() {
        console.log("loaded!");
    });
    
    tests[i] = function() {
        return T("efx.dist", audio);
    }; tests[i++].desc = "efx.dist";
    
    return tests;
}());
