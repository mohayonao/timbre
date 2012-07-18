/**
 * Player
 * v12.07.18: first version
 */
"use strict";

var timbre = require("../timbre");
var node   = {};
// __BEGIN__

var ctimbre = null;

var CTimbrePlayer = function(sys) {
    var self = this;
    
    this.setup = function() {
        var samplerate, dx, onaudioprocess;
        
        timbre.fn._setupTimbre(44100);        
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
    this.timerId = 0;
    
    this.setup = function() {
        timbre.fn._setupTimbre(44100);
        
        this.interval = timbre.streamsize * 1000 / timbre.samplerate;
        
        this.onaudioprocess = function() {
            sys.process();
        }.bind(this);
        
        return this;
    };
    
    this.on = function() {
        if (this.timerId !== 0) {
            clearInterval(this.timerId);
        }
        this.timerId = setInterval(this.onaudioprocess, this.interval);
    };
    
    this.off = function() {
        if (this.timerId !== 0) {
            clearInterval(this.timerId);
        }
    }
    
    return this;
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
