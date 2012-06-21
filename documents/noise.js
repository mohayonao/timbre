ex0 = (function() {
    var synth = T("noise").set("mul", 0.5);

    synth.$listener = T("fft", 1024, 1000).listen(synth).off();
    synth.$view = synth.$listener.spectrum;
    synth.$range = [0, 50000];
    
    return synth;
}());

ex4 = (function() {
    var synth, env, metro, i;

    synth = T("*", T("hpf", 6000, T("noise")),
                   env = T("perc"));

    metro = T("interval", 110, function() {
        var i = metro.count % 4;
        if (i <= 1) {
            env.r = 20;
            env.mul = 0.6 - i * 0.4;
            env.bang();
        } else if (i === 2) {
            env.r = 200;
            env.mul = 0.8;
            env.bang();
        }
    });
    
    synth.onplay = function() {
        metro.on();
    };
    synth.onpause = function() {
        metro.off();
    };
    
    return synth;
}());
