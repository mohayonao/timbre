tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        return T("clip", -0.5, +0.5, T("sin", 440));
    }; tests[i++].desc = "clip";

    tests[i] = function() {
        var e, synth = T("rlpf", 20, 0.6, T("clip", T("*", T("tri", 40, 16),
                                                           e = T("perc", 200))).set({mul:0.35}));
        
        var t = T("interval", 500, e);
        synth.onplay  = function() { t.on() ; }
        synth.onpause = function() { t.off(); }

        synth.$listener = T("rec", 5000).listen(synth).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "clip";
    
    return tests;
}());
