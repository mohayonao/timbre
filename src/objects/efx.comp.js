/**
 * EfxComp v12.07.15
 * v12.07.15: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxComp = (function() {
    
    var EfxComp = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(EfxComp, {
        base: "ar-only",
        properties: {
            thres: {
                set: function(value) {
                    var _ = this._;
                    if (typeof value === "number") {
                        _.thres  = value;
                        _.thres2 = value * value;
                    }
                },
                get: function() { return this._.thres; }
            },
            ratio: {
                set: function(value) {
                    var _ = this._;
                    if (typeof value === "number") {
                        _.ratio = value;
                        set_params.call(this, _.ratio, _.attack, _.release);
                    }
                },
                get: function() { return this._.ratio; }
            },
            attack: {
                set: function(value) {
                    var _ = this._;
                    if (typeof value === "number") {
                        _.attack = value;
                        set_params.call(this, _.ratio, _.attack, _.release);
                    }
                },
                get: function() { return this._.attack; }
            },
            release: {
                set: function(value) {
                    var _ = this._;
                    if (typeof value === "number") {
                        _.release = value;
                        set_params.call(this, _.ratio, _.attack, _.release);
                    }
                },
                get: function() { return this._.release; }
            },
            gain: {
                set: function(value) {
                    var _ = this._;
                    if (typeof value === "number") _.gain = value;
                },
                get: function() { return this._.gain; }
            }
        } // properties
    });
    
    var WINDOW_MSEC = 40;
    
    var initialize = function(_args) {
        var _ = this._ = {};

        var i, bits = Math.ceil(Math.log(timbre.samplerate * 0.04) * Math.LOG2E)
        
        _.buffer = new Float32Array(1<<bits);
        _.mask = _.buffer.length - 1;
        _.sum  = 0;
        _.avg  = 1 / _.buffer.length;
        
        _.thres = 0.2;
        _.ratio = 0.25;
        _.attack  = 20;
        _.release = 30;
        _.gain = 1.5;
        
        var i = 0;
        if (typeof _args[i] === "number") {
            _.thres  = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.ratio = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.gain = _args[i++];
        }
        
        _.idx = 0;
        _.xrt = 0;
        _.thres2 = _.thres * _.thres;
        _.ratio2 = 0;
        
        set_params.call(this, _.ratio, _.attack, _.release);
        
        this.args = timbre.fn.valist.call(this, _args.slice(i));
    };

    var set_params = function(ratio, attack, release) {
        var _ = this._;
        if (ratio > 0.999755859375) {
            ratio = 0.999755859375;
        } else if (ratio < 0) {
            ratio = 0;
        }
        _.adx = (1-ratio) / (attack  * timbre.samplerate / 1000);
        _.rdx = (1-ratio) / (release * timbre.samplerate / 1000);
        _.xrt = 1;
    }    
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var i, imax;
        
        var cell = this.cell;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            var args = this.args.slice(0);
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            if (_.ison) {
                var thres = _.thres;
                var ratio = _.ratio;
                var gain  = _.gain;
                
                var x, b = _.buffer, mask = _.mask;
                var idx = _.idx, sum = _.sum, avg = _.avg;
                var xrt = _.xrt, adx = _.adx, rdx = _.rdx;
                var thres2 = _.thres2;
                var rms2;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    x = cell[i];
                    
                    sum -= b[idx];
                    sum += b[idx] = x * x;
                    idx   = (++idx) & mask;
                    
                    rms2 = sum * avg;
                    
                    if (rms2 > thres2) {
                        if ((xrt -= adx) < ratio) xrt = ratio;
                    } else {
                        if ((xrt += rdx) > 1) xrt = 1;
                    }
                    if (xrt < 1) {
                        if (x > thres) {
                            x = +thres + (x - thres) * xrt;
                        } else if (x < -thres) {
                            x = -thres + (x + thres) * xrt;    
                        }
                    }
                    cell[i] = x * gain;
                }
                
                _.sum = sum;
                _.idx = idx;
                _.xrt = xrt;
            }
            
            var mul = _.mul, add = _.add;
            for (i = cell.length; i--; ) {
                cell[i] = cell[i] * mul + add;
            }
        }
        return cell;
    };
    
    return EfxComp;
}());
timbre.fn.register("efx.comp", EfxComp);

// __END__
if (module.parent && !module.parent.parent) {
    describe("efx.comp", function() {
        object_test(EfxComp, "efx.comp");
    });
}
