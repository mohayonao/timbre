tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var func = function(x) {
            return (x * x * x);
        };
        return T("func", func, 880);
    }; tests[i++].desc = "FuncOscillator";
    
    tests[i] = function() {
        var func = function(x) {
            return [ (x * x * x), -(x * x), x ];
        };
        return T("func", 3, func, 660);
    }; tests[i++].desc = "FuncOscillator";
    
    tests[i] = function() {
        var func = function(x) {
            return [ (x * x * x), -(x * x), x ];
        };
        return T("func", 3, func, 440).kr();
    }; tests[i++].desc = "control rate FuncOscillator (TODO:implements)";
    
    tests[i] = function() {
        return T("*", T("sin", 880), T("+tri", 0.8));
    }; tests[i++].desc = "LFO";
    
    return tests;
}());
