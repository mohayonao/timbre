ex0 = (function() {
    "use strict";
    
    timbre.workerpath = "../timbre.js";
    timbre.utils.exports("converter"); // use atof

    timbre.setup({samplerate:22050});
    
    // dac
    var ex0 = T("dac");
    var ready = 0;
    ex0.$ready = false;
    
    // metronome
    var metronome = T("interval", function() {
        metronome.count %= 16 * 4;
    });
    
    // amen (load a wav file and decode it)
    var amen = T("wav", "./public/audio/amen.wav", true).load(function(res) {
        metronome.interval = (this.duration / 3) / 16;
        if (ready === 1) ex0.$ready = true; else ready = 1;
    });
    var dist = T("efx.dist", 0, -18, 2400, amen).set("mul", 0.5);
    dist.dac = ex0;
    
    var beat = 8, beattimer = (function() {
        var tim = 0, cnt = 0, stay = 0;
        return T("interval", function() {
            if (cnt === 0) {
                if (stay === 0) {
                    tim  = ((Math.random() * beat)|0) * (amen.duration / beat);
                    cnt  = (((Math.random() * beat) / 16)|0) * 2;
                    stay = (((Math.random() * beat) /  6)|0);
                    amen.currentTime = tim;                    
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
        var synth, prev_chord, chordtable = [
            [1, 6, 8], [2, 5, 8], [1, 4, 8], [0, 2, 6],
        ], amptable = [ 0.9, 0.5, 0.8, 0.6 ], pianotones = [];
        
        T("wav", "./public/audio/piano_cmaj.wav").load(function(res) {
            var dx = this.duration / 9;
            for (var i = 0; i < 9; i++) {
                pianotones[i] = this.slice(dx * i, dx * i + dx);
            }
            if (ready === 1) ex0.$ready = true; else ready = 1;
        });
        
        synth = T("+").set("mul", 0.5);
        ex0.append(synth);
        
        function play_chord(chord, amp) {
            if (!chord) return;
            for (var i = 0; i < chord.length; i++) {
                synth.append(pianotones[chord[i]].clone().set("mul", amp));
            }
            while (synth.args.length > 3) {
                synth.args.shift();
            }
        }
        
        return T("interval", function() {
            var chord, amp;
            chord = (metronome.count / 16)|0;
            if (chord !== prev_chord) {
                amp = 1.0; prev_chord = chord;
            } else amp = amptable[(metronome.count-1) % 4];
            play_chord(chordtable[chord], amp);
        });
    }());
    
    // melo
    var leadtone = timbre.utils.wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
    
    var lead = T("rlpf", T("pulse", 0.462, 800, 2000, 0.8).kr(),
                   0.8, 0.8,
                   T("*", T("+", T("osc", leadtone, 0, 0.20),
                                 T("osc", leadtone, 0, 0.15)),
                          T("adsr", 20, 1500, 0.4)));
    var delay = T("efx.delay", 125, 0.8, lead).set("mul", 0.5);
    delay.dac = ex0;
    
    var melo = 16, melotimer = (function() {
        var tone1, tone2, env, phrase = [
            0, 0, 0, 0,
            atof("E4"), atof("E4"), atof("A4"),
            atof("A4"), atof("G4"), atof("C5"), ];
        
        tone1 = lead.args[0].args[0].args[0];
        tone2 = lead.args[0].args[0].args[1];
        env   = lead.args[0].args[1];
        
        return T("interval", function() {
            var freq = phrase[(Math.random() * phrase.length)|0];
            if (freq !== 0) {
                tone1.freq.value = freq;
                tone2.freq.value = freq * 0.9928057204912689;
                env.bang();
            }
        });
    }());
    
    ex0.onbang  = function() {
        dist.isOn  ? dist.off()  : dist.on();
        delay.isOn ? delay.off() : delay.off();
    };
    ex0.onplay  = function() {
        metronome.on();
        beattimer.interval  = (amen.duration / 3) / beat;
        beattimer.on();
        pianotimer.interval = (amen.duration / 3) / piano;
        pianotimer.on();
        melotimer.interval  = (amen.duration / 3) / melo;
        melotimer.on();
    };
    ex0.onpause = function() {
        melotimer.off();
        pianotimer.off();
        beattimer.off();
        metronome.off();
    };
    
    ex0.$listener = T("rec", 100, 100).listen(ex0).off().set("overwrite", true);
    ex0.$view = ex0.$listener.buffer;
    ex0.$range = [-2.5, +2.5];
    
    ex0.$initUI = function() {
        Object.defineProperty(window, "beat", {
            set: function(value) {
                beat = value;
                beattimer.interval  = (amen.duration / 3) / beat;
            },
            get: function() { return beat; }
        });
        Object.defineProperty(window, "piano", {
            set: function(value) {
                piano = value;
                pianotimer.interval = (amen.duration / 3) / piano;
            },
            get: function() { return piano; }
        });
        Object.defineProperty(window, "melo", {
            set: function(value) {
                melo = value;
                melotimer.interval  = (amen.duration / 3) / melo;
            },
            get: function() { return melo; }
        });
        window.dist  = dist;
        window.delay = delay;
        
        if (timbre.env !== "webkit") $("#caution2").show();
        var isOpen = false;
        $("#read").on("click", function() {
            if (isOpen) {
                $(this).text("read");
                $("#list").hide(100);
            } else {
                $(this).text("close");
                $("#list").show(100);
            }
            isOpen = !isOpen;
        });
    };
    
    return ex0;
}());
