tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    
    tests[i] = function() {
        var synth = T("aux", T("audio", "/public/audio/amen.wav", true).load());

        var dist   = T("efx.dist");
        var reverb = T("efx.reverb", 150, 0.8, 0.5);
        var comp   = T("efx.comp");

        synth.list = [ dist, reverb ];
        
        var n = 0;
        synth.onbang = function() {
            synth.list = [
                [ reverb ],
                [ comp ],
                [ comp, dist ],
                [ dist ]
            ][n];
            n = (n + 1) % 4;
        };
        
        return synth;
    }; tests[i++].desc = "aux";
    
    return tests;
}());
