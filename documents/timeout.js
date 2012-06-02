timbre.workerpath = "../timbre.js";

ex4 = (function() {
    var synth = T("*", T("adsr", 0, 0, 1.0, 3000).bang(),
                       T("wav", "public/audio/amen.wav", true).load());
    
    var timer = T("timeout", 3000, function() {
        synth.args[0].keyoff();
    });
    
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };
    synth.onbang = function() {
        synth.args[0].bang();
        timer.on();
    };
    
    synth.$listener = T("rec", 100).listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.buffer;
    synth.$listener.onrecorded = function () {
        synth.$listener.on();
    };
    
    return synth;
}());
