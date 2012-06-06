tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/scale.js"];
    
    tests[i] = function() {
        var synth, array, scale;

        array = T([0,1,2,3,4,5,6,7,8,9,10]);
        scale = T("scale", "major", 440);
        scale.append(array);

        synth = T("sin", scale, 0.5);

        synth.onbang = function() {
            array.bang();
        };
        
        return synth;
    }; tests[i++].desc = "scale";
    
    return tests;
}());
