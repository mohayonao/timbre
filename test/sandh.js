tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/sandh.js"];

    tests[i] = function() {
        var osc = T("saw");
        var synth = T("s&h", 2, osc);
        
        return synth;
    }; tests[i++].desc = "s&h";
    
    return tests;
}());
