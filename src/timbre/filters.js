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
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var f;
            if (typeof value === "string") {
                if ((f = Filter.types[value]) !== undefined) {
                    this._type = value;
                    this._set_params = f.set_params;
                }
            }
        },
        get: function() {
            return this._type;
        }
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            if (typeof value !== "object") {
                this._freq = timbre(value);
            } else {
                this._freq = value;
            }
        },
        get: function() {
            return this._freq;
        }
    });
    Object.defineProperty($this, "band", {
        set: function(value) {
            if (typeof value !== "object") {
                this._band = timbre(value);
            } else {
                this._band = value;
            }
        },
        get: function() {
            return this._band;
        }
    });
    Object.defineProperty($this, "gain", {
        set: function(value) {
            if (typeof value !== "object") {
                this._gain = timbre(value);
            } else {
                this._gain = value;
            }
        },
        get: function() {
            return this._gain;
        }
    });
    
    var initialize = function(_args) {
        var i, type;
        
        this._mul  = 1.0;
        this._add  = 0.0;
        
        i = 0;
        if (typeof _args[i] === "string" && (Filter.types[_args[i]]) !== undefined) {
            this.type = _args[i++];
        } else {
            this.type = "LPF";
        }
        type = this._type;
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._freq = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._freq = timbre(_args[i++]);
        } else {
            this._freq = timbre(Filter.types[type].default_freq);
        }
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._band = _args[i++];
        } else if (typeof _args[i] === "number") {
            this._band = timbre(_args[i++]);
        } else {
            this._band = timbre(Filter.types[type].default_band);
        }
        
        if (type === "peaking" || type === "lowboost" || type === "highboost") {
            if (typeof _args[i] === "object" && !_args[i]._ar) {
                this._gain = _args[i++];
            } else if (typeof _args[i] === "number") {
                this._gain = timbre(_args[i++]);
            } else {
                this._gain = timbre(Filter.types[type].default_gain);
            }
        } else {
            this._gain = timbre(undefined);
        }
        
        if (typeof _args[i] === "number") {
            this._mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this._add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        this._prev_type = undefined;
        this._prev_freq = undefined;
        this._prev_band = undefined;
        this._prev_gain = undefined;
        
        this._ison = true;
        this._in1 = this._in2 = this._out1 = this._out2 = 0;
        this._ar = true;
    };
    
    $this.on = function() {
        this._ison = true;
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._ison = false;
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var args, cell, mul, add;
        var type, freq, band, gain;
        var tmp, i, imax, j, jmax;
        
        var a1, a2, b0, b1, b2;
        var in1, in2, out1, out2;
        var input, output;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            // filter
            if (this._ison) {
                type = this._type;
                freq = this._freq.seq(seq_id)[0];
                band = this._band.seq(seq_id)[0];
                gain = this._gain.seq(seq_id)[0];
                if (type !== this._prev_type ||
                    freq !== this._prev_freq ||
                    band !== this._prev_band ||
                    gain !== this._prev_gain) {
                    this._set_params(freq, band, gain);
                    this._prev_type = type;
                    this._prev_freq = freq;
                    this._prev_band = band;
                    this._prev_gain = gain;
                }
                mul = this._mul;
                add = this._add;
                a1 = this._a1; a2 = this._a2;
                b0 = this._b0; b1 = this._b1; b2 = this._b2;
                in1  = this._in1;  in2  = this._in2;
                out1 = this._out1; out2 = this._out2;
                
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
                    
                    cell[i] = output * mul + add;
                }
                
                this._in1  = in1;  this._in2  = in2;
                this._out1 = out1; this._out2 = out2;
            }
            this._seq_id = seq_id;
        }
        
        return cell;
    };
    
    return Filter;
}());

