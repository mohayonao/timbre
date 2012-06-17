tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/clip.js"];
    
    tests[i] = function() {
        return T("clip", -0.5, +0.5, T("sin", 440));
    }; tests[i++].desc = "clip";
    
    return tests;
}());
