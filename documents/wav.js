timbre.workerpath = "../timbre.js";

ex0 = (function() {
    var synth = T("wav", "public/audio/amen.wav", true).load();
    
    synth.$listener = T("rec", 100).listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.buffer;
    synth.$listener.onrecorded = function () {
        synth.$listener.on();
    };
    
    return synth;
}());

ex4 = (function() {
    var synth = T("+");
    synth.onplay = function() {
        synth.args[0] = s[0].clone().set("reversed", true);
    };

    synth.$listener = T("rec", 100).listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.buffer;
    synth.$listener.onrecorded = function () {
        synth.$listener.on();
    };
    
    return synth;
}());

ex5 = (function() {
    var synth = T("+");
    synth.onplay = function() {
        synth.args[0] = s[0].slice(280, 280+214);
    };

    synth.$listener = T("rec", 100).listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.buffer;
    synth.$listener.onrecorded = function () {
        synth.$listener.on();
    };
    
    return synth;
}());
