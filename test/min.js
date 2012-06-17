tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/min.js"];
    
    tests[i] = function() {
        return T("min", T("sin", 440), T("sin", 360));
    }; tests[i++].desc = "min";
    
    return tests;
}());
