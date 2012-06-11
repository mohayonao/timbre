tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/scale.js", "/draft/schedule.js"];
    
    tests[i] = function() {
        var array = T([0, [0, 0, 2, 0, 2, 3, 2,
                           0, 0, 2, 0, 2, 3, 4]]);
        var scale = T("scale", "minor", timbre.utils.atof("E2"), array);
        
        var synth = T("*", T("sinx", T("+", T("phasor", scale),
                                            T("sinx", T("phasor", T("*", 0.25, scale))))),
                           T("perc", 500).set({mul:0.5}));
        
        array.onbang = function() {
            synth.args[1].bang();
        };
        
        var schedule = T("schedule", "bpm(142, 16)", [
            [ 0, array], [ 3, array], [ 6, array], [ 8, array],
            [10, array], [12, array], [14, array], [16],
        ], true);
        
        synth.onplay = function() {
            schedule.on();
        };
        synth.onpause = function() {
            schedule.off();
        };
        
        return synth;
    }; tests[i++].desc = "+ (ar, kr)";
    
    return tests;
}());
