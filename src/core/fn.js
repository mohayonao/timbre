/**
 * timbre.fn: 0.1.0
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.fn = (function(timbre) {
    var fn = {};
    var klasses = {};
    var TimbreObject = function() {};
    
    klasses.find = function(key) {
        if (typeof klasses[key] === "function") {
            return klasses[key];
        }
        key = "-" + timbre.env + "-" + key;    
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
    
    defaults.optional.listen = function(target) {
        if (target === null) {
            this.args = this._.args;
            timbre.listeners.remove(this);
        } else {
            if (fn.isTimbreObject(target)) {
                this._.args = this.args;
                this.args.removeAll();
                this.args.append(target);
                timbre.listeners.append(this);
            }
        }
        return this;
    };

    defaults.optional.dac = {};
    defaults.optional.dac.on = function() {
        var f;
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.doEvent(this, "on");
        if ((f = this._.proto._.on)) f.call(this);
        return this;
    };
    defaults.optional.dac.off = function() {
        var f;
        this._.ison = false;
        timbre.dacs.remove(this);
        timbre.fn.doEvent(this, "off");
        if ((f = this._.proto._.off)) f.call(this);
        return this;
    };
    defaults.optional.dac.play = function() {
        var f;
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.doEvent(this, "play");
        if ((f = this._.proto._.play)) f.call(this);
        return this;
    };
    defaults.optional.dac.pause = function() {
        var f;
        this._.ison = false;
        timbre.dacs.remove(this);
        timbre.fn.doEvent(this, "pause");
        if ((f = this._.proto._.pause)) f.call(this);
        return this;
    };
    
    defaults.optional.timer = {};
    defaults.optional.timer.on = function() {
        var f;
        this._.ison = true;
        timbre.timers.append(this);
        timbre.fn.doEvent(this, "on");
        if ((f = this._.proto._.on)) f.call(this);
        return this;
    };
    defaults.optional.timer.off = function() {
        var f;
        this._.ison = false;
        timbre.timers.remove(this);
        timbre.fn.doEvent(this, "off");
        if ((f = this._.proto._.off)) f.call(this);
        return this;
    };
    defaults.optional.timer.play = function() {
        timbre.fn.doEvent(this, "play");
        return this;
    };
    defaults.optional.timer.pause = function() {
        timbre.fn.doEvent(this, "pause");
        return this;
    };
    
    fn.init = function() {
        var args, key, klass, instance, isThrougOut, isUndefined, proto;
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
            if (key === null) {
                instance = new NumberWrapper([0]);
            } else if (fn.isTimbreObject(key)) {
                instance = key;
                isThrougOut = true;
            }
            if (instance === undefined) {
                if (key instanceof Array || key.buffer instanceof ArrayBuffer) {
                    instance = new ArrayWrapper([key]);
                }
            }
            break;
        }
        if (instance === undefined) {
            instance = new NumberWrapper([0]);
            isUndefined = true;
            if (timbre._.verbose) {
                console.warn("'" + key + "' is not defined.");
            }
        }
        
        // init
        proto = Object.getPrototypeOf(instance);
        if (!isThrougOut) {
            instance.seq_id = -1;
            if (!instance.cell) {
                instance.cell = new Float32Array(timbre.cellsize);
            }
            if (!instance.args) instance.args = [];
            timbre.fn.arrayset(instance.args);
            
            if (!instance.hasOwnProperty("_")) instance._ = {};
            instance._.proto = proto;
            instance._.isUndefined = !!isUndefined;
            
            if (typeof !instance._.ev !== "object") instance._.ev = {};
            
            if (typeof instance._.ar !== "boolean") {
                if (proto && typeof proto._ === "object") {
                    instance._.ar = !!proto._.ar;
                } else {
                    instance._.ar = false;
                }
            }
            if (typeof instance._.ison !== "boolean") {
                instance._.ison = true;
            }
            if (typeof instance._.mul !== "number") {
                instance._.mul = 1.0;
            }
            if (typeof instance._.add !== "number") {
                instance._.add = 0.0;
            }
            if (typeof instance._.dac !== "object") {
                instance._.dac = null;
            }
        }
        
        if (proto._.init) proto._.init.call(instance);
        
        return instance;
    };
    
    defaults.play = function() {
        var f, _ = this._;
        if (_.ar) {
            if (_.dac === null) {
                _.dac = timbre("dac", this);
                if ((f = _.proto._.play)) f.call(this);
                timbre.fn.doEvent(this, "play");
            } else if (this.dac.args.indexOf(this) === -1) {
                _.dac.append(this);
                if ((f = _.proto._.play)) f.call(this);
                timbre.fn.doEvent(this, "play");
            }
            if (_.dac.isOff) _.dac.on();
        }
        return this;
    };
    defaults.pause = function() {
        var f, _ = this._;
        if (_.dac && _.dac.args.indexOf(this) !== -1) {
            _.dac.remove(this);
            if ((f = _.proto._.pause)) f.call(this);
            timbre.fn.doEvent(this, "pause");
            if (_.dac.isOn && _.dac.args.length === 0) _.dac.off();
        }
        return this;
    };
    defaults.bang = function() {
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    defaults.seq = function() {
        return this.cell;
    };
    defaults.on = function() {
        var f;
        this._.ison = true;
        if ((f = this._.proto._.on)) f.call(this);
        timbre.fn.doEvent(this, "on");
        return this;
    };
    defaults.off = function() {
        var f;
        this._.ison = false;
        if ((f = this._.proto._.off)) f.call(this);
        timbre.fn.doEvent(this, "off");
        return this;
    };
    defaults.clone = function(deep) {
        var newone = timbre(this._.proto._.klassname);
        timbre.fn.copyBaseArguments(this, newone, deep);
        return newone;
    };
    defaults.append = function() {
        var f;
        this.args.append.apply(this.args, arguments);
        if ((f = this._.proto._.append)) f.call(this);
        return this;
    };
    defaults.remove = function() {
        var f;
        this.args.remove.apply(this.args, arguments);
        if ((f = this._.proto._.remove)) f.call(this);
        return this;
    };
    defaults.removeAll = function() {
        var f;
        this.args.removeAll.apply(this.args, arguments);
        if ((f = this._.proto._.remove)) f.call(this);
        return this;
    };
    defaults.set = function(key, value) {
        var self, k;
        if (typeof key === "string") {
            self = this._.proto;
            if (Object.getOwnPropertyDescriptor(self, key)) {
                this[key] = value;
            }
        } else if (typeof key === "object") {
            self = this._.proto;
            for (k in key) {
                if (Object.getOwnPropertyDescriptor(self, k)) {
                    this[k] = key[k];
                }
            }
        }
        return this;
    };
    defaults.get = function(key) {
        var self, res;
        self = this._.proto;
        if (Object.getOwnPropertyDescriptor(self, key)) {
            res = this[key];
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
    defaults.properties.isUndefined = { get: function() { return this._.isUndefined; } };
    
    defaults.properties.dac = {
        set: function(value) {
            if (value !== this._.dac) {
                if (this._.dac) {
                    this._.dac.remove(this);
                }
                if (value !== null) {
                    this._.dac = value.append(this);
                } else {
                    this._.dac = null;
                }
            }
        },
        get: function() { return this._.dac; },
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
                fn.setPrototypeOf.call(p, "ar-kr");
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
        if (!this._) this._ = {};
        switch (type) {
        case "ar-only":
            this.ar = defaults.optional.fixrate;
            this.kr = defaults.optional.fixrate;
            this._.ar = true;
            break;
        case "kr-only":
            this.ar = defaults.optional.fixrate;
            this.kr = defaults.optional.fixrate;
            this._.ar = false;
            break;
        case "kr-ar":
            this.ar = defaults.optional.ar;
            this.kr = defaults.optional.kr;
            this._.ar = false;
            break;
        case "ar-kr":
            this.ar = defaults.optional.ar;
            this.kr = defaults.optional.kr;
            this._.ar = true;
            break;
        case "dac":
            this.on    = defaults.optional.dac.on;
            this.off   = defaults.optional.dac.off;
            this.play  = defaults.optional.dac.play;
            this.pause = defaults.optional.dac.pause;
            this._.type = 1;
            break;
        case "timer":
            this.on    = defaults.optional.timer.on;
            this.off   = defaults.optional.timer.off;
            this.play  = defaults.optional.timer.play;
            this.pause = defaults.optional.timer.pause;
            this._.type = 2;
            break;
        case "listener":
            this.listen = defaults.optional.listen;
            this._.type = 3;
            break;
        }
    };
    
    fn.valist = function(_args) {
        var args, instance;
        var i, imax;
        
        args = [];
        for(i = 0, imax = _args.length; i < imax; ++i) {
            instance = null;
            switch (typeof _args[i]) {
            case "number":
            case "boolean":
            case "function":
            case "undefined":
                instance = timbre(_args[i]);
                break;
            case "object":
                if (_args[i] === null) {
                    instance = timbre(null);
                } else {
                    instance = _args[i];
                }
                break;
            default:
                instance = timbre(undefined);
                break;
            }
            if (instance !== null) {
                args.push(instance);
            }
        }
        
        return args;
    };
    
    fn.arrayset = (function() {
        var append = function() {
            var args, i, imax, instance;
            args = fn.valist(arguments);
            for (i = 0, imax = args.length; i < imax; ++i) {
                instance = args[i];
                if (this.indexOf(instance) === -1) {
                    this.push(instance);
                }
            }
            return this;
        };
        var remove = function() {
            var i, j, instance;
            for (i = arguments.length; i--; ) {
                if ((j = this.indexOf(arguments[i])) !== -1) {
                    instance = this.splice(j, 1)[0];
                }
            }
            return this;
        };
        var removeAll = function() {
            while (this.length > 0) this.pop();
            return this;
        };
        var extend = function() {
            this.append.apply(this, list);
            return this;
        };
        return function(self) {
            var i, imax, find, remindexes = [];
            for (i = 1, imax = self.length; i < imax; ++i) {
                find = self.indexOf(self[i]);
                if (find !== -1 && find < i) remindexes.push(i);
            }
            while (remindexes.length) {
                self.splice(remindexes.pop(), 1);
            }
            self.append    = append;
            self.remove    = remove;
            self.removeAll = removeAll;
            self.extend    = extend;
            return self;
        };
    }());
    
    fn.doEvent = function(obj, name, args) {
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
    fn.do_event = fn.doEvent;
    
    fn.copyBaseArguments = function(src, dst, deep) {
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
    fn.copy_for_clone = fn.copyBaseArguments;
    
    fn.isTimbreObject = function(o) {
        return (typeof o === "object") &&
            ((o._||{}).proto||{})._ instanceof TimbreObject;
    };
    
    fn.getClass = function(name) {
        return klasses[name];
    };
    
    fn.copyPropertyDescriptors = function(self, base, names) {
        var i, d;
        for (i = names.length; i--; ) {
            d = Object.getOwnPropertyDescriptor(base, names[i]);
            if (d !== undefined) {
                Object.defineProperty(self, names[i], d);
            }
        }
        return self;
    };
    
    fn.copyFunctions = function(self, base, names) {
        var i, f;
        for (i = names.length; i--; ) {
            f = base[names[i]];
            if (typeof f === "function") {
                self[names[i]] = f;
            }
        }
        return self;
    };
    
    return fn;
}(timbre));

// __END__
