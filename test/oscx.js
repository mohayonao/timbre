tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth = T("oscx", "tri", T("phasor", 1340), 0.5);
        return synth;
    }; tests[i++].desc = "osxc";

    tests[i] = function() {
        var synth = T("sinx", T("phasor", 1340), 0.5);
        return synth;
    }; tests[i++].desc = "sinx";
    
    
    tests[i] = function() {
        var freq = T(timbre.utils.mtof(42));
        
        var op1 = T("*", T("sinx", T("phasor", freq, 0.5)),
                         T("adsr", 500, 0, 1).set("mul", 0.3));
        var op2 = T("*", T("sinx", T("+", T("phasor", freq), op1)),
                             T("adsr", 0, 1000, 0.8));
        var op3 = T("*", T("sinx", T("+", T("phasor", freq), op2)),
                             T("adsr", 0, 500, 1));
        
        var synth = T("+", op2, op3);
        
        synth.onplay = function() {
            op1.args[1].bang();
            op2.args[1].bang();
            op3.args[1].bang();
        };
        synth.onbang = function() {
            op1.args[1].bang();
            op2.args[1].bang();
            op3.args[1].bang();
        };
        var i = 42;
        synth.args[0].args[1].onS = function() {
            op1.args[1].bang();
            op2.args[1].bang();
            op3.args[1].bang();
            i += 5;
            if (i > 64) i -= 20;
            freq.value = timbre.utils.mtof(i);
        };
        
        return synth;
    }; tests[i++].desc = "fm";
    
    return tests;
}());
