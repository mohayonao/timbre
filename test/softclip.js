tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/softclip.js"];
    
    tests[i] = function() {
        return T("softclip", T("sin", 440));
    }; tests[i++].desc = "softclip";
    
    return tests;
}());
