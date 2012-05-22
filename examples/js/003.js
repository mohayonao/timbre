ex1 = (function() {
    "use strict";
    
    var ex1;
    var amen, dist, bass, timer, path;
    
    var _3rd  = 1.2599210; // Math.pow(2, 4/12)
    var _5th  = 1.4983071; // Math.pow(2, 7/12)
    var _6th  = 1.6817928; // Math.pow(2, 9/12)        
    var _7th  = 1.8877486; // Math.pow(2,11/12)
    var _1oct = 2;    
    var _9th  = 2.2449241; // Math.pow(2,14/12)
    
    
    var chordtone, basstone;
    
    timbre.workerpath = "../timbre.js";
    timbre.utils.exports("converter");
    
    path = ".";
    if (timbre.workerpath) {
        path += location.pathname.substr(0, location.pathname.lastIndexOf("/"));
    }
    path += "/audio/amen.wav";
    
    
    // amen
    amen = T("wav", path, true).load();
    amen.onloadend = function(res) {
        console.log("loadend", amen.duration);
    };
    dist = T("efx.dist", -30, 12, 3200, amen);
    
    
    // chord
    chordtone = wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
    
    function playchord(freq, mode) {
        var synth, chord, tens, env;
        
        tens = [[ _5th, _7th ], [ _6th, _9th  ],
                [ _7th, _9th ], [ _6th, _1oct ]][mode];
        
        chord = T("+");        
        chord.append(T("osc", chordtone, freq          , 0, 0.25));
        chord.append(T("osc", chordtone, freq * tens[0], 0, 0.25));
        chord.append(T("osc", chordtone, freq * tens[1], 0, 0.25));
        
        synth = T("rLPF",
                  T("pulse", msec2Hz(amen.duration / 3), 0, 800, freq * 1.25, 0.8).kr(),
                    T("*", chord, T("sin", 5).kr(), env = T("adsr", 4000, 2000)));
        synth.dac = ex1;
        
        env.addEventListener("~ended", function() {
            synth.dac.remove(synth);
        }).bang();
    }
    
    
    // bass
    basstone = wavb("8084B0D800101C1C283C3C48404C5868585C444850747C7C6C60544C403C240C0C0C243C404C54606C7C7C745048445C5868584C40483C3C281C1C1000D8B084");
    
    bass = T("rLPF", 400, 0.5, 0.8,
             T("*", T("+", T("osc", basstone, 0, 0, 0.25), T("osc", basstone, 0, 0, 0.20)),
                    T("adsr", 20, 500, 0.4)));
    bass.tone1 = bass.args[0].args[0].args[0];
    bass.tone2 = bass.args[0].args[0].args[1];
    bass.env   = bass.args[0].args[1];
    bass.phrase = [ _3rd, _5th, _6th, _3rd, _5th, _7th, _3rd, _5th ];    
    bass.root   = 0;
    bass.i      = 0;
    
    
    // algorithm composition
    var tim, cnt = 0, stay = 0;
    var beat_table = [0, 3, 6, 12, 24, 48, 96, 192];
    var beat = beat_table[4];
    
    timer = T("interval", function(i) {
        // for amen
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
    }, function(i) {
        // for chord and bass
        var freq;
        
        if (!(i & 7)) {        
            if (!(i & 127)) {
                freq = Math.random() * 660 + 220;
                playchord(freq, (i % 2048 / 512)|0);
                bass.root = freq;
                bass.i    = 0;
                while (bass.root > 82.5) bass.root /= 2;
            }
            
            bass.tone1.freq.value = bass.root * bass.phrase[bass.i];
            bass.tone2.freq.value = bass.root * bass.phrase[bass.i] * 0.996396;
            bass.env.bang();
            bass.i += 1;
            if (bass.i >= bass.phrase.length) bass.i = 0;
        }
    });
    
    
    // exports
    ex1 = dist.dac;
    ex1.append(bass);
    
    ex1.onplay = function() {
        timer.interval = amen.duration / 192;
        timer.on();
    };
    ex1.onpause = function() {
        timer.off();
    };
    
    ex1.bridge = {
        change_beat: function(_beat) {
            if (beat !== beat_table[_beat]) {
                beat = beat_table[_beat];
                console.log(beat);
            }
        }
    };
    
    return ex1;
}());
