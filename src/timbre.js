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
timbre.sys       = null;
timbre.global    = {};
timbre._ = { ev:{}, none: new Float32Array(timbre.cellsize) };

var TimbreObject = function() {};

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
        this.cell = new Float32Array(timbre.cellsize);
        this.seq_id = 0;
        
        this._ = {};
        this._.impl = null;
        this._.ison = false;
        this._.cellsize = timbre.cellsize;
    };
    
    $this.bind = function(PlayerKlass) {
        this._.impl = new PlayerKlass(this);
    };

    $this.on = function() {
        if (this._.impl) {
            this._.ison = true;
            this._.impl.on();
        }
    };
    
    $this.off = function() {
        if (this._.impl) {
            this._.impl.off();
            this._.ison = false;
        }
    };
    
    $this.process = function() {
        var cell, L, R;
        var seq_id, dacs, dac, timers, timer;
        var i, imax, j, jmax, k, kmax, n, nmax;
        var saved_i, tmpL, tmpR, amp, x;
        
        cell = this.cell;
        L = this.L;
        R = this.R;
        amp = timbre.amp;
        
        seq_id = this.seq_id;
        
        imax = L.length;
        kmax = this._.cellsize;
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
            for (j = 0, jmax = timers.length; j < jmax; ++j) {
                if ((timer = timers[j]) !== undefined) {
                    timer.seq(seq_id);
                }
            }
            dacs = timbre.dacs.slice(0);
            for (j = 0, jmax = dacs.length; j < jmax; ++j) {
                if ((dac = dacs[j]) !== undefined) {
                    dac.seq(seq_id);
                    tmpL = dac.L;
                    tmpR = dac.R;
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
        
        this.seq_id = seq_id;
    };
    
    return SoundSystem;
}());
timbre.sys = new SoundSystem();

Object.defineProperty(timbre, "isEnabled", {
    get: function() {
        return !!timbre.sys._.impl;
    }
});

Object.defineProperty(timbre, "isOn", {
    get: function() {
        return timbre.sys._.ison;
    }
});
Object.defineProperty(timbre, "isOff", {
    get: function() {
        return !timbre.sys._.ison;
    }
});

timbre.on = function() {
    if (!timbre.sys._.ison) {
        timbre.sys.on();
        timbre.fn.do_event(this, "on");
    }
    return timbre;
};

