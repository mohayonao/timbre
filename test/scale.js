tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/scale.js"];
    
    tests[i] = function() {
        var synth, array, scale;

        array = T([0,1,2,3,4,5,6,7]).bang();
        scale = T("scale", "major", 440);
        scale.append(array);

        synth = T("sin", scale, 0.5);

        synth.onbang = function() {
            array.bang();
        };
        
        return synth;
    }; tests[i++].desc = "scale";
    
    tests[i] = function() {
        var synth, array, scale, list;
        
        list = [0,2,4,5,7,9,11];
        array = T([0,1,2,3,4,5,6,7]).bang();
        scale = T("scale").set("scale", list);
        scale.append(array);
        
        synth = T("sin", scale, 0.5);
        
        array.onlooped = function() {
            list[0] -= 0.5;
            if (list[0] < -2) list[0] = 0;
        };
        
        synth.onbang = function() {
            array.bang();
        };
        
        return synth;
    }; tests[i++].desc = "scale";
    
    return tests;
}());
