/**
 * timbre/envelopes
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ADSR = (function() {
    var ADSR = function() {
        initialize.apply(this, arguments);
    }, $this = ADSR.prototype;
    
    Object.defineProperty($this, "a", {
        set: function(value) {
            if (typeof value === "number") {
                this._a = value;
            }
        },
        get: function() {
            return this._a;
        }
    });
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._d = value;
            }
        },
        get: function() {
            return this._d;
        }
    });
    Object.defineProperty($this, "s", {
        set: function(value) {
            if (typeof value === "number") {
                this._s = value;
            }
        },
        get: function() {
            return this._s;
        }
    });
    Object.defineProperty($this, "r", {
        set: function(value) {
            if (typeof value === "number") {
                this._r = value;
            }
        },
        get: function() {
            return this._r;
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
        var i;

        i = 0;
        if (typeof _args[i] === "number") {
            this.a = _args[i++];
        } else {
            this.a = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.d = _args[i++];
        } else {
            this.d = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.s = _args[i++];
        } else {
            this.s = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.r = _args[i++];
        } else {
            this.r = 0.0;
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

        this._mode = 0;
        this._samplesMax = (timbre.samplerate * (this._a / 1000))|0;
        this._samples    = 0;
    };
    
    $this.bang = function() {
        this._mode = 0;
        this._samplesMax = (timbre.samplerate * (this._a / 1000))|0;
        this._samples    = 0;
        timbre.fn.do_event(this, "bang");
        timbre.fn.do_event(this, "A");
        return this;
    };
    
    $this.keyOff = function() {
        this._mode = 3;
        this._samples = 0;
        this._samplesMax = (timbre.samplerate * (this._r / 1000))|0;
        timbre.fn.do_event(this, "R");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell;
        var mode, samples, samplesMax;
        var mul, add;
        var s0, s1, x, i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            mode    = this._mode;
            samples = this._samples;
            samplesMax = this._samplesMax;
            mul = this._mul;
            add = this._add;
            s0 = this._s;
            s1 = 1.0 - this._s;
            
            while (samples >= samplesMax) {
                if (mode === 0) { // A -> D
                    this._mode = 1;
                    this._samples   -= samplesMax;
                    this._samplesMax = (timbre.samplerate * (this._d / 1000))|0;
                    timbre.fn.do_event(this, "D");
                    mode = this._mode;
                    samplesMax = this._samplesMax;
                    samples    = this._samples;
                    continue;
                }
                if (mode === 1) { // D -> S
                    this._mode = 2;
                    this._samples    = 0;
                    this._samplesMax = Infinity;
                    timbre.fn.do_event(this, "S");
                    mode = this._mode;
                    samplesMax = this._samplesMax;
                    samples    = this._samples;
                    continue;
                }
                if (mode === 3) { // S -> end
                    mode = 4;
                    this._samples    = 0;
                    this._samplesMax = Infinity;
                    timbre.fn.do_event(this, "ended");
                    mode = this._mode;
                    samplesMax = this._samplesMax;
                    samples    = this._samples;
                    continue;
                }
            }
            switch (mode) {
            case 0:
                x = samples / samplesMax;
                break;
            case 1:
                x = samples / samplesMax;
                x = (1.0 - x) * s1 + s0;
                break;
            case 2:
                x = s0;
                break;
            case 3:
                x = samples / samplesMax;
                x = (1.0 - x) * s1;
                break;
            default:
                x = 0;
                break;
            }
            x = x * mul + add;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            this._mode = mode;
            this._samples    = samples + imax;
            this._samplesMax = samplesMax;
        }
        return cell;
    };
    
    return ADSR;
}());
timbre.fn.register("adsr", ADSR);


var Perc = (function() {
    var Perc = function() {
        initialize.apply(this, arguments);
    }, $this = Perc.prototype;
    
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._d = value;
            }
        },
        get: function() {
            return this._d;
        }
    });
    
    var nop = function() {};
    
    var initialize = function(_args) {
        var i;
        
        i = 0;
        if (typeof _args[i] === "number") {
            this.d = _args[i++];
        } else {
            this.d = 100.0;
        }
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        this._samples = (timbre.samplerate * (this._d / 1000))|0;
        this._dx = timbre.cellsize / this._samples;
        this._x  = 1.0;
    };
    
    $this.bang = function() {
        this._samples = (timbre.samplerate * (this._d / 1000))|0;
        this._dx = timbre.cellsize / this._samples;
        this._x  = 1.0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell;
        var x, dx, samples;
        var i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            x  = this._x;
            dx = this._dx;
            samples = this._samples;
            
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            x -= dx * imax;
            if (x < 0.0) x = 0.0;
            if (samples > 0) {
                samples -= imax;
                if (samples <= 0) {
                    this._samples = 0;
                    timbre.fn.do_event(this, "ended");
                    x  = this._x;
                    samples = this._samples;
                }
            }
            
            this._x = x;
            this._samples = samples;
        }
        return cell;
    };
    
    return Perc;
}());
timbre.fn.register("perc", Perc);

// __END__

describe("adsr", function() {
    var instance = timbre("adsr", 1000, 1000, 0.2, 200);
    object_test(ADSR, instance);
});
describe("perc", function() {
    var instance = timbre("perc", 1000);
    object_test(Perc, instance);
});
