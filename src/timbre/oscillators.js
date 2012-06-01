/**
 * timbre/oscillators
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Oscillator: 0.0.0
 * Table lookup oscillator
 * [ar-kr]
 */
var Oscillator = (function() {
    var Oscillator = function() {
        initialize.apply(this, arguments);
    }, $this = Oscillator.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    Object.defineProperty($this, "wave", {
        set: function(value) {
            var wave, i, dx;
            wave = this._.wave;
            if (typeof value === "function") {
                for (i = 0; i < 1024; i++) {
                    wave[i] = value(i / 1024);
                }
            } else if (typeof value === "object" &&
                       (value instanceof Array || value.buffer instanceof ArrayBuffer)) {
                if (value.length === 1024) {
                    this._.wave = value;
                } else {
                    dx = value.length / 1024;
                    for (i = 0; i < 1024; i++) {
                        wave[i] = value[(i * dx)|0] || 0.0;
                    }
                }
            } else if (typeof value === "string") {
                if ((dx = Oscillator.Wavetables[value]) !== undefined) {
                    if (typeof dx === "function") dx = dx();
                    this._.wave = dx;
                }
            }
        },
        get: function() { return this._.wave; }
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            this._.freq = timbre(value);
        },
        get: function() { return this._.freq; }
    });
    Object.defineProperty($this, "phase", {
        set: function(value) {
            if (typeof value === "number") {
                while (value >= 1.0) value -= 1.0;
                while (value <  0.0) value += 1.0;
                this._.phase = value;
                this._.x = 1024 * this._.phase;
            }
        },
        get: function() { return this._.phase; }
    });
    
    var initialize = function(_args) {
        var i, _;

        this._ = _ = {};
        i = 0;
        
        _.wave = new Float32Array(1024);        
        
        if (typeof _args[i] === "function") {
            this.wave = _args[i++];
        } else if (typeof _args[i] === "object" && _args[i] instanceof Float32Array) {
            this.wave = _args[i++];
        } else if (typeof _args[i] === "string" && Oscillator.Wavetables[_args[i]]) {
            this.wave = _args[i++];
        } else {
            this.wave = "sin";
        }
        if (typeof _args[i] !== "undefined") {
            this.freq = _args[i++];
        } else {
            this.freq = 440;
        }
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];    
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];    
        }
        
        _.phase = 0;
        _.x = 1024 * _.phase;
        _.coeff = 1024 / timbre.samplerate;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("osc", _.wave);
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        newone._.phase = _.phase;
        timbre.fn.copy_for_clone(this, newone, deep);        
        return newone;
    };
    
    $this.bang = function() {
        this._.x = 1024 * this._.phase;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var freq, mul, add, wave;
        var x, dx, coeff;
        var index, delta, x0, x1, xx;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            freq = _.freq.seq(seq_id);
            
            mul  = _.mul;
            add  = _.add;
            wave = _.wave;
            x = _.x;
            coeff = _.coeff;
            if (_.ar) {
                if (_.freq.isAr) {
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[(index  ) & 1023];
                        x1 = wave[(index+1) & 1023];
                        xx = (1.0 - delta) * x0 + delta * x1;
                        cell[i] = xx * mul + add;
                        x += freq[i] * coeff;
                    }
                } else {
                    dx = freq[0] * coeff;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        index = x|0;
                        delta = x - index;
                        x0 = wave[(index  ) & 1023];
                        x1 = wave[(index+1) & 1023];
                        xx = (1.0 - delta) * x0 + delta * x1;
                        cell[i] = xx * mul + add;
                        x += dx;
                    }
                }
            } else {
                index = x|0;
                delta = x - index;
                x0 = wave[(index  ) & 1023];
                x1 = wave[(index+1) & 1023];
                xx = (1.0 - delta) * x0 + delta * x1;
                xx = xx * mul + add;
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    cell[i] = xx;
                }
                x += freq[0] * coeff * imax;
            }
            _.x = x;
        }
        
        return cell;
    };
    
    $this.getWavetable = function(name) {
        var wave = Oscillator.Wavetables[name];
        if (wave !== undefined) {
            if (typeof wave === "function") wave = wave();
            return wave;
        }
    };
    
    $this.setWavetable = function(name, value) {
        var wave, i;
        if (typeof value === "function") {
            wave = new Float32Array(1024);
            for (i = 0; i < 1024; i++) {
                wave[i] = value(i / 1024);
            }
            Oscillator.Wavetables[name] = wave;
        } else if (typeof value === "object" &&
                   (value instanceof Array || value.buffer instanceof ArrayBuffer)) {
            if (value.length === 1024) {
                Oscillator.Wavetables[name] = value;
            } else {
                wave = new Float32Array(1024);
                dx = value.length / 1024;
                for (i = 0; i < 1024; i++) {
                    wave[i] = value[(i * dx)|0] || 0.0;
                }
                Oscillator.Wavetables[name] = value;
            }
        }
    };
    
    return Oscillator;
}());
timbre.fn.register("osc", Oscillator);

