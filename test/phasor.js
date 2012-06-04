tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/phasor.js"];
    
    tests[i] = function() {
        var synth = T("phasor", 880, 0.5);
        return synth;
    }; tests[i++].desc = "Phasor";

    tests[i] = function() {
        var synth = T("phasor", T("sin", 2, 40, 880), 0.5);
        return synth;
    }; tests[i++].desc = "Phasor.freq";
    
    return tests;
}());
