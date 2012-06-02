timbre.workerpath = "../timbre.js";

ex4 = (function() {
    var synth = T("wav", "public/audio/amen.wav", true).load();
    
    var rec = T("rec", 1000).listen(synth).off();
    
    rec.onrecorded = function(buffer) {
        rec.on();
    };
    
    synth.$listener = rec;
    synth.$view = rec.buffer;
    
    return synth;
}());

ex5 = (function() {
    var synth = T("+");

    synth.onplay = function() {
        synth.args[0] = s[4].clone();
    };
    
    var rec = T("rec", 5000).listen(synth).off();
    rec.overwrite = true;
    
    rec.onrecorded = function(buffer) {
        rec.on();
    };
    
    synth.$listener = rec;
    synth.$view = rec.buffer;
    
    return synth;
}());