timbre.off = function() {
    if (timbre.sys._.ison) {
        timbre.sys.off();
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
        list = this._.ev[name];
        if (list === undefined) {
            this._.ev[name] = list = [];
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
        list = this._.ev[name];
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
        delete this._.ev[name];
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
        this._.ar = true;
        return this;
    };
    defaults.optional.kr = function() {
        this._.ar = false;
        return this;
    };
    defaults.optional.fixrate = function() {
        return this;
    };
    
    fn.init = function() {
        var args, key, klass, instance, isThrougOut, proto;
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
            if (key == null) {
                instance = new NullWrapper();
            }  else if (Object.getPrototypeOf(key)._ instanceof TimbreObject) {
                instance = key;
                isThrougOut = true;
            }
            if (instance === undefined) {
                if (key instanceof Array || key.buffer instanceof ArrayBuffer) {
                    instance = new ArrayWrapper([key]);
                } else {
                    instance = new ObjectWrapper([key]);
                }
            }
            break;
        }
        if (instance === undefined) instance = new UndefinedWrapper();
        
        // init
        if (!isThrougOut) {
            instance.seq_id = -1;
            if (!instance.cell) {
                instance.cell = new Float32Array(timbre.cellsize);
            }
            if (!instance.args) instance.args = [];
            timbre.fn.init_set.call(instance.args);
            
            if (!instance.hasOwnProperty("_")) instance._ = {};
            
            if (typeof !instance._.ev !== "object") instance._.ev = {};
            
            if (typeof instance._.ar !== "boolean") {
                proto = Object.getPrototypeOf(instance);
                if (proto && typeof proto._ === "object") {
                    instance._.ar = !!proto._.ar;
                } else {
                    instance._.ar = false;
                }
            }
            if (typeof instance._.mul !== "number") {
                instance._.mul = 1.0;
            }
            if (typeof instance._.add !== "number") {
                instance._.add = 0.0;
            }
        }
        if (instance._post_init) instance._post_init();
        
        return instance;
    };
    
    defaults.play = function() {
        var _ = this._;
        if (_.ar) {
            if (!_.dac && this.dac) {
                timbre.fn.do_event(this, "play");
            } else if (this.dac.args.indexOf(this) === -1) {
                _.dac.append(this);
                timbre.fn.do_event(this, "play");
            }
            if (_.dac.isOff) _.dac.on();
        }
        return this;
    };
    defaults.pause = function() {
        var _ = this._;
        if (_.dac && _.dac.args.indexOf(this) !== -1) {
            _.dac.remove(this);
            timbre.fn.do_event(this, "pause");
            if (_.dac.isOn && _.dac.args.length === 0) _.dac.off();
        }
        return this;
    };
    defaults.bang = function() {
        timbre.fn.do_event(this, "bang");
        return this;
    };
    defaults.seq = function() {
        return this.cell;
    };
    defaults.on = function() {
        this._.ison = true;
        timbre.fn.do_event(this, "on");
        return this;
    };
    defaults.off = function() {
        this._.ison = false;
        timbre.fn.do_event(this, "off");
        return this;
    };
    defaults.clone = function(deep) {
        var newone = timbre(Object.getPrototypeOf(this)._.klassname);
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
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
    
    defaults.properties.isAr = { get: function() { return !!this._.ar; } };
    defaults.properties.isKr = { get: function() { return  !this._.ar; } };
    defaults.properties.isOn  = { get: function() { return !!this._.ison; } };
    defaults.properties.isOff = { get: function() { return  !this._.ison; } };
    
    defaults.properties.dac = {
        set: function(value) {
            if (value !== this._.dac) {
                if (this._.dac) {
                    this._.dac.remove(this);
                    this._.dac_autobinded = false;
                }
                if (value !== null) {
                    this._.dac = value.append(this);
                } else {
                    this._.dac = null; // TODO: ???
                }
            }
        },
        get: function() {
            if (!this._.dac) {
                this._.dac = timbre("dac", this);
                this._.dac_autobinded = true;
            }
            return this._.dac;
        },
    };
    defaults.properties.mul  = {
        set: function(value) {
            if (typeof value === "number") { this._.mul = value; }
        },
        get: function() { return this._.mul; }
    };
    defaults.properties.add  = {
        set: function(value) {
            if (typeof value === "number") { this._.add = value; }
        },
        get: function() { return this._.add; }
    };
    
    fn.register = function(key, klass, func) {
        var name, p, _, i;
        
        if (typeof klass === "function") {
            p = klass.prototype;
            
            _ = new TimbreObject();
            if (typeof p._ === "object") {
                for (i in p._) _[i] = p._[i];
            }
            p._ = _;
            
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
            
            if (typeof p.ar !== "function") {
                fn.newPrototypeOf("kr-only", p);
            }
            
            if (typeof key === "string") {            
                if (!func) {
                    p._.klassname = key;
                    p._.klass     = klass;
                    klasses[key]  = klass;
                } else {
                    klasses[key] = func;
                }
            }
        }
    };
    
    fn.setPrototypeOf = function(type) {
        switch (type) {
        case "ar-only":
            this.ar = defaults.optional.fixrate;
            this.kr = defaults.optional.fixrate;
            if (!this._) this._ = {};
            this._.ar = true;
            break;
        case "kr-only":
            this.ar = defaults.optional.fixrate;
            this.kr = defaults.optional.fixrate;
            if (!this._) this._ = {};
            this._.ar = false;
            break;
        case "kr-ar":
            this.ar = defaults.optional.ar;
            this.kr = defaults.optional.kr;
            if (!this._) this._ = {};
            this._.ar = false;
            break;
        case "ar-kr":
            this.ar = defaults.optional.ar;
            this.kr = defaults.optional.kr;
            if (!this._) this._ = {};
            this._.ar = true;
            break;
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
            var args, i, imax;
            args = fn.valist(arguments);
            for (i = 0, imax = args.length; i < imax; ++i) {
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
        return function() {
            this.append = append;
            this.remove = remove;
            this.update = update;
            return this;
        };
    }());
    
    fn.do_event = function(obj, name, args) {
        var func, list, i, imax;
        func = obj["on" + name];
        if (typeof func === "function") {
            func.apply(obj, args);
        }

        list = obj._.ev[name];
        if (list !== undefined) {
            for (i = 0, imax = list.length; i < imax; ++i) {
                func = list[i];
                func.apply(obj, args);
                if (func.rm) obj.removeEventListener(name, func);
            }
        }
    };
    
    fn.copy_for_clone = function(src, dst, deep) {
        var src_args, i, imax;
        
        dst._.ar = src._.ar;
        dst._.mul = src._.mul;
        dst._.add = src._.add;
        dst._.ison = src._.ison;
        
        src_args = src.args;
        if (deep) {
            for (i = 0, imax = src_args.length; i < imax; ++i) {
                dst.args[i] = src_args[i].clone(true);
            }
        } else {
            for (i = 0, imax = src_args.length; i < imax; ++i) {
                dst.args[i] = src_args[i];
            }
        }
        
        return dst;
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
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            var cell, i;
            if (typeof value === "number") {
                this._.value = value;
                cell = this.cell;
                for (i = cell.length; i--; ) {
                    cell[i] = value;
                }
            }
        },
        get: function() {
            return this._.value;
        }
    });
    
    var initialize = function(_args) {
        this._ = {};
        if (typeof _args[0] === "number") {
            this._.value = _args[0];
        } else{
            this._.value = 0;
        }
    };
    
    $this._post_init = function() {
        this.value = this._.value;
    };
    
    $this.clone = function() {
        return timbre(this._.value);
    };
    
    return NumberWrapper;
}());
timbre.fn.register("number", NumberWrapper);

