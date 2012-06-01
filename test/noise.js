tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("noise");
    }; tests[i++].desc = "WhiteNoise";
    
    tests[i] = function() {
        return T("noise").kr();
    }; tests[i++].desc = "control-rate WhiteNoise";
    
    return tests;
}());
