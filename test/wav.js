tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth;
        synth = T("wav", "/audio/amen.wav", true);
        synth.onerror = function(res) {
            console.log("error", res);
        };
        synth.onloadend = function(res) {
            console.log("loadend", res);
        };
        return synth.load();
    }; tests[i++].desc = "wav";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].slice(500, 1500);
        };
        return synth;
    }; tests[i++].desc = "wav#slice()";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].clone().set("reversed", true);
        };
        return synth;
    }; tests[i++].desc = "reversed wav";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].slice(2500, 1500);
        };
        return synth;
    }; tests[i++].desc = "reversed slice";
    
    return tests;
}());
