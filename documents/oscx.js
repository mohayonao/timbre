ex0 = (function() {
    return T("oscx", T("phasor", 440));
}());

ex4 = (function() {
    return T("sinx", T("phasor", 440)).set("fb", 0.25);
}());

ex5 = (function() {
    var synth, freq, op1, op2;
    
    freq = T("phasor", 440);
    op1 = T("*", T("oscx", freq),             // modulator
                 T("adsr", 100, 4900));
    op2 = T("*", T("oscx", T("+", freq, op1)), // carrier
                 T("adsr", 0, 10000, 0.6));

    synth = op2;
    synth.onplay = function() {
        op1.args[1].bang();
        op2.args[1].bang();
    };
    synth.onbang = function() {
        op1.args[1].bang();
        op2.args[1].bang();
    };
    
    return synth;
}());
