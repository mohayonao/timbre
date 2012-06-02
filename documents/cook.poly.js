ex0 = (function() {
    var synth = T("+");
    
    function play(freq) {
        var tone = T("*", T("fami", freq, 0.25),
                          T("adsr", 50, 2500).bang());
        synth.append(tone);
        while (synth.args.length > 8)
            synth.args.shift();
    }
    
    
    var i = 60;
    var timer = T("interval", 250, function() {
        play(timbre.utils.mtof(i));
        i += 5;
        if (96 < i) i -= 42;
    });
    
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };
    
    return synth;
}());
