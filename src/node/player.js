/**
 * Player: v12.07.14
 * v12.07.14: first version
 */
"use strict";

var timbre = require("../timbre");
var node   = {};
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

var ctimbre = null;

var CTimbrePlayer = function(sys) {
    var self = this;
    
    this.setup = function() {
        var samplerate, dx, onaudioprocess;
        
        setupTimbre(44100);
        this.jsnode = new ctimbre.JavaScriptOutputNode(timbre.streamsize);
        samplerate = this.jsnode.sampleRate;
        this.streamsize = timbre.streamsize;
        console.log("streamsize", this.streamsize);
        
        if (timbre.samplerate === samplerate) {
            onaudioprocess = function(e) {
                var inL, inR, outL, outR, i;
                sys.process();
                
                inL  = sys.L;
                inR  = sys.R;
                outL = e.getChannelData(0);
                outR = e.getChannelData(1);
                for (i = e.bufferSize; i--; ) {
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
                outL = e.getChannelData(0);
                outR = e.getChannelData(1);
                outLen = outL.length;
                
                streamsize = self.streamsize;
                x = self.x;
                prevL = self.prevL;
                prevR = self.prevR;
                for (i = 0, imax = e.bufferSize; i < imax; ++i) {
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
        this.jsnode.onaudioprocess = onaudioprocess;
        
        return this;
    };
    
    this.on = function() {
        this.x = this.streamsize;
        this.prevL = this.prevR = 0;
        this.jsnode.start();
    };
    this.off = function() {
        this.jsnode.stop();
    };
};

var NopPlayer = function(sys) {
     this.setup = this.on = this.off = function() {};
};


try {
    ctimbre = require("ctimbre");
} catch (e) {
    ctimbre = null;
}

if (ctimbre !== null) {
    timbre.env = "ctimbre";
    timbre.sys.bind(CTimbrePlayer);
} else {
    timbre.env = "nop";
    timbre.sys.bind(NopPlayer);
}

// __END__
