ex0 = (function() {
    var synth, env 
    synth = T("*", T("sin", 1340),
                   T("tri", 8, 0.8, 0.4).kr(),
                   env = T("adsr", 500, 1500));
    synth.onplay = function() {
        synth.dac.append(synth);
        env.bang();
    };
    env.onended = function() {
        synth.pause();
    };
    return synth;
}());

ex1 = (function() {
    var delay = T("efx.delay", 125, 0.8, 0.75);
    
    function synth(freq) {
        var s, env;
        s = T("*", T("fami", freq, 0.4),
                   env = T("perc", 1000).bang());
        delay.append(s);
        if (delay.args.length >= 4) {
            delay.args.shift();
        }
    }
    
    var index = 0;
    var list  = [ "C5", "D5", "E5", "G5", "C6", "D6", 
                  "E6", "D6", "C6", "G5", "E5", "D5" ];
    
    var timer = T("interval", 380, function() {
        synth(timbre.utils.atof(list[index++]));
        if (index >= list.length) index = 0;
    });
    
    delay.onbang = function() {
        index = 0;
    };
    delay.onplay = function() {
        timer.on();
    };
    delay.onpause = function() {
        timer.off();
    };
    
    return delay;
}());

ex2 = (function() {
    var pianotones = [];
    var lpf = T("lpf");
    
    T("wav", "./examples/public/audio/piano_cmaj.wav").load(function(res) {
        var dx = this.duration / 9;
        for (var i = 0; i < 9; i++) {
            pianotones[i] = this.slice(dx * i, dx * i + dx);
        }
    }).set("mul", 0.5);
    
    function playpiano(id) {
        lpf.append( pianotones[id].clone() );
        if (lpf.args.length >= 4) {
            lpf.args.shift();
        }
    }
    
    var serif = [ "oh!", "awesome!", "cool!!", "nice!" ];
    var bridge = function(id) {
        if (lpf.dac && lpf.dac.isOn) {
            playpiano(id);
            return serif[(Math.random() * serif.length)|0];
        } else {
            return "press [play] button";
        }
    };
    
    lpf.$initUI = function() {
        Object.defineProperty(window, "c", {
            get: function() { return bridge(6); }
        });
        Object.defineProperty(window, "d", { get: function() {
            return bridge(7); }
        });
        Object.defineProperty(window, "e", { get: function() {
            return bridge(0); }
        });
        Object.defineProperty(window, "f", { get: function() {
            return bridge(1); }
        });
        Object.defineProperty(window, "g", { get: function() {
            return bridge(2); }
        });
        Object.defineProperty(window, "gg", { get: function() {
            return bridge(3); }
        });
        Object.defineProperty(window, "a", { get: function() {
            return bridge(4); }
        });
        Object.defineProperty(window, "b", { get: function() {
            return bridge(5); }
        });
    };
    
    return lpf;
}());
