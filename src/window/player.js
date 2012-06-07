/**
 * window/player
 */
"use strict";

var timbre = require("../timbre");
var window = {};
// __BEGIN__

var setupTimbre = function(defaultSamplerate) {
    switch (timbre.samplerate) {
    case  8000: case 11025: case 12000:
    case 16000: case 22050: case 24000:
    case 32000: case 44100: case 48000:
        break;
    default:
        timbre.samplerate = defaultSamplerate;
    }
    
    switch (timbre.channels) {
    default:
        timbre.channels = 2;
    }
    
    switch (timbre.cellsize) {
    case 64: case 128:
    case 256: case 512:
        break;
    default:
        timbre.cellsize = 128;
    }
    
    switch (timbre.streamsize) {
    case  512: case 1024: case 2048:
    case 4096: case 8192:
        break;
    default:
        timbre.streamsize = 1024;
    }
};


var WebKitPlayer = function(sys) {
    var self = this;
    var ctx, onaudioprocess;
    var samplerate, dx;
    
    ctx = new webkitAudioContext();
    samplerate = ctx.sampleRate;
    
    this.setup = function() {
        setupTimbre(samplerate);
        this.streamsize = timbre.streamsize;
        
        if (timbre.samplerate === samplerate) {
            onaudioprocess = function(e) {
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
        } else {
            dx = timbre.samplerate / samplerate;
            onaudioprocess = function(e) {
                var inL, inR, outL, outR, outLen;
                var streamsize, x, prevL, prevR;
                var index, delta, x0, x1, xx;
                var i, imax;
                
                inL = sys.L;
                inR = sys.R;
                outL = e.outputBuffer.getChannelData(0);
                outR = e.outputBuffer.getChannelData(1);
                outLen = outL.length;
                
                streamsize = self.streamsize;
                x = self.x;
                prevL = self.prevL;
                prevR = self.prevR;
                for (i = 0, imax = outL.length; i < imax; ++i) {
                    if (x >= streamsize) {
                        sys.process();
                        x -= streamsize;
                    }
                    
                    index = x|0;
                    delta = 1- (x - index);
                    
                    x1 = inL[index];
                    xx = (1.0 - delta) * prevL + delta * x1;
                    prevL = x1;
                    outL[i] = xx;
                    
                    x1 = inR[index];
                    xx = (1.0 - delta) * prevR + delta * x1;
                    prevR = x1;
                    outR[i] = xx;
                    
                    x += dx;
                }
                self.x = x;
                self.prevL = prevL;
                self.prevR = prevR;
            };
        }
        
        return this;
    };
    
    this.on = function() {
        this.x = this.streamsize;
        this.prevL = this.prevR = 0;
        this.node = ctx.createJavaScriptNode(sys.streamsize, 1, sys.channels);
        this.node.onaudioprocess = onaudioprocess;
        this.node.connect(ctx.destination);
    };
    this.off = function() {
        this.node.disconnect();
        this.node = null;
    };
    
    return this.setup();
};

var MozPlayer = function(sys) {
    var timer = new MutekiTimer();
    
    this.setup = function() {
        var self = this;
        
        setupTimbre(44100);
        
        this.audio = new Audio();
        this.audio.mozSetup(timbre.channels, timbre.samplerate);
        timbre.samplerate = this.audio.mozSampleRate;
        timbre.channels   = this.audio.mozChannels;
        
        this.interval = (timbre.streamsize / timbre.samplerate) * 1000;
        this.interleaved = new Float32Array(timbre.streamsize * timbre.channels);
        
        this.onaudioprocess = function() {
            var interleaved;
            var inL, inR, i, j;
            
            interleaved = self.interleaved;
            self.audio.mozWriteAudio(interleaved);
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
        
        return this;
    };
    
    this.on = function() {
        timer.setInterval(this.onaudioprocess, this.interval);
    };
    
    this.off = function() {
        var interleaved = this.interleaved;
        for (var i = interleaved.length; i--; ) {
            interleaved[i] = 0.0;
        }
        timer.clearInterval();
    }
    
    return this.setup();
};

if (typeof webkitAudioContext === "function") {
    timbre.env = "webkit";
    timbre.sys.bind(WebKitPlayer);
} else if (typeof Audio === "function" && typeof (new Audio).mozSetup === "function") {
    timbre.env = "moz";
    timbre.sys.bind(MozPlayer);
}

// __END__
