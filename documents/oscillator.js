ex0 = (function() {
    return T("osc", "sin", 440, 1, 0);
}());

ex1 = (function() {
    var osc = T("osc");

    osc.wave  = "tri";
    osc.freq  = 880;
    osc.phase = 0.5;
    osc.mul   = 0.2;
    osc.add   = 0.8;
    
    return osc;
}());

ex2 = (function() {
    var synth = T("osc", 660, 0.5);
    synth.onplay = synth.onbang = function() {
        var wave = ["sin", "tri", "saw", "pulse", "fami", "konami"];
        wave = wave[(Math.random() * wave.length)|0];
        synth.wave = wave;
    };
    return synth;
}());

ex3 = (function() {
    var func = function(x) { return x * x * x; };
    return T("osc", func, 880);
}());

ex4 = (function() {
    T("osc").setWavetable("myosc", function(x) {
        return Math.random() - 0.5;
    });
    
    var synth = T("osc", "myosc", 1340);
    synth.onbang = function() {
        console.log( T("osc").getWavetable("myosc") );
    };
    
    return synth;
}());

ex5 = (function() {
    return T("*", T("tri", 880, 0.25),
                  T("+sin", 8).kr());
}());

ex6 = (function() {
    return T("tri", T("tri", 2, 30, 880).kr(), 0.25);
}());

ex7 = (function() {
    var synth = T("fami", T("glide", 150, 880), 0.25);
    var cnt = 0;

    synth.onbang = function() {
        synth.freq.value = [880, 1320, 1100, 660][++cnt % 4]
    };
    
    return synth;
}());
