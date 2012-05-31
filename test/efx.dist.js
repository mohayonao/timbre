tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var audio = T("audio", "/public/audio/sample.ogg", true);
        return T("efx.dist", audio.load());
    }; tests[i++].desc = "efx.dist";
    
    return tests;
}());
