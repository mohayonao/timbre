/**
 * timbre/osillators
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Oscillator = (function() {
    var Oscillator = function() {
        initialize.apply(this, arguments);
    }, $this = Oscillator.prototype;
    
    Object.defineProperty($this, "wavelet", {
        set: function(value) {
            var wavelet, i, dx;
            wavelet = this._wavelet;
            if (typeof value === "function") {
                for (i = 0; i < 1024; i++) {
                    wavelet[i] = value(i / 1024);
                }
            } else if (typeof value === "string" && value instanceof Float32Array) {
                dx = value.length / 1024;
                for (i = 0; i < 1024; i++) {
                    wavelet[i] = value[(i * dx)|0] || 0.0;
                }
            } else if (typeof value === "string") {
                if ((dx = Oscillator.wavelets[value]) !== undefined) {
                    for (i = 0; i < 1024; i++) {
                        wavelet[i] = dx[i];
                    }
                }
            }
        },
        get: function() {
            return this._wavelet;
        }
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            if (typeof value === "object") {
                this._freq = value;
            } else {
                this._freq = timbre(value);
            }
        },
        get: function() {
            return this._freq;
        }
    });
    Object.defineProperty($this, "phase", {
        set: function(value) {
            if (typeof value === "number") {
                while (value >= 1.0) value -= 1.0;
                while (value <  0.0) value += 1.0;
                this._phase = value;
                this._x = 1024 * this._phase;
            }
        },
        get: function() {
            return this._phase;
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
        var i ;
        
        i = 0;
        this._wavelet = new Float32Array(1024);        
        
        if (typeof _args[i] === "function") {
            this.wavelet = _args[i++];
        } else if (typeof _args[i] === "object" && _args[i] instanceof Float32Array) {
            this.wavelet = _args[i++];
        } else if (typeof _args[i] === "string") {
            this.wavelet = _args[i++];
        }
        this.freq = _args[i++];
        if (typeof _args[i] === "number") {
            this.phase = _args[i++];
        } else {
            this.phase = 0.0;
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
        
        this._x = 1024 * this._phase;
        this._coeff = 1024 / timbre.samplerate;
    };
    
    $this.clone = function() {
        return new Oscillator([this.wavelet, this.freq, this.phase, this.mul, this.add]);
    };
    
    $this.bang = function() {
        this._x = 1024 * this._phase;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell;
        var freq, mul, add, wavelet;
        var x, coeff;
        var index, delta, x0, x1, xx;
        var i, imax;
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            freq = this._freq.seq(seq_id);
            mul  = this._mul * this._mul;
            add  = this._add;
            wavelet = this._wavelet;
            x = this._x;
            coeff = this._coeff;
            for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                index = x|0;
                delta = x - index;
                x0 = wavelet[(index  ) & 1023];
                x1 = wavelet[(index+1) & 1023];
                xx = (1.0 - delta) * x0 + delta * x1;
                cell[i] = xx * mul + add;
                x += freq[i] * coeff;
            }
            this._x = x;
            this._seq_id = seq_id;
        }        
        return cell;
    }
    
    return Oscillator;
}());
timbre.fn.register("osc", Oscillator);

Oscillator.wavelets = {};
Oscillator.wavelets.sin = (function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = Math.sin(2 * Math.PI * (i/1024));
    }
    return l;
}());
Oscillator.wavelets.cos = (function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = Math.cos(2 * Math.PI * (i/1024));
    }
    return l;
}());
Oscillator.wavelets.pulse = (function() {
    var l, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        l[i] = i < 512 ? -1 : +1;
    }
    return l;
}());
Oscillator.wavelets.tri = (function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024) - 0.25;
        l[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
    }
    return l;
}());
Oscillator.wavelets.sawup = (function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024);
        l[i] = +2.0 * (x - Math.round(x));
    }
    return l;
}());
Oscillator.wavelets.saw = Oscillator.wavelets.sawup;
Oscillator.wavelets.sawdown = (function() {
    var l, x, i;
    l = new Float32Array(1024);
    for (i = 0; i < 1024; ++i) {
        x = (i / 1024);
        l[i] = -2.0 * (x - Math.round(x));
    }
    return l;
}());
Oscillator.wavelets.fami = (function() {
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
}());
Oscillator.wavelets.konami = (function() {
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
}());


timbre.fn.register("sin", function(_args) {
    return new Oscillator(["sin"].concat(_args));
});
timbre.fn.register("cos", function(_args) {
    return new Oscillator(["cos"].concat(_args));
});
timbre.fn.register("pulse", function(_args) {
    return new Oscillator(["pulse"].concat(_args));
});
timbre.fn.register("tri", function(_args) {
    return new Oscillator(["tri"].concat(_args));
});
timbre.fn.register("saw", function(_args) {
    return new Oscillator(["saw"].concat(_args));
});
timbre.fn.register("sawup", function(_args) {
    return new Oscillator(["sawup"].concat(_args));
});
timbre.fn.register("sawdown", function(_args) {
    return new Oscillator(["sawdown"].concat(_args));
});
timbre.fn.register("fami", function(_args) {
    return new Oscillator(["fami"].concat(_args));
});
timbre.fn.register("konami", function(_args) {
    return new Oscillator(["konami"].concat(_args));
});

// __END__

describe("osc", function() {
    var instance = timbre("osc", "sin", 0, 0.5, 2, 100);
    object_test(Oscillator, instance);
    describe("#wavelet", function() {
        it("should be an instance of Float32Array(1024)", function() {
            instance.wavelet.should.be.an.instanceOf(Float32Array);
            instance.wavelet.length.should.equal(1024);
        });
    });
    describe("#freq", function() {
        it("should be an instance of Object", function() {
            object_test(timbre(0)._klass, instance.freq);
        });
    });
    describe("#phase", function() {
        it("should equal 0.5", function() {
            instance.phase.should.equal(0.5);
        });
    });
    describe("#mul", function() {
        it("should equal 2", function() {
            instance.mul.should.equal(2);
        });
    });
    describe("#add", function() {
        it("should equal 100", function() {
            instance.add.should.equal(100);
        });
    });
});
