ex0 = (function() {
    return T("sin", 440);
}());

ex1 = (function() {
    return T("+", T("sin", 523.35),
                  T("sin", 659.25),
                  T("sin", 783.99)).set("mul", 0.3);
}());

ex2 = (function() {
    var synth = T("*", T("+", T("sin", 523.35),
                              T("sin", 659.25),
                              T("sin", 783.99)).set("mul", 0.25),
                       T("+tri", 8),
                       T("adsr", 0, 1500).bang());
    synth.onplay = synth.onbang = function() {
        synth.args[2].bang();
    };
    return synth;
}());

ex3 = (function() {
    timbre.utils.exports("atof");
    
    var synth = T("efx.delay", 150, 0.8);
    
    function tone(freq) {
        synth.append(  T("*", T("+", T("sin", freq, 0.25), T("sin", freq + 4, 0.1)),
                              T("perc", 2500).bang()) );
        if (synth.args.length > 4) synth.args.shift();
    }
    
    var sch = T("schedule", "bpm (116, 2)", [
        [0, tone, [atof("G3")]],
        [1, tone, [atof("B4")]], [1, tone, [atof("D5")]], [1, tone, [atof("F#5")]],
        [3, tone, [atof("D3")]],
        [4, tone, [atof("A4")]], [4, tone, [atof("C#5")]], [4, tone, [atof("F#5")]],
        [6],
    ], true);
    
    synth.onbang = function() {
        sch.bang();
    };
    synth.onplay = function() {
        sch.on();
    };
    synth.onpause = function() {
        sch.off();
    };
    
    return synth;
}());
