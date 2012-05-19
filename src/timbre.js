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
timbre.amp        = 0.8;
timbre.verbose    = true;
timbre.dacs       = [];
timbre.timers     = [];
timbre._ev        = {};
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
        this._ison = false;
        this._cell = new Float32Array(timbre.cellsize);
        this._cellsize = timbre.cellsize;
        this._seq_id = 0;
    };
    
    $this.bind = function(PlayerKlass) {
        this._impl = new PlayerKlass(this);
    };

    $this.on = function() {
        if (this._impl) {
            this._ison = true;
            this._impl.on();
        }
    };
    
    $this.off = function() {
        if (this._impl) {
            this._impl.off();
            this._ison = false;
        }
    };
    
    $this.process = function() {
        var cell, L, R;
        var seq_id, dacs, dac, timers, timer;
        var i, imax, j, jmax, k, kmax, n, nmax;
        var saved_i, tmpL, tmpR, amp, x;
        
        cell = this._cell;
        L = this.L;
        R = this.R;
        amp = timbre.amp;
        
        dacs   = timbre.dacs;
        timers = timbre.timers;
        seq_id = this._seq_id;
        
        imax = L.length;
        jmax = dacs.length;        
        kmax = this._cellsize;
        nmax = this.streamsize / kmax;
        saved_i = 0;
        
        // clear
        for (i = imax; i--; ) {
            L[i] = R[i] = 0.0;
        }
        
        // signal process
        for (n = nmax; n--; ) {
            ++seq_id;
            for (j = timers.length; j--; ) {
                if ((timer = timers[j]) !== undefined) {
                    timer.seq(seq_id);
                }
            }
            for (j = dacs.length; j--; ) {
                if ((dac = dacs[j]) !== undefined) {
                    dac.seq(seq_id);
                    tmpL = dac._L;
                    tmpR = dac._R;
                    for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                        L[i] += tmpL[k];
                        R[i] += tmpR[k];
                    }
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
            cell[k] = L[k] + R[k];
            x = cell[k] * amp * 0.5;
            if (x < -1.0) {
                x = -1.0;
            } else if (1.0 < x) {
                x = 1.0;
            }
            cell[k] = x;
        }
        
        this._seq_id = seq_id;
    };
    
    return SoundSystem;
}());
timbre._sys = new SoundSystem();

Object.defineProperty(timbre, "isOn", {
    get: function() {
        return timbre._sys._ison;
    }
});
Object.defineProperty(timbre, "isOff", {
    get: function() {
        return !timbre._sys._ison;
    }
});

timbre.on = function() {
    if (!timbre._sys._ison) {
        timbre._sys.on();
        timbre.fn.do_event(this, "on");
    }
    return timbre;
};

timbre.off = function() {
    if (timbre._sys._ison) {
        timbre._sys.off();
        timbre.fn.do_event(this, "off");
    }
    return timbre;
};

