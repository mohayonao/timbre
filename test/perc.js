tests = (function() {
    "use strict";
    
    var i = 0, tests = [];

    tests[i] = function() {
        var perc = T("perc");
        
        var synth = T("*", T("tri", 880), perc);
        var interval = T("interval", 1250, function() {
            perc.bang();
        });
        
        synth.onplay = function() {
            interval.on();
        };
        synth.onpause = function() {
            interval.off();
        };
        
        synth.$listener = T("rec", 3000).listen(perc).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc";
    
    tests[i] = function() {
        var perc = T("perc", 250);
        
        var synth = T("*", T("tri", 880), perc);
        var interval = T("interval", 1250, function() {
            perc.bang();
        });
        
        synth.onplay = function() {
            interval.on();
        };
        synth.onpause = function() {
            interval.off();
        };
        
        synth.$listener = T("rec", 3000).listen(perc).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc";

    tests[i] = function() {
        var perc = T("perc", 500, 250);
        
        var synth = T("*", T("tri", 880), perc);
        var interval = T("interval", 1250, function() {
            perc.bang();
        });
        
        synth.onplay = function() {
            interval.on();
        };
        synth.onpause = function() {
            interval.off();
        };
        
        synth.$listener = T("rec", 3000).listen(perc).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc";

    tests[i] = function() {
        var perc = T("perc", 100, 500, 250);
        
        var synth = T("*", T("tri", 880), perc);
        var interval = T("interval", 1250, function() {
            perc.bang();
        });
        
        synth.onplay = function() {
            interval.on();
        };
        synth.onpause = function() {
            interval.off();
        };
        
        synth.$listener = T("rec", 3000).listen(perc).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc";
    
    tests[i] = function() {
        var perc = T("perc", 100, 500, 250, 0.5);
        
        var synth = T("*", T("tri", 880), perc);
        var interval = T("interval", 1250, function() {
            perc.bang();
        });
        
        synth.onplay = function() {
            interval.on();
        };
        synth.onpause = function() {
            interval.off();
        };
        
        synth.$listener = T("rec", 3000).listen(perc).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc";

    tests[i] = function() {
        var perc = T("perc", "24db", 100, 500, 250, 0.5);
        
        var synth = T("*", T("tri", 880), perc);
        var interval = T("interval", 1250, function() {
            perc.bang();
        });
        
        synth.onplay = function() {
            interval.on();
        };
        synth.onpause = function() {
            interval.off();
        };
        
        synth.$listener = T("rec", 3000).listen(perc).off();
        synth.$view  = synth.$listener.buffer;
        
        return synth;
    }; tests[i++].desc = "perc";
    
    return tests;
}());
