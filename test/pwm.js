tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("pwm", 0.5, 880).set({mul:0.25});
    }; tests[i++].desc = "wpm";

    tests[i] = function() {
        return T("pwm", T("+sin", 1, 0.8, 0.15).kr(), 880).set({mul:0.25});
    }; tests[i++].desc = "pwm";
    
    return tests;
}());
