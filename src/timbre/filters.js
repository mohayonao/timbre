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
                    if (typeof this._freq !== "number") this._freq = f.default_freq;
                    if (typeof this._band !== "number") this._band = f.default_band;
                    this._set_params = f.set_params;
                    this._set_params(this._freq, this._band, this._gain);
                }
            }
        },
        get: function() {
            return this._type;
        }
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            if (typeof value === "number") {
                this._freq = value;
                this._set_params(this._freq, this._band, this._gain);
            }
        },
        get: function() {
            return this._freq;
        }
    });
    Object.defineProperty($this, "band", {
        set: function(value) {
            if (typeof value === "number") {
                this._band = value;
                this._set_params(this._freq, this._band, this._gain);
            }
        },
        get: function() {
            return this._band;
        }
    });
    Object.defineProperty($this, "gain", {
        set: function(value) {
            if (typeof value === "number") {
                this._gain = value;
                this._set_params(this._freq, this._band, this._gain);
            }
        },
        get: function() {
            return this._gain;
        }
    });
    Object.defineProperty($this, "mul", {
        set: function(value) {
            if (typeof value === "number") {
                this._mul = value;
            }
        },
        get: function() {
            return this._mul;
        }
    });
    Object.defineProperty($this, "add", {
        set: function(value) {
            if (typeof value === "number") {
                this._add = value;
            }
        },
        get: function() {
            return this._add;
        }
    });
    
    var initialize = function(_args) {
        var i, type;
        
        this._mul  = 1.0;
        this._add  = 0.0;
        this._gain = 6;
        
        i = 0;
        if (typeof _args[i] === "string" && (Filter.types[_args[i]]) !== undefined) {
            type = _args[i++];
        } else {
            type = "LPF";
        }
        if (typeof _args[i] === "number") {
            this._freq = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this._band = _args[i++];
        }
        if (type === "peaking" || type === "lowboost" || type === "highboost") {
            if (typeof _args[i] === "number") {
                this._gain = _args[i++];
            }
        }
        if (typeof _args[i] === "number") {
            this._mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this._add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));

        this._ison = true;
        this._in1 = this._in2 = this._out1 = this._out2 = 0;
        
        this._ar = true;
        this.type = type;
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
    default_freq: 3000, default_band: 1,
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
    default_freq: 3000, default_band: 1,
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
    default_freq: 5500, default_band: 1,
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
timbre.fn.register("LPF", function(_args) {
    return new Filter(["LPF"].concat(_args));
});
timbre.fn.register("HPF", function(_args) {
    return new Filter(["HPF"].concat(_args));
});
timbre.fn.register("BPF", function(_args) {
    return new Filter(["BPF"].concat(_args));
});
timbre.fn.register("BRF", function(_args) {
    return new Filter(["BRF"].concat(_args));
});
timbre.fn.register("allpass", function(_args) {
    return new Filter(["allpass"].concat(_args));
});
timbre.fn.register("peaking", function(_args) {
    return new Filter(["peaking"].concat(_args));
});
timbre.fn.register("lowboost", function(_args) {
    return new Filter(["lowboost"].concat(_args));
});
timbre.fn.register("highboost", function(_args) {
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
                    this._set_params(this._cutoff, this._Q);
                }
            }
        },
        get: function() {
            return this._type;
        }
    });
    
    Object.defineProperty($this, "cutoff", {
        set: function(value) {
            if (typeof value === "number") {
                this._cutoff = value;
                this._set_params(this._cutoff, this._Q);
            }
        },
        get: function() {
            return this._cutoff;
        }
    });
    Object.defineProperty($this, "Q", {
        set: function(value) {
            if (typeof value === "number") {
                this._Q = value;
                this._set_params(this._cutoff, this._Q);
            }
        },
        get: function() {
            return this._Q;
        }
    });
    Object.defineProperty($this, "depth", {
        set: function(value) {
            if (typeof value === "number") {
                this._depth = value;
                this._depth0 = Math.cos(0.5 * Math.PI * value);
                this._depth1 = Math.sin(0.5 * Math.PI * value);
            }
        },
        get: function() {
            return this._depth;
        }
    });
    Object.defineProperty($this, "mul", {
        set: function(value) {
            if (typeof value === "number") {
                this._mul = value;
            }
        },
        get: function() {
            return this._mul;
        }
    });
    Object.defineProperty($this, "add", {
        set: function(value) {
            if (typeof value === "number") {
                this._add = value;
            }
        },
        get: function() {
            return this._add;
        }
    });
    
    var initialize = function(_args) {
        var i, type;
        
        i = 0;
        if (typeof _args[i] === "string" && (ResonantFilter.types[_args[i]]) !== undefined) {
            type = _args[i++];
        } else {
            type = "LPF";
        }
        if (typeof _args[i] === "number") {
            this._cutoff = _args[i++];
        } else {
            this._cutoff = 2000;
        }
        if (typeof _args[i] === "number") {
            this._Q = _args[i++];
        } else {
            this._Q = 0;
        }
        if (typeof _args[i] === "number") {
            this.depth = _args[i++];
        } else {
            this.depth = 0.5;
        }
        if (typeof _args[i] === "number") {
            this.mul = _args[i++];
        } else {
            this.mul = 1.0;
        }
        if (typeof _args[i] === "number") {
            this.add = _args[i++];
        } else {
            this.add = 0.0;
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
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
        var tmp, i, imax, j, jmax;
        var f, mode, damp, freq, depth0, depth1;
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
                mul = this._mul;
                add = this._add;
                f = this._f;
                mode = this._mode;
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
timbre.fn.register("rLPF", function(_args) {
    return new ResonantFilter(["LPF"].concat(_args));
});
timbre.fn.register("rHPF", function(_args) {
    return new ResonantFilter(["HPF"].concat(_args));
});
timbre.fn.register("rBPF", function(_args) {
    return new ResonantFilter(["BPF"].concat(_args));
});
timbre.fn.register("rBRF", function(_args) {
    return new ResonantFilter(["BRF"].concat(_args));
});




// __END__

// describe("filter", function() {
//     var instance = timbre("lpf");
//     object_test(LowPassFilter, fps);
// });
