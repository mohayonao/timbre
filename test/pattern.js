tests = (function() {
    "use strict";
    
    timbre.utils.exports("atof","bpm2msec", "range", "random.choice", "random.shuffle");
    
    var i = 0, tests = [];
    tests.require = ["/draft/scale.js"];
    
    tests[i] = function() {
        var bpm, synth, timer, array, scale;
        var arp, pad;
        
        bpm = 138;
        array = T(shuffle(range(16)));
        scale = T("scale", "minor");
        scale.append(array);
        
        array.repeat = 3;
        
        arp = T("*", T("sin", scale, 0.4),
                     T("perc", 450).bang());
        
        pad = T("*", T("+", T("sin", T("*", 2, scale.root).kr()),
                            T("sin", T("*", 3, scale.root).kr())),
                     T("+tri", 8, 0.2),
                     T("adsr", 2500, 10000).bang());
                  
        synth = T("efx.delay", T("+", arp, pad));
        
        timer = T("interval", bpm2msec(bpm, 8), function() {
            array.bang();
            arp.args[1].bang();
        });
        
        array.onended = function() {
            scale.root.value = atof(choice(["A3","G3","F3","E3","D-3"]));
            array.reset();
            pad.args[2].bang();
        };
        
        synth.onbang = function() {
            scale.scale = (scale.scale === "major") ? "minor" : "major";
            shuffle(array.value);
        };
        synth.onplay = function() {
            timer.on();
        };
        synth.onpause = function() {
            timer.off();
        };
        
        return synth;
    }; tests[i++].desc = "scale";
    
    return tests;
}());
