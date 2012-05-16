/**
 *  timbre / JavaScript Library for Objective Sound Programming
 */
"use strict";

// __BEGIN__
var timbre = function() {
    return timbre.fn.init.apply(timbre, arguments);
};
timbre.VERSION    = "${VERSION}";
timbre.BUILD      = "${DATE}";
timbre.env        = "";
timbre.platform   = "";
timbre.samplerate = 44100;
timbre.channels   = 2;
timbre.cellsize   = 128;
timbre.streamsize = 1024;
timbre.verbose    = true;
timbre.dacs       = [];
timbre._sys       = null;
timbre._global    = {};


var SoundSystem = (function() {
    var SoundSystem = function() {
        initialize.apply(this, arguments);
    }, $this = SoundSystem.prototype;
    
    var initialize = function(streamsize, channels) {
        streamsize = streamsize || timbre.streamsize;
        channels   = channels   || timbre.channels;
        channels   = (channels === 1) ? 1 : 2;
        
        this.streamsize = streamsize;
        this.channels   = channels;
        this.L = new Float32Array(streamsize);
        this.R = new Float32Array(streamsize);
        
        this._impl = null;
        this._cell = new Float32Array(timbre.cellsize);
        this._cellsize = timbre.cellsize;
        this._seq_id = 0;
    };
    
    $this.bind = function(PlayerKlass) {
        this._impl = new PlayerKlass(this);
    };

    $this.on = function() {
        if (this._impl) this._impl.on();
    };
    
    $this.off = function() {
        if (this._impl) this._impl.off();
    };
    
    $this.process = function() {
        var cell, L, R;
        var seq_id, dacs, dac;
        var i, imax, j, jmax, k, kmax, n, nmax;
        var saved_i, tmpL, tmpR, amp, x;
        
        cell = this._cell;
        L = this.L;
        R = this.R;
        dacs = timbre.dacs;
        seq_id = this._seq_id;
        
        imax = L.length;
        jmax = dacs.length;        
        kmax = this._cellsize;
        nmax = this.streamsize / kmax;
        saved_i = 0;
        amp     = 1.0;
        
        // clear
        for (i = imax; i--; ) {
            L[i] = R[i] = 0.0;
        }
        
        // signal process
        for (n = nmax; n--; ) {
            ++seq_id;
            for (j = dacs.length; j--; ) {
                dac = dacs[j];
                dac.seq(seq_id);
                tmpL = dac._L;
                tmpR = dac._R;
                for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                    L[i] += tmpL[k];
                    R[i] += tmpR[k];
                    cell[k] = tmpL[k] + tmpR[k];
                }
            }
            saved_i = i;
        }
        
        // clip
        for (i = imax = L.length; i--; ) {
            x = L[i] * amp;
            if (x < -1.0) {
                x = -1.0;
            } else if (1.0 < x) {
                x = 1.0;
            }
            L[i] = x;
            
            x = R[i] * amp;
            if (x < -1.0) {
                x = -1.0;
            } else if (1.0 < x) {
                x = 1.0;
            }
            R[i] = x;
        }
        
        for (k = kmax; k--; ) {
            cell[k] *= 0.5;
        }
        
        this._seq_id = seq_id;
    };
    
    return SoundSystem;
}());
timbre._sys = new SoundSystem();

timbre.on = function() {
    timbre._sys.on();
    return timbre;
};

timbre.off = function() {
    timbre._sys.off();
    return timbre;
};


// timbre.functions
timbre.fn = (function(timbre) {
    var fn = {};

    var klasses = {};
    klasses.find = function(key) {
        if (typeof klasses[key] === "function") {
            return klasses[key];
        }
    };
    
    fn.init = function() {
        var args, key, klass, instance;
        args = Array.prototype.slice.call(arguments);
        key  = args[0];
        
        switch (typeof key) {
        case "string":
            klass = klasses.find(key);
            if (klass) {
                instance = new klass(args.slice(1));
            }
            break;
        case "number":
            instance = new NumberWrapper([key]);
            break;
        case "boolean":
            instance = new BooleanWrapper([key]);
            break;
        case "function":
            instance = new FunctionWrapper(args);
            break;
        case "object":
            break; // TODO:
        }
        
        if (instance === undefined) {
            if (key === null) {
                instance = new NullWrapper();
            } else {
                instance = new UndefinedWrapper();
            }
        }
        return object_init.call(instance);
    };
    
    fn.register = function(key, klass) {
        if (typeof klass === "function") {
            if (typeof key === "string") {
                klass.prototype._klass = klass;
                klass.prototype._name  = key;
                klasses[key] = klass;
            }
        }
    };
    
    fn.valist = function(_args) {
        var args;
        var i, imax;
        
        args = [];
        for(i = 0, imax = _args.length; i < imax; ++i) {
            switch (typeof _args[i]) {
            case "number":
            case "boolean":
            case "function":
            case "undefined":
                args.push(timbre(_args[i]));
                break;
            case "object":
                if (_args[i] === null) {
                    args.push(timbre(null));
                } else {
                    args.push(_args[i]);
                }
                break;
            default:
                args.push(timbre(undefined));
                break;
            }
        }
        
        return args;
    };
    
    fn.init_set = function() {
        this.append = function() {
            var args, i;
            args = fn.valist(arguments);
            for (i = args.length; i--; ) {
                if (this.indexOf(args[i]) === -1) {
                    this.push(args[i]);
                }
            }
            return this;
        };
        this.remove = function() {
            var i, j;
            for (i = arguments.length; i--; ) {
                if ((j = this.indexOf(arguments[i])) !== -1) {
                    this.splice(j, 1);
                }
            }
            return this;
        };
        this.update = function(list) {
            this.append.apply(this, list);
        };
        return this;
    };
    
    var defaults = {};
    defaults.seq = function() {
        return this._cell;
    };
    
    var object_init = function() {
        this._seq_id = -1;

        if (!this._cell) {
            this._cell = new Float32Array(timbre.cellsize);
        }
        if (!this.args) {
            this.args = [];
        }
        if (typeof this.seq !== "function") {
            this.seq = defaults.seq;
        }
        
        if (this._post_init) {
            this._post_init();
        }
        
        return this;
    };
    
    return fn;
}(timbre));
timbre.fn.init_set.call(timbre.dacs);


