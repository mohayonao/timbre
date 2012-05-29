tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];

    var audio = T("audio", "/audio/sample.ogg", true).load(function() {
        console.log("loaded!");
    });
    
    tests[i] = function() {
        return T("efx.chorus", T("saw", 1340));
    }; tests[i++].desc = "efx.chorus";
    
    tests[i] = function() {
        return T("efx.chorus", audio);
    }; tests[i++].desc = "efx.chorus";
    
    return tests;
}());
