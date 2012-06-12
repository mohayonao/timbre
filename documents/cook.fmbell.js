ex0 = (function() {
    timbre.utils.exports("random.choice");
    
    var synth = T("+");

    function play(f) {
        var op1, op2, op3, op4, op5, op6;
        
        op4 = T("*", T("sin", 100, 0.2),
                     T("perc", 100).bang());
        op6 = T("*", T("sin", f * 9.04, 0.05),
                     T("perc", 2500).bang());
        op5 = T("*", T("oscx", T("+", T("phasor", f * 0.99), op6), 0.1),
                     T("perc", 250).bang()) ;
        op3 = T("*", T("oscx", T("+", T("phasor", f * 1.01), op4, op5), 0.25),
                     T("perc", 2500).bang());
        op2 = T("*", T("oscx", T("phasor", f * 1.025, 0.001)),
                     T("perc", 2500).bang());
        op1 = T("*", T("oscx", T("+", T("phasor", f * 0.9998), op2), 0.08),
                     T("perc", 3500).bang());
        
        synth.append( T("+", op1, op3) );
        if (synth.args.length > 4) synth.args.shift();
    }
    
    var timer = T("interval", 800, function() {
        var m, k1, k2;
        
        k1 = choice([-1,0,0,3,3,3,7,7,8,9]);
        k2 = choice([-1,-1,-1,3,3,5,7,8,10,11]);
        
        if (k1 !== -1) {
            if (k2 === -1) {
                m  = k1 + 57 - 12;
                play(timbre.utils.mtof(m + 0));
            } else {
                m  = k1 + 57;
                play(timbre.utils.mtof(m + 0));
                play(timbre.utils.mtof(m + k2));
            }
        }
    });
    
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };
    
    return synth;
}());
