/**
 * FFT
 * Fast Fourier transform
 * v 0. 1. 0: first version
 * v12.07.18: use timbre.utils.FFT
 */

"use strict";

var timbre = require("../timbre");
timbre.utils.FFT = require("../utils/fft");

// __BEGIN__

var FFT = (function() {
    var FFT = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(FFT, {
        base: ["ar-only", "listener"],
        properties: {
            size: {
                get: function() { return this._.buffersize >> 1; }
            },
            window: {
                set: function(value) {
                    var f;
                    if (typeof value === "string") {
                        var m = /([A-Z][a-z]+)(?:([01]\.?\d*))?/.exec(value);
                        if (m !== null) {
                            var name = m[1], a = m[2] !== undefined ? +m[2] : 0.25;
                            if ((f = timbre.utils.FFT.WindowFunctions[name]) !== undefined) {
                                this._.window = name;
                                this._.fft.setWindow(name, a);
                            }
                        }
                        
                    }
                },
                get: function() { return this._.window; }
            },
            interval: {
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
            },
            spectrum: {
                get: function() { return this._.spectrum; }
            },
            noSpectrum: {
                set: function(value) { this._.noSpectrum = !!value; },
                get: function() { return this._.noSpectrum; }
            }
        } // properties
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
        
        _.fft = new timbre.utils.FFT(n);
        
        if (typeof _args[i] === "number") {
            this.interval = _args[i++];    
        } else {
            this.interval = 100;
        }
        
        if (typeof _args[i] === "string" &&
            (timbre.utils.FFT.WindowFunctions[_args[i]]) !== undefined) {
            this.window = _args[i++];
        } else {
            this.window = "Hann";
        }
        
        if (typeof _args[i] === "function") {
            this.onfft = _args[i++];
        }
        
        this.args = _args.slice(i).map(timbre);
        
        _.status   = 0;
        _.samples  = 0;
        _.buffersize = n;
        _.samplerate = timbre.samplerate;
        _.buffer = new Float32Array(n);
        _.index  = 0;
        
        _.noSpectrum = false;
        _.spectrum   = new Float32Array(n>>1);
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("fft", _.buffersize);
        newone._.window   = _.window;
        newone._.interval = _.interval;
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
        var fft, real, imag, spectrum;
        var sqrt, n, m, i, rval, ival, mag;
        
        fft = _.fft;
        
        fft.forward(buffer);
        real = fft.real;
        imag = fft.imag;
        
        // calc spectrum
        if (!_.noSpectrum) {
            sqrt = Math.sqrt;
            spectrum = _.spectrum;
            n = buffer.length;
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
    
    return FFT;
}());
timbre.fn.register("fft", FFT);


// __END__
if (module.parent && !module.parent.parent) {
    describe("fft", function() {
        object_test(FFT, "fft", 128);
    });
}