var BooleanWrapper = (function() {
    var BooleanWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = BooleanWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            var cell, i, x;
            this._.value = !!value;
            cell = this.cell;
            x = this._.value ? 1 : 0;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        },
        get: function() {
            return this._.value;
        }
    });
    
    var initialize = function(_args) {
        this._ = {};
        if (typeof _args[0] === "boolean") {
            this._.value = _args[0];
        } else{
            this._.value = false;
        }
    };
    
    $this._post_init = function() {
        this.value = this._.value;
    };
    
    $this.clone = function() {
        return timbre(!!this._.value);
    };
    
    return BooleanWrapper;
}());
timbre.fn.register("boolean", BooleanWrapper);

var FunctionWrapper = (function() {
    var FunctionWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = FunctionWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            if (typeof value === "function") {
                this._.value = value;
            }
        },
        get: function() {
            return this._.value;
        }
    });
    Object.defineProperty($this, "args", {
        set: function(value) {
            if (typeof value === "object" && value instanceof Array) {
                this._.args = value;
            }
        },
        get: function() {
            return this._.args;
        }
    });
    
    var initialize = function(_args) {
        var i, _;
        this._ = _ = {};

        i = 0;
        if (typeof _args[i] === "function") {
            _.value = _args[i++];
        } else {
            _.value = null;
        }
        if (typeof _args[i] === "object" && _args[i] instanceof Array) {
            _.args = _args[i++];
        } else {
            _.args = [];
        }
    };
    
    $this.clone = function(deep) {
        return timbre("function", this._.value, this._.args);
    };
    
    $this.bang = function() {
        var _ = this._;
        if (_.value !== null) {
            _.value.apply(this, _.args);
        }
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    return FunctionWrapper;
}());
timbre.fn.register("function", FunctionWrapper);

