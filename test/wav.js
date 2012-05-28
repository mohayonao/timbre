tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];

    var wav = T("wav", "/audio/sample.wav").load(function() {
        console.log("loaded!");
    });
    
    tests[i] = function() {
        var synth, env;
            
        synth = wav;
        
        // synth.onplay  = synth.onon   = function() { t.on() ; };
        // synth.onpause = synth.onoff  = function() { t.off(); };
        // synth.onbang  = function() { wav.bang(); };
        
        return synth;
    }; tests[i++].desc = "wav";
    
    return tests;
}());