Filter.types = {};
Filter.types.LPF = {
    default_freq: 800, default_band: 1,
    set_params: function(freq, band) {
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        this._a1 = -2 * cos  * ia0;
        this._a2 = (1 - alp) * ia0;
        // this._b0
        this._b1 = (1 - cos) * ia0;
        this._b2 = this._b0 = this._b1 * 0.5;
    }
};
Filter.types.HPF = {
    default_freq: 5500, default_band: 1,
    set_params: function(freq, band) {
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        this._a1 = -2 * cos  * ia0;
        this._a2 = +(1 - alp) * ia0;
        // this.b0
        this._b1 = -(1 + cos) * ia0;
        this._b2 = this._b0 = - this._b1 * 0.5;
    }
};
Filter.types.BPF = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        this._a1 = -2 * cos  * ia0;
        this._a2 = (1 - alp) * ia0;
        this._b0 = alp * ia0;        
        this._b1 = 0;
        this._b2 = -this._b0;
    }
};
Filter.types.BRF = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        this._a1 = -2 * cos * ia0;
        this._a2 = +(1 - alp) * ia0;
        this._b0 = 1;
        this._b1 = -(1 + cos) * ia0;
        this._b2 = 1;
    }
};
Filter.types.allpass = {
    default_freq: 3000, default_band: 1,
    set_params: function(freq, band) {
        var omg, cos, sin, alp, n, ia0;
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        n = 0.34657359027997264 * band * omg / sin;
        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
        ia0 = 1 / (1 + alp);
        this._a1 = -2 * cos * ia0;
        this._a2 = +(1 - alp) * ia0;
        this._b0 = this._a2;
        this._b1 = this._a1;
        this._b2 = 1;
    }
};
Filter.types.peaking = {
    default_freq: 3000, default_band: 1, default_gain: 6,
    set_params: function(freq, band, gain) {
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
        this._a1 = -2 * cos * ia0;
        this._a2 = +(1 - alpiA) * ia0;
        this._b0 = +(1 + alpA ) * ia0;
        this._b1 = this._a1;
        this._b2 = +(1 - alpA ) * ia0;
    }
};
Filter.types.lowboost = {
    default_freq: 3000, default_band: 1, default_gain: 6,
    set_params: function(freq, band, gain) {
        var A, omg, cos, sin, alp, alpsA2, ia0;
        A = Math.pow(10, gain * 0.025);
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
        alpsA2 = alp * Math.sqrt(A) * 2;
        ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
        this._a1 = -2 * ((A - 1) + (A + 1) * cos         ) * ia0;
        this._a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
        this._b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
        this._b1 =  2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
        this._b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
    }
};
Filter.types.highboost = {
    default_freq: 5500, default_band: 1, default_gain: 6,
    set_params: function(freq, band, gain) {
        var A, omg, cos, sin, alp, alpsA2, ia0;
        A = Math.pow(10, gain * 0.025);
        omg = freq * 2 * Math.PI / timbre.samplerate;
        cos = Math.cos(omg);
        sin = Math.sin(omg);
        alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
        alpsA2 = alp * Math.sqrt(A) * 2;
        ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
        this._a1 =  2 * ((A - 1) + (A + 1) * cos         ) * ia0;
        this._a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
        this._b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
        this._b1 = -2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
        this._b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
    }
};
timbre.fn.register("LPF", Filter, function(_args) {
    return new Filter(["LPF"].concat(_args));
});
timbre.fn.register("HPF", Filter, function(_args) {
    return new Filter(["HPF"].concat(_args));
});
timbre.fn.register("BPF", Filter, function(_args) {
    return new Filter(["BPF"].concat(_args));
});
timbre.fn.register("BRF", Filter, function(_args) {
    return new Filter(["BRF"].concat(_args));
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
    
    ResonantFilter.types = { LPF:0, HPF:1, BPF:2, BRF:3 };
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var mode;
            if (typeof value === "string") {
                if ((mode = ResonantFilter.types[value]) !== undefined) {
                    this._type = value;
                    this._mode = mode;
                }
            }
        },
        get: function() {
            return this._type;
        }
    });
    
    Object.defineProperty($this, "cutoff", {
        set: function(value) {
            if (typeof value !== "object") {
                this._cutoff = timbre(value);
            } else {
                this._cutoff = value;
            }
        },
        get: function() {
            return this._cutoff;
        }
    });
    Object.defineProperty($this, "Q", {
        set: function(value) {
            if (typeof value !== "object") {
                this._Q = timbre(value);
            } else {
                this._Q = value;
            }
        },
        get: function() {
            return this._Q;
        }
    });
    Object.defineProperty($this, "depth", {
        set: function(value) {
            if (typeof value !== "object") {
                this._depth = timbre(value);
            } else {
                this._depth = value;
            }
        },
        get: function() {
            return this._depth;
        }
    });
    
    var initialize = function(_args) {
        var i, type;
        
        i = 0;
        if (typeof _args[i] === "string" && (ResonantFilter.types[_args[i]]) !== undefined) {
            this.type = _args[i++];
        } else {
            this.type = "LPF";
        }

        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._cutoff = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._cutoff = timbre(_args[i++]);
        } else {
            this._cutoff = timbre(800);
        }
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._Q = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._Q = timbre(_args[i++]);
        } else {
            this._Q = timbre(0.5);
        }
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._depth = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._depth = timbre(_args[i++]);
        } else {
            this._depth = timbre(0.5);
        }
        
        if (typeof _args[i] === "number") {
            this.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this.add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        this._prev_cutoff = undefined;
        this._prev_Q      = undefined;
        this._prev_depth  = undefined;
        
        this._ison = true;
        this._f = new Float32Array(4);
        this._mode = 0;
        this._damp = 0;
        this._freq = 0;
        
        this._ar = true;
        this.type = type;
    };
    
    $this._set_params = function(cutoff, Q) {
        var freq = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (timbre.samplerate * 2)));
        this._damp = Math.min(2 * (1 - Math.pow(Q, 0.25)), Math.min(2, 2 / freq - freq * 0.5));
        this._freq = freq;
    };
    
    $this.on = function() {
        this._ison = true;
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._ison = false;
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var args, cell, mul, add;
        var cutoff, Q;
        var tmp, i, imax, j, jmax;
        var f, mode, damp, freq, depth, depth0, depth1;
        var input, output;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            // filter
            if (this._ison) {
                mode   = this._mode;
                cutoff = this._cutoff.seq(seq_id)[0];
                Q      = this._Q.seq(seq_id)[0];
                if (cutoff !== this._prev_cutoff || Q !== this._prev_Q ) {
                    this._set_params(cutoff, Q);
                    this._prev_cutoff = cutoff;
                    this._prev_Q      = Q;
                }
                depth = this._depth.seq(seq_id)[0];
                if (depth !== this._prev_depth) {
                    this._depth0 = Math.cos(0.5 * Math.PI * depth);
                    this._depth1 = Math.sin(0.5 * Math.PI * depth);
                }
                mul = this._mul;
                add = this._add;
                f = this._f;
                damp = this._damp;
                freq = this._freq;
                depth0 = this._depth0;
                depth1 = this._depth1;
                
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
                    
                    cell[i] = output * mul + add;
                }
            }
            this._seq_id = seq_id;
        }
        
        return cell;
    };
    
    return ResonantFilter;
}());
timbre.fn.register("rLPF", ResonantFilter, function(_args) {
    return new ResonantFilter(["LPF"].concat(_args));
});
timbre.fn.register("rHPF", ResonantFilter, function(_args) {
    return new ResonantFilter(["HPF"].concat(_args));
});
timbre.fn.register("rBPF", ResonantFilter, function(_args) {
    return new ResonantFilter(["BPF"].concat(_args));
});
timbre.fn.register("rBRF", ResonantFilter, function(_args) {
    return new ResonantFilter(["BRF"].concat(_args));
});




// __END__

// describe("filter", function() {
//     var instance = timbre("lpf");
//     object_test(LowPassFilter, fps);
// });
