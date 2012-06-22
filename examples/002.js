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

ex0 = (function() {
    "use strict";

    timbre.setup({samplerate:24000});
    
    var bpm = 132;
    var seq, s1, s2, hh, hh_env, sd, sd_env, bd, bd_env;
    var metro, drumkit, beam;

    // sequence
    seq = T("+");
    
    // sequence(1)
    s1 = function(freq) {
        var s1, env;
        s1 = T("*", T("fami", freq, 0.6),
                    T("*", T("pulse", 12), env = T("perc", 120))).appendTo(seq);
        env.addEventListener("~ended", function() {
            seq.remove(s1);
        }).bang();
    };
    s1.freqs = [ 880, 440, 880*2, 220, 880*2, 660, 880*2, 660 ];
    s1.i = 0;
    
    // sequence(2)
    s2 = function() {
        var s2, env;
        s2 = T("*", T("saw", T("ease", "cubic.out", 300, 880*4, 220).bang(), 0.4),
                    env = T("perc", 300)).appendTo(seq);
        env.addEventListener("~ended", function() {
            seq.remove(s2);
        }).bang();
    };
    s2.i = 1;
    
    // hihat
    hh = T("*", T("hpf", 8000, T("noise")),
                hh_env = T("perc", "32db", 30));
    hh.i = 2;
    
    // snare
    sd = T("*", T("rlpf", 5000, 0.4, T("pink")),
                sd_env = T("perc", "32db", 120));
    sd.i = 3;
    
    // bass drum
    bd = T("clip", T("*", T("rlpf", 40, 0.5, T("pulse", 40, 2)),
                          bd_env = T("perc", "32db", 60)));
    bd.i = 4;
    
    // metro    
    metro = T("interval", timbre.utils.bpm2msec(bpm, 16), function() {
        var i = metro.count % p[0].length;
        
        if (p[s1.i][i]) s1(s1.freqs[i & 7]);
        if (p[s2.i][i] || beam) s2();
        beam = false;
        
        if (p[hh.i][i]) {
            hh_env.mul = [0.4, 0.6][i & 1];
            hh_env.bang();
        }
        if (p[sd.i][i]) {
            sd_env.mul = [0.4, 0.2][i & 1];
            sd_env.d   = [180, 120][i & 1];
            sd_env.bang();
        }
        if (p[bd.i][i]) {
            bd_env.bang();
        }
    });
    
    // drumkit
    drumkit = T("dac", seq, hh, sd, bd);

    drumkit.onbang = function() {
        beam = true;
    };
    
    drumkit.onplay = function() {
        metro.on();
    };
    drumkit.onpause = function() {
        metro.off();
    };
    
    var ex0 = drumkit;
    ex0.$listener = T("rec", 1818, 1818).listen(ex0).set("overwrite", true);
    ex0.$view = ex0.$listener.buffer;
    ex0.$range = [-2, +2];
    
    ex0.$initUI = function() {
        var elem = document.getElementById("p");
        var div, x, i, j;
        for (i = 0; i < p.length; i++) {
            div = $(document.createElement("div"));
            div.append($(document.createElement("label")).text(["S1","S2","HH","SD","BD"][i]));
            for (j = 0; j < p[i].length; j++) {
                x = $(document.createElement("input")).attr("type", "checkbox")
                    .on("click", (function(i, j) {
                        return function() {
                            p[i][j] = $(this).attr("checked") ? 1 : 0;
                        };
                    }(i, j)));
                if (p[i][j]) x.attr("checked", true);
                if (j === 15) {
                    x.css("margin-right", "25px");
                } else if (j % 4 === 3) {
                    x.css("margin-right", "10px");
                }
                div.append(x);
            }
            div.appendTo(elem);
        }
    };
    
    return ex0;
}());
