tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var osc = T("sin", 880, 1.85);
        var synth = T("pong", 2, osc);
        
        var interval = timbre.utils.hz2msec(880)
        synth.$listener = T("rec", interval*4, 400).listen(synth).off();
        synth.$view = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "pong";
    
    return tests;
}());
