/**
 * Oscillator
 * Table lookup oscillator
 * v 0. 0. 1: first version
 * v12.07.18: wave shaping
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Oscillator = (function() {
    var Oscillator = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Oscillator, {
        base: "ar-kr",
        properties: {
            wave: {
                set: function(val) {
                    var dx, wave = this._.wave;
                    if (typeof val === "function") {
                        for (var i = 0; i < 1024; i++) {
                            wave[i] = val(i / 1024);
                        }
                    } else if (typeof val === "object" &&
                               (val instanceof Array ||
                                val.buffer instanceof ArrayBuffer)) {
                        if (val.length === 1024) {
                            this._.wave = val;
                        } else {
                            dx = val.length / 1024;
                            for (var i = 0; i < 1024; i++) {
                                wave[i] = val[(i * dx)|0] || 0.0;
                            }
                        }
                    } else if (typeof val === "string") {
                        if ((dx = this.getWavetable(val)) !== undefined) {
                            this._.wave = dx;
                        }
                    }
                },
                get: function() { return this._.wave; }
            },
            freq: {
                set: function(val) {
                    this._.freq = timbre(val);
                },
                get: function() { return this._.freq; }
            },
            phase: {
                set: function(val) {
                    if (typeof val === "number") {
                        while (val >= 1.0) val -= 1.0;
                        while (val <  0.0) val += 1.0;
                        this._.phase = val;
                        this._.x = 1024 * this._.phase;
                    }
                },
                get: function() { return this._.phase; }
            }
        } // properties
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.wave  = new Float32Array(1024);
        _.phase = 0;
        _.x     = 0;
        _.coeff = 1024 / timbre.samplerate;
        
        var i = 0;
        this.wave = "sin";
        if (typeof _args[i] === "function") {
            this.wave = _args[i++];
        } else if (_args[i] instanceof Float32Array) {
            this.wave = _args[i++];
        } else if (typeof _args[i] === "string") {
            this.wave = _args[i++];
        }
        
        if (_args[i] !== undefined) {
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
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = timbre("osc", _.wave);
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        newone._.phase = _.phase;
        return timbre.fn.copyBaseArguments(this, newone, deep);        
    };
    
    $this.bang = function() {
        var _ = this._;
        _.x = 1024 * _.phase;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var index, delta, x0, x1, xx;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var freq = _.freq.seq(seq_id);
            var mul  = _.mul , add = _.add;
            var wave = _.wave, x   = _.x, coeff = _.coeff;
            
            if (_.ar) { // ar-mode
                if (_.freq.isAr) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        index = x|0; delta = x - index;
                        x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                        cell[i] = ((1.0 - delta) * x0 + delta * x1) * mul + add;
                        x += freq[i] * coeff;
                    }
                } else {
                    var dx = freq[0] * coeff;
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        index = x|0; delta = x - index;
                        x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                        cell[i] = ((1.0 - delta) * x0 + delta * x1) * mul + add;
                        x += dx;
                    }
                }
            } else {    // kr-mode
                index = x|0; delta = x - index;
                x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                xx = ((1.0 - delta) * x0 + delta * x1) * mul + add;
                for (i = imax = cell.length; i--; ) cell[i] = xx;
                x += freq[0] * coeff * imax;
            }
            while (x > 1024) x -= 1024;
            _.x = x;
        }
        
        return cell;
    };
    
    
    var shapeWave = function(shape, wave) {
        var i, _wave;
        switch (shape) {
        case "@1":
            for (i = 512; i < 1024; ++i) wave[i] = 0;
            break;
        case "@2":
            for (i = 512; i < 1024; ++i) wave[i] = Math.abs(wave[i]);
            break;
        case "@3":
            for (i = 256; i <  512; ++i) wave[i] = 0;
            for (i = 512; i <  768; ++i) wave[i] = Math.abs(wave[i]);
            for (i = 768; i < 1024; ++i) wave[i] = 0;
            break;
        case "@4":
            _wave = new Float32Array(1024);
            for (i = 0; i < 512; ++i) _wave[i] = wave[i<<1];
            wave = _wave;
            break;
        case "@5":
            _wave = new Float32Array(1024);
            for (i = 0; i < 512; ++i) _wave[i] = Math.abs(wave[i<<1]);
            wave = _wave;
            break;
        }
        return wave;
    };

    var phaseDistortion = function(width, wave) {
        if (width !== undefined) {
            width *= 0.01;
            width = (width < 0) ? 0 : (width > 1) ? 1 : width;
            
            var _wave = new Float32Array(1024);            
            var tp = (1024 * width)|0;
            var x  = 0;
            var dx = (width > 0) ? 0.5 / width : 0;
            var index, delta, x0, x1;
            
            for (var i = 0; i < 1024; ++i) {
                index = x|0; delta = x - index;
                x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                _wave[i] = ((1.0 - delta) * x0 + delta * x1);
                if (i === tp) {
                    x  = 512;
                    dx = (width < 1) ? 0.5 / (1-width) : 0;
                }
                x += dx;
            }
            wave = _wave;
        }
        return wave;
    };
    
    $this.getWavetable = function(key) {
        var m, wave = Oscillator.Wavetables[key];
        if (wave !== undefined) {
            if (wave instanceof Function) wave = wave();
            return wave;
        } else {
            m = /^([-+]?)(\w+)(?:\((@[0-7])?:?(\d+\.?\d*)?\))?$/.exec(key);
            if (m !== null) { // wave shape
                var sign = m[1], name = m[2], shape = m[3], width = m[4];
                wave = Oscillator.Wavetables[name];
                if (wave !== undefined) {
                    wave = (wave instanceof Function) ? wave() : wave;
                    wave = shapeWave(shape, wave);
                    wave = phaseDistortion(width, wave);
                    if (sign === "+") {
                        for (var i = 1024; i--; )
                            wave[i] = wave[i] * +0.5 + 0.5;
                    } else if (sign === "-") {
                        for (var i = 1024; i--; )
                            wave[i] *= -1;
                    }
                    return Oscillator.Wavetables[key] = wave;
                }
            }
            m = /^wavb\(((?:[0-9a-fA-F][0-9a-fA-F])+)\)$/.exec(key);
            if (m !== null) {
                wave = timbre.utils.wavb(m[1]);
                return Oscillator.Wavetables[key] = wave;
            }
            m = /^wavc\(([0-9a-fA-F]{8})\)$/.exec(key);
            if (m !== null) {
                wave = timbre.utils.wavc(m[1]);
                return Oscillator.Wavetables[key] = wave;
            }
        }
    };
    
    $this.setWavetable = function(name, value) {
        if (typeof value === "function") {
            var wave = new Float32Array(1024);
            for (var i = 0; i < 1024; i++) {
                wave[i] = value(i / 1024);
            }
            Oscillator.Wavetables[name] = wave;
        } else if (typeof value === "object" &&
                   (value instanceof Array ||
                    value.buffer instanceof ArrayBuffer)) {
            if (value.length === 1024) {
                Oscillator.Wavetables[name] = value;
            } else {
                var wave = new Float32Array(1024);
                var dx = value.length / 1024;
                for (var i = 0; i < 1024; i++) {
                    wave[i] = value[(i * dx)|0] || 0.0;
                }
                Oscillator.Wavetables[name] = value;
            }
        }
    };
    
    return Oscillator;
}());
timbre.fn.register("osc", Oscillator);

Oscillator.Wavetables = {
    sin: function() {
        var l = new Float32Array(1024);
        for (var i = 1024; i--; )
            l[i] = Math.sin(2 * Math.PI * (i/1024));
        return l;
    },
    cos: function() {
        var l = new Float32Array(1024);
        for (var i = 1024; i--; )
            l[i] = Math.cos(2 * Math.PI * (i/1024));
        return l;
    },
    pulse: function() {
        var l = new Float32Array(1024);
        for (var i = 1024; i--; )
            l[i] = (i < 512) ? +1 : -1;
        return l;
    },
    tri: function() {
        var l = new Float32Array(1024);
        for (var x, i = 1024; i--; ) {
            x = (i / 1024) - 0.25;
            l[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }
        return l;
    },
    sawup: function() {
        var l = new Float32Array(1024);
        for (var x, i = 1024; i--; ) {
            x = (i / 1024);
            l[i] = +2.0 * (x - Math.round(x));
        }
        return l;
    },
    sawdown: function() {
        var l = new Float32Array(1024);
        for (var x, i = 1024; i--; ) {
            x = (i / 1024);
            l[i] = -2.0 * (x - Math.round(x));
        }
        return l;
    },
    fami: function() {
        var d = [ +0.000, +0.125, +0.250, +0.375, +0.500, +0.625, +0.750, +0.875,
                  +0.875, +0.750, +0.625, +0.500, +0.375, +0.250, +0.125, +0.000,
                  -0.125, -0.250, -0.375, -0.500, -0.625, -0.750, -0.875, -1.000,
                  -1.000, -0.875, -0.750, -0.625, -0.500, -0.375, -0.250, -0.125 ];
        var l = new Float32Array(1024);
        for (var i = 1024; i--; )
            l[i] = d[(i / 1024 * d.length)|0];
        return l;
    },
    konami: function() {
        var d = [-0.625, -0.875, -0.125, +0.750, + 0.500, +0.125, +0.500, +0.750,
                 +0.250, -0.125, +0.500, +0.875, + 0.625, +0.000, +0.250, +0.375,
                 -0.125, -0.750, +0.000, +0.625, + 0.125, -0.500, -0.375, -0.125,
                 -0.750, -1.000, -0.625, +0.000, - 0.375, -0.875, -0.625, -0.250 ];
        var l = new Float32Array(1024);
        for (var i = 1024; i--; )
            l[i] = d[(i / 1024 * d.length)|0];
        return l;
    }
};
Oscillator.Wavetables["saw"] = Oscillator.Wavetables["sawup" ];

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

// __END__
if (module.parent && !module.parent.parent) {
    describe("osc", function() {
        object_test(Oscillator, "osc");
    });
}
