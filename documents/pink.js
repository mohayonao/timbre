ex0 = (function() {
    var synth = T("pink").set("mul", 0.5);

    synth.$listener = T("fft", 1024, 1000).listen(synth).off();
    synth.$view = synth.$listener.spectrum;
    synth.$range = [0, 50000];
    
    return synth;
}());
