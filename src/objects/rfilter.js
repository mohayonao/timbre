/**
 * ResonantFilter
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ResonantFilter = (function() {
    var ResonantFilter = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(ResonantFilter, {
        base: "ar-only",
        properties: {
            type: {
                set: function(val) {
                    var mode;
                    if (typeof val === "string") {
                        if ((mode = ResonantFilter.Types[val]) !== undefined) {
                            this._.type = val;
                            this._.mode = mode;
                        }
                    }
                },
                get: function() { return this._.type; }
            },
            cutoff: {
                set: function(val) {
                    this._.cutoff = timbre(val);
                },
                get: function() { return this._.cutoff; }
            },
            Q: {
                set: function(val) {
                    this._.Q = timbre(val);
                },
                get: function() { return this._.Q; }
            },
            depth: {
                set: function(val) {
                    this._.depth = timbre(val);
                },
                get: function() { return this._.depth; }
            }
        } // properties
    });
    
    
    ResonantFilter.Types = { lpf:0, hpf:1, bpf:2, brf:3 };
    
    
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
        this.args = _args.slice(i).map(timbre);
        
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
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var cutoff, Q, f, mode, damp, freq, depth, depth0, depth1;
        var input, output;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            if (_.ison) {
                mode   = _.mode;
                cutoff = _.cutoff.seq(seq_id)[0];
                Q      = _.Q.seq(seq_id)[0];
                
                if (cutoff !== _.prev_cutoff || Q !== _.prev_Q ) {
                    
                    freq = 2 * Math.sin(3.141592653589793 * Math.min(0.25, cutoff / (timbre.samplerate * 2)));
                    _.damp = Math.min(2 * (1 - Math.pow(Q, 0.25)), Math.min(2, 2 / freq - freq * 0.5));
                    _.freq = freq;
                    
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
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
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
if (module.parent && !module.parent.parent) {
    describe("rfilter", function() {
        object_test(ResonantFilter, "rfilter");
    });
}
