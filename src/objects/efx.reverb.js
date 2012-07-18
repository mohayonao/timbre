/**
 * EfxReverb
 * v12.07.18: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxReverb = (function() {
    
    var NUM_OF_DELAY = 6;
    
    var EfxReverb = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(EfxReverb, {
        base: "ar-only",
        properties: {
            time: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        _.time = val;
                        set_params.call(this, _.time, _.fb, _.wet);
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
    
    var Delay = function(size, time, fb, wet) {
        this.buffer = new Float32Array(size);
        this.mask = size - 1;
        this.idx  = 0;
        this.out  = 0;
        
        this.time = time;
        this.fb   = fb;
        this.wet  = wet;
    };
    Delay.prototype = {
        set_params: function(time, fb, wet) {
            var offset = time * timbre.samplerate / 1000;
            var mask   = this.mask;
            
            this.out = (this.idx + offset) & mask;

            if (fb >= 0.995) {
                this.fb = +0.995;
            } else if (fb <= -0.995) {
                this.fb = -0.995;
            } else {
                this.fb = fb;
            }
            
            if (wet > 1) wet = 1; else if (wet < 0) wet = 0;
            this.wet = wet;
        },
        process: function(cell) {
            var i, imax;
            
            var n, b = this.buffer, mask = this.mask;
            var idx = this.idx, fb  = this.fb, out = this.out;
            var wet = this.wet, dry = 1 - this.wet;
            
            for (i = 0, imax = cell.length; i < imax; ++i) {
                n = b[idx];
                b[out] = cell[i] - (n * fb);
                out = (++out) & mask;
                idx = (++idx) & mask;
                cell[i] = (cell[i] * dry) + (n * wet);
            }
            this.idx = idx;
            this.out = out;
            
            return cell;
        }
    };
    
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        var i, bits = Math.ceil(Math.log(timbre.samplerate * 1) * Math.LOG2E)
        
        var delay = _.delay = new Array(NUM_OF_DELAY);
        for (i = 0; i < NUM_OF_DELAY; ++i) {
            delay[i] = new Delay(1<<bits, 0, 0, 0);
        }
        
        _.time = 700;
        _.fb   = 0.8;
        _.wet  = 0.3;
        _.cell = new Float32Array(timbre.cellsize);
        
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
    
    var set_params = function(time, fb, wet) {
        var _ = this._;
        
        var i, t = (time / NUM_OF_DELAY), delay = _.delay;
        for (i = NUM_OF_DELAY; i--; ) {
            delay[i].set_params(time, fb, wet);
            time *= 0.5;
            fb   *= 0.5;
        }
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var i, imax, j, jmax;
        
        var cell = this.cell;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            var args = this.args.slice(0);
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);

            var _cell = _.cell;
            var delay = _.delay;
            var dry   = 1 - _.wet;

            for (i = cell.length; i--; ) {
                _cell[i] = cell[i];
            }
            for (i = 0; i < NUM_OF_DELAY; ++i) {
                delay[i].process(cell);
            }
            
            if (_.ison) {
                for (i = cell.length; i--; ) {
                    cell[i] += _cell[i] * dry;
                }
            } else {
                for (i = cell.length; i--; ) {
                    cell[i] = _cell[i];
                }
            }                
            
            var mul = _.mul, add = _.add;
            for (i = cell.length; i--; ) {
                cell[i] = cell[i] * mul + add;
            }
        }
        return cell;
    };
    
    return EfxReverb;
}());
timbre.fn.register("efx.reverb", EfxReverb);

// __END__
if (module.parent && !module.parent.parent) {
    describe("efx.reverb", function() {
        object_test(EfxReverb, "efx.reverb");
    });
}
