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
timbre.workerpath = "";
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
        var i, imax, j, k, kmax, n, nmax;
        var saved_i, tmpL, tmpR, amp, x;
        
        cell = this._cell;
        L = this.L;
        R = this.R;
        amp = timbre.amp;
        
        seq_id = this._seq_id;
        
        imax = L.length;
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
            timers = timbre.timers.slice(0);
            for (j = timers.length; j--; ) {
                if ((timer = timers[j]) !== undefined) {
                    timer.seq(seq_id);
                }
            }
            dacs = timbre.dacs.slice(0);
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
    var list, rm, i;
    if (typeof func === "function") {
        if (name[0] === "~") {
            name = name.substr(1);
            func.rm = true;
        }
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

    var defaults = { optional:{}, properties:{} };
    
    defaults.optional.ar = function() {
        this._ar = true;
        return this;
    };
    defaults.optional.kr = function() {
        this._ar = false;
        return this;
    };
    defaults.optional.fixArKr = function() {
        return this;
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

        // init
        instance._seq_id = -1;
        
        if (!instance._cell) {
            instance._cell = new Float32Array(timbre.cellsize);
        }
        if (!instance.args) {
            instance.args = [];
        }
        timbre.fn.init_set.call(instance.args, instance._raw_args);
        
        if (!instance._ev) {
            instance._ev = {};
        }
        if (typeof instance._ar !== "boolean") {
            instance._ar = false;
        }
        instance._seq = instance.seq;
        
        if (typeof instance._ar === "boolean") {
            if (typeof instance.ar !== "function") {
                instance.ar = defaults.optional.ar;
            }
            if (typeof instance.kr !== "function") {
                instance.kr = defaults.optional.kr;
            }
        } else {
            instance.ar = instance.kr = defaults.optional.fixArKr;
        }
        instance._ar = !!instance._ar;
        
        if (instance._post_init) {
            instance._post_init();
        }
        
        return instance;
    };
    
    var noneseq = (function() {
        var nonecell = new Float32Array(timbre.cellsize);
        return function() { return nonecell; };
    }());
    

    defaults.play = function() {
        if (this.dac.isOff) {
            this.dac.on();
            timbre.fn.do_event(this, "play");
        }
        return this;
    };
    defaults.pause = function() {
        if (this.dac.isOn) {
            this.dac.off();
            timbre.fn.do_event(this, "pause");
        }
        return this;
    };
    defaults.bang = function() {
        timbre.fn.do_event(this, "bang");
        return this;
    };
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
    defaults.append = function() {
        this.args.append.apply(this.args, arguments);
        return this;
    };
    defaults.remove = function() {
        this.args.remove.apply(this.args, arguments);
        return this;
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
    defaults.addEventListener        = timbre.addEventListener;
    defaults.removeEventListener     = timbre.removeEventListener;
    defaults.removeAllEventListeners = timbre.removeAllEventListeners;
    
    defaults.properties.isAr = { get: function() { return !!this._ar; } };
    defaults.properties.isKr = { get: function() { return  !this._ar; } };
    defaults.properties.dac = {
        set: function(value) {
            if (this._dac) {
                this._dac.remove(this);
            }
            this._dac = value.append(this);
        },
        get: function() {
            if (!this._dac) {
                this._dac = timbre("dac", this);
            }
            return this._dac;
        },
    };
    defaults.properties.mul  = {
        set: function(value) {
            if (typeof value === "number") { this._mul = value; }
        },
        get: function() { return this._mul; }
    };
    defaults.properties.add  = {
        set: function(value) {
            if (typeof value === "number") { this._add = value; }
        },
        get: function() { return this._add; }
    };
    
    fn.register = function(key, klass, func) {
        var name, p;
        
        if (typeof klass === "function") {
            p = klass.prototype;
            for (name in defaults) {
                if (typeof defaults[name] === "function") {
                    if (!p[name]) p[name] = defaults[name];
                }
            }
            for (name in defaults.properties) {
                if (!Object.getOwnPropertyDescriptor(p, name)) {
                    Object.defineProperty(p, name, defaults.properties[name]);
                }
            }
            p._mul = 1.0;
            p._add = 0.0;
            
            if (p._ar === true) {
                p.ar = p.kr = defaults.optional.fixArKr;
            }
            
            if (typeof key === "string") {            
                if (!func) {
                    p._klass = klass;
                    p._name  = key;
                    klasses[key] = klass;
                } else {
                    klasses[key] = func;
                }
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
        var append_raw = function() {
            var args, i;
            args = arguments;
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
            return this;
        };
        return function(raw_args) {
            this.append = (raw_args) ? append_raw : append;
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
                func = list[i];
                func.apply(obj, args);
                if (func.rm) obj.removeEventListener(name, func);
            }
        }
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
            if (typeof value === "function") {
                this._func = value;
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
        }
        if (typeof _args[i] === "number") {
            this.add = _args[i++];    
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
    
    $this.seq = function(seq_id) {
        var cell;
        var x, value;
        var i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            x = this._x;
            value = this._func(x) * this._mul + this._add;
            for (i = cell.length; i--; ) {
                cell[i] = value;
            }
            x += this._freq.seq(seq_id)[0] * this._coeff;
            while (x >= 1.0) x -= 1.0;
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
