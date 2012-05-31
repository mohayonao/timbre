tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, begin;
        synth = T("audio", "/audio/sample.ogg", true);
        synth.onerror = function(res) {
            console.dir("error", res);
        };
        synth.onloadedmetadata = function(res) {
            begin = +new Date();
            console.log("loadedmetadata: buffer.length=", res.buffer.length);
        };
        synth.onloadeddata = function(res) {
            console.log("loadeddata: buffer.length=", res.buffer.length);
            console.log("elapsed: " + (+new Date() - begin));
        };
        synth.onlooped = function() {
            console.log("looped");
        };
        synth.onended = function() {
            console.log("ended");
        };
        return synth.load();
    }; tests[i++].desc = "audio";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].slice(500, 1500);
        };
        return synth;
    }; tests[i++].desc = "audio#slice()";
    
    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].clone().set("reversed", true);
        };
        return synth;
    }; tests[i++].desc = "reversed audio";

    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = s[0].slice(2500, 1500);
        };
        return synth;
    }; tests[i++].desc = "reversed slice";
    
    return tests;
}());