Oscillator.Wavetables = {};
Oscillator.Wavetables["sin"] = function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = Math.sin(2 * Math.PI * (i/1024));
    }
    return l;
};
Oscillator.Wavetables["+sin"] = function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = Math.sin(2 * Math.PI * (i/1024)) * 0.5 + 0.5;
    }
    return l;
};
Oscillator.Wavetables["cos"] = function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = Math.cos(2 * Math.PI * (i/1024));
    }
    return l;
};
Oscillator.Wavetables["+cos"] = function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = Math.cos(2 * Math.PI * (i/1024)) * 0.5 + 0.5;
    }
    return l;
};
Oscillator.Wavetables["pulse"] = function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = i < 512 ? -1 : +1;
    }
    return l;
};
Oscillator.Wavetables["+pulse"] = function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = i < 512 ? 0 : 1;
    }
    return l;
};
Oscillator.Wavetables["tri"] = function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024) - 0.25;
        l[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
    }
    return l;
};
Oscillator.Wavetables["+tri"] = function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024) - 0.25;
        l[i] = (1.0 - 4.0 * Math.abs(Math.round(x) - x)) * 0.5 + 0.5;
    }
    return l;
};
Oscillator.Wavetables["sawup"] = function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024);
        l[i] = +2.0 * (x - Math.round(x));
    }
    return l;
};
Oscillator.Wavetables["+sawup"] = function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024);
        l[i] = (+2.0 * (x - Math.round(x))) * 0.5 + 0.5;
    }
    return l;
};
Oscillator.Wavetables["saw"]  = Oscillator.Wavetables["sawup"];
Oscillator.Wavetables["+saw"] = Oscillator.Wavetables["+sawup"];
Oscillator.Wavetables["sawdown"] = function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024);
        l[i] = -2.0 * (x - Math.round(x));
    }
    return l;
};
Oscillator.Wavetables["+sawdown"] = function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024);
        l[i] = (-2.0 * (x - Math.round(x))) * 0.5 + 0.5;
    }
    return l;
};
Oscillator.Wavetables["fami"] = function() {
    var l, d, x, i, j;
    d = [ +0.000, +0.125, +0.250, +0.375, +0.500, +0.625, +0.750, +0.875,
          +0.875, +0.750, +0.625, +0.500, +0.375, +0.250, +0.125, +0.000,
          -0.125, -0.250, -0.375, -0.500, -0.625, -0.750, -0.875, -1.000,
          -1.000, -0.875, -0.750, -0.625, -0.500, -0.375, -0.250, -0.125 ];
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = d[((i / 1024) * d.length)|0];
    }
    return l;
};
Oscillator.Wavetables["konami"] = function() {
    var l, d, x, i, j;
        d = [-0.625, -0.875, -0.125, +0.750, + 0.500, +0.125, +0.500, +0.750,
             +0.250, -0.125, +0.500, +0.875, + 0.625, +0.000, +0.250, +0.375,
             -0.125, -0.750, +0.000, +0.625, + 0.125, -0.500, -0.375, -0.125,
             -0.750, -1.000, -0.625, +0.000, - 0.375, -0.875, -0.625, -0.250 ];
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = d[((i / 1024) * d.length)|0];
    }
    return l;
};


timbre.fn.register("sin", Oscillator, function(_args) {
    return new Oscillator(["sin"].concat(_args));
});
timbre.fn.register("cos", Oscillator, function(_args) {
    return new Oscillator(["cos"].concat(_args));
});
timbre.fn.register("pulse", Oscillator, function(_args) {
    return new Oscillator(["pulse"].concat(_args));
});
timbre.fn.register("tri", Oscillator, function(_args) {
    return new Oscillator(["tri"].concat(_args));
});
timbre.fn.register("saw", Oscillator, function(_args) {
    return new Oscillator(["saw"].concat(_args));
});
timbre.fn.register("fami", Oscillator, function(_args) {
    return new Oscillator(["fami"].concat(_args));
});
timbre.fn.register("konami", Oscillator, function(_args) {
    return new Oscillator(["konami"].concat(_args));
});
timbre.fn.register("+sin", Oscillator, function(_args) {
    return (new Oscillator(["+sin"].concat(_args))).kr();
});
timbre.fn.register("+cos", Oscillator, function(_args) {
    return (new Oscillator(["+cos"].concat(_args))).kr();
});
timbre.fn.register("+pulse", Oscillator, function(_args) {
    return (new Oscillator(["+pulse"].concat(_args))).kr();
});
timbre.fn.register("+tri", Oscillator, function(_args) {
    return (new Oscillator(["+tri"].concat(_args))).kr();
});
timbre.fn.register("+saw", Oscillator, function(_args) {
    return (new Oscillator(["+saw"].concat(_args))).kr();
});



