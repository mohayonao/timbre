var dist, delay;

ex1 = (function() {
    "use strict";
    
    var ex1;
    var timer, amen, beat, piano, melo;
    
    timbre.workerpath = "../timbre.js";
    timbre.utils.exports("converter"); // use msec2Hz
    
    // dac
    ex1 = T("dac");
    
    
    // timer
    timer = T("interval");
    
    
    // amen (load a wav file and decode it)
    beat = 24;
    amen = T("wav", "./audio/amen.wav", true).load(function(res) {
        timer.interval = this.duration / 192;
    });
    dist = T("efx.dist", -30, 12, 4800, amen).set("mul", 0.5);
    dist.dac = ex1;
    
    (function() {
        var tim = 0, cnt = 0, stay = 0;
        timer.append(function(i) {
            if (i % (192 / beat) === 0) {
                if (cnt === 0) {
                    if (stay === 0) {
                        tim = ((Math.random() * beat)|0) * (amen.duration / beat);
                        amen.currentTime = tim;
                        cnt  = (((Math.random() * beat) / 24)|0) * 2;
                        stay = (((Math.random() * beat) /  6)|0);
                    } else {
                        stay -= 1;
                    }
                } else {
                    amen.currentTime = tim;
                    cnt -= 1;
                }
            }
        });
    }());
    
    
    // piano (load s wav file and decode it)
    piano = [];
    T("wav", "./audio/piano.wav").load(function(res) {
        var i, dx;
        dx = this.duration / 17;
        this.mul = 0.75;
        for (i = 0; i < 17; i++) {
            piano[i] = this.slice(dx * i, dx * i + dx);
        }
    });
    
    function playpiano(p) {
        var i, chord = T("+");
        for (i = 0; i < p.length; i++) {
            chord.append(piano[p[i]].clone());
        }
        chord.args[0].addEventListener("~ended", function() {
            chord.dac.remove(chord);
        });
        chord.dac = ex1;
    }
    
    (function() {
        var index = 0, pattern = [
            [5, 9, 16], [7, 11, 16], [5, 9, 16], [4, 7, 12],
        ];
        
        timer.append(function(count) {
            var p;
            if (count % 16 === 0) {
                p = pattern[(index / 4)|0];
                if (p.length > 0) playpiano(p);
                index = (index + 1) % 16;
            }
        });
    }());
    
    
    // melo
    var melotone = timbre.utils.wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
    
    melo = T("rLPF", T("pulse", 0.462, 0, 800, 2000, 0.8).kr(),
               0.8, 0.8,
               T("*", T("+", T("osc", melotone, 0, 0, 0.20),
                             T("osc", melotone, 0, 0, 0.15)),
                      T("adsr", 20, 500, 0.4)));
    delay = T("efx.delay", 125, 0.8, melo);
    delay.mul = 0.5;
    delay.dac = ex1;
    
    (function() {
        var tone1, tone2, env, phrase;
        var phrase = [ 0, 0, 0, 0,
                       atof("E4"), atof("E4"), atof("A4"),
                       atof("A4"), atof("G4"), atof("C5"), ];
        
        tone1 = melo.args[0].args[0].args[0];
        tone2 = melo.args[0].args[0].args[1];
        env   = melo.args[0].args[1];
        
        timer.append(function(count) {
            var freq;
            if (count % 4 === 0) {
                freq = phrase[(Math.random() * phrase.length)|0];
                if (freq !== 0) {
                    tone1.freq.value = freq;
                    tone2.freq.value = freq * 0.996396;
                    env.bang();
                }
            }
        });
    }());
    
    ex1.onplay = function() {
        timer.on();
    };
    ex1.onpause = function() {
        timer.off();
    };
    
    return ex1;
}());
