tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth = T("fnoise");
        
        synth.$listener = T("fft", 1024, 500).listen(synth).off();
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 100000];
        
        return synth;
    }; tests[i++].desc = "fnoise";
    
    return tests;
}());