/**
 * WhiteNoise: 0.1.0
 * White noise generator
 * [ar-kr]
 */
var WhiteNoise = (function() {
    var WhiteNoise = function() {
        initialize.apply(this, arguments);
    }, $this = WhiteNoise.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("noise");
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var mul, add, x, i;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            mul = _.mul;
            add = _.add;
            if (_.ar) {
                for (i = cell.length; i--; ) {
                    cell[i] = (Math.random() * 2.0 - 1.0) * mul + add;
                }
            } else {
                x = (Math.random() * 2.0 - 1.0) * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    return WhiteNoise;
}());
timbre.fn.register("noise", WhiteNoise);


/**
 * FuncOscillator: 0.0.0
 * Signal generator
 * [ar-kr] TODO: kr
 */
var FuncOscillator = (function() {
    var FuncOscillator = function() {
        initialize.apply(this, arguments);
    }, $this = FuncOscillator.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    Object.defineProperty($this, "func", {
        set: function(value) {
            if (typeof value === "function") {
                this._.func = value;
            }
        },
        get: function() { return this._.func; }
    });
    Object.defineProperty($this, "numOfSamples", {
        set: function(value) {
            if (typeof value === "number") {
                this._.saved = new Float32Array(value);
                this._.numOfSamples = value;
            }
        },
        get: function() { return this._.numOfSamples; }
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            this._.freq = timbre(value);
        },
        get: function() { return this._.freq; }
    });
    Object.defineProperty($this, "phase", {
        set: function(value) {
            if (typeof value === "number") {
                while (value >= 1.0) value -= 1.0;
                while (value <  0.0) value += 1.0;
                this._.phase = this._.x = value;
            }
        },
        get: function() { return this._.phase; }
    });
    
    var DEFAULT_FUNCTION = function(x) { return x; };
    
    var initialize = function(_args) {
        var numOfSamples, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "number" && _args[i] > 0) {
            _.numOfSamples = _args[i++]|0;
        } else {
            _.numOfSamples = 0;
        }
        if (typeof _args[i] === "function") {
            _.func = _args[i++];
        } else {
            _.func = DEFAULT_FUNCTION;    
        }
        this.freq = _args[i++];
        
        _.saved = new Float32Array(_.numOfSamples);
        _.index = 0;
        _.phase = _.x = 0;
        _.coeff = 1 / timbre.samplerate;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("func", _.func, null, _.numOfSamples);
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        newone._.phase = _.phase;
        timbre.fn.copy_for_clone(this, newone, deep);        
        return newone;
    };
    
    $this.bang = function() {
        this._.x = this._.phase;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var func, freq, x, coeff;
        var mul, add, saved, index;
        var tmp, i, imax, j, jmax, k;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            func  = _.func;
            freq  = _.freq.seq(seq_id);
            
            x     = _.x;
            coeff = _.coeff;
            mul   = _.mul;
            add   = _.add;
            
            saved = _.saved;
            j     = _.index; jmax = saved.length;
            for (i = 0, imax = cell.length; i < imax; ++i, ++j) {
                if (jmax === 0) {
                    cell[i] = func(x) * mul + add;
                } else {
                    if (j >= jmax) {
                        tmp = func(x, freq[i] * coeff);
                        if (jmax !== 0) {
                            for (k = tmp.length; k--; ) {
                                saved[k] = tmp[k] || 0;
                            }
                        }
                        j = 0;
                    }
                    cell[i] = saved[j] * mul + add;
                }
                x += freq[i] * coeff;
                while (x >= 1.0) x -= 1.0;
            }
            _.index = j;
            _.x = x;
        }
        return cell;
    };
    
    return FuncOscillator;
}());
timbre.fn.register("func", FuncOscillator);

// __END__

describe("osc", function() {
    object_test(Oscillator, "osc");
});
describe("noise", function() {
    object_test(WhiteNoise, "noise");
});
describe("func", function() {
    object_test(FuncOscillator, "func");
});
