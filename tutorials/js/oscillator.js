ex0 = (function() {
    return T("osc", "sin", 1340, 0.5, 0);
}());

ex1 = (function() {
    var osc = T("sin");

    osc.wave  = "tri";
    osc.freq  = T("sin", 8, 10, 880).kr();
    osc.phase = 0.5;
    osc.mul   = 0.2;
    osc.add   = 0.8;
    
    return osc;
}());

ex2 = (function() {
    var func = function(x) { return x * x * x; };
    return T("osc", func, 880); 
}());
