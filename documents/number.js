ex4 = (function() {

    var timerId;
    var num   = T(880);
    var synth = T("fami", num, 0.25);
    
    synth.onplay = function() {
        timerId = setInterval(function() {
            num.value = (Math.random() * 2000) + 200;
        }, 100);
    };
    synth.onpause = function() {
        clearInterval(timerId);
    };
    
    return synth;
}());
