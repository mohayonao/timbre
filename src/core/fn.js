/**
 * timbre.fn: 0.3.2
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.fn = (function(timbre) {
    var TimbreObject = function() {};
    var fn = {}, klasses;
    var defaults = { optional:{}, properties:{} };
    
    TimbreObject.objectId = 0;
    TimbreObject.klasses = klasses = {
        _find: function(key) {
            if (typeof klasses[key] === "function") {
                return klasses[key];
            }
            key = "-" + timbre.env + "-" + key;    
            if (typeof klasses[key] === "function") {
                return klasses[key];
            }
        }
    };
    
    
    fn.init = function() {
        var args, key, klass, instance, proto, f;
        var isThrougOut, isUndefined;
        
        args = Array.prototype.slice.call(arguments);
        key  = args[0];
        
        switch (typeof key) {
        case "string":
            if ((klass = klasses._find(key)) !== undefined) {
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
            } else if (key instanceof Array) {
                instance = new ArrayWrapper([key]);
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
            if (TimbreObject.objectId === 0) timbre.setup();
            instance._.id = TimbreObject.objectId++;
            
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
        
        if ((f = proto._.init) instanceof Function) f.call(instance);
        
        return instance;
    };
    
    defaults.play = function() {
        var f, _ = this._;
        if (_.ar) {
            if (_.dac === null) {
                _.dac = timbre("dac", this);
                if ((f = _.proto._.play) instanceof Function) f.call(this);
                timbre.fn.doEvent(this, "play");
            } else if (this.dac.args.indexOf(this) === -1) {
                _.dac.append(this);
                if ((f = _.proto._.play) instanceof Function) f.call(this);
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
            if ((f = _.proto._.pause) instanceof Function) f.call(this);
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
        if ((f = this._.proto._.on) instanceof Function) f.call(this);
        timbre.fn.doEvent(this, "on");
        return this;
    };
    
    defaults.off = function() {
        var f;
        this._.ison = false;
        if ((f = this._.proto._.off) instanceof Function) f.call(this);
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
        if ((f = this._.proto._.append) instanceof Function) f.call(this);
        return this;
    };
    
    defaults.appendTo = function(obj) {
        obj.args.append.call(obj.args, this);
        return this;
    };
    
    defaults.remove = function() {
        var f;
        this.args.remove.apply(this.args, arguments);
        if ((f = this._.proto._.remove) instanceof Function) f.call(this);
        return this;
    };
    
    defaults.removeFrom = function(obj) {
        obj.args.remove.call(obj.args, this);
        return this;
    };
    
    defaults.removeAll = function() {
        var f;
        this.args.removeAll.apply(this.args, arguments);
        if ((f = this._.proto._.remove) instanceof Function) f.call(this);
        return this;
    };
    
    defaults.set = function(key, value) {
        var k, self = this._.proto;
        if (typeof key === "string") {
            if (Object.getOwnPropertyDescriptor(self, key) !== undefined) {
                this[key] = value;
            }
        } else if (typeof key === "object") {
            for (k in key) {
                if (Object.getOwnPropertyDescriptor(self, k) !== undefined) {
                    this[k] = key[k];
                }
            }
        }
        return this;
    };
    
    defaults.get = function(key) {
        var v, self = this._.proto;
        if (Object.getOwnPropertyDescriptor(self, key) !== undefined) {
            v = this[key];
        }
        return v;
    };
    
    defaults.addEventListener        = timbre.addEventListener;
    defaults.removeEventListener     = timbre.removeEventListener;
    defaults.removeAllEventListeners = timbre.removeAllEventListeners;
    
    defaults.properties.isAr = { get: function() { return !!this._.ar; } };
    defaults.properties.isKr = { get: function() { return  !this._.ar; } };
    defaults.properties.isOn  = { get: function() { return !!this._.ison; } };
    defaults.properties.isOff = { get: function() { return  !this._.ison; } };
    defaults.properties.isUndefined = { get: function() { return this._.isUndefined; } };
    
    defaults.properties.scalar = {
        get: function() {
            if (timbre.sys.seq_id !== this.seq_id) {
                this.seq(timbre.sys.seq_id);
            }
            return this.cell[0];
        }
    };
    
    defaults.properties.dac = {
        set: function(value) {
            if (value !== this._.dac) {
                if (this._.dac !== null) {
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
        var proto, _, i;
        
        if (typeof klass === "function") {
            proto = klass.prototype;
            
            _ = new TimbreObject();
            if (typeof proto._ === "object") {
                for (i in proto._) _[i] = proto._[i];
            }
            proto._ = _;
            
            for (i in defaults) {
                if (typeof defaults[i] === "function") {
                    if (!(proto[i] instanceof Function)) proto[i] = defaults[i];
                }
            }
            for (i in defaults.properties) {
                if (Object.getOwnPropertyDescriptor(proto, i) === undefined) {
                    Object.defineProperty(proto, i, defaults.properties[i]);
                }
            }
            
            if (typeof proto.ar !== "function") {
                fn.setPrototypeOf.call(proto, "ar-kr");
            }
            
            if (typeof key === "string") {
                if (func instanceof Function) {
                    klasses[key]  = func;
                } else {
                    proto._.klassname = key;
                    proto._.klass     = klass;
                    klasses[key] = klass;
                }
            }
        }
    };
    
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
    
    defaults.optional.dac = {
        on: function() {
            var f;
            this._.ison = true;
            timbre.dacs.append(this);
            if ((f = this._.proto._.on)) f.call(this);
            timbre.fn.doEvent(this, "on");
            return this;
        },
        off: function() {
            var f;
            this._.ison = false;
            timbre.dacs.remove(this);
            if ((f = this._.proto._.off)) f.call(this);
            timbre.fn.doEvent(this, "off");
            return this;
        },
        play: function() {
            var f;
            this._.ison = true;
            timbre.dacs.append(this);
            if ((f = this._.proto._.play)) f.call(this);
            timbre.fn.doEvent(this, "play");
            return this;
        },
        pause: function() {
            var f;
            this._.ison = false;
            timbre.dacs.remove(this);
            if ((f = this._.proto._.pause)) f.call(this);
            timbre.fn.doEvent(this, "pause");
            return this;
        }
    };
    
    defaults.optional.timer = {
        on: function() {
            var f;
            this._.ison = true;
            timbre.timers.append(this);
            if ((f = this._.proto._.on)) f.call(this);
            timbre.fn.doEvent(this, "on");
            return this;
        },
        off: function() {
            var f;
            this._.ison = false;
            timbre.timers.remove(this);
            if ((f = this._.proto._.off)) f.call(this);
            timbre.fn.doEvent(this, "off");
            return this;
        },
        play: function() {
            var f;
            if ((f = this._.proto._.play)) f.call(this);
            timbre.fn.doEvent(this, "play");
            return this;
        },
        pause: function() {
            var f;
            if ((f = this._.proto._.pause)) f.call(this);
            timbre.fn.doEvent(this, "pause");
            return this;
        }
    };
    
    defaults.optional.listener = {
        listen: function(target) {
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
        }
    };
    
    fn.setPrototypeOf = function(type) {
        if (!this._) this._ = {};
        switch (type) {
        case "ar-only": case "ar":
            this.ar = defaults.optional.fixrate;
            this.kr = defaults.optional.fixrate;
            this._.ar = true;
            break;
        case "kr-only": case "kr":
            this.ar = defaults.optional.fixrate;
            this.kr = defaults.optional.fixrate;
            this._.ar = false;
            break;
        case "kr-ar": case "kr->ar":
            this.ar = defaults.optional.ar;
            this.kr = defaults.optional.kr;
            this._.ar = false;
            break;
        case "ar-kr": case "ar->kr":
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
            this.listen = defaults.optional.listener.listen;
            this._.type = 3;
            break;
        }
        return this;
    };
    
    fn.valist = function(_args) {
        var args = [], i = _args.length;
        
        while (i--) {
            args.unshift(timbre(_args[i]));
        }
        
        return args;
    };
    
    fn.arrayset = (function() {
        var append = function() {
            var args, i, imax;
            args = fn.valist(arguments);
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (this.indexOf(args[i]) === -1) this.push(args[i]);
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
        
        if ((func = obj["on" + name]) instanceof Function) {
            func.apply(obj, args);
        }
        
        if ((list = obj._.ev[name]) !== undefined) {
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
        var x;
        if (o instanceof Object) {
            if ((x = o._) instanceof Object) {
                if ((x = x.proto) instanceof Object) {
                    return x._ instanceof TimbreObject;
                }
            }
        }
        return false;
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
            if ((f = base[names[i]]) instanceof Function) self[names[i]] = f;
        }
        return self;
    };
    
    fn.sumargsAR = function(self, args, seq_id) {
        var cell, tmp, i, imax, j, jmax;
        
        cell = self.cell;
        for (j = jmax = cell.length; j--; ) {
            cell[j] = 0;
        }
        for (i = 0, imax = args.length; i < imax; ++i) {
            tmp = args[i].seq(seq_id);
            for (j = jmax; j--; ) {
                cell[j] += tmp[j];
            }
        }
        return cell;
    };
    
    fn.sumargsKR = function(self, args, seq_id) {
        var tmp, i, imax;
        
        tmp = 0;
        for (i = 0, imax = args.length; i < imax; ++i) {
            tmp += args[i].seq(seq_id)[0];
        }
        return tmp;
    };
    
    return fn;
}(timbre));

// __END__