var ArrayWrapper = (function() {
    var ArrayWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = ArrayWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            if (typeof value === "object" && 
                (value instanceof Array ||
                 value.buffer instanceof ArrayBuffer)) {
                this._.value = value;
            }
        },
        get: function() { return this._.value; }
    });
    Object.defineProperty($this, "index", {
        set: function(value) {
            var _ = this._;
            var cell, x, i, imax;
            if (typeof value === "number") {
                value = value|0;
                if (value < 0) {
                    value = _.value.length + value;
                }
                if (0 <= value && value < _.value.length) {
                    _.index = value|0;
                    cell = this.cell;
                    x = _.value[_.index];
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
        },
        get: function() { return this._.index; }
    });
    
    var initialize = function(_args) {
        var value, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "object") {
            if (_args[i] instanceof Array ||
                _args[i].buffer instanceof ArrayBuffer) {
                value = _args[i++];
            }
        }
        _.value = (value !== undefined) ? value : new Float32Array(0);
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];    
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];    
        }
        _.index = 0;
    };
    
    $this._post_init = function() {
        this.index = 0;
    };
    
    $this.clone = function(deep) {
        return timbre("array", this._.value, this._.mul, this._.add);
    };
    
    $this.bang = function() {
        var _ = this._;
        this.index = (_.index + 1) % _.value.length;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, value, i;
        cell = this.cell;
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            value = _.value[_.index] * _.mul + _.add;
            if (isNaN(value)) value = 0;
            for (i = cell.length; i--; ) {
                cell[i] = value;
            }
            if ((++_.index) === _.value.length) _.index = 0;
        }
        return cell;
    };
    
    return ArrayWrapper;
}());
timbre.fn.register("array", ArrayWrapper);

var ObjectWrapper = (function() {
    var ObjectWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = ObjectWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            if (typeof value === "object") {
                this._.value = value;
            }
        },
        get: function() { return this._.value; }
    });
    
    var initialize = function(_args) {
        this._ = {};
        if (typeof _args[0] === "object") {
            this._.value = _args[0];
        } else{
            this._.value = {};
        }
    };
    
    $this.clone = function(deep) {
        return timbre("object", this._.value);
    };
    
    return ObjectWrapper;
}());
timbre.fn.register("object", ObjectWrapper);

var UndefinedWrapper = function() {};
timbre.fn.setPrototypeOf.call(UndefinedWrapper.prototype, "kr-only");
timbre.fn.register("undefined", UndefinedWrapper);

var NullWrapper = function() {};
timbre.fn.setPrototypeOf.call(NullWrapper.prototype, "kr-only");
timbre.fn.register("null", NullWrapper);


// __END__
global.T = global.timbre = timbre;
module.exports = timbre;

// setting for tests
timbre.samplerate = 1000;
timbre.streamsize =   32;
timbre.cellsize   =    8;

var should = require("should");
global.object_test = function(klass) {
    var klassname = klass.prototype._.klassname;
    var args = Array.prototype.slice.call(arguments, 1);
    describe("timbre(" + klassname + ")", function() {
        it("should return new instance", function() {
            var instance = timbre.apply(null, args);
            should.exist(instance);
            instance.should.be.an.instanceOf(klass);
        });
    });
    describe("#args", function() {
        it("should be an instance of Array", function() {
            var instance = timbre.apply(null, args);
            instance.args.should.be.an.instanceOf(Array);
        });
    });
    describe("#cell", function() {
        it("should be an Float32Array(timbre.cellsize)", function() {
            var instance = timbre.apply(null, args);
            instance.cell.should.be.an.instanceOf(Float32Array);
            instance.cell.should.have.length(timbre.cellsize);
        });
    });
    describe("#seq()", function() {
        it("should return Float32Array(timbre.cellsize)", function() {
            var instance = timbre.apply(null, args), _;
            instance.seq.should.be.an.instanceOf(Function);
            _ = instance.seq(0);
            _.should.be.an.instanceOf(Float32Array);
            _.should.have.length(timbre.cellsize);
        });
    });
    describe("#on()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.on.should.be.an.instanceOf(Function);
            instance.on().should.equal(instance);
        });
        it("should call 'on' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("on", done);
            instance.on();
        });
    });
    describe("#off()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.off.should.be.an.instanceOf(Function);
            instance.off().should.equal(instance);
        });
        it("should call 'off' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("off", done);
            instance.off();
        });
    });
    describe("#play()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.play.should.be.an.instanceOf(Function);
            instance.play().should.equal(instance);
        });
        it("should call 'play' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("play", done);
            instance.off().play();
        });
    });
    describe("#pause()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.pause.should.be.an.instanceOf(Function);
            instance.pause().should.equal(instance);
        });
        it("should call 'pause' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("pause", done);
            instance.play().pause();
        });
    });
    describe("#bang()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.bang.should.be.an.instanceOf(Function);
            instance.bang().should.equal(instance);
        });
        it("should call 'bang' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("bang", done);
            instance.on().bang();
        });
    });
    describe("#clone()", function() {
        it("should return an instance of a same class", function() {
            var instance = timbre.apply(null, args), _;
            instance.clone.should.be.an.instanceOf(Function);
            _ = instance.clone();
            instance.should.be.an.instanceOf(klass);
        });
    });
};

