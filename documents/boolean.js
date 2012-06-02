ex4 = (function() {
    var bool  = T(true);
    var sin   = T("sin", 880, 0.25);
    var synth = T("*", bool, sin);
    
    synth.onbang = function() {
        bool.bang();
    };
    
    return synth;
}());

ex5 = (function() {
    var bool = T(false);
    bool.add = 660;
    bool.mul = 220;
    
    var synth = T("fami", bool, 0.25);
    synth.onbang = function() {
        bool.bang();
    };
    
    return synth;
}());
