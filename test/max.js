tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/max.js"];
    
    tests[i] = function() {
        return T("max", T("sin", 440), T("sin", 360));
    }; tests[i++].desc = "max";
    
    return tests;
}());
