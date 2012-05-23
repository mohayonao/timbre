ex1 = (function() {
    "use strict";
    
    var ex1;
    var amen, dist, bass, timer;
    var freq, beat, bassphrase;
    
    var _2nd_ = Math.pow(2, 3/12);
    var _5th_ = Math.pow(2, 8/12);
    
    
    timbre.workerpath = "../timbre.js";
    timbre.utils.exports("converter"); // use msec2Hz
    timbre.utils.exports("tension");   // use _1st .. _11th
    
    
    // timer
    timer = T("interval", function(i) {
        if (!(i & 127)) freq = Math.random() * 660 + 220;
    });
    
    // amen (load a wav file and decode it)
    amen = T("wav", "./audio/amen.wav", true).load(function(res) {
        timer.interval = this.duration / 192;
    });
    dist = T("efx.dist", -30, 12, 3200, amen);
    
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
    
    
    // chord
    var chordtone = timbre.utils.wavb("8084888C90989CA4ACB8C0CCE0002C50707C7C78746858483C3024181004F8E0E4E0F804101824303C48586874787C7C70502C00E0CCC0B8ACA49C98908C8884");
    
    function playchord(freq, mode) {
        var synth, chord, tens, lpfFreq, env;
        
        tens = [[ _5th, _7th ], [ _6th, _9th  ],
                [ _7th, _9th ], [ _6th, _1oct ]][mode];
        
        chord = T("+");        
        chord.append(T("osc", chordtone, freq          , 0, 0.25));
        chord.append(T("osc", chordtone, freq * tens[0], 0, 0.25));
        chord.append(T("osc", chordtone, freq * tens[1], 0, 0.25));
        
        lpfFreq = T("pulse", msec2Hz(amen.duration / 3),
                             0, 800, freq * 1.25, 0.8).kr();
        
        synth = T("rLPF", lpfFreq,
                    T("*", chord,
                           T("sin", 5).kr(),
                           T("adsr", 4000, 2000)));
        env = synth.args[0].args[2];
        synth.dac = ex1;
        
        env.addEventListener("~ended", function() {
            synth.dac.remove(synth);
        }).bang();
    }
    
    timer.append(function(i) {
        if (!(i & 127)) {
            playchord(freq, (i % 2048 / 512)|0);
        }
    });
    
    
    // bass
    var basstone = timbre.utils.wavb("8084B0D800101C1C283C3C48404C5868585C444850747C7C6C60544C403C240C0C0C243C404C54606C7C7C745048445C5868584C40483C3C281C1C1000D8B084");
    
    bass = T("rLPF", 400, 0.5, 0.8,
             T("*", T("+", T("osc", basstone, 0, 0, 0.25),
                           T("osc", basstone, 0, 0, 0.20)),
                    T("adsr", 20, 500, 0.4)));
    
    (function() {
        var tone1, tone2, env, phrase, root, index;
        var pattern;
        
        tone1 = bass.args[0].args[0].args[0];
        tone2 = bass.args[0].args[0].args[1];
        env   = bass.args[0].args[1];
        index = root = 0;
        
        timer.append(function(i) {
            if (!(i & 7)) {
                if (!(i & 127)) {
                    root  = freq;
                    while (root > 82.5) root /= 2;
                    index = 0;
                }
                if (index >= bassphrase.length) {
                    index %= bassphrase.length;
                }
                tone1.freq.value = root * bassphrase[index];
                tone2.freq.value = root * bassphrase[index] * 0.996396;
                env.bang();
                index += 1;
            }
        });
    }());
    
    // exports
    ex1 = dist.dac;
    ex1.append(bass);
    
    ex1.onplay = function() {
        timer.on();
        
        if (Math.random() < 0.75) {
            dist.on();
        } else {
            dist.off();
        }
        
        beat = [ 0, 0, 6, 6, 6, 12, 12, 24, 24, 48 ];
        beat = beat[ (Math.random() * beat.length)|0 ];
        
        bassphrase = [ [ _3rd, _5th , _6th , _3rd , _5th , _7th, _3rd , _5th  ],
                       [ _3rd, _5th , _6th , _3rd , _5th , _7th, _3rd , _5th  ],
                       [ _3rd, _5th , _6th , _3rd , _5th , _7th, _3rd , _5th  ],
                       
                       [ _3rd, _1oct, _2nd , _5th , _1oct, _7th, _3rd , _1oct ],
                       [ _3rd, _1oct, _2nd , _5th , _1oct, _7th, _3rd , _1oct ],
                       
                       [ _3rd, _9th , _3rd , _2nd , _1oct, _3rd, _9th , _3rd  ],
                       [ _3rd, _6th , _5th_, _2nd , _1st , _5th, _2nd , _2nd_ ],
                       [ _3rd, _3rd , _2nd , _5th , _5th , _2nd, _9th , _2nd_ ],
                     ];
        bassphrase = bassphrase[ (Math.random() * bassphrase.length)|0 ];
    };
    ex1.onpause = function() {
        timer.off();
    };
    
    return ex1;
}());
