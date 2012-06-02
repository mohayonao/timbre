ex4 = (function() {

    var num   = T(880);
    var synth = T("fami", num, 0.25);
    var timer = T("interval", 100, function() {
        num.value = (Math.random() * 2000) + 200;
    });
    
    synth.onplay = function() {
        timer.on();
    };
    synth.onpause = function() {
        timer.off();
    };
    
    return synth;
}());