timbre.addEventListener = function(name, func) {
    var list, i;
    if (typeof func === "function") {
        list = this._ev[name];
        if (list === undefined) {
            this._ev[name] = list = [];
        }
        if ((i = list.indexOf(func)) === -1) {
            list.push(func);
        }
    }
    return this;
};
timbre.removeEventListener = function(name, func) {
    var list, i;
    if (typeof name === "string" && name !== "") {
        list = this._ev[name];
        if (list !== undefined) {
            if ((i = list.indexOf(func)) !== -1) {
                list.splice(i, 1);
            }
        }
    }
    return this;
};
timbre.removeAllEventListeners = function(name) {
    if (typeof name === "string" && name !== "") {
        delete this._ev[name];
        delete this["on" + name];
    }
    return this;
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
            if (key && typeof key.clone === "function") {
                instance = key.clone();
            }
            break;
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
    
    fn.init_set = (function() {
        var append = function() {
            var args, i;
            args = fn.valist(arguments);
            for (i = args.length; i--; ) {
                if (this.indexOf(args[i]) === -1) {
                    this.push(args[i]);
                }
            }
            return this;
        };
        var remove = function() {
            var i, j;
            for (i = arguments.length; i--; ) {
                if ((j = this.indexOf(arguments[i])) !== -1) {
                    this.splice(j, 1);
                }
            }
            return this;
        };
        var update = function() {
            this.append.apply(this, list);
        };
        return function() {
            this.append = append;
            this.remove = remove;
            this.update = update;
            return this;
        };
    }());
    
    fn.do_event = function(obj, name, args) {
        var func, list, i;
        func = obj["on" + name];
        if (typeof func === "function") {
            func.apply(obj, args);
        }
        list = obj._ev[name];
        if (list !== undefined) {
            for (i = list.length; i--; ) {
                list[i].apply(obj, args);
            }
        }
    };
    
    var noneseq = (function() {
        var nonecell = new Float32Array(timbre.cellsize);
        return function() { return nonecell; };
    }());
    
    var defaults = {};
    defaults.seq = function() {
        return this._cell;
    };
    defaults.on = function() {
        this.seq = this._seq;
        timbre.fn.do_event(this, "on");
        return this;
    };
    defaults.off = function() {
        this.seq = noneseq;
        timbre.fn.do_event(this, "off");
        return this;
    };
    defaults.clone = function() {
        return new this._klass(this.args);
    };
    defaults.set = function(key, value) {
        var self;
        self = this;
        while (self !== null) {
            if (Object.getOwnPropertyDescriptor(self, key)) {
                this[key] = value;
                break;
            }
            self = Object.getPrototypeOf(self);
        }
        return this;
    };
    defaults.get = function(key) {
        var self, res;
        self = this;
        while (self !== null) {
            if (Object.getOwnPropertyDescriptor(self, key)) {
                res = this[key];
                break;
            }
            self = Object.getPrototypeOf(self);
        }
        return res;
    };
    defaults.bang = function() {
        timbre.fn.do_event(this, "bang");
        return this;
    };
    defaults.addEventListener        = timbre.addEventListener;
    defaults.removeEventListener     = timbre.removeEventListener;
    defaults.removeAllEventListeners = timbre.removeAllEventListeners;
    
    
    var object_init = function() {
        this._seq_id = -1;
        
        if (!this._cell) {
            this._cell = new Float32Array(timbre.cellsize);
        }
        if (!this.args) {
            this.args = [];
        }
        timbre.fn.init_set.call(this.args);
        
        if (!this._ev) {
            this._ev = {};
        }
        
        if (!this.set) {
            this.set = defaults.set;
        }
        if (!this.get) {
            this.get = defaults.get;
        }

        if (!this.bang) {
            this.bang = defaults.bang;
        }
        
        if (typeof this._ar !== "boolean") {
            this._ar = false;
        }
        Object.defineProperty(this, "isAr", {
            get: function() { return this._ar; }
        });
        Object.defineProperty(this, "isKr", {
            get: function() { return !this._ar; }
        });
        
        if (typeof this.seq !== "function") {
            this.seq = defaults.seq;
        }
        this._seq = this.seq;
        
        if (typeof this.on !== "function") {
            this.on = defaults.on;
        }
        if (typeof this.off !== "function") {
            this.off = defaults.off;
        }
        if (typeof this.clone !== "function") {
            this.clone = defaults.clone;
        }
        if (typeof this.addEventListener !== "function") {
            this.addEventListener = defaults.addEventListener;
        }
        if (typeof this.removeEventListener !== "function") {
            this.removeEventListener = defaults.removeEventListener;
        }
        
        if (this._post_init) {
            this._post_init();
        }
        
        return this;
    };
    
    return fn;
}(timbre));
timbre.fn.init_set.call(timbre.dacs);
timbre.fn.init_set.call(timbre.timers);


// built-in-types
var NumberWrapper = (function() {
    var NumberWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = NumberWrapper.prototype;
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            var cell, i;
            if (typeof value === "number") {
                this._value = value;
                cell = this._cell;
                for (i = cell.length; i--; ) {
                    cell[i] = value;
                }
            }
        },
        get: function() {
            return this._value;
        }
    });
    
    var initialize = function(_args) {
        if (typeof _args[0] === "number") {
            this._value = _args[0];
        } else{
            this._value = 0;
        }
    };
    
    $this._post_init = function() {
        this.value = this._value;
    };
    
    $this.clone = function() {
        return new NumberWrapper([this.value]);
    };
    
    return NumberWrapper;
}());
timbre.fn.register("number", NumberWrapper);

