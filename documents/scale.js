ex4 = (function() {
    timbre.utils.exports("atof", "range", "random.choice");
    
    var array = T(range(8));
    var scale = T("scale", "major", atof("C4"), array);
    
    var synth = T("sin", scale);
    var timer = T("interval", 250, array);
    
    synth.onbang = function() {
        scale.scale = (scale.scale === "major") ? "minor" : "major";
    };
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };

    return synth;
}());

ex5 = (function() {
    timbre.utils.exports("atof","bpm2msec", "range",
                         "random.choice", "random.shuffle");
    var bpm = 138;
    var array = T(shuffle(range(16))).set("repeat", 3);
    var scale = T("scale", "minor").append(array);
    
    var arp = T("*", T("sin", scale, 0.4),
                     T("perc", 450).bang());
    
    var pad = T("*", T("+", T("sin", T("*", 2, scale.root).kr()),
                            T("sin", T("*", 3, scale.root).kr())),
                     T("+tri", 8, 0.4),
                     T("adsr", 2500, 10000).bang());
    
    var synth = T("efx.delay", T("+", arp, pad));
    
    var timer = T("interval", bpm2msec(bpm, 8), function() {
        array.bang();
        arp.args[1].bang();
    });
    
    array.onended = function() {
        scale.root.value = atof(choice(["A3","G3","F3","E3","D-3"]));
        array.reset();
        pad.args[2].bang();
    };
    
    synth.onbang = function() {
        scale.scale = (scale.scale === "major") ? "minor" : "major";
        shuffle(array.value);
    };
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };
    
    return synth;
}());
