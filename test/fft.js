tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("audio", "/public/audio/sample.ogg", true).load();
    }; tests[i++].desc = "audio source";
    
    tests[i] = function() {
        var synth = T("ar");
        synth.onplay = function() {
            synth.args[0] = s[0].clone();
        };
        
        synth.$listener = T("fft", 256).listen(synth).off();
        synth.$listener.interval = 50;

        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 3000];
        
        return synth;
    }; tests[i++].desc = "fft";
    
    return tests;
}());
