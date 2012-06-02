ex4 = (function() {

    var timerId;
    var glide = T("glide", "quartic.inout", 150, 880);
    var synth = T("fami", glide, 0.25);
    
    synth.onplay = function() {
        timerId = setInterval(function() {
            glide.value = (Math.random() * 2000) + 200;
        }, 250);
    };
    synth.onpause = function() {
        clearInterval(timerId);
    };
    
    return synth;
}());
