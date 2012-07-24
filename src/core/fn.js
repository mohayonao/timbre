/**
 * timbre.fn
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

timbre.fn = (function(timbre) {
    var fn = {}, NOP = function() { return this; };
    
    var TimbreObject = function() {};
    TimbreObject.objectId = 0;
    TimbreObject.klasses = {
        _find: function(key) {
            if (typeof TimbreObject.klasses[key] === "function") {
                return TimbreObject.klasses[key];
            }
            key = "-" + timbre.env + "-" + key;    
            if (typeof TimbreObject.klasses[key] === "function") {
                return TimbreObject.klasses[key];
            }
        }
    };
    TimbreObject.PrototypeValue = function() {};
    
    
    timbre.TimbreBasePrototype = TimbreObject.prototype = {
        play: function() {
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
        },
        pause: function() {
            var f, _ = this._;
            if (_.dac && _.dac.args.indexOf(this) !== -1) {
                _.dac.remove(this);
                if ((f = _.proto._.pause) instanceof Function) f.call(this);
                timbre.fn.doEvent(this, "pause");
                if (_.dac.isOn && _.dac.args.length === 0) _.dac.off();
            }
            return this;
        },
        ar: function() {
            this._.ar = true;
            return this;
        },
        kr: function() {
            this._.ar = false;
            return this;
        },
        bang: function() {
            timbre.fn.doEvent(this, "bang");
            return this;
        },
        seq: function() {
            return this.cell;
        },
        on: function() {
            var f;
            this._.ison = true;
            if ((f = this._.proto._.on) instanceof Function) f.call(this);
            timbre.fn.doEvent(this, "on");
            return this;
        },
        off: function() {
            var f;
            this._.ison = false;
            if ((f = this._.proto._.off) instanceof Function) f.call(this);
            timbre.fn.doEvent(this, "off");
            return this;
        },
        clone: function(deep) {
            var newone = timbre(this._.proto._.klassname);
            timbre.fn.copyBaseArguments(this, newone, deep);
            return newone;
        },
        // v12.07.18: buddy
        buddy: function(name, list, altMethod) {
            var buddies = this._.buddies;
            
            if (typeof name === "string") name = [ name ];
            
            if (name instanceof Array) {
                for (var i = name.length, x; i--; ) {
                    if (typeof(x = name[i]) === "string") {
                        if (list === null) {
                            delete buddies[x];
                        } else if (list === undefined) {
                            buddies[x] = [this.args, altMethod];
                        } else if (list instanceof Array) {
                            buddies[x] = [ list    , altMethod];
                        } else if (list instanceof Function) {
                            buddies[x] = [[list]   , altMethod];
                        } else if (list instanceof TimbreObject) {
                            buddies[x] = [[list]   , altMethod];
                        }
                    }
                }
            }
            return this;
        },
        append: function() {
            var f;
            this.args.append.apply(this.args, arguments);
            if ((f = this._.proto._.append) instanceof Function) f.call(this);
            return this;
        },
        appendTo: function(obj) {
            obj.args.append.call(obj.args, this);
            return this;
        },
        remove: function() {
            var f;
            this.args.remove.apply(this.args, arguments);
            if ((f = this._.proto._.remove) instanceof Function) f.call(this);
            return this;
        },
        removeFrom: function(obj) {
            obj.args.remove.call(obj.args, this);
            return this;
        },
        removeAll: function() {
            var f;
            this.args.removeAll.apply(this.args, arguments);
            if ((f = this._.proto._.remove) instanceof Function) f.call(this);
            return this;
        },
        set: function(key, value) {
            var desc = Object.getOwnPropertyDescriptor;
            if (typeof key === "string") {
                var x = this._.proto;
                while (x !== null) {
                    if (desc(x, key) !== undefined) {
                        this[key] = value;
                        break;
                    }
                    x = Object.getPrototypeOf(x); 
                }
            } else if (typeof key === "object") {
                for (var k in key) {
                    var x = this._.proto;
                    while (x !== null) {
                        if (desc(x, k) !== undefined) {
                            this[k] = key[k];
                            break;
                        }
                        x = Object.getPrototypeOf(x); 
                    }
                }
            }
            return this;
        },
        get: function(key) {
            var desc = Object.getOwnPropertyDescriptor;
            var x    = this._.proto;
            while (x !== null) {
                if (desc(x, key) !== undefined) return this[key];
                x = Object.getPrototypeOf(x);
            }
        },
        addEventListener       : timbre.addEventListener,
        removeEventListener    : timbre.removeEventListener,
        removeAllEventListeners: timbre.removeAllEventListeners
    }; // TimbreObject.prototype

    var TimbreObjectPropertiesDescription = {
        isAr: { get: function() { return !!this._.ar; } },
        isKr: { get: function() { return  !this._.ar; } },
        isOn : { get: function() { return !!this._.ison; } },
        isOff: { get: function() { return  !this._.ison; } },
        isUndefined: { get: function() { return this._.isUndefined; } },
        scalar: {
            get: function() {
                if (timbre.sys.seq_id !== this.seq_id) {
                    this.seq(timbre.sys.seq_id);
                }
                return this.cell[0];
            }
        },
        dac: {
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
        },
        mul: {
            set: function(value) {
                if (typeof value === "number") { this._.mul = value; }
            },
            get: function() { return this._.mul; }
        },
        add: {
            set: function(value) {
                if (typeof value === "number") { this._.add = value; }
            },
            get: function() { return this._.add; }
        }
    }; // TimbreObjectPropertiesDescription
    
    Object.defineProperties(TimbreObject.prototype,
                            TimbreObjectPropertiesDescription);
    
    
    fn.init = function() {
        if (TimbreObject.objectId === 0) timbre.setup();
        
        var klass, instance;
        var isThrougOut, isUndefined;
        
        var args = Array.prototype.slice.call(arguments);
        var key  = args[0];
        
        switch (typeof key) {
        case "string":
            if ((klass = TimbreObject.klasses._find(key)) !== undefined) {
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
                instance    = key;
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
        
        var p = Object.getPrototypeOf(instance);
        if (!isThrougOut) {
            instance.seq_id = -1;
            if (!instance.cell) {
                instance.cell = new Float32Array(timbre.cellsize);
            }
            if (!instance.args) instance.args = [];
            timbre.fn.arrayset(instance.args);
            
            if (!instance.hasOwnProperty("_")) instance._ = {};
            instance._.proto = p;
            instance._.isUndefined = !!isUndefined;
            instance._.id = TimbreObject.objectId++;
            
            if (typeof instance._.ev      !== "object") {
                instance._.ev = {};
            }
            if (typeof instance._.buddies !== "object") {
                instance._.buddies = {};
            }
            if (typeof instance._.ar !== "boolean") {
                if (p && typeof p._ === "object") {
                    instance._.ar = !!p._.ar;
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
        
        if (p._.init instanceof Function) p._.init.call(instance);
        
        return instance;
    }; // fn.init
    
    
    fn.register = function(key, klass, func) {
        if (typeof key !== "string") return;
        
        if (klass instanceof Function) {
            var p = klass.prototype;
            var q = TimbreObject.prototype;
            var _ = new TimbreObject.PrototypeValue();
            
            if (typeof p._ === "object") {
                for (var i in p._) _[i] = p._[i];
            }
            p._ = _;
            
            if (!(p instanceof TimbreObject)) {
                for (var i in q) {
                    if (typeof q[i] === "function") {
                        if (!(p[i] instanceof Function)) p[i] = q[i];
                    }
                }
                for (var i in TimbreObjectPropertiesDescription) {
                    if (Object.getOwnPropertyDescriptor(p, i) === undefined) {
                        Object.defineProperty(p, i, TimbreObjectPropertiesDescription[i]);
                    }
                }
            }
            
            if (typeof p.ar !== "function") {
                fn.setPrototypeOf.call(p, "ar-kr");
            }
            
            for (var j in p) {
                if (p.hasOwnProperty(j) && p[j] instanceof Function) {
                    if (q[j] === undefined) q[j] = NOP;
                }
            }
        }
        
        if (func instanceof Function) {
            TimbreObject.klasses[key]  = func;
        } else {
            p._.klassname = key;
            p._.klass     = klass;
            TimbreObject.klasses[key] = klass;
        }
    }; // fn.register
    
    
    TimbreObject.dac = {
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
    
    TimbreObject.timer = {
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
    
    TimbreObject.listener = {
        listen: function(target) {
            if (target === null) {
                if (this._.args) this.args = this._.args;
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
            this.ar = this.kr = NOP;
            this._.ar = true;
            break;
        case "kr-only": case "kr":
            this.ar = this.kr = NOP;
            this._.ar = false;
            break;
        case "kr-ar": case "kr->ar":
            this._.ar = false;
            break;
        case "ar-kr": case "ar->kr":
            this._.ar = true;
            break;
        case "dac":
            this.on    = TimbreObject.dac.on;
            this.off   = TimbreObject.dac.off;
            this.play  = TimbreObject.dac.play;
            this.pause = TimbreObject.dac.pause;
            this._.type = 1;
            break;
        case "timer":
            this.on    = TimbreObject.timer.on;
            this.off   = TimbreObject.timer.off;
            this.play  = TimbreObject.timer.play;
            this.pause = TimbreObject.timer.pause;
            this._.type = 2;
            break;
        case "listener":
            this.listen = TimbreObject.listener.listen;
            this._.type = 3;
            break;
        }
        return this;
    };
    
    fn.valist = function(args) {
        if (args instanceof Array) {
            return args.map(timbre);
        } else {
            return Array.prototype.map.call(args, timbre);
        }
    };
    
    fn.arrayset = (function() {
        var append = function() {
            var args = fn.valist(arguments);
            for (var i = 0, imax = args.length; i < imax; ++i) {
                if (this.indexOf(args[i]) === -1) this.push(args[i]);
            }
            return this;
        };
        var remove = function() {
            for (var i = arguments.length, j; i--; ) {
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
            var remindexes = [];
            for (var i = 1, imax = self.length; i < imax; ++i) {
                var find = self.indexOf(self[i]);
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
    
    // v12.07.18: for buddy
    var buddyCall = function(name, list, altMethod) {
        var func;
        for (var i = 0, imax = list.length; i < imax; ++i) {
            if (list[i] instanceof Array) {
                buddyCall(name, list[i], altMethod);
            } else if (list[i] instanceof Function) {
                list[i].call();
            } else if ((func = list[i][altMethod||name]) instanceof Function) {
                func.call(list[i]);
            }
        }
    };
    
    fn.doEvent = function(obj, name, args) {
        var func, list;
        
        if ((func = obj["on" + name]) instanceof Function) {
            func.apply(obj, args);
        }
        
        if ((list = obj._.ev[name]) !== undefined) {
            for (var i = 0, imax = list.length; i < imax; ++i) {
                func = list[i];
                func.apply(obj, args);
                if (func.rm) obj.removeEventListener(name, func);
            }
        }
        
        // v12.07.18: for buddy
        if (obj._.buddies && (list = obj._.buddies[name]) !== undefined) {
            buddyCall(name, list[0], list[1]);
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
        if (o instanceof TimbreObject) {
            return true;
        }
        if (o instanceof Object) {
            if ((x = o._) instanceof Object) {
                if ((x = x.proto) instanceof Object) {
                    return x._ instanceof TimbreObject.PrototypeValue;
                }
            }
        }
        return false;
    };
    
    fn.getClass = function(name) {
        return TimbreObject.klasses[name];
    };
    
    fn.copyPropertyDescriptors = function(self, base, names) {
        console.warn("timbre.fn.copyPropertyDescriptors is deprecated.");
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
        console.warn("timbre.fn.copyFunctions is deprecated.");
        var i, f;
        for (i = names.length; i--; ) {
            if ((f = base[names[i]]) instanceof Function) self[names[i]] = f;
        }
        return self;
    };
    
    fn.sumargsAR = function(self, args, seq_id) {
        var cell, tmp, i, imax, j, jmax;
        
        cell = self.cell;
        
        j = jmax = cell.length;
        while (j) {
            cell[--j] = 0; cell[--j] = 0; cell[--j] = 0; cell[--j] = 0;
            cell[--j] = 0; cell[--j] = 0; cell[--j] = 0; cell[--j] = 0;
        }
        
        for (i = 0, imax = args.length; i < imax; ++i) {
            tmp = args[i].seq(seq_id);
            j = jmax;
            while (j) {
                --j; cell[j] += tmp[j]; --j; cell[j] += tmp[j];
                --j; cell[j] += tmp[j]; --j; cell[j] += tmp[j];
                --j; cell[j] += tmp[j]; --j; cell[j] += tmp[j];
                --j; cell[j] += tmp[j]; --j; cell[j] += tmp[j];
            }
        }
        return cell;
    };
    
    fn.sumargsKR = function(self, args, seq_id) {
        var tmp = 0;
        for (var i = 0, imax = args.length; i < imax; ++i) {
            tmp += args[i].seq(seq_id)[0];
        }
        return tmp;
    };
    
    // v12.07.18:
    fn.buildPrototype = function(constructor, options) {
        var TimbreObject = function() {};
        TimbreObject.prototype = timbre.TimbreBasePrototype;
        var p = constructor.prototype = new TimbreObject();
        
        options = options || {};
        
        var base = options.base;
        if (typeof base === "string") base = [ base ];
        
        if (base instanceof Array) {
            base.forEach(function(x) {
                if (typeof x === "string") {
                    fn.setPrototypeOf.call(this, x);
                } else if (typeof x === "function") {
                    x.call(p);
                }
            }.bind(p));
        }
        
        if (options.properties instanceof Object) {
            Object.defineProperties(p, options.properties);
        }
        
        var copies = options.copies;
        if (copies instanceof Array) {
            var klassMap = {};
            var re = /^([\w\d]+)\.([\w\d]+)(\(\))?$/;
            copies.forEach(function(x) {
                var m = re.exec(x.trim());
                if (m !== null) {
                    var klass = klassMap[m[1]] ||
                        (klassMap[m[1]] = timbre.fn.getClass(m[1]));
                    if (klass !== undefined) {
                        var name = m[2];
                        var x, q = klass.prototype;
                        if (m[3] !== undefined) {
                            if ((x = q[name]) instanceof Function) p[name] = x;
                        } else {
                            var x = Object.getOwnPropertyDescriptor(q, name);
                            if (x !== undefined) {
                                Object.defineProperty(p, name, x);
                            }
                        }
                    }
                }
            });
        }
        
        return p;
    };

    // v12.07.24
    fn.fix = function() {
        for (var i = 0, imax = arguments.length; i < imax; ++i) {
            var name = arguments[i];
            switch (name) {
            case "atom":
                timbre.utils.atom.octaveshift = -1;
                break;
            }
        }
        return timbre;
    };
    
    fn._setupTimbre = function(defaultSamplerate) {
        switch (timbre.samplerate) {
        case  8000: case 11025: case 12000:
        case 16000: case 22050: case 24000:
        case 32000: case 44100: case 48000:
            break;
        default:
            timbre.samplerate = defaultSamplerate;
        }
        
        switch (timbre.channels) {
        default:
            timbre.channels = 2;
        }
        
        switch (timbre.cellsize) {
        case 64: case 128:
        case 256: case 512:
            break;
        default:
            timbre.cellsize = 128;
        }
        
        switch (timbre.streamsize) {
        case  512: case 1024: case 2048:
        case 4096: case 8192:
            break;
        default:
            timbre.streamsize = 1024;
        }
    };
    
    return fn;
}(timbre));

// __END__
