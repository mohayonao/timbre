/**
 * window/player
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var WebKitPlayer = function(sys) {
    var ctx, node;

    ctx = new webkitAudioContext();
    timbre.samplerate = ctx.sampleRate;
    node = ctx.createJavaScriptNode(sys.streamsize, 0, sys.channels);
    
    node.onaudioprocess = function(e) {
        var inL, inR, outL, outR, i;
        sys.process();
        
        inL  = sys.L;
        inR  = sys.R;
        outL = e.outputBuffer.getChannelData(0);
        outR = e.outputBuffer.getChannelData(1);
        for (i = outL.length; i--; ) {
            outL[i] = inL[i];
            outR[i] = inR[i];
        }
    };
    
    return {
        on : function() {
            node.connect(ctx.destination);
        },
        off: function() {
            node.disconnect();
        }
    };
};

var NopPlayer = function(sys) {
    return {
        on : function() {},
        off: function() {}
    };
};

if (typeof webkitAudioContext === "function") {
    timbre.env = "webkit";
    timbre._sys.bind(WebKitPlayer);
} else {
    timbre._sys.bind(NopPlayer);
}

// __END__
