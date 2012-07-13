tests = (function() {
    "use strict";
    
    var i = 0, tests = [];

    var rec;
    tests[i] = function() {
        return rec = T("rec", 2500, function() {
            console.log("rec done");
        });
    }; tests[i++].desc = "rec";
    
    tests[i] = function() {
        var synth = T("*", T("sin", 880), T("+saw", 2).ar());
        
        var dt;
        var timer = T("interval", timbre.utils.bpm2msec(160, 16), function() {
            synth.args[0].freq.value = (Math.random() * 1500) + 330;
        });
        
        synth.onplay = function() {
            rec.listen(synth).on();
            timer.on();
        };
        synth.onpause = function() {
            rec.off();
            timer.off();
        };
        
        return synth;
    }; tests[i++].desc = "source";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = T("buffer", rec.buffer, true);
        };
        return synth;
    }; tests[i++].desc = "buffer from rec";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = T("buffer", rec.buffer, true).set("reversed", true);
        };
        return synth;
    }; tests[i++].desc = "reversed buffer from rec";
    
    return tests;
}());
