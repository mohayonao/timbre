var p = [
    [ 1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,
      0, 1, 0, 0,  1, 0, 1, 0,  0, 0, 1, 0,  1, 0, 1, 1, ],
    [ 0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0, ],
    [ 1, 0, 0, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 0, 0,
      1, 0, 0, 0,  1, 0, 1, 0,  0, 1, 1, 0,  0, 0, 0, 0, ],
    [ 0, 0, 0, 0,  1, 0, 0, 1,  0, 0, 0, 0,  1, 0, 0, 0,
      0, 0, 0, 0,  1, 0, 0, 1,  0, 0, 1, 0,  0, 0, 1, 0, ],
    [ 1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1,  0, 0, 0, 0,
      1, 0, 0, 0,  0, 0, 1, 0,  0, 1, 0, 0,  1, 0, 0, 0, ],
];

ex1 = (function() {
    "use strict";
    
    var bpm = 132, msec = (60 / bpm) * (4 / 16) * 1000;
    var s1, s2, hh, hh_env, sd, sd_env, bd, bd_env;
    var interval, drumkit;
    
    // sequence(1)
    s1 = function(freq) {
        var s1, env;
        s1 = T("*", T("fami", freq, 0.6),
                    T("*", T("pulse", 12), env = T("perc", 120))).play();
        env.addEventListener("~ended", function() {
            s1.pause();
        }).bang();
    };
    s1.freqs = [ 880, 440, 880*2, 220, 880*2, 660, 880*2, 660 ];
    s1.i = 0;
    
    // sequence(2)
    s2 = function() {
        var s2, env;
        s2 = T("*", T("saw", T("ease", "cubic.out", 300, 880*4, 220).bang(), 0.4),
                    env = T("perc", 300)).play();
        env.addEventListener("~ended", function() {
            s2.pause();
        }).bang();
    };
    s2.i = 1;
    
    // hihat
    hh = T("*", T("hpf", 8000, T("noise")),
                hh_env = T("perc", 30));
    hh.i = 2;
    
    // snare
    sd = T("*", T("rlpf", 5000, 0.4, T("noise")),
                sd_env = T("perc", 120));
    sd.i = 3;

    // bass drum
    bd = T("*", T("rlpf", 40, 0.5, T("pulse", 40, 2)),
                bd_env = T("perc", 60));
    bd.i = 4;
    
    // interval    
    interval = T("interval", msec, function(i) {
        i %= p[0].length;
        
        if (p[s1.i][i]) s1(s1.freqs[i & 7]);
        if (p[s2.i][i]) s2();
        
        if (p[hh.i][i]) {
            hh_env.mul = [0.2, 0.4][i & 1];
            hh_env.bang();
        }
        if (p[sd.i][i]) {
            sd_env.mul = [0.6, 0.4][i & 1];
            sd_env.d   = [180, 120][i & 1];
            sd_env.bang();
        }
        if (p[bd.i][i]) {
            bd_env.bang();
        }
    });
    
    // drumkit
    drumkit = T("dac", hh, sd, bd);
    
    drumkit.onplay = function() {
        interval.on();
    };
    drumkit.onpause = function() {
        interval.off();
    };
    
    return drumkit;
}());
