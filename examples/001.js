// hello, sinewave!!
ex0 = (function() {
    return T("sin", 1320);
}());


// 880Hz pulse with tremolo(10Hz)
ex1 = (function() {
    return T("*", T("pulse", 880, 0.2),
                  T("tri", 10, 0.6, 0.8).kr());
}());


// 660Hz triangle with vibrato(5Hz)
ex2 = (function() {
    return T("tri", T("sin", 5, 20, 660).kr());
}());


// computer noise
ex3 = (function() {
    var tone, timerId;
    
    tone = T("fami", 880);
    
    tone.onplay = function() {
        timerId = setInterval(function() {
            tone.freq = (Math.random() * 2000) + 200;
        }, 100);
    };
    tone.onpause = function() {
        clearInterval(timerId);
    };
    return tone;
}());


// chords
ex4 = (function() {
    var c1, c2, c3, c_env, b0, b_env;
    var player, chords = [
        [ 698.456, 880.000, 1318.510, 349.228 ], // FM7  = F A E / F
        [ 783.456, 987.766, 1174.659, 349.228 ], // G7/F = G B D / F
        [ 783.456, 987.766, 1174.659, 329.627 ], // Em7  = G B D / E
        [ 659.255, 783.456, 1046.502, 440.000 ], // Am7  = E G C / A
        [ 698.456, 880.000, 1318.510, 349.228 ], // FM7  = F A E / F
        [ 783.456, 987.766, 1174.659, 349.228 ], // G7/F = G B D / F
        [ 830.609, 987.766, 1396.129, 329.627 ], // E9   = G#B F / E
        [ 880.000,1046.502, 1318.510, 440.000 ], // Am   = A C E / A
    ]; chords.index = 0;
    
    player = T("+", T("*", c_env = T("adsr", 20, 1740, 0.5),
                           T("+", c1 = T("konami"),
                                  c2 = T("konami"),
                                  c3 = T("konami"))),
                          T("*", b_env = T("adsr", 0, 220),
                                 b = T("pulse")));
    
    player.onplay = function() {
        chords.index = 0;
        c_env.bang();
    };
    
    c_env.onbang = function() {
        c1.freq = chords[chords.index][0] / 2;
        c2.freq = chords[chords.index][1] / 2;
        c3.freq = chords[chords.index][2] / 2;
        b .freq = chords[chords.index][3] / 2;
        chords.index = ++chords.index % chords.length;
        b_env.bang();
    };
    c_env.onS = function() {
        c_env.bang();
    };
    b_env.onended = function() {
        b_env.bang();
    };
    player.mul = 0.25;
    
    return player;
}());    
