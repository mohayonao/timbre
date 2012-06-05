ex0 = (function() {
    var synth = T("+");

    function playBell(f) {
        var f, op1, op2, op3, op4;
        
        f = T(f);
        op1 = T("*", T("sinx", T("phasor", T("*", 2.02, f).kr())).set("fb", 0.05),
                     T("perc", 2500).set("mul", 0.6).bang());
        op2 = T("*", T("trix", T("+", T("phasor", f), op1)),
                     T("perc", 2000).set("mul", 0.5).bang());
        op3 = T("*", T("oscx", T("phasor", T("*", 9, f).kr())),
                     T("perc", 5000).set("mul", 0.2).bang());
        op4 = T("*", T("oscx", T("+", T("phasor", T("*", 4.04, f).kr()), op3)),
                     T("perc", 2000).set("mul", 0.4).bang());
        
        synth.append( T("+", op2, op4) );
        if (synth.args.length > 4) synth.args.shift();
    }
    
    var timer = T("interval", 800, function() {
        var m, k1, k2;
        
        k1 = [-1,0,0,3,3,3,7,7,8,9][(Math.random()*10)|0];
        k2 = [-1,-1,-1,3,3,5,7,8,10,11][(Math.random()*10)|0];
        
        if (k1 !== -1) {
            if (k2 === -1) {
                m  = k1 + 69 - 12;
                playBell(timbre.utils.mtof(m + 0));
            } else {
                m  = k1 + 69;
                playBell(timbre.utils.mtof(m + 0));
                playBell(timbre.utils.mtof(m + k2));
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
