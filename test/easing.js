tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, tri, env;
        synth = T("*", tri = T("tri" , 1340, 0.5),
                       env = T("ease", "bounce.out", 1500, 1, 0));
        
        synth.onplay = function() { env.bang(); };
        synth.onbang = function() { env.bang(); };
        env.onended = function() { synth.pause(); };
        env.delay = 1000;
        
        synth.listener = T("rec", 3000).listen(env).off();
        
        return synth;
    }; tests[i++].desc = "ease";

    tests[i] = function() {
        var synth, tri, env, func;
        
        func = function(k) { return Math.sin(k) * Math.cos(k*Math.PI*8); };
        synth = T("*", tri = T("tri" , 1340, 0.5),
                       env = T("ease", func, 2500, 1, 0));
        
        synth.onplay = function() { env.bang(); };
        synth.onbang = function() { env.bang(); };
        env.onended = function() { synth.pause(); };
        env.delay = 500;
        
        synth.listener = T("rec", 3000).listen(env).off();
        
        return synth;
    }; tests[i++].desc = "ease";

    tests[i] = function() {
        var synth, tri, env, func;
        
        func = function(k) { return Math.abs(Math.sin(24 * Math.PI * k)) * k; };
        T("ease").setFunction("myfunc", func);
        
        synth = T("*", tri = T("tri" , 1340, 0.5),
                       env = T("ease", "myfunc", 2500, 0, 1, function(x) {
                           console.log(x);
                       }));
        
        synth.onplay = function() { env.bang(); };
        synth.onbang = function() { env.bang(); };
        env.onended = function() { synth.pause(); };
        env.delay = 500;
        
        synth.listener = T("rec", 3000).listen(env).off();
        
        return synth;
    }; tests[i++].desc = "ease";
    
    
    return tests;
}());
