tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    // tests.require = ["/draft/scale.js", "/draft/schedule.js"];
    
    tests[i] = function() {
        var array = T([[0, 0, -1], 0, 2, 1, -1]);
        array.value[0].repeat = 3;
        
        var scale = T("minor", timbre.utils.atof("E2"), array);
        
        var synth = T("*", T("sinx", T("+", T("phasor", scale),
                                            T("sinx", T("phasor", T("*", 0.5, scale))))),
                           T("perc", 300).set({mul:0.8}));
        
        array.onbang = function() {
            synth.args[1].bang();
        };

        var schedule = T("schedule", "bpm(134, 16)", [
            [ 0, array], [ 2, array], [ 3, array],
            [ 4, array], [ 6, array], [ 7, array],
            [ 8, array], [10, array], [11, array],
            [12, array], [13, array], [14, array], [15, array], [16]
        ], true);
        
        synth.onbang = function() {
            if (schedule.getSchedules(2)[0]) {
                schedule.remove([2, array]);
            } else {
                schedule.append([2, array]);
            }
        };
        schedule.onlooped = function(count) {
            switch (count % 8) {
            case 4:
                array.add = -1;
                break;
            case 6:
                array.add = 0;
                break;
            }
        };
        
        synth.onplay = function() {
            schedule.on();
        };
        synth.onpause = function() {
            schedule.off();
        };
        synth.onon = function() {
            schedule.on();
        };
        synth.onoff = function() {
            schedule.off();
        };
        
        return synth;
    }; tests[i++].desc = "schedule";
    
    
    tests[i] = function() {
        timbre.utils.exports("random.choice");
        
        var synth = T("efx.comp");
        
        function hh(vol, len) {
            var tone = T("*", T("hpf", 8000, T("noise")),
                              T("perc", len || 30).set("mul", vol).bang());
            tone.args[1].onended = function() {
                synth.remove(tone);
            };
            synth.append(tone);
        }
        function sd(vol, len) {
            var tone = T("*", T("rlpf", 5000, 0.4, T("noise")),
                              T("perc", len || 120).set("mul", vol).bang());
            tone.args[1].onended = function() {
                synth.remove(tone);
            };
            synth.append(tone);
        };
        function bd(vol) {
            var tone = T("*", T("rlpf", 120, 0.95, T("pulse", 20), T("sin", 40, 2)),
                              T("perc", 60).set("mul", vol).bang());
            tone.args[1].onended = function() {
                synth.remove(tone);
            };
            synth.append(tone);
        };
        
        var hh_schs = [
            [ [0, hh, [0.8]], [1, hh, [0.2]], [2, hh, [0.6]], [3, hh, [0.3]],
              [4, hh, [0.8]], [5, hh, [0.3]], [6, hh, [0.5, 180]] ],
            [ [0, hh, [0.8]], [2, hh, [0.4, 140]],
              [4, hh, [0.8]], [6, hh, [0.4, 140]] ],
            [ [0, hh, [0.8]], [1, hh, [0.2]], [2, hh, [0.6]],
              [5, hh, [0.3]], [6, hh, [0.4]], [6.5, hh, [0.25]], [7, hh, [0.3]] ],
            [ [0, hh, [0.8, 140]], [1.3, hh, [0.3]], [2.6, hh, [0.5]],
              [4, hh, [0.8, 140]], [5.3, hh, [0.3]], [6.6, hh, [0.5]] ]
        ];
        var hh_sch = choice(hh_schs);
        var sd_sch = [
            [4, sd, [0.8]],
        ];
        var bd_sch = [
            [0, bd], [4, bd],
        ];
        
        var sch = T("schedule", "bpm(120)", [[8]], true);
        sch.append(hh_sch, bd_sch, sd_sch).bang();
        
        synth.onbang = function() {
            sch.remove(hh_sch);
            hh_sch = choice(hh_schs);
            sch.append(hh_sch);
        };
        
        synth.onplay = function() {
            sch.on();
        };
        synth.onpause = function() {
            sch.off();
        };
        
        return synth;
    }; tests[i++].desc = "schedule drumming";
    

    tests[i] = function() {
        timbre.utils.exports("random.choice");
        
        var synth = T("+");
        
        function hh(vol) {
            var tone = T("*", T("hpf", 8000, T("noise")),
                              T("perc", 30).set("mul", vol).bang());
            tone.args[1].onended = function() {
                synth.remove(tone);
            };
            synth.append(tone);
        }
        function sd(vol) {
            var tone = T("*", T("rlpf", 5000, 0.4, T("noise")),
                              T("perc", 120).set("mul", vol).bang());
            tone.args[1].onended = function() {
                synth.remove(tone);
            };
            synth.append(tone);
        };
        function bd(vol) {
            var tone = T("*", T("rlpf", 120, 0.95, T("pulse", 20), T("sin", 40, 2)),
                              T("perc", 60).set("mul", vol).bang());
            tone.args[1].onended = function() {
                synth.remove(tone);
            };
            synth.append(tone);
        };
        
        var hh_sch = [
            [0, function() {
                var x, vol;
                if (this[0] !== this[0]|0) {
                    x = 0.5;
                    vol = 0.4;
                } else {
                    x = choice([0.5,1,1,1,1,2,2,2,4,8]);
                    vol = 0.8;
                }
                this[0] += x
                hh(vol);
                sch.update();
            }]
        ];
        var sd_sch = [
            [4, function() {
                sd(1);
                this[0] += 8;
                sch.update();
            }]
        ];
        var bd_sch = [
            [0, function() {
                bd(1);
                this[0] += 4;
                sch.update();
            }]
        ];
        
        var sch = T("schedule", "bpm(120)", false);
        sch.append(hh_sch, bd_sch, sd_sch);
        
        synth.onplay = function() {
            sch.on();
        };
        synth.onpause = function() {
            sch.off();
        };
        
        return synth;
    }; tests[i++].desc = "schedule drumming";
    
    return tests;
}());
