/**
 * window/player
 */
"use strict";

var timbre = require("../timbre");
var window = {};
// __BEGIN__

var WebKitPlayer = function(sys) {
    var ctx, node;

    ctx = new webkitAudioContext();
    timbre.samplerate = ctx.sampleRate;
    node = ctx.createJavaScriptNode(sys.streamsize, 1, sys.channels);
    
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

var MozPlayer = function(sys) {
    var audio, timer;
    var interval, interleaved;
    var onaudioprocess;
    
    audio = new Audio();
    audio.mozSetup(sys.channels, timbre.samplerate);
    timbre.samplerate = audio.mozSampleRate;
    timbre.channels   = audio.mozChannels;
    
    timer = new MutekiTimer();
    interval    = (sys.streamsize / timbre.samplerate) * 1000;
    
    interleaved = new Float32Array(sys.streamsize * sys.channels);
    
    onaudioprocess = function() {
        var inL, inR, i, j;
        audio.mozWriteAudio(interleaved);
        sys.process();
        
        inL  = sys.L;
        inR  = sys.R;
        
        i = interleaved.length;
        j = inL.length;
        while (j--) {
            interleaved[--i] = inR[j];            
            interleaved[--i] = inL[j];
        }
    };

    return {
        on : function() {
            timer.setInterval(onaudioprocess, interval);
        },
        off: function() {
            timer.clearInterval();
        }
    };
};

if (typeof webkitAudioContext === "function") {
    timbre.env = "webkit";
    timbre._sys.bind(WebKitPlayer);
} else if (typeof Audio === "function" && typeof (new Audio).mozSetup === "function") {
    timbre.env = "moz";
    timbre._sys.bind(MozPlayer);
}

// __END__
