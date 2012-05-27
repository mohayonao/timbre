tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", tri = T("tri" , 1340, 0.5),
                       env = T("adsr", 500, 1000));
        
        synth.onplay = synth.onbang = function() { env.bang(); };
        synth.onoff = function() { env.off(); };
        env.onA     = function() { tri.freq = 1340; };
        env.onD     = function() { tri.freq =  880; };
        env.onS     = function() { tri.freq =  660; };
        env.onR     = function() { tri.freq =  440; };
        env.onended = function() { synth.pause(); };
        
        synth.listener = T("rec", 1500).listen(env);
        
        return synth;
    }; tests[i++].desc = "adsr: a->d->end";
    
    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", tri = T("tri" , 1340, 0.5),
                  env = T("adsr", 500, 1000, 0.5, 0));
        
        synth.onplay = synth.onbang = function() { env.bang(); };
        synth.onoff = function() { env.off(); };
        env.onA     = function() { tri.freq = 1340; };
        env.onD     = function() { tri.freq =  880; };
        env.onS     = function() { tri.freq =  660; };
        env.onR     = function() { tri.freq =  440; };
        env.onended = function() { synth.pause(); };
        
        synth.listener = T("rec", 3000).listen(env);
        
        return synth;
    }; tests[i++].desc = "adsr: a->d->end";
    
    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", tri = T("tri" , 1340, 0.5),
                  env = T("adsr", 500, 1000, 0.5, 1500));
        
        synth.onplay = synth.onbang = function() { env.bang(); };
        synth.onoff = function() { env.off(); };
        env.onA     = function() { tri.freq = 1340; };
        env.onD     = function() { tri.freq =  880; };
        env.onS     = function() { tri.freq =  660; };
        env.onR     = function() { tri.freq =  440; };
        env.onended = function() { synth.pause(); };
        
        synth.listener = T("rec", 3000).listen(env);
        
        return synth;
    }; tests[i++].desc = "adsr: a->d->end";
    
    return tests;
}());
