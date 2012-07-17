tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, t1, t2, t3;
        
        synth = T("+");
        
        t1 = T("mml", "t160 o4 l4 $ a <c0e c0e> a <c0e c0e> g b0<d> b0<d> g b0<d> b0<d> g b0<d> b0<d> g+ b0<d> b0<d> a <c0e c0e> a <c0e c0e>");
        t1.synth = T("+").appendTo(synth);
        t1.synthdef = function(freq) {
            var synth = T("*", T("pulse", freq, 0.25),
                               T("adsr", "24db", 0, 500, 0.2, 250));
            synth.keyon = function() {
                synth.args[1].bang();
            };
            synth.keyoff = function() {
                synth.args[1].keyoff();
            };
            return synth;
        };
        
        t2 = T("mml", "t160 o6 l8 k64 $ [ag+ab<cd e2de d2c4> b2. | ba+b<c>b<c dcdedc >b2<cd e2.>]2 <f4e4d4c4>b4<c4 >b2.a2r4")
        t2.synth = T("efx.reverb", 600, 0.8, 0.6).appendTo(synth);
        t2.synthdef = function(freq) {
            var synth = T("*", T("fami", freq),
                               T("adsr", "24db", 10, 2500));
            synth.keyon = function() {
                synth.args[1].bang();
            };
            synth.keyoff = function() {
                synth.args[1].keyoff();
            };
            return synth;
        };
        
        t3 = T("mml", "t160 l4 $ cee c16c16c8ee");
        t3.synth = T("rhpf", 2400, 0.8).appendTo(synth);
        t3.synthdef = function(freq, options) {
            var synth;
            if (options.tnum === 60) {
                synth = T("*", T("pink", 0.2),
                               T("perc", "24db", 25));
            } else if (options.tnum === 64) {
                synth =  T("*", T("fnoise", 250, 0.8),
                                T("perc", "24db", 150));
            }
            synth.keyon = function() {
                synth.args[1].bang();
            };
            return synth;
        };
        
        var buddies = [t1, t2, t3];
        synth.buddy("play" , buddies, "on" );
        synth.buddy("pause", buddies, "off");
        synth.buddy("bang" , buddies);
        
        return synth;
    }; tests[i++].desc = "mml";

    tests[i] = function() {
        var synth, t1, t2, t3;
        
        synth = T("+");
        
        t1 = T("mml", "t120 o4 q2 $ f0a0<e4> f0a0<d4> f0a0<e8.> f0a0<d8.>f8 e0g0<d8>e0g0<d8> e0g0<c8>e8 e0g0<d8.> e0g0<c8.> e8");
        t1.synth = T("hpf", 1200).appendTo(synth);
        t1.synthdef = function(freq) {
            var synth = T("*", T("pulse", freq, 0.20),
                               T("adsr", "24db", 0, 500, 0.2, 500));
            synth.keyon = function() {
                synth.args[1].bang();
            };
            synth.keyoff = function() {
                synth.args[1].keyoff();
            };
            return synth;
        };
        
        t2 = T("mml", "t120 o5 l8 $ o5 ab<c>a <e.e.r rdedcdc>b");
        t2.synth = T("+").appendTo(synth).set({mul:1.0});
        t2.synthdef = function(freq) {
            var synth =  T("*", T("+" , T("konami", freq, 0.25), T("konami", freq + 5, 0.1)),
                                T("perc", "24db", 250));
            synth.keyon = function() {
                synth.args[1].bang();
            };
            return synth;
        };
        t2.onexternal = function(options) {
            t2.segno( (Math.random() * 6)|0 );
        };
        
        t3 = T("mml", "t120 $ c4e4c8c8e4 c4e4c8c8e4 c4e4c8c8e4 c4e4e8c8e8c16c16");
        t3.synth = T("efx.delay", 250, 0.75, T("rhpf", 2400, 0.8)).appendTo(synth);
        t3.synthdef = function(freq, options) {
            var synth;
            if (options.tnum === 60) {
                synth = T("*", T("pink", 0.4),
                               T("perc", "24db", 25));
            } else if (options.tnum === 64) {
                synth =  T("*", T("fnoise", 440, 0.6),
                                T("perc", "24db", 200));
            }
            synth.keyon = function() {
                synth.args[1].bang();
            };
            return synth;
        };
        
        synth.buddy("play" , [t1, t2, t3], "on" );
        synth.buddy("payse", [t1, t2, t3], "off");
        synth.buddy("bang" , [t1, t2, t3]);
        
        return synth;
    }; tests[i++].desc = "mml2";
    
    return tests;
}());
