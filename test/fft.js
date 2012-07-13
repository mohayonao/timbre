tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("audio", "/public/audio/sample.ogg", true).load();
    }; tests[i++].desc = "audio source";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].clone();
        };
        
        synth.$listener = T("fft", 256).listen(synth).off();
        synth.$listener.window = "Tukery(0.25)";
        synth.$listener.interval = 50;
        
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 3000];
        
        return synth;
    }; tests[i++].desc = "fft";

    tests[i] = function() {
        var synth = T("+");

        var fft = new timbre.utils.FFT(512);
        fft.setWindow("Blackman", 0.25);
        
        synth.$view = fft._window;
        synth.$range = [0, 1];
        
        return synth;
    }; tests[i++].desc = "fft";
    
    return tests;
}());
