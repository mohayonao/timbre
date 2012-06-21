tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("pwm", 0.5, 880).set({mul:0.25});
    }; tests[i++].desc = "pwm";

    tests[i] = function() {
        return T("pwm", T("+sin", 1, 0.8, 0.15).kr(), 880).set({mul:0.25});
    }; tests[i++].desc = "pwm";

    tests[i] = function() {
        var synth = T("pwm", 0.05);
        
        synth.$listener = T("fft", 1024, 100).listen(synth).off();
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 50000];
        
        return synth;
    }; tests[i++].desc = "pwm 5%: fft";
    
    return tests;
}());
