ex4 = (function() {
    var ease = T("ease", "bounce.out", 1500, 1320, 440);
    var synth = T("tri", ease, 0.5);
    
    synth.onplay = function() { ease.bang(); };
    synth.onbang = function() { ease.bang(); };
    ease.delay = 1000;
    
    synth.$listener = T("rec", 3000).listen(ease).off();
    synth.$view  = synth.$listener.buffer;
    synth.$range = [0, 1400];
        
    return synth;
}());
