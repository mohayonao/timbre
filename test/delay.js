tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/delay.js"];

    tests[i] = function() {
        var perc = T("perc");
        var osc = T("*", T("tri", 880), perc);
        
        var synth = T("+", osc, T("delay", 1000, osc));
        
        synth.onplay = synth.onbang = function() {
            perc.bang();
        };
        
        return synth;
    }; tests[i++].desc = "delay";
    
    return tests;
}());
