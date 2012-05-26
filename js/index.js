ex0 = (function() {
    var synth, env 
    synth = T("*", T("sin", 880),
                   T("tri", 8, 0.4).kr(),
                   env = T("adsr", 500, 1500));
    synth.onplay = function() {
        synth.dac.append(synth);
        env.bang();
    };
    env.onended = function() {
        synth.dac.remove(synth);
        synth.dac.off();
    };
    return synth;
}());

ex1 = (function() {
    var delay = T("efx.delay", 125, 0.8, 0.75);
    
    function synth(freq) {
        var s, env;
        s = T("*", T("fami", freq, 0.25),
                   env = T("perc", 1000).bang());
        s.dac = delay;
        env.onended = function() {
            delay.remove(s);
        };
    }
    
    var list  = [ "C5", "D5", "E5", "G5", "C6", "D6", 
                  "E6", "D6", "C6", "G5", "E5", "D5" ];
    var index = 0;
    var timeout = 0;
    delay.onbang = function() {
        synth(timbre.utils.atof(list[index++]));
        if (index >= list.length) index = 0;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            delay.dac.off();
        }, 2250);
    };
    
    return delay;
}());

ex2 = (function() {
    var pianotones = [], synth = [];
    var dac = T("dac");
    
    T("wav", "./examples/audio/piano_cmaj.wav").load(function(res) {
        var dx = this.duration / 9;
        this.mul = 0.25;
        for (var i = 0; i < 9; i++) {
            pianotones[i] = this.slice(dx * i, dx * i + dx);
        }
    });
    
    function playpiano(id) {
        if (synth[0]) synth[0].dac.remove(synth[0]);
        synth[0] = synth[1];
        synth[1] = synth[2];
        synth[2] = pianotones[id].clone();
        synth[2].dac = dac;
    }
    
    var serif = [ "oh!", "awesome!", "cool!!", "nice!" ];
    dac.bridge = function(id) {
        if (dac.isOn) {
            playpiano(id);
            return serif[(Math.random() * serif.length)|0];
        } else {
            return "press [play] button";
        }
    };
    return dac;
}());
