tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, ease;
        synth = T("tri" , ease = T("ease", "bounce.out", 1500, 1320, 440), 0.5);
        
        synth.onplay = function() { ease.bang(); };
        synth.onbang = function() { ease.bang(); };
        ease.delay = 1000;
        
        synth.$listener = T("rec", 3000).listen(ease).off();
        synth.$view  = synth.$listener.buffer;
        synth.$range = [0, 1400];
        
        return synth;
    }; tests[i++].desc = "easing";
    
    tests[i] = function() {
        var synth, ease, func;
        
        func = function(k) {
            return Math.sin(k) * Math.cos(k * Math.PI * 8);
        };
        synth = T("tri", ease = T("ease", func, 2500, 440, 880), 0.5);
        
        synth.onplay = function() { ease.bang(); };
        synth.onbang = function() { ease.bang(); };
        ease.delay = 500;
        
        synth.$listener = T("rec", 3000).listen(ease).off();
        synth.$view  = synth.$listener.buffer;
        synth.$range = [0, 1400];
        
        return synth;
    }; tests[i++].desc = "easing with the function";

    tests[i] = function() {
        var synth, ease, func, cnt = 0;
        
        func = function(k) {
            return Math.abs(Math.cos(24 * Math.PI * k)) * k;
        };
        T("ease").setFunction("myfunc", func);
        
        synth = T("*", T("tri" , 1340, 0.5),
                       ease = T("ease", "myfunc", 2500, 0, 1, function(x) {
                           cnt += 1;
                           if (cnt < 2000 && cnt % 100 === 0) console.log(x);
                       }));
        
        synth.onplay = function() { ease.bang(); };
        synth.onbang = function() { ease.bang(); };
        ease.onended = function() { console.log(this.value); }
        ease.delay = 500;
        
        return synth;
    }; tests[i++].desc = "ease with the registered function";
    
    return tests;
}());
