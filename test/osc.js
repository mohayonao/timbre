tests = (function() {
    "use strict";
    
    var i = 0, tests = [];

    tests[i] = function() {
        return T("osc", "sin", 880, 0.5, -0.5);
    }; tests[i++].desc = "constructor: wave, freq, mul, add";
    
    tests[i] = function() {
        return T("osc", "sin", 220, 0.5).kr();
    }; tests[i++].desc = "kr() switch control rate";
    
    tests[i] = function() {
        var wavefunc = function(x) { return x < 0.2 ? -1 : + 1; };
        return T("osc", wavefunc, 660, 0.5);
    }; tests[i++].desc = "assgin a function to the 1st argument";
    
    tests[i] = function() {
        var wavearray = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
        return T("osc", wavearray, 440, 0.5);
    }; tests[i++].desc = "assgin a Float32Array to the 1st argument";
    
    tests[i] = function() {
        return T("osc", 440, 0.25).set("wave", "pulse");
    }; tests[i++].desc = "abbr arguments";
    
    tests[i] = function() {
        var mod = T("osc", "sin", 8, 40, 880).kr();
        return T("osc", mod, 0.25).set("wave", "pulse");
    }; tests[i++].desc = "modulation";

    tests[i] = function() {
        return T("fami", 880, 0.5, -0.5);
    }; tests[i++].desc = 'alias: T("fami", ...) is T("osc", "fami", ...)';
    
    tests[i] = function() {
        return T("konami", 660, 0.5, -0.5);
    }; tests[i++].desc = 'alias: T("konami", ...) is T("osc", "konami", ...)';
    
    tests[i] = function() {
        T("osc").setWavetable("random", function() {
            return Math.random() - 0.5;
        });
        return T("osc", "random", 440);
    }; tests[i++].desc = "set wavetable";
    
    tests[i] = function() {
        var tone = timbre.utils.wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
        return T("osc", tone, 440);
    }; tests[i++].desc = 'utils.wavb() define wavetable';


    tests[i] = function() {
        var synth = T("sin");
        
        synth.$listener = T("fft", 1024, 500).listen(synth).off();
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 50000];
        
        return synth;
    }; tests[i++].desc = "sin: fft";
    
    tests[i] = function() {
        var synth = T("tri");
        
        synth.$listener = T("fft", 1024, 500).listen(synth).off();
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 50000];
        
        return synth;
    }; tests[i++].desc = "tri: fft";
    
    tests[i] = function() {
        var synth = T("saw");
        
        synth.$listener = T("fft", 1024, 500).listen(synth).off();
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 50000];
        
        return synth;
    }; tests[i++].desc = "saw: fft";

    tests[i] = function() {
        var synth = T("pulse");
        
        synth.$listener = T("fft", 1024, 500).listen(synth).off();
        synth.$view = synth.$listener.spectrum;
        synth.$range = [0, 50000];
        
        return synth;
    }; tests[i++].desc = "pulse: fft";
    
    return tests;
}());
