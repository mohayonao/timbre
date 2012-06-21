ex0 = (function() {
    var osc  = T("tri", 880, 0.25);
    var adsr = T("adsr", 200, 500, 0.5, 500);
    var synth = T("*", osc, adsr);
    
    var timeout = T("timeout", 1500, function() {
        adsr.keyoff();
    });
    
    synth.onplay = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onbang = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onpause = function() {
        timeout.off();
    };
    
    synth.$listener = T("rec", 5000).listen(adsr).off();
    synth.$view  = synth.$listener.buffer;
    
    return synth;
}());

ex3 = (function() {
    var osc  = T("tri", 880, 0.25);
    var adsr = T("adsr", 200, 500, 0.5, 500).set("delay", 200);
    var synth = T("*", osc, adsr);
    
    adsr.onA = function() { osc.freq.value = 880; }
    adsr.onD = function() { osc.freq.value = 660; }
    adsr.onS = function() { osc.freq.value = 440; }
    adsr.onR = function() { osc.freq.value = 220; }
    adsr.onended = function() {};

    var timeout = T("timeout", 3000, function() {
        adsr.keyoff();
    });
    
    synth.onplay = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onbang = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onpause = function() {
        timeout.off();
    };
    
    synth.$listener = T("rec", 5000).listen(adsr).off();
    synth.$view  = synth.$listener.buffer;
    
    return synth;
}());

ex4 = (function() {
    var adsr  = T("adsr", 250, 1000, 0.5, 500);
    var synth = T("*", adsr, T("tri", 880, 0.25));
    
    var timeout = T("timeout", 3000, function() {
        adsr.keyoff();
    });
    
    adsr.onbang = function() {
        this.table = "32db";
    };
    adsr.onD = function() {
        this.table = "~32db";
    };
    
    synth.onplay = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onbang = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onpause = function() {
        timeout.off();
    };
    
    synth.$listener = T("rec", 5000).listen(adsr).off();
    synth.$view  = synth.$listener.buffer;
    
    return synth;
}());

ex5 = (function() {
    var adsr  = T("adsr", 200, 500, 0.75, 500).set("delay", 200);
    var synth = T("tri", adsr, 0.25);
    
    adsr.al = 0.2;
    adsr.dl = 1.0;
    adsr.mul = 880;
    adsr.add = 440;
    
    var timeout = T("timeout", 3000, function() {
        adsr.keyoff();
    });
    
    synth.onplay = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onbang = function() {
        adsr.bang();
        timeout.on();
    };
    synth.onpause = function() {
        timeout.off();
    };
    
    synth.$listener = T("rec", 5000).listen(adsr).off();
    synth.$view  = synth.$listener.buffer;
    synth.$range = [220, 2400];
    
    return synth;
}());
