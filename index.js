window.onload = function() {
    prettyPrint();
    
    var cid   = -1;
    var synth = null;
    
    window.play = function(id) {
        if (cid !== id) {
            cid = id;
            if (synth !== null) {
                synth.pause();
            }
            if (id === -1) {
                timbre.dacs.removeAll();
            } else {
                synth = synthdef[id]().play();
            }
        }
    };

    var synthdef = [
        function() {
            return T("sin", 440);
        },
        function() {
            return T("+", T("sin", 523.35),
                          T("sin", 659.25),
                          T("sin", 783.99)).set({mul: 0.25});
        },
        function() {
            return T("*", T("+", T("sin", 523.35),
                                 T("sin", 659.25),
                                 T("sin", 783.99)).set({mul: 0.25}),
                          T("+tri", 8),
                          T("perc", 15000).bang());
        },
        function() {
            var mml   = T("mml", "t116 o3 $ l2 g l1 <b0<d0f+>> l2 d l1 <a0<c+0f+>>");
            
            mml.synth = T("efx.reverb");
            mml.synthdef = function(freq, opts) {
                var synth = T("*", T("+", T("tri", freq + 1, 0.25),
                                          T("tri", freq - 1, 0.25)),
                                   T("adsr", "24db", 100, 2500, 0.6, 1500));
                synth.keyon = function(opts) {
                    synth.args[1].bang();
                };
                synth.keyoff = function(opts) {
                    synth.args[1].keyoff();
                };
                return synth;
            };
            
            mml.synth.onplay = function() {
                mml.on().bang();
            };
            mml.synth.onpause = function() {
                mml.off();
            };
            
            return mml.synth;
        },
    ];
};
