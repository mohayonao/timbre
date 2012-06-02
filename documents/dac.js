ex4 = (function() {

    var synth = T("saw", 880, 0.25);
    var dac   = T("dac", synth);
    dac.pan   = T("+sin", 0.5);
    
    return dac;
}());
