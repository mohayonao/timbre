tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var t, synth, env;
        
        t = T("metro", 120, 8, function() {
            console.log(t.measure, t.beat, t.currentTime);
            env.bang();
        });
        t.shuffle = 0.75;
        
        synth = T("*", T("tri" , 1340, 0.5),
                       env = T("perc", 250));
        
        synth.onplay  = function() { t.on() ; };
        synth.onpause = function() { t.off(); };
        synth.onbang  = function() { t.bang(); };
        
        return synth;
    }; tests[i++].desc = "metro";
    
    return tests;
}());
