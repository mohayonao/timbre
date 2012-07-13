tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    var file_audio = T("audio").set("loop", true);
    
    tests[i] = function() {
        var synth, begin;
        synth = T("audio", "/public/audio/sample.ogg", true);
        synth.onerror = function(res) {
            console.log("error", res);
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

    tests[i] = function() {
        var synth = T("+");
        synth.onplay = function() {
            synth.args[0] = file_audio.clone();
        };
        return synth;
    }; tests[i++].desc = "from File (drag & drop an audio file)";
    
    jQuery(function() {
        var begin;
        file_audio.onerror = function(res) {
            console.log("File: ERROR", res);
        };
        file_audio.onloadedmetadata = function(res) {
            begin = +new Date();
            console.log("File: loadedmetadata: buffer.length=", res.buffer.length);
        };
        file_audio.onloadeddata = function(res) {
            console.log("File: loadeddata: buffer.length=", res.buffer.length);
            console.log("File: elapsed: " + (+new Date() - begin));
        };
        $(document.body).on("dragover", function(e) {
            e.preventDefault();
            e.stopPropagation();
        });        
        $(document.body).on("drop", function(e) {
            e.preventDefault();
            e.stopPropagation();
            file_audio.src = e.originalEvent.dataTransfer.files[0];
            file_audio.load();
            console.log("file load!!");
        });
    });
    
    return tests;
}());
