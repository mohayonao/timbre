/**
 * ResonantFilter: 0.1.0
 * [ar-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ResonantFilter = (function() {
    var ResonantFilter = function() {
        initialize.apply(this, arguments);
    }, $this = ResonantFilter.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    ResonantFilter.Types = { lpf:0, hpf:1, bpf:2, brf:3 };
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var mode;
            if (typeof value === "string") {
                if ((mode = ResonantFilter.Types[value]) !== undefined) {
                    this._.type = value;
                    this._.mode = mode;
                }
            }
        },
        get: function() { return this._.type; }
    });
    
    Object.defineProperty($this, "cutoff", {
        set: function(value) {
            this._.cutoff = timbre(value);
        },
        get: function() { return this._.cutoff; }
    });
    Object.defineProperty($this, "Q", {
        set: function(value) {
            this._.Q = timbre(value);
        },
        get: function() { return this._.Q; }
    });
    Object.defineProperty($this, "depth", {
        set: function(value) {
            this._.depth = timbre(value);
        },
        get: function() { return this._.depth; }
    });
    
    var initialize = function(_args) {
        var type, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            (ResonantFilter.Types[_args[i]]) !== undefined) {
            this.type = _args[i++];
        } else {
            this.type = "lpf";
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.cutoff = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.cutoff = timbre(_args[i++]);
        } else {
            _.cutoff = timbre(800);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.Q = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.Q = timbre(_args[i++]);
        } else {
            _.Q = timbre(0.5);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.depth = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.depth = timbre(_args[i++]);
        } else {
            _.depth = timbre(0.5);
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.prev_cutoff = undefined;
        _.prev_Q      = undefined;
        _.prev_depth  = undefined;
        
        _.f = new Float32Array(4);
        _.mode = 0;
        _.damp = 0;
        _.freq = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("rfilter", _.type);
        if (deep) {
            newone.cutoff = _.cutoff.clone(deep);
            newone.Q      = _.Q     .clone(deep);
            newone.depth  = _.depth .clone(deep);
        } else {
            newone.cutoff = _.cutoff;
            newone.Q      = _.Q;
            newone.depth  = _.depth;
        }
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    var set_params = function(cutoff, Q) {
        var _ = this._;
        var freq = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (timbre.samplerate * 2)));
        _.damp = Math.min(2 * (1 - Math.pow(Q, 0.25)),
                          Math.min(2, 2 / freq - freq * 0.5));
        _.freq = freq;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var cutoff, Q;
        var tmp, i, imax, j, jmax;
        var f, mode, damp, freq, depth, depth0, depth1;
        var input, output;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            args = this.args.slice(0);
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (args[i].seq_id === seq_id) {
                    tmp = args[i].cell;
                } else {
                    tmp = args[i].seq(seq_id);
                }
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }

            mul = _.mul;
            add = _.add;
            
            // filter
            if (_.ison) {
                mode   = _.mode;
                if (_.cutoff.seq_id === seq_id) {
                    cutoff = _.cutoff.cell[0];
                } else {
                    cutoff = _.cutoff.seq(seq_id)[0];
                }
                if (_.Q.seq_id === seq_id) {
                    Q = _.Q.cell[0];
                } else {
                    Q = _.Q.seq(seq_id)[0];
                }
                if (cutoff !== _.prev_cutoff || Q !== _.prev_Q ) {
                    set_params.call(this, cutoff, Q);
                    _.prev_cutoff = cutoff;
                    _.prev_Q      = Q;
                }
                depth = _.depth.seq(seq_id)[0];
                if (depth !== _.prev_depth) {
                    _.depth0 = Math.cos(0.5 * Math.PI * depth);
                    _.depth1 = Math.sin(0.5 * Math.PI * depth);
                }
                f   = _.f;
                damp = _.damp;
                freq = _.freq;
                depth0 = _.depth0;
                depth1 = _.depth1;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    input = cell[i];
                    
                    f[3] = input - damp * f[2];
                    f[0] = f[0] + freq * f[2];
                    f[1] = f[3] - f[0];
                    f[2] = freq * f[1] + f[2];
                    output = 0.5 * f[mode];

                    // second pass
                    f[3] = input - damp * f[2];
                    f[0] = f[0] + freq * f[2];
                    f[1] = f[3] - f[0];
                    f[2] = freq * f[1] + f[2];
                    output += 0.5 * f[mode];
                    
                    output = (input * depth0) + (output * depth1);
                    
                    cell[i] = output;
                }
                
                for (i = imax; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            } else {
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            }
            this.seq_id = seq_id;
        }
        
        return cell;
    };
    
    return ResonantFilter;
}());
timbre.fn.register("rfilter", ResonantFilter);
timbre.fn.register("rlpf", ResonantFilter, function(_args) {
    return new ResonantFilter(["lpf"].concat(_args));
});
timbre.fn.register("rhpf", ResonantFilter, function(_args) {
    return new ResonantFilter(["hpf"].concat(_args));
});
timbre.fn.register("rbpf", ResonantFilter, function(_args) {
    return new ResonantFilter(["bpf"].concat(_args));
});
timbre.fn.register("rbrf", ResonantFilter, function(_args) {
    return new ResonantFilter(["brf"].concat(_args));
});

// __END__

describe("rfilter", function() {
    object_test(ResonantFilter, "rfilter");
});
