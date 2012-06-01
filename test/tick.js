tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var t, synth, env;
        
        t = T("tick", function() {
            console.log(t.count);
        });
        
        synth = T("*", T("tri" , 1340, 0.5),
                  env = T("perc", 450, function() {
                      synth.pause();
                  }));
        
        synth.onplay  = function() { env.bang(); t.on(); };
        synth.onpause = function() { t.off(); };
        
        return synth;
    }; tests[i++].desc = "tick";
    
    return tests;
}());
