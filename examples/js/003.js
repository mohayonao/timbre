var dist, delay, beat = 8, piano = 4;

ex1 = (function() {
    "use strict";
    
    var ex1, timer, amen, pianotones, melo;
    
    timbre.workerpath = "../timbre.js";
    timbre.utils.exports("converter"); // use msec2Hz
    
    // dac
    ex1 = T("dac");
    
    // timer
    timer = T("interval");
    
    // amen (load a wav file and decode it)
    amen = T("wav", "./audio/amen.wav", true).load(function(res) {
        timer.interval = this.duration / 192;
    });
    dist = T("efx.dist", -30, 12, 4800, amen).set("mul", 0.5);
    dist.dac = ex1;
    
    (function() {
        var tim = 0, cnt = 0, stay = 0;
        timer.append(function(i) {
            var b = (beat * 3)|0;
            if (b <= 0 || 192 < b || i % (192 / b) !== 0) return;
            if (cnt === 0) {
                if (stay === 0) {
                    tim = ((Math.random() * b)|0) * (amen.duration / b);
                    amen.currentTime = tim;
                    cnt  = (((Math.random() * b) / 24)|0) * 2;
                    stay = (((Math.random() * b) /  6)|0);
                } else {
                    stay -= 1;
                }
            } else {
                amen.currentTime = tim;
                cnt -= 1;
            }
        });
    }());
    
    
    // piano (load s wav file and decode it)
    pianotones = [];
    T("wav", "./audio/piano.wav").load(function(res) {
        var i, dx;
        dx = this.duration / 17;
        for (i = 0; i < 17; i++) {
            pianotones[i] = this.slice(dx * i, dx * i + dx);
        }
    });
    
    function playpiano(chord, amp) {
        var i, synth = T("+");
        for (i = 0; i < chord.length; i++) {
            synth.append(pianotones[chord[i]].clone());
        }
        synth.mul = amp;
        synth.args[0].addEventListener("~ended", function() {
            synth.dac.remove(synth);
        });
        synth.dac = ex1;
    }
    
    (function() {
        var index = 0, prev, chordtable = [
            [5, 9, 16], [7, 11, 16], [5, 9, 16], [4, 7, 12],
        ], amptable = [ 0.9, 0.6, 0.8, 0.6 ];
        timer.append(function(count) {
            var chord, triggr, amp;
            if (0 < piano && piano <= 16) {
                triggr = (64 / piano)|0;
                if (count % triggr === 0) {
                    chord = (index / 64)|0;
                    if (chord !== prev) {
                        amp = 1.0; prev = chord;
                    } else amp = amptable[(index % 16 / 4)|0];
                    chord = chordtable[chord];
                    playpiano(chord, amp);
                }
            }
            index = (index + 1) % 256;
        });
    }());
    
    
    // melo
    var melotone = timbre.utils.wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
    
    melo = T("rLPF", T("pulse", 0.462, 0, 800, 2000, 0.8).kr(),
               0.8, 0.8,
               T("*", T("+", T("osc", melotone, 0, 0, 0.20),
                             T("osc", melotone, 0, 0, 0.15)),
                      T("adsr", 20, 500, 0.4)));
    delay = T("efx.delay", 125, 0.8, melo).set("mul", 0.5);
    delay.dac = ex1;
    
    (function() {
        var tone1, tone2, env, phrase = [
            0, 0, 0, 0,
            atof("E4"), atof("E4"), atof("A4"),
            atof("A4"), atof("G4"), atof("C5"), ];
        
        tone1 = melo.args[0].args[0].args[0];
        tone2 = melo.args[0].args[0].args[1];
        env   = melo.args[0].args[1];
        
        timer.append(function(count) {
            if (count % 4 !== 0) return;
            
            var freq = phrase[(Math.random() * phrase.length)|0];
            if (freq !== 0) {
                tone1.freq.value = freq;
                tone2.freq.value = freq * 0.996396;
                env.bang();
            }
        });
    }());
    
    ex1.onplay  = function() { timer.on() ; };
    ex1.onpause = function() { timer.off(); };
    
    return ex1;
}());
