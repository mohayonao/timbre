tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/delta.js"];

    
    tests[i] = function() {
        return T("delta", T("sin"));
    }; tests[i++].desc = "delta";
    
    return tests;
}());
