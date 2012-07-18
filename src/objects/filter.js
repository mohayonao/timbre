/**
 * Filter
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Filter = (function() {
    var Filter = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Filter, {
        base: "ar-only",
        properties: {
            type: {
                set: function(val) {
                    var f;
                    if (typeof val === "string") {
                        if ((f = Filter.Types[val]) !== undefined) {
                            this._.type = val;
                            this._.set_params = f.set_params;
                        }
                    }
                },
                get: function() { return this._.type; }
            },
            freq: {
                set: function(val) {
                    this._.freq = timbre(val);
                },
                get: function() { return this._.freq; }
            },
            band: {
                set: function(val) {
                    this._.band = timbre(val);
                },
                get: function() { return this._.band; }
            },
            gain: {
                set: function(val) {
                    this._.gain = timbre(val);
                },
                get: function() { return this._.gain; }
            },
        } // properties
    });
    
    
    var initialize = function(_args) {
        var type, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            (Filter.Types[_args[i]]) !== undefined) {
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
            _.freq = timbre(Filter.Types[type].default_freq);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.band = _args[i++];
        } else if (typeof _args[i] === "number") {
            _.band = timbre(_args[i++]);
        } else {
            _.band = timbre(Filter.Types[type].default_band);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.gain = _args[i++];
        } else if (typeof _args[i] === "number") {
            _.gain = timbre(_args[i++]);
        } else {
            _.gain = timbre(Filter.Types[type].default_gain || 6);
        }
        this.args = _args.slice(i).map(timbre);
        
        _.prev_type = undefined;
        _.prev_freq = undefined;
        _.prev_band = undefined;
        _.prev_gain = undefined;
        
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
        return timbre.fn.copyBaseArguments(this, newone, deep);
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
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul = _.mul;
            add = _.add;
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            if (_.ison) {
                type = _.type;
                if (_.freq.seq_id === seq_id) {
                    freq = _.freq.cell[0];
                } else {
                    freq = _.freq.seq(seq_id)[0];
                }
                if (_.band.seq_id === seq_id) {
                    band = _.band.cell[0];
                } else {
                    band = _.band.seq(seq_id)[0];
                }
                if (_.gain.seq_id === seq_id) {
                    gain = _.gain.cell[0];
                } else {
                    gain = _.gain.seq(seq_id)[0];
                }
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
            
            for (i = cell.length; i--; ) {
                cell[i] = cell[i] * mul + add;
            }
        }
        
        return cell;
    };
    
    $this.getFilter = function(name) {
        return Filter.Types[name];
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
                Filter.Types[name] = params;
            }
        }
    };
    
    return Filter;
}());

Filter.Types = {};
Filter.Types.lpf = {
    default_freq: 800, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        if (alp === Infinity) alp = 0;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos  * ia0;
        _.a2 = (1 - alp) * ia0;
        // _.b0
        _.b1 = (1 - cos) * ia0;
        _.b2 = _.b0 = _.b1 * 0.5;
    }
};
Filter.Types.hpf = {
    default_freq: 5500, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        if (alp === Infinity) alp = 0;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos  * ia0;
        _.a2 = +(1 - alp) * ia0;
        // this.b0
        _.b1 = -(1 + cos) * ia0;
        _.b2 = _.b0 = - _.b1 * 0.5;
    }
};
Filter.Types.bpf = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        if (alp === Infinity) alp = 0;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos  * ia0;
        _.a2 = (1 - alp) * ia0;
        _.b0 = alp * ia0;        
        _.b1 = 0;
        _.b2 = -_.b0;
    }
};
Filter.Types.brf = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        if (alp === Infinity) alp = 0;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos * ia0;
        _.a2 = +(1 - alp) * ia0;
        _.b0 = 1;
        _.b1 = -(1 + cos) * ia0;
        _.b2 = 1;
    }
};
Filter.Types.allpass = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var _ = this._;
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        if (alp === Infinity) alp = 0;
        ia0 = 1 / (1 + alp);
        _.a1 = -2 * cos * ia0;
        _.a2 = +(1 - alp) * ia0;
        _.b0 = _.a2;
        _.b1 = _.a1;
        _.b2 = 1;
    }
};
Filter.Types.peaking = {
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
        if (alp === Infinity) alp = 0;
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
Filter.Types.lowboost = {
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
Filter.Types.highboost = {
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

// __END__
if (module.parent && !module.parent.parent) {
    describe("filter", function() {
        object_test(Filter, "filter");
    });
}
