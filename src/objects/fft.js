/**
 * FFT: 0.3.7
 * Fast Fourier transform
 * [ar-only]
 */

"use strict";

var timbre = require("../timbre");
timbre.utils = {
    FFT:require("../utils/fft")
};
// __BEGIN__

var FFT = (function() {
    var FFT = function() {
        initialize.apply(this, arguments);
    }, $this = FFT.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    timbre.fn.setPrototypeOf.call($this, "listener");
    
    Object.defineProperty($this, "size", {
        get: function() { return this._.buffersize >> 1; }
    });
    Object.defineProperty($this, "window", {
        set: function(value) {
            var f;
            if (typeof value === "string") {
                if ((f = FFT.WindowFunctions[value]) !== undefined) {
                    this._.window = value;
                    this._.windowfunc = f;
                }
            } else if (typeof value === "function") {
                this._.window = "function";
                this._.windowfunc = value;
            }
        },
        get: function() { return this._.window; }
    });
    Object.defineProperty($this, "interval", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number") {
                _.interval = value;
                _.interval_samples = (timbre.samplerate * (value / 1000))|0;
                if (_.interval_samples < _.buffersize) {
                    _.interval_samples = _.buffersize;
                    _.interval = _.buffersize * timbre.samplerate / 1000;
                }
            }
        },
        get: function() { return this._.interval; }
    });
    Object.defineProperty($this, "spectrum", {
        get: function() { return this._.spectrum; }
    });
    Object.defineProperty($this, "noSpectrum", {
        set: function(value) { this._.noSpectrum = !!value; },
        get: function() { return this._.noSpectrum; }
    });
    
    
    var initialize = function(_args) {
        var n, i, _;
        var sintable, costable, k;
        
        this._ = _ = {};

        i = 0;
        n = (typeof _args[i] === "number") ? _args[i++] : 512;
        if (n < 256) n = 256;
        else if (2048 < n) n = 2048;
        n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);
        
        if (typeof _args[i] === "number") {
            this.interval = _args[i++];    
        } else {
            this.interval = 100;
        }
        
        if (typeof _args[i] === "string" &&
            (FFT.WindowFunctions[_args[i]]) !== undefined) {
            this.window = _args[i++];
        } else {
            this.window = "Hann";
        }
        
        if (typeof _args[i] === "function") {
            this.onfft = _args[i++];
        }
        
        timbre.fn.valist.call(this, _args.slice(i));
        
        _.status   = 0;
        _.samples  = 0;
        _.buffersize = n;
        _.samplerate = timbre.samplerate;
        _.buffer = new Float32Array(n);
        _.index  = 0;
        
        _.fft = new timbre.utils.FFT(n);
        
        _.noSpectrum = false;
        _.spectrum   = new Float32Array(n>>1);
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("fft", _.buffersize);
        newone._.window     = _.window;
        newone._.windowfunc = _.windowfunc;
        newone._.interval   = _.interval;
        newone._.interval_samples = _.interval_samples;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, args, buffer, buffersize, mul, add;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            buffer     = _.buffer;
            buffersize = _.buffersize;
            mul  = _.mul;
            add  = _.add;
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            for (i = 0, imax = cell.length; i < imax; ++i) {
                if (_.samples <= 0) {
                    if (_.status === 0) {
                        _.status = 1;
                        _.index  = 0;
                        _.samples += _.interval_samples;                        
                    }
                }
                if (_.status === 1) {
                    buffer[_.index++] = cell[i];
                    if (buffersize <= _.index) {
                        if (_.ison) process.call(this, buffer);
                        _.status = 0;
                    }
                }
                cell[i] = cell[i] * mul + add;
                --_.samples;
            }
        }
        return cell;
    };
    
    var process = function(buffer) {
        var _ = this._;
        var fft, real, imag, windowfunc, spectrum;
        var sqrt, n, m, i, rval, ival, mag;
        
        fft = _.fft;
        windowfunc = _.windowfunc;
        
        for (i = n = fft.length; i--; ) {
            buffer[i] *= windowfunc(i / n);
        }
        fft.forward(buffer);
        real = fft.real;
        imag = fft.imag;
        
        // calc spectrum
        if (!_.noSpectrum) {
            sqrt = Math.sqrt;
            spectrum = _.spectrum;
            m = n >> 1;
            for (i = n; i--; ) {
                rval = real[i];
                ival = imag[i];
                mag  = n * sqrt(rval * rval + ival * ival);
                spectrum[i] = mag;
            }
        }
        
        timbre.fn.doEvent(this, "fft", [real, imag]);
    };
    
    $this.getWindowFunction = function(name) {
        return FFT.WindowFunctions[name];
    };
    
    $this.setWindowFunction = function(name, func) {
        if (typeof value === "function") {
            FFT.WindowFunctions[name] = func;
        }
    };
    
    return FFT;
}());
timbre.fn.register("fft", FFT);

FFT.WindowFunctions = {};
(function() {
    var PI2 = Math.PI * 2;
    FFT.WindowFunctions["Hann"] = function(x) {
        return 0.5 * (1 - Math.cos(PI2 * x));
    };
}());

// __END__
if (module.parent && !module.parent.parent) {
    describe("fft", function() {
        object_test(FFT, "fft", 128);
    });
}
