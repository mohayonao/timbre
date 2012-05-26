ex1 = (function() {
    var synth, env 
    synth = T("*", T("sin", 880),
                   T("tri", 8, 0.4).kr(),
                   env = T("adsr", 500, 1500));
    synth.onplay = function() {
        synth.dac.append(synth);
        env.bang();
    };
    env.onended = function() {
        synth.dac.remove(synth);
        synth.dac.off();
    };
    return synth;
}());

ex2 = (function() {
    var synth, dac;
    
    dac = T("efx.delay", 125, 0.8, 0.75);
    
    function synth(freq) {
        var s, env;
        s = T("*", T("fami", freq, 0, 0.25),
                   env = T("perc", 1000).bang());
        dac.append(s);
        env.addEventListener("~ended", function() {
            dac.remove(s);
        });
        s.play();
    }
    
    var list  = [ "C5", "D5", "E5", "G5", "C6", "D6", 
                  "E6", "D6", "C6", "G5", "E5", "D5" ];
    var index = 0;
    dac.onbang = function() {
        var freq = timbre.utils.atof(list[index++]);
        synth(freq);
        if (index >= list.length) index = 0;
    };
    
    return dac;
}());
