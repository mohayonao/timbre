tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];

    var audio = T("audio", "/audio/sample.ogg", true).load(function() {
        console.log("loaded!");
    });
    
    tests[i] = function() {
        return T("efx.chorus", audio);
    }; tests[i++].desc = "efx.chorus";
    
    tests[i] = function() {
        var synth = T("efx.chorus", audio), toggle = false;
        synth.onbang = function() {
            toggle = !toggle;
            synth.depth = (toggle) ? 0.8 : 0.4;
        };
        return synth;
    }; tests[i++].desc = "efx.chorus depth";
    
    tests[i] = function() {
        var synth = T("efx.chorus", audio), toggle = false;
        synth.onbang = function() {
            toggle = !toggle;            
            synth.rate = (toggle) ? 1 : 0.5;
        };
        return synth;
    }; tests[i++].desc = "efx.chorus rate";
    
    tests[i] = function() {
        var synth = T("efx.chorus", audio), toggle = false;
        synth.onbang = function() {
            toggle = !toggle;
            synth.wet = (toggle) ? 0.8 : 0.25;
        };
        return synth;
    }; tests[i++].desc = "efx.chorus wet";
    
    return tests;
}());