var BooleanWrapper = (function() {
    var BooleanWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = BooleanWrapper.prototype;
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            var cell, i, x;
            this._value = !!value;
            cell = this._cell;
            x = this._value ? 1 : 0;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        },
        get: function() {
            return this._value;
        }
    });
    
    var initialize = function(_args) {
        if (typeof _args[0] === "boolean") {
            this._value = _args[0];
        } else{
            this._value = false;
        }
    };
    
    $this._post_init = function() {
        this.value = this._value;
    };
    
    $this.clone = function() {
        return new BooleanWrapper([this.value]);
    };
    
    return BooleanWrapper;
}());
timbre.fn.register("boolean", BooleanWrapper);

var FunctionWrapper = (function() {
    var FunctionWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = FunctionWrapper.prototype;
    
    var DEFAULT_FUNCTION = function(x) { return x; };
    
    Object.defineProperty($this, "func", {
        set: function(value) {
            var tmp;
            if (typeof value === "function") {
                this._func = value;
                
                tmp = this._func(0);
                if (tmp instanceof Float32Array || tmp instanceof Array) {
                    this.seq = this._seq = ary_seq;
                    this._array_saved = [];
                    this._array_index = 0;
                } else {
                    if (typeof tmp !== "number") {
                        this._func = DEFAULT_FUNCTION;
                    }
                    this.seq = this._seq = num_seq;
                    delete this._array_saved;
                    delete this._array_index;
                }
            }
        },
        get: function() {
            return this._func;
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
                this._x = this._phase = value;
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
        var i, tmp;
        
        i = 0;
        if (typeof _args[i] === "function") {
            this.func = _args[i++];
        } else {
            this.func = DEFAULT_FUNCTION;    
        }
        this.freq  = _args[i++];
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
        this._x = this._phase;        
        this._coeff = 1 / timbre.samplerate;
    };
    
    $this.clone = function() {
        return new FunctionWrapper([this.func, this.freq, this.phase, this.mul, this.add]);
    };
    
    $this.bang = function() {
        this._x = this._phase;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    var ary_seq = function(seq_id) {
        var cell, func, tmp;
        var freq, mul, add;
        var x, coeff;
        var i, imax, j, jmax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            func = this._func;
            freq = this._freq.seq(seq_id);
            mul  = this._mul;
            add  = this._add;
            x = this._x;
            coeff  = this._coeff;
            tmp = this._array_saved;
            j   = this._array_index; jmax = tmp.length;
            for (i = 0, imax = cell.length; i < imax; ++i, ++j) {
                if (j >= jmax) {
                    tmp = func(x, freq[i] * coeff);
                    j = 0; jmax = tmp.length;
                }
                cell[i] = tmp[j] * mul + add;
                x += freq[i] * coeff;
                while (x >= 1.0) x -= 1.0;
            }
            this._array_saved = tmp;
            this._array_index = j;
            this._x = x;
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    var num_seq = function(seq_id) {
        var cell, func;
        var freq, mul, add;
        var x, coeff;
        var i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            func = this._func;
            freq = this._freq.seq(seq_id);
            mul  = this._mul;
            add  = this._add;
            x = this._x;
            coeff  = this._coeff;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = func(x) * mul + add;
                x += freq[i] * coeff;
                while (x >= 1.0) x -= 1.0;
            }
            this._x = x;
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

global.NumberWrapper    = NumberWrapper;
global.BooleanWrapper   = BooleanWrapper;
global.FunctionWrapper  = FunctionWrapper;
global.UndefinedWrapper = UndefinedWrapper;
global.NullWrapper      = NullWrapper;

var should = require("should");
global.object_test = function(klass, instance) {
    describe("timbre(...)", function() {
        it("should return new instance", function() {
            should.exist(instance);
            instance.should.be.an.instanceOf(klass);
        });
    });
    describe("#args", function() {
        it("should be an instance of Array", function() {
            instance.args.should.be.an.instanceOf(Array);
        });
    });
    describe("#_cell", function() {
        it("should be an Float32Array(timbre.cellsize)", function() {
            instance._cell.should.be.an.instanceOf(Float32Array);
            instance._cell.should.have.length(timbre.cellsize);
        });
    });
    describe("#seq()", function() {
        it("should return Float32Array(timbre.cellsize)", function() {
            var _;
            instance.seq.should.be.an.instanceOf(Function);
            _ = instance.seq(0);
            _.should.be.an.instanceOf(Float32Array);
            _.should.have.length(timbre.cellsize);
        });
    });
    describe("#on()", function() {
        it("should return self", function() {
            instance.on.should.be.an.instanceOf(Function);
            instance.on().should.equal(instance);
        });
        it("should call 'on' event", function() {
            var _ = false;
            instance.addEventListener("on", function() { _ = true; });
            instance.on();
            _.should.equal(true);
        });
    });
    describe("#off()", function() {
        it("should return self", function() {
            instance.off.should.be.an.instanceOf(Function);
            instance.off().should.equal(instance);
        });
        it("should call 'off' event", function() {
            var _ = false;
            instance.addEventListener("off", function() { _ = true; });
            instance.off();
            _.should.equal(true);
        });
    });
    describe("#set()", function() {
        it("should return self", function() {
            instance.set.should.be.an.instanceOf(Function);
            instance.set().should.equal(instance);
        });
    });
    describe("#get()", function() {
        it("should return self", function() {
            instance.get.should.be.an.instanceOf(Function);
            should.equal(instance.get(), undefined);
        });
    });
    describe("#bang()", function() {
        it("should return self", function() {
            instance.bang.should.be.an.instanceOf(Function);
            instance.bang().should.equal(instance);
        });
        it("should call 'bang' event", function() {
            var _ = false;
            instance.addEventListener("bang", function() { _ = true; });
            instance.bang();
            _.should.equal(true);
        });
    });
    describe("#clone()", function() {
        it("should return an instance of a same class", function() {
            var _;
            instance.clone.should.be.an.instanceOf(Function);
            _ = instance.clone();
            _.should.be.an.instanceOf(instance._klass);
        });
    });
};

if (module.parent && !module.parent.parent) {
    describe("NumberWrapper", function() {
        var instance = timbre(100);
        object_test(NumberWrapper, instance);
        describe("#value", function() {
            it("should equal 100", function() {
                instance.value.should.equal(100);
            });
            it("should changed", function() {
                instance.value = 10;
                instance.value.should.equal(10);
                instance._cell[0].should.equal(10);
            });
            it("should not changed with no number", function() {
                instance.value = "1";
                instance.value.should.equal(10);
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                timbre(instance).value.should.equal(instance.value);
            });
        });
    });
    describe("BooleanWrapper", function() {
        var instance = timbre(true);
        object_test(BooleanWrapper, instance);
        describe("#value", function() {
            it("should equal true", function() {
                instance.value.should.equal(true);
            });
            it("should changed", function() {
                instance.value = false;
                instance.value.should.equal(false);
                instance._cell[0].should.equal(0);
                
                instance.value = true;
                instance.value.should.equal(true);
                instance._cell[0].should.equal(1);
                
                instance.value = false;
                instance.value = 1000;
                instance.value.should.equal(true);
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                timbre(instance).value.should.equal(instance.value);
            });
        });
    });
    describe("FunctionWrapper", function() {
        var instance = timbre(function(x) { return 1.0-x; }, 0, 0.5, 2, 100);
        object_test(FunctionWrapper, instance);
        describe("#func", function() {
            it("should be an instance of Function", function() {
                instance.func.should.be.an.instanceOf(Function);
            });
        });
        describe("#freq", function() {
            it("should be an instance of Object", function() {
                object_test(NumberWrapper, instance.freq);
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
        describe("#seq()", function() {
            it("should return signal ((1-0.5)*2+100)", function() {

                instance.phase = 0.5;
                instance.freq  = 0;
                instance.mul   = 2;
                instance.add   = 100;
                instance.on().seq(1).should.eql(timbre( (1-0.5)*2+100 ).seq(0));
            });
            it("should return signal not ((1-0.5)*2+100)", function() {
                instance.phase = 0.5;
                instance.freq  = 800;
                instance.mul   = 2;
                instance.add   = 100;
                instance.on().seq(2).should.not.eql(timbre( (1-0.5)*2+100 ).seq(0));
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                var _ = timbre(instance);
                _.func.should.equal(instance.func);
                _.freq.should.equal(instance.freq);
                _.phase.should.equal(instance.phase);
                _.mul.should.equal(instance.mul);
                _.add.should.equal(instance.add);
            });
        });
    });
    describe("NullWrapper", function() {
        object_test(NullWrapper, timbre(null));
    });
    describe("UndefinedWrapper", function() {
        object_test(UndefinedWrapper, timbre(undefined));
    });
}
