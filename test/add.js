tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth = T("+", T("sin", 440), T("sin", 660), T("sin", 880));
        synth.onbang = function() {
            (synth.isAr) ? synth.kr() : synth.ar();
        };
        return synth;
    }; tests[i++].desc = "+ (ar, kr)";
    
    return tests;
}());
