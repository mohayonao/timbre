tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("efx.chorus", T("saw", 1340));
    }; tests[i++].desc = "efx.chorus";
    
    tests[i] = function() {
        var audio = T("audio", "/public/audio/sample.ogg", true);
        return T("efx.chorus", audio.load());
    }; tests[i++].desc = "efx.chorus";
    
    return tests;
}());
