tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/absmax.js"];
    
    tests[i] = function() {
        return T("absmax", T("sin", 440), T("sin", 360));
    }; tests[i++].desc = "absmax";
    
    return tests;
}());