if (module.parent && !module.parent.parent) {
    describe("NumberWrapper", function() {
        object_test(NumberWrapper, 100);
        describe("#value", function() {
            it("should equal 100", function() {
                var instance = timbre(100);
                instance.value.should.equal(100);
            });

            it("should changed", function() {
                var instance = timbre(100);
                instance.value = 10;
                instance.value.should.equal(10);
                instance.cell[0].should.equal(10);
            });
            it("should not changed with no number", function() {
                var instance = timbre(100);
                instance.value = "1";
                instance.value.should.equal(100);
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                var instance = timbre(100);
                timbre(instance).value.should.equal(instance.value);
            });
        });
    });
    describe("BooleanWrapper", function() {
        object_test(BooleanWrapper, true);
        describe("#value", function() {
            it("should equal true", function() {
                var instance = timbre(true);
                instance.value.should.equal(true);
            });
            it("should changed", function() {
                var instance = timbre(true);
                instance.value = false;
                instance.value.should.equal(false);
                instance.cell[0].should.equal(0);
                
                instance.value = true;
                instance.value.should.equal(true);
                instance.cell[0].should.equal(1);
                
                instance.value = false;
                instance.value = 1000;
                instance.value.should.equal(true);
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                var instance = timbre(true);
                timbre(instance).value.should.equal(instance.value);
            });
        });
    });
    describe("FunctionWrapper", function() {
        var y, func = function(x) { y = x * 2; };
        object_test(FunctionWrapper, func);
        describe("#bang()", function() {
            var instance = timbre(func, [ 100 ]);
            instance.bang();
            y.should.equal(200);
            instance.args = [ 50 ];
            instance.bang();
            y.should.equal(100);
        });
    });
    describe("ArrayWrapper", function() {
        object_test(ArrayWrapper, [2, 3, 5, 7, 11, 13]);
        describe("#bang()", function() {
            var instance = timbre([2, 3, 5, 7, 11, 13]);
            instance.cell[0].should.equal(2);
            instance.bang();
            instance.cell[0].should.equal(3);
            instance.index = 3;
            instance.cell[0].should.equal(7);
            instance.index = -1;
            instance.cell[0].should.equal(13);
        });
    });
    describe("ObjectWrapper", function() {
        object_test(ObjectWrapper, {});
    });
    describe("NullWrapper", function() {
        object_test(NullWrapper, null);
    });
    describe("UndefinedWrapper", function() {
        object_test(UndefinedWrapper, undefined);
    });
    describe("Through out", function() {
        var instance = timbre();
        instance.should.equal(timbre(instance));
    });
    describe("EventListener", function() {
        it("Once Time", function(done) {
            var instance = timbre();
            instance.addEventListener("~bang", done);
            instance.bang();
            instance.bang();
        });
    });
}
