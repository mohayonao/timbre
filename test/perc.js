tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", tri = T("tri" , 1340, 0.5),
                       env = T("perc", 500));
        
        synth.onplay = function() { env.bang(); };
        synth.onbang = function() { env.bang(); };
        env.onended  = function() { console.log(env.currentTime); };
        
        synth.$listener = T("rec", 3000).listen(env).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc:";

    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", tri = T("tri" , 1340, 0.5),
                       env = T("perc", 500));
        
        synth.onplay = function() { env.bang(); };
        synth.onbang = function() { env.bang(); };
        env.onended  = function() { console.log(env.currentTime); };

        env.delay = 1000;
        env.a = 10;
        env.al = 0.5;
        
        synth.$listener = T("rec", 3000).listen(env).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc:";
    
    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", T("hpf", 8000, T("noise")),
                       env = T("perc", 30), 0.1)        
        
        synth.onplay = function() { env.bang(); };
        synth.onbang = function() { env.bang(); };
        
        synth.$listener = T("rec", 3000).listen(env).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc:";
    
    return tests;
}());
