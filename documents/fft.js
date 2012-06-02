timbre.workerpath = "../timbre.js";

ex4 = (function() {
    var synth = T("wav", "public/audio/amen.wav", true).load();
    
    var fft = T("fft").listen(synth).off();
    
    fft.onfft = function(real, imag) {
        
    };
    
    synth.$listener = fft;
    synth.$view = fft.spectrum;
    synth.$range = [0, 3000];
    
    return synth;
}());
