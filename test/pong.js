tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/pong.js"];

    tests[i] = function() {
        var osc = T("sin", 880, 1.85);
        var synth = T("pong", 2, osc);
        
        synth.$listener = T("rec", timbre.utils.hz2msec(880)*4).listen(synth).off();
        synth.$view = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "pong";
    
    return tests;
}());
