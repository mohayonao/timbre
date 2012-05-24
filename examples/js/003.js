var dist, delay;

ex1 = (function() {
    "use strict";
    
    timbre.workerpath = "../timbre.js";
    timbre.utils.exports("converter"); // use atof
    
    // dac
    var ex1 = T("dac");
    ex1.ready = 0;
    
    // metronome
    var metronome = T("interval", function(count) {
        metronome.count %= 16;
        if (metronome.count === 0) metronome.measure += 1;
    }); metronome.measure = 0;
    
    // amen (load a wav file and decode it)
    var amen = T("wav", "./audio/amen.wav", true).load(function(res) {
        metronome.interval = (this.duration / 3) / 16;
        ex1.ready += 1;
    });
    dist = T("efx.dist", 0, -18, 2400, amen).set("mul", 0.5);
    dist.dac = ex1;
    
    var beat = 8, beattimer = (function() {
        var tim = 0, cnt = 0, stay = 0;
        return T("interval", function(count) {
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
        });
    }());
    
    
    // piano chord (load s wav file and decode it)
    var piano = 4, pianotimer = (function() {
        var synth, _synth, prev_chord, chordtable = [
            [1, 6, 8], [2, 5, 8], [1, 4, 8], [0, 2, 6],
        ], amptable = [ 0.9, 0.5, 0.8, 0.6 ], pianotones = [];
        
        T("wav", "./audio/piano_cmaj.wav").load(function(res) {
            var dx = this.duration / 9;
            for (var i = 0; i < 9; i++) {
                pianotones[i] = this.slice(dx * i, dx * i + dx);
            }
            ex1.ready += 1;
        });
        
        function play_chord(chord, amp) {
            if (_synth) _synth.dac.remove(_synth);
            _synth = synth;
            
            synth = T("+");
            for (var i = 0; i < chord.length; i++) {
                synth.append(pianotones[chord[i]].clone());
            }
            synth.mul = amp * 0.5;
            synth.dac = ex1;
        }
        
        return T("interval", function(count) {
            var chord, amp;
            chord = metronome.measure % 4;
            if (chord !== prev_chord) {
                amp = 1.0; prev_chord = chord;
            } else amp = amptable[metronome.count % 4];
            play_chord(chordtable[chord], amp);
        });
    }());
    
    // melo
    var leadtone = timbre.utils.wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
    
    var lead = T("rLPF", T("pulse", 0.462, 0, 800, 2000, 0.8).kr(),
                   0.8, 0.8,
                   T("*", T("+", T("osc", leadtone, 0, 0, 0.20),
                                 T("osc", leadtone, 0, 0, 0.15)),
                          T("adsr", 20, 1500, 0.4)));
    delay = T("efx.delay", 125, 0.8, lead).set("mul", 0.5);
    delay.dac = ex1;
    
    var melo = 16, melotimer = (function() {
        var tone1, tone2, env, phrase = [
            0, 0, 0, 0,
            atof("E4"), atof("E4"), atof("A4"),
            atof("A4"), atof("G4"), atof("C5"), ];
        
        tone1 = lead.args[0].args[0].args[0];
        tone2 = lead.args[0].args[0].args[1];
        env   = lead.args[0].args[1];
        
        return T("interval", function(count) {
            var freq = phrase[(Math.random() * phrase.length)|0];
            if (freq !== 0) {
                tone1.freq.value = freq;
                tone2.freq.value = freq * 0.9928057204912689;
                env.bang();
            }
        });
    }());
    
    
    ex1.onplay  = function() {
        metronome.measure = -1;
        metronome.on();
        beattimer.interval  = (amen.duration / 3) / beat;
        beattimer.on();
        pianotimer.interval = (amen.duration / 3) / piano;
        pianotimer.on();
        melotimer.interval  = (amen.duration / 3) / melo;
        melotimer.on();
    };
    ex1.onpause = function() {
        melotimer.off();
        pianotimer.off();
        beattimer.off();
        metronome.off();
    };
    
    ex1.bridge = {
        set_beat: function(_beat) {
            beat = _beat;
            beattimer.interval  = (amen.duration / 3) / beat;
        },
        get_beat: function() {
            return beat;
        },
        set_piano: function(_piano) {
            piano = _piano;
            pianotimer.interval = (amen.duration / 3) / piano;
        },
        get_piano: function() {
            return piano;
        },
        set_melo: function(_melo) {
            melo = _melo;
            melotimer.interval  = (amen.duration / 3) / melo;
        },
        get_melo: function() {
            return melo;
        },
    };
    
    return ex1;
}());
