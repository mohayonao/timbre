ex0 = (function() {
    return T("osc", "sin", 1320, 0.5, 0);
}());

ex1 = (function() {
    var osc = T("sin");

    osc.wave  = "tri";
    osc.freq  = 880;
    osc.phase = 0.5;
    osc.mul   = 0.2;
    osc.add   = 0.8;
    
    return osc;
}());

ex2 = (function() {
    var func = function(x) { return x * x * x; };
    return T("osc", func, 880); 
}());

ex3 = (function() {
    T("osc").setWaveform("myosc", function(x) {
        return Math.random() - 0.5;
    });
    
    var synth = T("osc", "myosc", 1340);
    synth.onbang = function() {
        console.log( T("osc").getWaveform("myosc") );
    };
    
    return synth;
}());

ex4 = (function() {
    return T("*", T("pulse", 880, 0.25),
                  T("+tri", 8).kr());
}());

ex5 = (function() {
    return T("pulse", T("tri", 4, 20, 1320).kr(), 0.25);
}());
