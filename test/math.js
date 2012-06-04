tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/phasor.js", "/draft/math.js"];
    
    tests[i] = function() {
        return T("math.PI");
    }; tests[i++].desc = "math.PI";
    
    tests[i] = function() {
        return T("math.E");
    }; tests[i++].desc = "math.E";
    
    tests[i] = function() {
        return T("math.LN2");
    }; tests[i++].desc = "math.LN2";
    
    tests[i] = function() {
        return T("math.LN10");
    }; tests[i++].desc = "math.LN10";
    
    tests[i] = function() {
        return T("math.LOG2E");
    }; tests[i++].desc = "math.LOG2E";

    tests[i] = function() {
        return T("math.LOG10E");
    }; tests[i++].desc = "math.LOG10E";

    tests[i] = function() {
        return T("math.SQRT2");
    }; tests[i++].desc = "math.SQRT2";

    tests[i] = function() {
        return T("math.SQRT1_2");
    }; tests[i++].desc = "math.SQRT1_2";

    tests[i] = function() {
        return T("math.random");
    }; tests[i++].desc = "math.random";
    
    tests[i] = function() {
        return T("math.sin", T("phasor", 220).set("mul", 2 * Math.PI));
    }; tests[i++].desc = "math.sin";

    tests[i] = function() {
        return T("math.cos", T("phasor", 220).set("mul", 2 * Math.PI));
    }; tests[i++].desc = "math.cos";

    tests[i] = function() {
        return T("math.tan", T("phasor", 220).set("mul", 2 * Math.PI));
    }; tests[i++].desc = "math.tan";

    tests[i] = function() {
        return T("math.asin", T("sin", 440));
    }; tests[i++].desc = "math.asin";

    tests[i] = function() {
        return T("math.acos", T("sin", 440));
    }; tests[i++].desc = "math.acos";
    
    tests[i] = function() {
        return T("math.atan", T("sin", 440));
    }; tests[i++].desc = "math.atan";

    tests[i] = function() {
        return T("math.ceil", T("sin", 440));
    }; tests[i++].desc = "math.ceil";

    tests[i] = function() {
        return T("math.floor", T("sin", 440));
    }; tests[i++].desc = "math.floor";

    tests[i] = function() {
        return T("math.round", T("sin", 440));
    }; tests[i++].desc = "math.round";
    
    tests[i] = function() {
        return T("math.abs", T("sin", 440));
    }; tests[i++].desc = "math.abs";

    tests[i] = function() {
        return T("math.sqrt", T("phasor", 440).set("mul", 3));
    }; tests[i++].desc = "math.sqrt";

    tests[i] = function() {
        return T("math.exp", T("phasor", 440).set("mul", 3));
    }; tests[i++].desc = "math.exp";

    tests[i] = function() {
        return T("math.log", T("phasor", 440).set("mul", 3));
    }; tests[i++].desc = "math.log";

    tests[i] = function() {
        return T("math.atan", 1, T("phasor", 440).set("mul", 3));
    }; tests[i++].desc = "math.atan";

    tests[i] = function() {
        return T("math.max", 0, T("sin", 440));
    }; tests[i++].desc = "math.max";
    
    tests[i] = function() {
        return T("math.min", 0, T("sin", 440));
    }; tests[i++].desc = "math.min";

    tests[i] = function() {
        return T("math.pow", 2, T("sin", 440));
    }; tests[i++].desc = "math.pow";
    
    return tests;
}());
