ex4 = (function() {
    var synth = T("*", T("fami", 880, 0.5), T("perc", 40));
    
    var timer = T("interval", 80, function() {
        if (timer.count % 16 === 0) {
            synth.args[0].freq.value = Math.random() * 1800 + 440;
        }
        synth.mul = (timer.count % 16) / 32 + 0.5;
        synth.args[1].bang();
    });
    
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };
    
    return synth;
}());
