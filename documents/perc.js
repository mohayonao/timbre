ex0 = (function() {
    var osc  = T("tri", 880, 0.25);
    var perc = T("perc", 200);
    var synth = T("*", osc, perc);

    synth.onplay = function() {
        perc.bang();
    };
    synth.onbang = function() {
        perc.bang();
    };
    
    synth.$listener = T("rec", 5000).listen(perc).off();
    synth.$view  = synth.$listener.buffer;
    
    return synth;
}());
