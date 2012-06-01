ex0 = (function() {
    return T("noise").set("mul", 0.5);
}());

ex4 = (function() {
    var synth, env, metro;

    synth = T("*", T("hpf", 6000, T("noise")),
                   env = T("perc"));

    metro = T("metro", 138, 16, function() {
        var i = metro.beat % 4;
        if (i <= 1) {
            env.duration = 20;
            env.mul = 0.6 - i * 0.4;
            env.bang();
        } else if (i === 2) {
            env.duration = 200;
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