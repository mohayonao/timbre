tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];

    var audio = T("audio", "/audio/sample.ogg").load(function() {
        console.log("loaded!");
    });
    
    tests[i] = function() {
        var synth, env;
            
        synth = audio;
        
        return synth;
    }; tests[i++].desc = "audio";
    
    return tests;
}());