// built-in-types
var NumberWrapper = (function() {
    var NumberWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = NumberWrapper.prototype;

    var initialize = function(_args) {
        if (typeof _args[0] === "number") {
            this._value = _args[0];
        } else{
            this._value = 0;
        }
    };
    
    $this._post_init = function() {
        var cell, value, i;
        cell  = this._cell;
        value = this._value;
        for (i = cell.length; i--; ) {
            cell[i] = value;
        }
    };
    
    return NumberWrapper;
}());
timbre.fn.register("number", NumberWrapper);

var BooleanWrapper = (function() {
    var BooleanWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = BooleanWrapper.prototype;

    var initialize = function(_args) {
        if (typeof _args[0] === "boolean") {
            this._value = _args[0];
        } else{
            this._value = false;
        }
    };
    
    $this._post_init = function() {
        var cell, value, i;
        cell  = this._cell;
        value = this._value ? 1 : 0;
        for (i = cell.length; i--; ) {
            cell[i] = value;
        }
    };
    
    return BooleanWrapper;
}());
timbre.fn.register("boolean", BooleanWrapper);

var FunctionWrapper = (function() {
    var FunctionWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = FunctionWrapper.prototype;

    var initialize = function(_args) {
        var i, tmp;
        
        this._func = function(x) { return x; };
        this._freq = 0;
        
        i = 0;
        if (typeof _args[i] === "function") {
            this._func = _args[i++];
        }
        if (typeof _args[i] === "object") {
            this._freq = _args[i++];
        } else {
            this._freq = timbre(_args[i++]);
        }
        
        this._phase = 0;
        this._coeff = 1 / timbre.samplerate;
        
        tmp = this._func(0);
        if (tmp instanceof Float32Array || tmp instanceof Array) {
            this.seq = ary_seq;
            this._array_saved = [];
            this._array_index = 0;
        } else if (typeof tmp === "number") {
            this.seq = num_seq;
        } else {
            this._func = function(x) { return 0; };
            this.seq = num_seq;
        }
    };

    var num_ary = function(seq_id) {
        var cell, func, tmp;
        var freq, phase, coeff;
        var i, imax, j, jmax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            func = this._func;
            freq  = this._freq.seq(seq_id);
            phase = this._phase;
            coeff  = this._coeff;
            tmp = this._array_saved;
            j   = this._array_index; jmax = tmp.length;
            for (i = 0, imax = cell.length; i < imax; ++i, ++j) {
                if (j >= jmax) {
                    tmp = func(phase, freq[i] * coeff);
                    j = 0; jmax = tmp.length;
                }
                cell[i] = tmp[j];
                phase += freq[i] * coeff;
                while (phase >= 1.0) phase -= 1.0;
            }
            this._array_saved = tmp;
            this._array_index = j;
            this._phase = phase;
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    var num_seq = function(seq_id) {
        var cell, func;
        var freq, phase, coeff;
        var i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            func = this._func;
            freq  = this._freq.seq(seq_id);
            phase = this._phase;
            coeff  = this._coeff;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = func(phase);
                phase += freq[i] * coeff;
                while (phase >= 1.0) phase -= 1.0;
            }
            this._phase = phase;
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    return FunctionWrapper;
}());
timbre.fn.register("function", FunctionWrapper);

var UndefinedWrapper = function() {};
timbre.fn.register("undefined", UndefinedWrapper);

var NullWrapper = function() {};
timbre.fn.register("null", NullWrapper);


// __END__
global.T = global.timbre = timbre;
module.exports = timbre;

var should = require("should");
global.object_test = function() {
    var klass, args, instance;
    
    klass = arguments[0];
    args  = Array.prototype.slice.call(arguments, 1);
    
    describe("#new()", function() {
        it("create an instance", function() {
            instance = timbre.apply(null, args);
            should.exist(instance);
            instance.should.be.an.instanceOf(klass);
        });
        it("args is an Array()", function() {
            instance.args.should.be.an.instanceOf(Array);
        });
        it("cell is a Float32Array(timbre.cellsize)", function() {
            instance._cell.should.be.an.instanceOf(Float32Array);
            instance._cell.should.have.length(timbre.cellsize);
        });
    });
    describe("#seq()", function() {
        it("execute", function() {
            var _;
            instance.seq.should.be.an.instanceOf(Function);
            _ = instance.seq(0);
            _.should.be.an.instanceOf(Float32Array);
            _.should.have.length(timbre.cellsize);
        });
    });

    return instance;
};

describe("timbre built-in object", function() {
    describe("NumberWrapper", function() {
        object_test(NumberWrapper, 100);
    });
    describe("BooleanWrapper", function() {
        object_test(BooleanWrapper, true);
    });
    describe("FunctionWrapper", function() {
        object_test(FunctionWrapper, function(x) { return x/2; });
    });
    describe("NullWrapper", function() {
        object_test(NullWrapper, null);
    });
    describe("UndefinedWrapper", function() {
        object_test(UndefinedWrapper, undefined);
    });
});
