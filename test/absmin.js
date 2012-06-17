tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/absmin.js"];
    
    tests[i] = function() {
        return T("absmin", T("sin", 440), T("sin", 360));
    }; tests[i++].desc = "absmin";
    
    return tests;
}());
