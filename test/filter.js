tests = (function() {
    "use strict";

    timbre.workerpath = "/timbre.js";
    
    var i = 0, tests = [];

    var audio = T("audio", "/audio/sample.ogg", true).load(function() {
        console.log("loaded!");
    });
    
    tests[i] = function() {
        return T("filter", "lpf", audio);
    }; tests[i++].desc = "filter.lpf";

    tests[i] = function() {
        return T("rfilter", "lpf", audio);
    }; tests[i++].desc = "rfilter.lpf";
    
    return tests;
}());
