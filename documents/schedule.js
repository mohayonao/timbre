ex4 = (function() {
    timbre.utils.exports("atof");
    
    var array = T([[0, 0, -1], 0, 2, 0, -1]);
    array.value[0].repeat = 3;
    
    var scale = T("minor", atof("E2"), array);
    
    var synth = T("*", T("oscx", T("+", T("phasor", scale),
                                   T("osc", T("*", 0.5, scale)))),
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
        schedule.bpm += 5;
    };
    schedule.onlooped = function(count) {
        switch (count % 12) {
        case 0:
            array.add = 0;
            break;
        case 4:
            array.add = +3;
            break;
        case 6:
            array.add = 0;
            break;
        case 8:
            array.add = 4;
            break;
        case 9:
            array.add = 3;
            break;
        case 10:
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
}());
