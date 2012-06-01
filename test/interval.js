tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var t, synth, env;

        t = T("interval", 1000, function() {
            console.log(t.count, t.currentTime);
            env.bang();
        });
        
        synth = T("*", T("tri" , 1340, 0.5),
                       env = T("perc", 450));
        
        synth.onplay  = function() { t.on() ; };
        synth.onpause = function() { t.off(); };
        synth.onbang  = function() { t.bang(); };
        
        return synth;
    }; tests[i++].desc = "interval";
    
    return tests;
}());
