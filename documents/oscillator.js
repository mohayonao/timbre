ex0 = (function() {
    return T("osc", "sin", 440, 1, 0);
}());


ex4 = (function() {
    var synth = T("osc", 660, 0.5);
    synth.onplay = synth.onbang = function() {
        var wave = ["sin", "tri", "saw", "pulse", "fami", "konami"];
        wave = wave[(Math.random() * wave.length)|0];
        synth.wave = wave;
    };
    return synth;
}());

ex5 = (function() {
    var func = function(x) { return x * x * x; };
    return T("osc", func, 880);
}());

ex6 = (function() {
    T("osc").setWavetable("myosc", function(x) {
        return Math.random() - 0.5;
    });
    
    var synth = T("osc", "myosc", 1340);
    synth.onbang = function() {
        console.log( T("osc").getWavetable("myosc") );
    };
    
    return synth;
}());

ex7 = (function() {
    return T("*", T("tri", 880, 0.25),
                  T("+sin", 8).kr());
}());

ex8 = (function() {
    return T("tri", T("tri", 2, 30, 880).kr(), 0.25);
}());

ex9 = (function() {
    var synth = T("fami", T("glide", 150, 880), 0.25);
    var cnt = 0;

    synth.onbang = function() {
        synth.freq.value = [880, 1320, 1100, 660][++cnt % 4]
    };
    
    return synth;
}());
