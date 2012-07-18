/**
 * EfxDelay
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxDelay = (function() {
    var EfxDelay = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(EfxDelay, {
        base: "ar-only",
        properties: {
            time: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        _.time = val;
                        set_params.call(this, _.time, this._.fb, _.wet);
                    }
                },
                get: function() { return this._.time; }
            },
            fb: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        _.fb = val;
                        set_params.call(this, _.time, _.fb, _.wet);
                    }
                },
                get: function() { return this._.fb; }
            },
            wet: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        _.wet = val;
                        set_params.call(this, _.time, _.fb, _.wet);
                    }
                },
                get: function() { return this._.wet; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        var i, bits = Math.ceil(Math.log(timbre.samplerate * 1.5) * Math.LOG2E)
        
        _.buffer = new Float32Array(1<<bits);
        _.mask = (1 << bits) - 1;
        _.idx  = 0;
        _.out  = 0;
        
        _.time = 250;
        _.fb   = 0.25;
        _.wet  = 0.25;
        
        i = 0;
        if (typeof _args[i] === "number") {
            _.time = _args[i++];
        }    
        if (typeof _args[i] === "number") {
            _.fb = _args[i++];
        }    
        if (typeof _args[i] === "number") {
            _.wet = _args[i++];
        }
        
        set_params.call(this, _.time, _.fb, _.wet);
        
        this.args = _args.slice(i).map(timbre);
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("efx.delay", _.time, _.fb, _.wet);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    var set_params = function(time, fb, wet) {
        var _ = this._;
        
        var offset = time * timbre.samplerate / 1000;
        var mask   = _.mask;
        
        _.out = (_.idx + offset) & mask;
        
        if (fb >= 0.995) {
            _.fb = +0.995;
        } else if (fb <= -0.995) {
            _.fb = -0.995;
        } else {
            _.fb = fb;
        }
        
        if (wet > 1) wet = 1; else if (wet < 0) wet = 0;
        _.wet = wet;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var i, imax, j, jmax;
        
        var cell = this.cell;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            var args = this.args.slice(0);

            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            var n, b = _.buffer, mask = _.mask;
            var idx = _.idx, fb  = _.fb, out = _.out;
            var wet = _.wet, dry = 1 - _.wet;
            
            if (_.ison) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    n = b[idx];
                    b[out] = cell[i] - (n * fb);
                    out = (++out) & mask;
                    idx = (++idx) & mask;
                    cell[i] = (cell[i] * dry) + (n * wet);
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    n = b[idx];
                    b[out] = cell[i] - (n * fb);
                    idx = (++idx) & mask;
                    out = (++out) & mask;                    
                }
            }
            _.idx = idx;
            _.out = out;

            var mul = _.mul, add = _.add;
            for (i = cell.length; i--; ) {
                cell[i] = cell[i] * mul + add;
            }
        }
        return cell;
    };
    

    return EfxDelay;
}());
timbre.fn.register("efx.delay", EfxDelay);

// __END__
if (module.parent && !module.parent.parent) {
    describe("efx.delay", function() {
        object_test(EfxDelay, "efx.delay", 0);
    });
}
