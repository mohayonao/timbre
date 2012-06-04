tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("phasor", 440);
    }; tests[i++].desc = "Phasor";
    
    tests[i] = function() {
        return T("phasor", T("sin", 2, 20, 660));
    }; tests[i++].desc = "Phasor.freq";
    
    tests[i] = function() {
        return T("+", T("phasor", 880), T("phasor", 880, 1.5));
    }; tests[i++].desc = "Phasor.fmul";
    
    tests[i] = function() {
        return T("+", T("phasor", 880, -10));
    }; tests[i++].desc = "Phasor.fmul";
    
    return tests;
}());
