ex0 = (function() {
    var perc = T("perc", 200);
    var synth = T("*", perc, T("tri", 880, 0.25));
    var interval = T("interval", 1000, perc);
    
    synth.onplay = function() {
        interval.on()
    };
    synth.onbang = function() {
        perc.bang();
    };
    synth.onpause = function() {
        interval.off()
    };
    
    synth.$listener = T("rec", 5000).listen(perc).off();
    synth.$view  = synth.$listener.buffer;
    
    return synth;
}());
