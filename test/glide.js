tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth, glide, cnt = 0;

        glide = T("glide", 100, 880);
        synth = T("tri", glide);
        
        synth.onbang = function() {
            glide.value = (++cnt % 2) ? 1320 : 880;
        };
        
        return synth;
    }; tests[i++].desc = "glide";
    
    return tests;
}());
