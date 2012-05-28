/**
 * timbre/filters
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Filter = (function() {
    var Filter = function() {
        initialize.apply(this, arguments);
    }, $this = Filter.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var f;
            if (typeof value === "string") {
                if ((f = Filter.types[value]) !== undefined) {
                    this._.type = value;
                    this._.set_params = f.set_params;
                }
            }
        },
        get: function() { return this._.type; }
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            this._.freq = timbre(value);
        },
        get: function() { return this._.freq; }
    });
    Object.defineProperty($this, "band", {
        set: function(value) {
            this._.band = timbre(value);
        },
        get: function() { return this._.band; }
    });
    Object.defineProperty($this, "gain", {
        set: function(value) {
            this._.gain = timbre(value);
        },
        get: function() { return this._.gain; }
    });
    
    var initialize = function(_args) {
        var type, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            (Filter.types[_args[i]]) !== undefined) {
            this.type = _args[i++];
        } else {
            this.type = "lpf";
        }
        type = this._.type;
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.freq = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.freq = timbre(_args[i++]);
        } else {
            _.freq = timbre(Filter.types[type].default_freq);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.band = _args[i++];
        } else if (typeof _args[i] === "number") {
            _.band = timbre(_args[i++]);
        } else {
            _.band = timbre(Filter.types[type].default_band);
        }
        
        if (type === "peaking" || type === "lowboost" || type === "highboost") {
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.gain = _args[i++];
            } else if (typeof _args[i] === "number") {
                _.gain = timbre(_args[i++]);
            } else {
                _.gain = timbre(Filter.types[type].default_gain);
            }
        } else {
            _.gain = timbre(undefined);
        }
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.prev_type = undefined;
        _.prev_freq = undefined;
        _.prev_band = undefined;
        _.prev_gain = undefined;
        
        _.ison = true;
        _.in1 = _.in2 = _.out1 = _.out2 = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("filter", _.type);
        if (deep) {
            newone.freq = _.freq.clone(deep);
            newone.band = _.band.clone(deep);
            newone.gain = _.gain.clone(deep);
        } else {
            newone.freq = _.freq;
            newone.band = _.band;
            newone.gain = _.gain;
        }
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var type, freq, band, gain;
        var tmp, i, imax, j, jmax;
        
        var a1, a2, b0, b1, b2;
        var in1, in2, out1, out2;
        var input, output;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            args = this.args.slice(0);
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            for (i = 0, imax = args.length; i < imax; ++i) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            // filter
            if (_.ison) {
                type = _.type;
                freq = _.freq.seq(seq_id)[0];
                band = _.band.seq(seq_id)[0];
                gain = _.gain.seq(seq_id)[0];
                if (type !== _.prev_type ||
                    freq !== _.prev_freq ||
                    band !== _.prev_band ||
                    gain !== _.prev_gain) {
                    _.set_params.call(this, freq, band, gain);
                    _.prev_type = type;
                    _.prev_freq = freq;
                    _.prev_band = band;
                    _.prev_gain = gain;
                }
                mul = _.mul;
                add = _.add;
                a1 = _.a1; a2 = _.a2;
                b0 = _.b0; b1 = _.b1; b2 = _.b2;
                in1  = _.in1;  in2  = _.in2;
                out1 = _.out1; out2 = _.out2;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    input = cell[i];
                    output = b0 * input + b1 * in1 + b2 * in2 - a1 * out1 - a2 * out2;
                    
                    if (output > 1.0) {
                        output = 1.0;
                    } else if (output < -1.0) {
                        output = -1.0;
                    }
                    
                    in2  = in1;
                    in1  = input;
                    out2 = out1;
                    out1 = output;
                    
                    cell[i] = output;
                }
                _.in1  = in1;  _.in2  = in2;
                _.out1 = out1; _.out2 = out2;
            }
            
            for (j = jmax; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
            
            this.seq_id = seq_id;
        }
        
        return cell;
    };

    $this.getFilter = function(name) {
        return Filter.types[name];
    };
    
    $this.setFilter = function(name, params) {
        if (typeof params === "object") {
            if (typeof params.set_params === "function") {
                if (typeof params.default_freq !== "number") {
                    params.default_freq = 2000;
                }
                if (typeof params.default_band !== "number") {
                    params.default_freq = 1;
                }
                if (typeof params.default_gain !== "number") {
                    params.default_freq = 6;
                }
                Filter.types[name] = params;
            }
        }
    };
    
    return Filter;
}());

Filter.types = {};
Filter.types.lpf = {
    default_freq: 800, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos  * ia0;
        _.a2 = (1 - alp) * ia0;
        // _.b0
        _.b1 = (1 - cos) * ia0;
        _.b2 = _.b0 = _.b1 * 0.5;
    }
};
Filter.types.hpf = {
    default_freq: 5500, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos  * ia0;
        _.a2 = +(1 - alp) * ia0;
        // this.b0
        _.b1 = -(1 + cos) * ia0;
        _.b2 = _.b0 = - _.b1 * 0.5;
    }
};
Filter.types.bpf = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos  * ia0;
        _.a2 = (1 - alp) * ia0;
        _.b0 = alp * ia0;        
        _.b1 = 0;
        _.b2 = -_.b0;
    }
};
Filter.types.brf = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos * ia0;
        _.a2 = +(1 - alp) * ia0;
        _.b0 = 1;
        _.b1 = -(1 + cos) * ia0;
        _.b2 = 1;
    }
};
Filter.types.allpass = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos * ia0;
        _.a2 = +(1 - alp) * ia0;
        _.b0 = _.a2;
        _.b1 = _.a1;
        _.b2 = 1;
    }
};
Filter.types.peaking = {
    default_freq: 3000, default_band: 1, default_gain: 6,
    set_params: function(freq, band, gain) {
        var _ = this._;
        var A, omg, cos, sin, alp, alpA, alpiA, n, ia0;
        A = Math.pow(10, gain * 0.025);
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        alpA  = alp * A;
        alpiA = alp / A;
        ia0 = 1 / (1 + alpiA);
        _.a1 = -2 * cos * ia0;
        _.a2 = +(1 - alpiA) * ia0;
        _.b0 = +(1 + alpA ) * ia0;
        _.b1 = _.a1;
        _.b2 = +(1 - alpA ) * ia0;
    }
};
Filter.types.lowboost = {
    default_freq: 3000, default_band: 1, default_gain: 6,
    set_params: function(freq, band, gain) {
        var _ = this._;
        var A, omg, cos, sin, alp, alpsA2, ia0;
        A = Math.pow(10, gain * 0.025);
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
        alpsA2 = alp * Math.sqrt(A) * 2;
        ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
        _.a1 = -2 * ((A - 1) + (A + 1) * cos         ) * ia0;
        _.a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
        _.b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
        _.b1 =  2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
        _.b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
    }
};
Filter.types.highboost = {
    default_freq: 5500, default_band: 1, default_gain: 6,
    set_params: function(freq, band, gain) {
        var _ = this._;
        var A, omg, cos, sin, alp, alpsA2, ia0;
        A = Math.pow(10, gain * 0.025);
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
        alpsA2 = alp * Math.sqrt(A) * 2;
        ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
        _.a1 =  2 * ((A - 1) + (A + 1) * cos         ) * ia0;
        _.a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
        _.b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
        _.b1 = -2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
        _.b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
    }
};
timbre.fn.register("filter", Filter);
timbre.fn.register("lpf", Filter, function(_args) {
    return new Filter(["lpf"].concat(_args));
});
timbre.fn.register("hpf", Filter, function(_args) {
    return new Filter(["hpf"].concat(_args));
});
timbre.fn.register("bpf", Filter, function(_args) {
    return new Filter(["bpf"].concat(_args));
});
timbre.fn.register("brf", Filter, function(_args) {
    return new Filter(["brf"].concat(_args));
});
timbre.fn.register("allpass", Filter, function(_args) {
    return new Filter(["allpass"].concat(_args));
});
timbre.fn.register("peaking", Filter, function(_args) {
    return new Filter(["peaking"].concat(_args));
});
timbre.fn.register("lowboost", Filter, function(_args) {
    return new Filter(["lowboost"].concat(_args));
});
timbre.fn.register("highboost", Filter, function(_args) {
    return new Filter(["highboost"].concat(_args));
});


var ResonantFilter = (function() {
    var ResonantFilter = function() {
        initialize.apply(this, arguments);
    }, $this = ResonantFilter.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    ResonantFilter.types = { lpf:0, hpf:1, bpf:2, brf:3 };
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var mode;
            if (typeof value === "string") {
                if ((mode = ResonantFilter.types[value]) !== undefined) {
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
            (ResonantFilter.types[_args[i]]) !== undefined) {
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
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.prev_cutoff = undefined;
        _.prev_Q      = undefined;
        _.prev_depth  = undefined;
        
        _.ison = true;
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
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            // filter
            if (_.ison) {
                mode   = _.mode;
                cutoff = _.cutoff.seq(seq_id)[0];
                Q      = _.Q.seq(seq_id)[0];
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
                mul = _.mul;
                add = _.add;
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

describe("filter", function() {
    object_test(Filter, "filter");
});
describe("rfilter", function() {
    object_test(ResonantFilter, "rfilter");
});
