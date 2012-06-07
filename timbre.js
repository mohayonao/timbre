/**
 * Timbre.js 0.2.1a / JavaScript Library for Objective Sound Programming
 * build: Thu, 07 Jun 2012 08:15:43 GMT
 */
;
var timbre = (function(context, timbre) {
    "use strict";
    
    var timbre = function() {
        return timbre.fn.init.apply(timbre, arguments);
    };
    timbre.VERSION    = "0.2.1a";
    timbre.BUILD      = "Thu, 07 Jun 2012 08:15:43 GMT";
    timbre.env        = "";
    timbre.platform   = "";
    timbre.samplerate = 44100;
    timbre.channels   = 2;
    timbre.cellsize   = 128;
    timbre.streamsize = 1024;
    timbre.dacs       = [];
    timbre.timers     = [];
    timbre.listeners  = [];
    timbre.sys        = null;
    timbre.context    = {};
    timbre._ = { ev:{}, amp:0.8,
                 autorun:true, verbose:true, workerpath:"",
                 none: new Float32Array(timbre.cellsize) };
    
    Object.defineProperty(timbre, "amp", {
        set: function(value) {
            if (typeof value === "number") {
                timbre._.amp = value;
            }
        },
        get: function() { return timbre._.amp; }
    });
    Object.defineProperty(timbre, "autorun", {
        set: function(value) {
            timbre._.autorun = !!value;
        },
        get: function() { return timbre._.autorun; }
    });
    Object.defineProperty(timbre, "workerpath", {
        set: function(value) {
            if (typeof value === "string") {
                timbre._.workerpath = value;
            }
        },
        get: function() { return timbre._.workerpath; }
    });
    Object.defineProperty(timbre, "verbose", {
        set: function(value) {
            timbre._.verbose = !!value;
        },
        get: function() { return timbre._.verbose; }
    });
    Object.defineProperty(timbre, "isOn", {
        get: function() { return timbre.sys._.ison; }
    });
    Object.defineProperty(timbre, "isOff", {
        get: function() { return !timbre.sys._.ison; }
    });
    
    timbre.setup = function(params) {
        var samplerate, channels, cellsize, streamsize;
        
        if (!Object.isFrozen(timbre)) {
            if (typeof params === "object") {
                if (typeof params.samplerate === "number") {
                    timbre.samplerate = params.samplerate;
                }
                if (typeof params.channels === "number") {
                    timbre.channels = params.channels;
                }
                if (typeof params.cellsize === "number") {
                    timbre.cellsize = params.cellsize;
                }
                if (typeof params.streamsize === "number") {
                    timbre.cellsize = params.streamsize;
                }
            }
            timbre.sys.setup();
            Object.freeze(timbre);
        } else {
            if (timbre._.verbose && params) {
                console.warn("timbre is already configured.");
            }
        }
        return timbre;
    };
    timbre.on = function() {
        if (!timbre.sys._.ison) {
            timbre.setup();
            timbre.sys.on();
            timbre.fn.doEvent(this, "on");
        }
        return timbre;
    };
    timbre.off = function() {
        if (timbre.sys._.ison) {
            timbre.sys.off();
            timbre.fn.doEvent(this, "off");
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
    
    
    (function() {
        var append = function() {
            var args, p, b, i, imax;
            args = timbre.fn.valist(arguments);
            for (i = 0, imax = args.length, b = false; i < imax; ++i) {
                p = args[i]._.proto;
                if (p._.type === this.type) {
                    if (this.indexOf(args[i]) === -1) {
                        this.push(args[i]);
                        b = true;
                    }
                }
            }
            if ( b && timbre._.autorun && this !== timbre.listeners ) timbre.on();
            return this;
        };
        var remove = function() {
            var i, j;
            for (i = arguments.length; i--; ) {
                if ((j = this.indexOf(arguments[i])) !== -1) {
                    this.splice(j, 1);
                }
            }
            if ( timbre._.autorun &&
                 timbre.dacs.length   === 0 &&
                 timbre.timers.length === 0 ) timbre.off();
            return this;
        };
        var removeAll = function() {
            while (this.length > 0) this.pop();
            if ( timbre._.autorun &&
                 timbre.dacs.length   === 0 &&
                 timbre.timers.length === 0 ) timbre.off();
            return this;
        };
        
        var i, x;
        for (i = arguments.length; i--; ) {
            x = arguments[i];
            x.append    = append;
            x.remove    = remove;
            x.removeAll = removeAll;
        }
    }(timbre.dacs, timbre.timers, timbre.listeners));
    
    timbre.dacs.type      = 1;
    timbre.timers.type    = 2;
    timbre.listeners.type = 3;
    
    
    timbre.fn = (function(timbre) {
        var fn = {};
        var klasses = {};
        var TimbreObject = function() {};
        var objectId = 0;
        
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
            if ((f = this._.proto._.on)) f.call(this);
            timbre.fn.doEvent(this, "on");
            return this;
        };
        defaults.optional.dac.off = function() {
            var f;
            this._.ison = false;
            timbre.dacs.remove(this);
            if ((f = this._.proto._.off)) f.call(this);
            timbre.fn.doEvent(this, "off");
            return this;
        };
        defaults.optional.dac.play = function() {
            var f;
            this._.ison = true;
            timbre.dacs.append(this);
            if ((f = this._.proto._.play)) f.call(this);
            timbre.fn.doEvent(this, "play");
            return this;
        };
        defaults.optional.dac.pause = function() {
            var f;
            this._.ison = false;
            timbre.dacs.remove(this);
            if ((f = this._.proto._.pause)) f.call(this);
            timbre.fn.doEvent(this, "pause");
            return this;
        };
        
        defaults.optional.timer = {};
        defaults.optional.timer.on = function() {
            var f;
            this._.ison = true;
            timbre.timers.append(this);
            if ((f = this._.proto._.on)) f.call(this);
            timbre.fn.doEvent(this, "on");
            return this;
        };
        defaults.optional.timer.off = function() {
            var f;
            this._.ison = false;
            timbre.timers.remove(this);
            if ((f = this._.proto._.off)) f.call(this);
            timbre.fn.doEvent(this, "off");
            return this;
        };
        defaults.optional.timer.play = function() {
            var f;
            if ((f = this._.proto._.play)) f.call(this);
            timbre.fn.doEvent(this, "play");
            return this;
        };
        defaults.optional.timer.pause = function() {
            var f;
            if ((f = this._.proto._.pause)) f.call(this);
            timbre.fn.doEvent(this, "pause");
            return this;
        };
        
        fn.init = function() {
            var args, key, klass, instance;
            var isThrougOut, isUndefined, proto, f;
            
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
                if (objectId === 0) timbre.setup();
                instance._.id = objectId++;
                
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
            
            if ((f = proto._.init)) f.call(instance);
            
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
    
    
    var SoundSystem = (function() {
        var SoundSystem = function() {
            initialize.apply(this, arguments);
        }, $this = SoundSystem.prototype;
        
        var initialize = function() {
            this.streamsize = timbre.streamsize;
            this.channels   = timbre.channels;
            this.L = new Float32Array(timbre.streamsize);
            this.R = new Float32Array(timbre.streamsize);
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
        
        $this.setup = function() {
            if (this._.impl) this._.impl.setup();
            this.streamsize = timbre.streamsize;
            this.channels   = timbre.channels;
            if (timbre.streamsize !== this.L.length) {
                this.L = new Float32Array(timbre.streamsize);
                this.R = new Float32Array(timbre.streamsize);
            }
            if (timbre.cellsize !== this.cell.length) {
                this.cell = new Float32Array(timbre.cellsize);
                this._.cellsize = timbre.cellsize;
            }
            if (timbre.samplerate === 0) timbre.samplerate = 44100;
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
            var seq_id, dacs, dac, timers, timer, listeners, listener;
            var i, imax, j, jmax, k, kmax, n, nmax;
            var saved_i, tmpL, tmpR, amp, x;
            
            cell = this.cell;
            L = this.L;
            R = this.R;
            amp = timbre._.amp;
            
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
                listeners = timbre.listeners.slice(0);
                for (j = 0, jmax = listeners.length; j < jmax; ++j) {
                    if ((listener = listeners[j]) !== undefined) {
                        listener.seq(seq_id);
                    }
                }
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
    
    
    var NumberWrapper = (function() {
        var NumberWrapper = function() {
            initialize.apply(this, arguments);
        }, $this = NumberWrapper.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
        
        Object.defineProperty($this, "value", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.value = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.value; }
        });
        Object.defineProperty($this, "mul", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.mul = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.mul; }
        });
        Object.defineProperty($this, "add", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.add = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.add; }
        });
        
        var initialize = function(_args) {
            this._ = {};
            if (typeof _args[0] === "number") {
                this._.value = _args[0];
            } else{
                this._.value = 0;
            }
        };
        
        var changeTheValue = function() {
            var x, cell, i, _ = this._;
            x = _.value * _.mul + _.add;
            cell = this.cell;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        
        $this._.init = function() {
            this.value = this._.value;
        };
        
        $this.clone = function(deep) {
            var newone = timbre(this._.value);
            newone._.mul = this._.mul;
            newone._.add = this._.add;
            changeTheValue.call(newone);
            return timbre.fn.copyBaseArguments(this, newone, deep);
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
                this._.value = !!value;
                changeTheValue.call(this);
            },
            get: function() { return this._.value; }
        });
        Object.defineProperty($this, "mul", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.mul = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.mul; }
        });
        Object.defineProperty($this, "add", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.add = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.add; }
        });
        
        var initialize = function(_args) {
            this._ = {};
            if (typeof _args[0] === "boolean") {
                this._.value = _args[0];
            } else{
                this._.value = false;
            }
        };
        
        var changeTheValue = function() {
            var x, cell, i, _ = this._;
            x = (_.value ? 1 : 0) * _.mul + _.add;
            cell = this.cell;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        
        $this._.init = function() {
            this.value = this._.value;
        };
        
        $this.clone = function(deep) {
            var newone = timbre(this._.value);
            newone._.mul = this._.mul;
            newone._.add = this._.add;
            changeTheValue.call(newone);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            this._.value = !this._.value;
            changeTheValue.call(this);
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        return BooleanWrapper;
    }());
    timbre.fn.register("boolean", BooleanWrapper);
    
    
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
                    this._.index = 0;
                }
            },
            get: function() { return this._.value; }
        });
        Object.defineProperty($this, "index", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    value = value|0;
                    if (value < 0) value = _.value.length + value;
                    if (0 <= value && value < _.value.length) {
                        _.index = value;
                        changeTheValue.call(this);
                    }
                }
            },
            get: function() { return this._.index; }
        });
        Object.defineProperty($this, "mul", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.mul = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.mul; }
        });
        Object.defineProperty($this, "add", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.add = value;
                    changeTheValue.call(this);
                }
            },
            get: function() { return this._.add; }
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
            _.value = (value !== undefined) ? value : [];
            _.index = 0;
        };
        
        var changeTheValue = function() {
            var x, cell, i, _ = this._;
            x = _.value[_.index] * _.mul + _.add;
            cell = this.cell;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        
        $this._.init = function() {
            this.index = 0;
        };
        
        $this.clone = function(deep) {
            var newone = timbre(this._.value);
            newone._.mul = this._.mul;
            newone._.add = this._.add;
            changeTheValue.call(newone);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            var _ = this._;
            this.index = (_.index + 1) % _.value.length;
            timbre.fn.doEvent(this, "bang");
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
            }
            return cell;
        };
        
        return ArrayWrapper;
    }());
    timbre.fn.register("array", ArrayWrapper);
    
    
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
            get: function() { return this._.value; }
        });
        Object.defineProperty($this, "args", {
            set: function(value) {
                if (typeof value === "object" && value instanceof Array) {
                    this._.args = value;
                }
            },
            get: function() { return this._.args; }
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
            var newone = timbre("function", this._.value, this._.args);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            var _ = this._;
            if (_.value !== null) {
                _.value.apply(this, _.args);
            }
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        return FunctionWrapper;
    }());
    timbre.fn.register("function", FunctionWrapper);
    
    
    var Dac = (function() {
        var Dac = function() {
            initialize.apply(this, arguments);
        }, $this = Dac.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        timbre.fn.setPrototypeOf.call($this, "dac");
        
        Object.defineProperty($this, "dac", {
            get: function() { return this; }
        });
        Object.defineProperty($this, "pan", {
            set: function(value) {
                this._.pan = timbre(value);
            },
            get: function() { return this._.pan; }
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            this.args = timbre.fn.valist.call(this, _args);
            this.pan = 0.5;
            this.L = new Float32Array(timbre.cellsize);
            this.R = new Float32Array(timbre.cellsize);
            _.prev_pan = undefined;
            _.ison = false;
        };
        
        $this._.init = function() {
            var i, args;
            args = this.args;
            for (i = args.length; i--; ) {
                args[i].dac = this;
            }
        };
        
        $this.clone = function(deep) {
            var newone = timbre("dac");
            newone._.pan = (deep) ? this._.pan.clone(true) : this._.pan;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, L, R;
            var mul, pan, panL, panR;
            var tmp, i, imax, j, jmax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                pan = _.pan.seq(seq_id)[0];
                if (pan !== _.prev_pan) {
                    _.panL = Math.cos(0.5 * Math.PI * pan);
                    _.panR = Math.sin(0.5 * Math.PI * pan);
                    _.prev_pan = pan;
                }
                L = this.L;
                R = this.R;
                mul  = _.mul;
                panL = _.panL * mul;
                panR = _.panR * mul;
                jmax = timbre.cellsize;
                for (j = jmax; j--; ) {
                    cell[j] = L[j] = R[j] = 0;
                }
                args = this.args.slice(0);
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i] !== undefined) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            cell[j] += tmp[j] * mul;
                            L[j] += tmp[j] * panL;
                            R[j] += tmp[j] * panR;
                        }
                    }
                }
            }
            return cell;
        };
        
        return Dac;
    }());
    timbre.fn.register("dac", Dac);
    
    timbre.fn.register("pandac", Dac, function(_args) {
        var instance = new Dac(_args.slice(1));
        instance.pan = _args[0];
        return instance;
    });
    
    
    var Add = (function() {
        var Add = function() {
            initialize.apply(this, arguments);
        }, $this = Add.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        var initialize = function(_args) {
            this.args = timbre.fn.valist.call(this, _args);
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("+"), deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell;
            var mul, add;
            var tmp, i, imax, j, jmax;
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                jmax = timbre.cellsize;
                if (_.ar) {
                    for (j = jmax; j--; ) {
                        cell[j] = 0;
                    }
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            cell[j] += tmp[j];
                        }
                    }
                    
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                } else {
                    tmp = 0;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp += args[i].seq(seq_id)[0];
                    }
                    tmp = tmp * mul + add;
                    for (j = jmax; j--; ) {
                        cell[j] = tmp;
                    }
                }
                
            }
            return cell;
        };
        
        return Add;
    }());
    timbre.fn.register("+", Add);
    
    
    var Multiply = (function() {
        var Multiply = function() {
            initialize.apply(this, arguments);
        }, $this = Multiply.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        var initialize = function(_args) {
            this.args = timbre.fn.valist.call(this, _args);
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("*"), deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell;
            var mul, add;
            var tmp, i, imax, j, jmax;
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                jmax = timbre.cellsize;
                if (_.ar) {
                    for (j = jmax; j--; ) {
                        cell[j] = mul;
                    }
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        if (args[i].seq_id === seq_id) {
                            tmp = args[i].cell;
                        } else {
                            tmp = args[i].seq(seq_id);
                        }
                        for (j = jmax; j--; ) {
                            cell[j] *= tmp[j];
                        }
                    }
                    if (add !== 0) {
                        for (j = jmax; j--; ) {
                            cell[j] += add;
                        }
                    }
                } else {
                    tmp = mul;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        if (args[i].seq_id === seq_id) {
                            tmp *= args[i].cell[0];
                        } else {
                            tmp *= args[i].seq(seq_id)[0];
                        }
                    }
                    tmp += add;
                    for (j = jmax; j--; ) {
                        cell[j] = tmp;
                    }
                }
            }
            return cell;
        };
        
        return Multiply;
    }());
    timbre.fn.register("*", Multiply);
    
    
    var Oscillator = (function() {
        var Oscillator = function() {
            initialize.apply(this, arguments);
        }, $this = Oscillator.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        Object.defineProperty($this, "wave", {
            set: function(value) {
                var wave, i, dx;
                wave = this._.wave;
                if (typeof value === "function") {
                    for (i = 0; i < 1024; i++) {
                        wave[i] = value(i / 1024);
                    }
                } else if (typeof value === "object" &&
                           (value instanceof Array || value.buffer instanceof ArrayBuffer)) {
                    if (value.length === 1024) {
                        this._.wave = value;
                    } else {
                        dx = value.length / 1024;
                        for (i = 0; i < 1024; i++) {
                            wave[i] = value[(i * dx)|0] || 0.0;
                        }
                    }
                } else if (typeof value === "string") {
                    if ((dx = Oscillator.Wavetables[value]) !== undefined) {
                        if (typeof dx === "function") dx = dx();
                        this._.wave = dx;
                    }
                }
            },
            get: function() { return this._.wave; }
        });
        Object.defineProperty($this, "freq", {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() { return this._.freq; }
        });
        Object.defineProperty($this, "phase", {
            set: function(value) {
                if (typeof value === "number") {
                    while (value >= 1.0) value -= 1.0;
                    while (value <  0.0) value += 1.0;
                    this._.phase = value;
                    this._.x = 1024 * this._.phase;
                }
            },
            get: function() { return this._.phase; }
        });
        
        var initialize = function(_args) {
            var i, _;
    
            this._ = _ = {};
            i = 0;
            
            _.wave = new Float32Array(1024);        
            
            if (typeof _args[i] === "function") {
                this.wave = _args[i++];
            } else if (typeof _args[i] === "object" && _args[i] instanceof Float32Array) {
                this.wave = _args[i++];
            } else if (typeof _args[i] === "string" && Oscillator.Wavetables[_args[i]]) {
                this.wave = _args[i++];
            } else {
                this.wave = "sin";
            }
            if (typeof _args[i] !== "undefined") {
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
            
            _.phase = 0;
            _.x = 1024 * _.phase;
            _.coeff = 1024 / timbre.samplerate;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("osc", _.wave);
            if (deep) {
                newone._.freq = _.freq.clone(true);
            } else {
                newone._.freq = _.freq;
            }
            newone._.phase = _.phase;
            return timbre.fn.copyBaseArguments(this, newone, deep);        
        };
        
        $this.bang = function() {
            this._.x = 1024 * this._.phase;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell;
            var freq, mul, add, wave;
            var x, dx, coeff;
            var index, delta, x0, x1, xx;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                freq = _.freq.seq(seq_id);
                
                mul  = _.mul;
                add  = _.add;
                wave = _.wave;
                x = _.x;
                coeff = _.coeff;
                if (_.ar) {
                    if (_.freq.isAr) {
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            index = x|0;
                            delta = x - index;
                            x0 = wave[(index  ) & 1023];
                            x1 = wave[(index+1) & 1023];
                            xx = (1.0 - delta) * x0 + delta * x1;
                            cell[i] = xx * mul + add;
                            x += freq[i] * coeff;
                        }
                    } else {
                        dx = freq[0] * coeff;
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            index = x|0;
                            delta = x - index;
                            x0 = wave[(index  ) & 1023];
                            x1 = wave[(index+1) & 1023];
                            xx = (1.0 - delta) * x0 + delta * x1;
                            cell[i] = xx * mul + add;
                            x += dx;
                        }
                    }
                } else {
                    index = x|0;
                    delta = x - index;
                    x0 = wave[(index  ) & 1023];
                    x1 = wave[(index+1) & 1023];
                    xx = (1.0 - delta) * x0 + delta * x1;
                    xx = xx * mul + add;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = xx;
                    }
                    x += freq[0] * coeff * imax;
                }
                _.x = x;
            }
            
            return cell;
        };
        
        $this.getWavetable = function(name) {
            var wave = Oscillator.Wavetables[name];
            if (wave !== undefined) {
                if (typeof wave === "function") wave = wave();
                return wave;
            }
        };
        
        $this.setWavetable = function(name, value) {
            var wave, i;
            if (typeof value === "function") {
                wave = new Float32Array(1024);
                for (i = 0; i < 1024; i++) {
                    wave[i] = value(i / 1024);
                }
                Oscillator.Wavetables[name] = wave;
            } else if (typeof value === "object" &&
                       (value instanceof Array || value.buffer instanceof ArrayBuffer)) {
                if (value.length === 1024) {
                    Oscillator.Wavetables[name] = value;
                } else {
                    wave = new Float32Array(1024);
                    dx = value.length / 1024;
                    for (i = 0; i < 1024; i++) {
                        wave[i] = value[(i * dx)|0] || 0.0;
                    }
                    Oscillator.Wavetables[name] = value;
                }
            }
        };
        
        return Oscillator;
    }());
    timbre.fn.register("osc", Oscillator);
    
    Oscillator.Wavetables = {};
    Oscillator.Wavetables["sin"] = function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = Math.sin(2 * Math.PI * (i/1024));
        }
        return l;
    };
    Oscillator.Wavetables["+sin"] = function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = Math.sin(2 * Math.PI * (i/1024)) * 0.5 + 0.5;
        }
        return l;
    };
    Oscillator.Wavetables["cos"] = function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = Math.cos(2 * Math.PI * (i/1024));
        }
        return l;
    };
    Oscillator.Wavetables["+cos"] = function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = Math.cos(2 * Math.PI * (i/1024)) * 0.5 + 0.5;
        }
        return l;
    };
    Oscillator.Wavetables["pulse"] = function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = i < 512 ? -1 : +1;
        }
        return l;
    };
    Oscillator.Wavetables["+pulse"] = function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = i < 512 ? 0 : 1;
        }
        return l;
    };
    Oscillator.Wavetables["tri"] = function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024) - 0.25;
            l[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }
        return l;
    };
    Oscillator.Wavetables["+tri"] = function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024) - 0.25;
            l[i] = (1.0 - 4.0 * Math.abs(Math.round(x) - x)) * 0.5 + 0.5;
        }
        return l;
    };
    Oscillator.Wavetables["sawup"] = function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024);
            l[i] = +2.0 * (x - Math.round(x));
        }
        return l;
    };
    Oscillator.Wavetables["+sawup"] = function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024);
            l[i] = (+2.0 * (x - Math.round(x))) * 0.5 + 0.5;
        }
        return l;
    };
    Oscillator.Wavetables["saw"]  = Oscillator.Wavetables["sawup"];
    Oscillator.Wavetables["+saw"] = Oscillator.Wavetables["+sawup"];
    Oscillator.Wavetables["sawdown"] = function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024);
            l[i] = -2.0 * (x - Math.round(x));
        }
        return l;
    };
    Oscillator.Wavetables["+sawdown"] = function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024);
            l[i] = (-2.0 * (x - Math.round(x))) * 0.5 + 0.5;
        }
        return l;
    };
    Oscillator.Wavetables["fami"] = function() {
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
    };
    Oscillator.Wavetables["konami"] = function() {
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
    };
    
    
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
    
    
    var FuncOscillator = (function() {
        var FuncOscillator = function() {
            initialize.apply(this, arguments);
        }, $this = FuncOscillator.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        Object.defineProperty($this, "func", {
            set: function(value) {
                if (typeof value === "function") {
                    this._.func = value;
                }
            },
            get: function() { return this._.func; }
        });
        Object.defineProperty($this, "numOfSamples", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.saved = new Float32Array(value);
                    this._.numOfSamples = value;
                }
            },
            get: function() { return this._.numOfSamples; }
        });
        Object.defineProperty($this, "freq", {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() { return this._.freq; }
        });
        Object.defineProperty($this, "phase", {
            set: function(value) {
                if (typeof value === "number") {
                    while (value >= 1.0) value -= 1.0;
                    while (value <  0.0) value += 1.0;
                    this._.phase = this._.x = value;
                }
            },
            get: function() { return this._.phase; }
        });
        
        var DEFAULT_FUNCTION = function(x) { return x; };
        
        var initialize = function(_args) {
            var numOfSamples, i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "number" && _args[i] > 0) {
                _.numOfSamples = _args[i++]|0;
            } else {
                _.numOfSamples = 0;
            }
            if (typeof _args[i] === "function") {
                _.func = _args[i++];
            } else {
                _.func = DEFAULT_FUNCTION;    
            }
            if (typeof _args[i] !== "undefined") {
                this.freq = _args[i++];
            } else {
                this.freq = 440;
            }
            
            _.saved = new Float32Array(_.numOfSamples);
            _.index = 0;
            _.phase = _.x = 0;
            _.coeff = 1 / timbre.samplerate;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("func", _.func, null, _.numOfSamples);
            if (deep) {
                newone._.freq = _.freq.clone(true);
            } else {
                newone._.freq = _.freq;
            }
            newone._.phase = _.phase;
            return timbre.fn.copyBaseArguments(this, newone, deep);        
        };
        
        $this.bang = function() {
            this._.x = this._.phase;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell;
            var func, freq, x, coeff;
            var mul, add, saved, index;
            var tmp, i, imax, j, jmax, k;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (this.seq_id !== seq_id) {
                this.seq_id = seq_id;
                
                func  = _.func;
                freq  = _.freq.seq(seq_id);
                
                x     = _.x;
                coeff = _.coeff;
                mul   = _.mul;
                add   = _.add;
                
                saved = _.saved;
                j     = _.index; jmax = saved.length;
                for (i = 0, imax = cell.length; i < imax; ++i, ++j) {
                    if (jmax === 0) {
                        cell[i] = func(x) * mul + add;
                    } else {
                        if (j >= jmax) {
                            tmp = func(x, freq[i] * coeff);
                            if (jmax !== 0) {
                                for (k = tmp.length; k--; ) {
                                    saved[k] = tmp[k] || 0;
                                }
                            }
                            j = 0;
                        }
                        cell[i] = saved[j] * mul + add;
                    }
                    x += freq[i] * coeff;
                    while (x >= 1.0) x -= 1.0;
                }
                _.index = j;
                _.x = x;
            }
            return cell;
        };
        
        return FuncOscillator;
    }());
    timbre.fn.register("func", FuncOscillator);
    
    
    var WhiteNoise = (function() {
        var WhiteNoise = function() {
            initialize.apply(this, arguments);
        }, $this = WhiteNoise.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        var initialize = function(_args) {
            
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("noise"), deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell;
            var mul, add, x, i;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                mul = _.mul;
                add = _.add;
                if (_.ar) {
                    for (i = cell.length; i--; ) {
                        cell[i] = (Math.random() * 2.0 - 1.0) * mul + add;
                    }
                } else {
                    x = (Math.random() * 2.0 - 1.0) * mul + add;
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
            return cell;
        };
        
        return WhiteNoise;
    }());
    timbre.fn.register("noise", WhiteNoise);
    
    
    var PhaseOscillator = (function() {
        var PhaseOscillator = function() {
            initialize.apply(this, arguments);
        }, $this = PhaseOscillator.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        var Oscillator = timbre.fn.getClass("osc");
        
        timbre.fn.copyPropertyDescriptors($this,
                                          Oscillator.prototype,
                                          ["wave"]);
        
        Object.defineProperty($this, "phase", {
            set: function(value) {
                this._.phase = timbre(value);
            },
            get: function() { return this._.phase; }
        });
        Object.defineProperty($this, "fb", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.fb = value;
                }
            },
            get: function() { return this._.fb; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            i = 0;
            
            _.wave = new Float32Array(1024);
            if (typeof _args[i] === "function") {
                this.wave = _args[i++];
            } else if (typeof _args[i] === "object" && _args[i] instanceof Float32Array) {
                this.wave = _args[i++];
            } else if (typeof _args[i] === "string" && Oscillator.Wavetables[_args[i]]) {
                this.wave = _args[i++];
            } else {
                this.wave = "sin";
            }
            if (typeof _args[i] !== "undefined") {
                this.phase = _args[i++];
            } else {
                this.phase = 0;
            }
            if (typeof _args[i] === "number") {
                _.mul = _args[i++];    
            }
            if (typeof _args[i] === "number") {
                _.add = _args[i++];    
            }
            _.prevx = 0;
            _.fb    = 0;
        };
    
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = T("oscx", _.wave);
            if (deep) {
                newone._.phase = _.phase.clone(true);
            } else {
                newone._.phase = _.phase;
            }
            newone._.fb = _.fb;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            this._.phase.bang();
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell;
            var phase, mul, add, wave;
            var x, prevx, fb;
            var index, delta, x0, x1, xx;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                phase = _.phase.seq(seq_id);
                fb    = _.fb;
                mul   = _.mul;
                add   = _.add;
                wave  = _.wave;
                prevx = _.prevx;
                
                if (_.ar && _.phase.isAr) {
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        x = (phase[i] + prevx) * 1024;
                        index = x|0;
                        delta = x - index;
                        x0 = wave[(index  ) & 1023];
                        x1 = wave[(index+1) & 1023];
                        xx = (1.0 - delta) * x0 + delta * x1;
                        prevx = xx * fb;
                        cell[i] = xx * mul + add;
                    }
                    _.prevx = prevx;
                } else {
                    x = phase[0] * 1024;
                    index = x|0;
                    delta = x - index;
                    x0 = wave[(index  ) & 1023];
                    x1 = wave[(index+1) & 1023];
                    xx = (1.0 - delta) * x0 + delta * x1;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = xx * mul + add;
                    }
                }
            }
            
            return cell;
        };
    
        $this.getWavetable = Oscillator.getWavetable;
        $this.setWavetable = Oscillator.setWavetable;
        
        return PhaseOscillator;
    }());
    timbre.fn.register("oscx", PhaseOscillator);
    
    timbre.fn.register("sinx", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["sin"].concat(_args));
    });
    timbre.fn.register("cosx", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["cos"].concat(_args));
    });
    timbre.fn.register("pulsex", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["pulse"].concat(_args));
    });
    timbre.fn.register("trix", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["tri"].concat(_args));
    });
    timbre.fn.register("sawx", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["saw"].concat(_args));
    });
    timbre.fn.register("famix", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["fami"].concat(_args));
    });
    timbre.fn.register("konamix", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["konamix"].concat(_args));
    });
    timbre.fn.register("+sinx", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["+sin"].concat(_args));
    });
    timbre.fn.register("+cosx", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["+cos"].concat(_args));
    });
    timbre.fn.register("+trix", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["+tri"].concat(_args));
    });
    timbre.fn.register("+sawx", PhaseOscillator, function(_args) {
        return new PhaseOscillator(["+saw"].concat(_args));
    });
    
    
    var Phasor = (function() {
        var Phasor = function() {
            initialize.apply(this, arguments);
        }, $this = Phasor.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        Object.defineProperty($this, "freq", {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() { return this._.freq; }
        });
        Object.defineProperty($this, "fmul", {
            set: function(value) {
                if (typeof value === "number" && value >= 0) {
                    this._.fmul = value;
                }
            },
            get: function() { return this._.fmul; }
        });
        Object.defineProperty($this, "phase", {
            set: function(value) {
                if (typeof value === "number") {
                    while (value >= 1.0) value -= 1.0;
                    while (value <  0.0) value += 1.0;
                    this._.phase = this._.x = value;
                }
            },
            get: function() { return this._.phase; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            i = 0;
            
            if (typeof _args[i] !== "undefined") {
                this.freq = _args[i++];
            } else {
                this.freq = 440;
            }
            _.fmul  = typeof _args[i] === "number" ? _args[i++] : 1;
            _.phase = typeof _args[i] === "number" ? _args[i++] : 0;
            if (_.fmul < 0) _.fmul = 0;
            
            this.phase = _.phase;
            _.x     = _.phase;
            _.coeff = 1 / timbre.samplerate;
        };
    
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = T("phasor");
            if (deep) {
                newone._.freq = _.freq.clone(true);
            } else {
                newone._.freq = _.freq;
            }
            newone._.fmul  = _.fmul;
            newone._.phase = _.phase;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            this._.x = this._.phase;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell;
            var freq, mul, add;
            var x, dx, coeff, xx;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                freq  = _.freq.seq(seq_id);
                mul   = _.mul;
                add   = _.add;
                x     = _.x;
                coeff = _.coeff * _.fmul;
                
                if (_.ar) {
                    if (_.freq.isAr) {
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = x * mul + add;
                            x += freq[i] * coeff;
                            while (x > 1.0) x -= 1.0;
                        }
                    } else {
                        dx = freq[0] * coeff;
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = x * mul + add;
                            x += dx;
                            while (x > 1.0) x -= 1.0;
                        }
                    }
                } else {
                    xx = _.x * _.mul + add;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = xx;
                    }
                    x += freq[0] * coeff * imax;
                    while (x > 1.0) x -= 1.0;
                }
                _.x = x;
            }
            return cell;
        };
        
        return Phasor;
    }());
    timbre.fn.register("phasor", Phasor);
    
    
    var ADSREnvelope = (function() {
        var ADSREnvelope = function() {
            initialize.apply(this, arguments);
        }, $this = ADSREnvelope.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
        
        var STATUSES = ["off","delay","a","d","s","r"];
        
        Object.defineProperty($this, "status", {
            get: function() { return STATUSES[this._.status+1]; }
        });
        Object.defineProperty($this, "delay", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.delay = value;
                }
            },
            get: function() { return this._.delay; }
        });
        Object.defineProperty($this, "a", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.a = value;
                }
            },
            get: function() { return this._.a; }
        });
        Object.defineProperty($this, "d", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.d = value;
                }
            },
            get: function() { return this._.d; }
        });
        Object.defineProperty($this, "s", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.s = value;
                }
            },
            get: function() { return this._.s; }
        });
        Object.defineProperty($this, "r", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.r = value;
                }
            },
            get: function() { return this._.r; }
        });
        Object.defineProperty($this, "al", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.al = value;
                }
            },
            get: function() { return this._.al; }
        });
        Object.defineProperty($this, "dl", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.dl = value;
                }
            },
            get: function() { return this._.dl; }
        });
        Object.defineProperty($this, "sl", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.sl = value;
                }
            },
            get: function() { return this._.sl; }
        });
        Object.defineProperty($this, "rl", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.rl = value;
                }
            },
            get: function() { return this._.rl; }
        });
        Object.defineProperty($this, "reversed", {
            set: function(value) {
                if (typeof value === "boolean") {
                    this._.reversed = value;
                }
            },
            get: function() { return this._.reversed; }
        });
        Object.defineProperty($this, "currentTime", {
            get: function() { return this._.currentTime; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            _ = this._ = {};
            
            i = 0;
            _.a  = (typeof _args[i] === "number") ? _args[i++] : 0;
            _.d  = (typeof _args[i] === "number") ? _args[i++] : 0;
            _.sl = (typeof _args[i] === "number") ? _args[i++] : 0;                
            _.r  = (typeof _args[i] === "number") ? _args[i++] : 0;
            
            _.delay = 0;
            _.al = 0;
            _.dl = 1;
            _.rl = 0;
            _.s  = Infinity;
            _.reversed = false;
            
            _.status = -1;
            _.samples = Infinity;
            _.x0 = 0; _.x1 = 0; _.dx = 0;
            _.currentTime = 0;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            var args, i, imax;
            newone = timbre("adsr", _.a, _.d, _.sl, _.r);
            newone._.delay = _.delay;
            newone._.s = _.s;
            newone._.reversed = _.reversed;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function(mode) {
            var _ = this._;
            
            // off -> delay
            _.status  = 0;
            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
            _.x0 = 0; _.x1 = 1;
            _.dx = (timbre.cellsize * _.al) / _.samples;
            _.currentTime = 0;
            
            timbre.fn.doEvent(this, "bang");
            return this;
        };
    
        $this.keyoff = function() {
            var _ = this._;
            
            if (_.status <= 3) {
                // (delay, A, D, S) -> R
                _.status  = 4;
                _.samples = (timbre.samplerate * (_.r / 1000))|0;
                _.x1 = _.x0; _.x0 = 1;
                _.dx = -timbre.cellsize * (1 - _.rl) / _.samples;
                timbre.fn.doEvent(this, "R");
            }
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, x, i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                while (_.samples <= 0) {
                    if (_.status === 0) { // delay -> A
                        _.status = 1;
                        _.samples += (timbre.samplerate * (_.a / 1000))|0;
                        _.x0 = _.al;
                        _.dx = (timbre.cellsize * (_.dl -_.al)) / _.samples;
                        timbre.fn.doEvent(this, "A");
                        continue;
                    }
                    if (_.status === 1) { // A -> D
                        _.status = 2;
                        _.samples += (timbre.samplerate * (_.d / 1000))|0;
                        _.x0 = _.dl;
                        _.dx = -timbre.cellsize * (_.dl - _.sl) / _.samples;
                        timbre.fn.doEvent(this, "D");
                        continue;
                    }
                    if (_.status === 2) { // D -> S
                        if (_.sl === 0) {
                            _.status = 4;
                            continue;
                        }
                        _.status = 3;
                        _.x0 = _.sl;
                        if (_.s === Infinity) {
                            _.samples = Infinity;
                            _.dx = 0;
                        } else {
                            _.samples += (timbre.samplerate * (_.s / 1000))|0;
                            _.dx = -timbre.cellsize * (_.sl - _.rl) / _.samples;
                        }
                        timbre.fn.doEvent(this, "S");
                        continue;
                    }
                    if (_.status <= 4) { // (S, R) -> end
                        _.status  = -1;
                        _.samples = Infinity;
                        _.x0 = _.x1 = _.dx = 0;
                        timbre.fn.doEvent(this, "ended");
                        continue;
                    }
                }
                
                if (_.reversed) {
                    x = (1.0 - (_.x0 * _.x1)) * _.mul + _.add;
                } else {
                    x = (_.x0 * _.x1) * _.mul + _.add;
                }
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x;
                }
                _.x0 += _.dx;
                _.samples -= imax;
                _.currentTime += imax * 1000 / timbre.samplerate;
            }
            return cell;
        };
        
        return ADSREnvelope;
    }());
    timbre.fn.register("adsr", ADSREnvelope);
    
    
    var PercussiveEnvelope = (function() {
        var PercussiveEnvelope = function() {
            initialize.apply(this, arguments);
        }, $this = PercussiveEnvelope.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
    
        var STATUSES = ["off","delay","a","r"];
        
        Object.defineProperty($this, "status", {
            get: function() { return STATUSES[this._.status+1]; }
        });
        
        Object.defineProperty($this, "delay", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.delay = value;
                }
            },
            get: function() { return this._.delay; }
        });
        Object.defineProperty($this, "a", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.a = value;
                }
            },
            get: function() { return this._.a; }
        });
        Object.defineProperty($this, "r", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.r = value;
                }
            },
            get: function() { return this._.r; }
        });
        Object.defineProperty($this, "al", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.al = value;
                }
            },
            get: function() { return this._.al; }
        });
        Object.defineProperty($this, "reversed", {
            set: function(value) {
                if (typeof value === "boolean") {
                    this._.reversed = value;
                }
            },
            get: function() { return this._.reversed; }
        });
        Object.defineProperty($this, "currentTime", {
            get: function() { return this._.currentTime; }
        });
        
        var initialize = function(_args) {
            var i, _;
    
            this._ = _ = {};
            
            i = 0;
            _.r = (typeof _args[i] === "number") ? _args[i++] : 0;
            
            if (typeof _args[i] === "function") {
                this.onended = _args[i++];
            }
            
            _.delay = 0;
            _.a  = 0;
            _.al = 0;
            _.reversed = false;
            
            _.status  = -1;        
            _.samples = Infinity;
            _.x0 = 0; _.dx = 0;
            _.currentTime = 0;
        };
        
        $this.clone = function(deep) {
            var _ = this._;
            var newone = timbre("perc", _.r);
            newone._.delay = _.delay;
            newone._.a     = _.a;
            newone._.al    = _.al;
            newone._.reversed = _.reversed;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            var _ = this._;
    
            // off -> delay
            _.status  = 0;
            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
            _.x0 = 0;
            _.dx = -(timbre.cellsize * _.al) / _.samples;
            _.currentTime = 0;
            
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, x, i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                while (_.samples <= 0) {
                    if (_.status === 0) { // delay -> A
                        _.status = 1;
                        _.samples += (timbre.samplerate * (_.a / 1000))|0;
                        _.x0 = _.al;
                        _.dx = -(timbre.cellsize * (1 -_.al)) / _.samples;
                        timbre.fn.doEvent(this, "A");
                        continue;
                    }
                    if (_.status === 1) {
                        // A -> R
                        _.status  = 2;
                        _.samples = (timbre.samplerate * (_.r / 1000))|0;
                        _.x0 = 1;
                        _.dx = timbre.cellsize / _.samples;
                        timbre.fn.doEvent(this, "R");
                        continue;
                    }
                    if (_.status === 2) {
                        // R -> end
                        _.status  = -1;
                        _.samples = Infinity;
                        _.x0 = _.dx = 0;
                        timbre.fn.doEvent(this, "ended");
                        continue;
                    }
                }
                
                if (_.reversed) {
                    x = (1.0 - _.x0) * _.mul + _.add;
                } else {
                    x = _.x0 * _.mul + _.add;
                }
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x;
                }
                _.x0 -= _.dx;
                _.samples -= imax;
                _.currentTime += imax * 1000 / timbre.samplerate;;
            }
            return cell;
        };
        
        return PercussiveEnvelope;
    }());
    timbre.fn.register("perc", PercussiveEnvelope);
    
    
    var Filter = (function() {
        var Filter = function() {
            initialize.apply(this, arguments);
        }, $this = Filter.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "type", {
            set: function(value) {
                var f;
                if (typeof value === "string") {
                    if ((f = Filter.Types[value]) !== undefined) {
                        this._.type = value;
                        this._.set_params = f.set_params;
                    }
                }
            },
            get: function() { return this._.type; }
        });
        Object.defineProperty($this, "freq", {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() { return this._.freq; }
        });
        Object.defineProperty($this, "band", {
            set: function(value) {
                this._.band = timbre(value);
            },
            get: function() { return this._.band; }
        });
        Object.defineProperty($this, "gain", {
            set: function(value) {
                this._.gain = timbre(value);
            },
            get: function() { return this._.gain; }
        });
        
        var initialize = function(_args) {
            var type, i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "string" &&
                (Filter.Types[_args[i]]) !== undefined) {
                this.type = _args[i++];
            } else {
                this.type = "lpf";
            }
            type = this._.type;
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.freq = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.freq = timbre(_args[i++]);
            } else {
                _.freq = timbre(Filter.Types[type].default_freq);
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.band = _args[i++];
            } else if (typeof _args[i] === "number") {
                _.band = timbre(_args[i++]);
            } else {
                _.band = timbre(Filter.Types[type].default_band);
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.gain = _args[i++];
            } else if (typeof _args[i] === "number") {
                _.gain = timbre(_args[i++]);
            } else {
                _.gain = timbre(Filter.Types[type].default_gain || 6);
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            _.prev_type = undefined;
            _.prev_freq = undefined;
            _.prev_band = undefined;
            _.prev_gain = undefined;
            
            _.in1 = _.in2 = _.out1 = _.out2 = 0;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            var args, i, imax;
            newone = timbre("filter", _.type);
            if (deep) {
                newone.freq = _.freq.clone(deep);
                newone.band = _.band.clone(deep);
                newone.gain = _.gain.clone(deep);
            } else {
                newone.freq = _.freq;
                newone.band = _.band;
                newone.gain = _.gain;
            }
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, mul, add;
            var type, freq, band, gain;
            var tmp, i, imax, j, jmax;
            
            var a1, a2, b0, b1, b2;
            var in1, in2, out1, out2;
            var input, output;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                mul = _.mul;
                add = _.add;
                
                // filter
                if (_.ison) {
                    type = _.type;
                    if (_.freq.seq_id === seq_id) {
                        freq = _.freq.cell[0];
                    } else {
                        freq = _.freq.seq(seq_id)[0];
                    }
                    if (_.band.seq_id === seq_id) {
                        band = _.band.cell[0];
                    } else {
                        band = _.band.seq(seq_id)[0];
                    }
                    if (_.gain.seq_id === seq_id) {
                        gain = _.gain.cell[0];
                    } else {
                        gain = _.gain.seq(seq_id)[0];
                    }
                    if (type !== _.prev_type ||
                        freq !== _.prev_freq ||
                        band !== _.prev_band ||
                        gain !== _.prev_gain) {
                        _.set_params.call(this, freq, band, gain);
                        _.prev_type = type;
                        _.prev_freq = freq;
                        _.prev_band = band;
                        _.prev_gain = gain;
                    }
                    a1 = _.a1; a2 = _.a2;
                    b0 = _.b0; b1 = _.b1; b2 = _.b2;
                    in1  = _.in1;  in2  = _.in2;
                    out1 = _.out1; out2 = _.out2;
                    
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        input = cell[i];
                        output = b0 * input + b1 * in1 + b2 * in2 - a1 * out1 - a2 * out2;
                        
                        if (output > 1.0) {
                            output = 1.0;
                        } else if (output < -1.0) {
                            output = -1.0;
                        }
                        
                        in2  = in1;
                        in1  = input;
                        out2 = out1;
                        out1 = output;
                        
                        cell[i] = output;
                    }
                    _.in1  = in1;  _.in2  = in2;
                    _.out1 = out1; _.out2 = out2;
                }
                
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            }
            
            return cell;
        };
    
        $this.getFilter = function(name) {
            return Filter.Types[name];
        };
        
        $this.setFilter = function(name, params) {
            if (typeof params === "object") {
                if (typeof params.set_params === "function") {
                    if (typeof params.default_freq !== "number") {
                        params.default_freq = 2000;
                    }
                    if (typeof params.default_band !== "number") {
                        params.default_freq = 1;
                    }
                    if (typeof params.default_gain !== "number") {
                        params.default_freq = 6;
                    }
                    Filter.Types[name] = params;
                }
            }
        };
        
        return Filter;
    }());
    
    Filter.Types = {};
    Filter.Types.lpf = {
        default_freq: 800, default_band: 1,
        set_params: function(freq, band) {
            var _ = this._;
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            if (alp === Infinity) alp = 0;
            ia0 = 1 / (1 + alp);
            _.a1 = -2 * cos  * ia0;
            _.a2 = (1 - alp) * ia0;
            // _.b0
            _.b1 = (1 - cos) * ia0;
            _.b2 = _.b0 = _.b1 * 0.5;
        }
    };
    Filter.Types.hpf = {
        default_freq: 5500, default_band: 1,
        set_params: function(freq, band) {
            var _ = this._;
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            if (alp === Infinity) alp = 0;
            ia0 = 1 / (1 + alp);
            _.a1 = -2 * cos  * ia0;
            _.a2 = +(1 - alp) * ia0;
            // this.b0
            _.b1 = -(1 + cos) * ia0;
            _.b2 = _.b0 = - _.b1 * 0.5;
        }
    };
    Filter.Types.bpf = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band) {
            var _ = this._;
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            if (alp === Infinity) alp = 0;
            ia0 = 1 / (1 + alp);
            _.a1 = -2 * cos  * ia0;
            _.a2 = (1 - alp) * ia0;
            _.b0 = alp * ia0;        
            _.b1 = 0;
            _.b2 = -_.b0;
        }
    };
    Filter.Types.brf = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band) {
            var _ = this._;
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            if (alp === Infinity) alp = 0;
            ia0 = 1 / (1 + alp);
            _.a1 = -2 * cos * ia0;
            _.a2 = +(1 - alp) * ia0;
            _.b0 = 1;
            _.b1 = -(1 + cos) * ia0;
            _.b2 = 1;
        }
    };
    Filter.Types.allpass = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band) {
            var _ = this._;
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            if (alp === Infinity) alp = 0;
            ia0 = 1 / (1 + alp);
            _.a1 = -2 * cos * ia0;
            _.a2 = +(1 - alp) * ia0;
            _.b0 = _.a2;
            _.b1 = _.a1;
            _.b2 = 1;
        }
    };
    Filter.Types.peaking = {
        default_freq: 3000, default_band: 1, default_gain: 6,
        set_params: function(freq, band, gain) {
            var _ = this._;
            var A, omg, cos, sin, alp, alpA, alpiA, n, ia0;
            A = Math.pow(10, gain * 0.025);
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            if (alp === Infinity) alp = 0;
            alpA  = alp * A;
            alpiA = alp / A;
            ia0 = 1 / (1 + alpiA);
            _.a1 = -2 * cos * ia0;
            _.a2 = +(1 - alpiA) * ia0;
            _.b0 = +(1 + alpA ) * ia0;
            _.b1 = _.a1;
            _.b2 = +(1 - alpA ) * ia0;
        }
    };
    Filter.Types.lowboost = {
        default_freq: 3000, default_band: 1, default_gain: 6,
        set_params: function(freq, band, gain) {
            var _ = this._;
            var A, omg, cos, sin, alp, alpsA2, ia0;
            A = Math.pow(10, gain * 0.025);
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
            alpsA2 = alp * Math.sqrt(A) * 2;
            ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
            _.a1 = -2 * ((A - 1) + (A + 1) * cos         ) * ia0;
            _.a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
            _.b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
            _.b1 =  2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
            _.b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
        }
    };
    Filter.Types.highboost = {
        default_freq: 5500, default_band: 1, default_gain: 6,
        set_params: function(freq, band, gain) {
            var _ = this._;
            var A, omg, cos, sin, alp, alpsA2, ia0;
            A = Math.pow(10, gain * 0.025);
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
            alpsA2 = alp * Math.sqrt(A) * 2;
            ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
            _.a1 =  2 * ((A - 1) + (A + 1) * cos         ) * ia0;
            _.a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
            _.b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
            _.b1 = -2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
            _.b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
        }
    };
    timbre.fn.register("filter", Filter);
    timbre.fn.register("lpf", Filter, function(_args) {
        return new Filter(["lpf"].concat(_args));
    });
    timbre.fn.register("hpf", Filter, function(_args) {
        return new Filter(["hpf"].concat(_args));
    });
    timbre.fn.register("bpf", Filter, function(_args) {
        return new Filter(["bpf"].concat(_args));
    });
    timbre.fn.register("brf", Filter, function(_args) {
        return new Filter(["brf"].concat(_args));
    });
    timbre.fn.register("allpass", Filter, function(_args) {
        return new Filter(["allpass"].concat(_args));
    });
    timbre.fn.register("peaking", Filter, function(_args) {
        return new Filter(["peaking"].concat(_args));
    });
    timbre.fn.register("lowboost", Filter, function(_args) {
        return new Filter(["lowboost"].concat(_args));
    });
    timbre.fn.register("highboost", Filter, function(_args) {
        return new Filter(["highboost"].concat(_args));
    });
    
    
    var ResonantFilter = (function() {
        var ResonantFilter = function() {
            initialize.apply(this, arguments);
        }, $this = ResonantFilter.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        ResonantFilter.Types = { lpf:0, hpf:1, bpf:2, brf:3 };
        
        Object.defineProperty($this, "type", {
            set: function(value) {
                var mode;
                if (typeof value === "string") {
                    if ((mode = ResonantFilter.Types[value]) !== undefined) {
                        this._.type = value;
                        this._.mode = mode;
                    }
                }
            },
            get: function() { return this._.type; }
        });
        
        Object.defineProperty($this, "cutoff", {
            set: function(value) {
                this._.cutoff = timbre(value);
            },
            get: function() { return this._.cutoff; }
        });
        Object.defineProperty($this, "Q", {
            set: function(value) {
                this._.Q = timbre(value);
            },
            get: function() { return this._.Q; }
        });
        Object.defineProperty($this, "depth", {
            set: function(value) {
                this._.depth = timbre(value);
            },
            get: function() { return this._.depth; }
        });
        
        var initialize = function(_args) {
            var type, i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "string" &&
                (ResonantFilter.Types[_args[i]]) !== undefined) {
                this.type = _args[i++];
            } else {
                this.type = "lpf";
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.cutoff = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.cutoff = timbre(_args[i++]);
            } else {
                _.cutoff = timbre(800);
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.Q = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.Q = timbre(_args[i++]);
            } else {
                _.Q = timbre(0.5);
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.depth = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.depth = timbre(_args[i++]);
            } else {
                _.depth = timbre(0.5);
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            _.prev_cutoff = undefined;
            _.prev_Q      = undefined;
            _.prev_depth  = undefined;
            
            _.f = new Float32Array(4);
            _.mode = 0;
            _.damp = 0;
            _.freq = 0;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            var args, i, imax;
            newone = timbre("rfilter", _.type);
            if (deep) {
                newone.cutoff = _.cutoff.clone(deep);
                newone.Q      = _.Q     .clone(deep);
                newone.depth  = _.depth .clone(deep);
            } else {
                newone.cutoff = _.cutoff;
                newone.Q      = _.Q;
                newone.depth  = _.depth;
            }
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        var set_params = function(cutoff, Q) {
            var _ = this._;
            var freq = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (timbre.samplerate * 2)));
            _.damp = Math.min(2 * (1 - Math.pow(Q, 0.25)),
                              Math.min(2, 2 / freq - freq * 0.5));
            _.freq = freq;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, mul, add;
            var cutoff, Q;
            var tmp, i, imax, j, jmax;
            var f, mode, damp, freq, depth, depth0, depth1;
            var input, output;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                args = this.args.slice(0);
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp = args[i].cell;
                    } else {
                        tmp = args[i].seq(seq_id);
                    }
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
    
                mul = _.mul;
                add = _.add;
                
                // filter
                if (_.ison) {
                    mode   = _.mode;
                    if (_.cutoff.seq_id === seq_id) {
                        cutoff = _.cutoff.cell[0];
                    } else {
                        cutoff = _.cutoff.seq(seq_id)[0];
                    }
                    if (_.Q.seq_id === seq_id) {
                        Q = _.Q.cell[0];
                    } else {
                        Q = _.Q.seq(seq_id)[0];
                    }
                    if (cutoff !== _.prev_cutoff || Q !== _.prev_Q ) {
                        set_params.call(this, cutoff, Q);
                        _.prev_cutoff = cutoff;
                        _.prev_Q      = Q;
                    }
                    depth = _.depth.seq(seq_id)[0];
                    if (depth !== _.prev_depth) {
                        _.depth0 = Math.cos(0.5 * Math.PI * depth);
                        _.depth1 = Math.sin(0.5 * Math.PI * depth);
                    }
                    f   = _.f;
                    damp = _.damp;
                    freq = _.freq;
                    depth0 = _.depth0;
                    depth1 = _.depth1;
                    
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        input = cell[i];
                        
                        f[3] = input - damp * f[2];
                        f[0] = f[0] + freq * f[2];
                        f[1] = f[3] - f[0];
                        f[2] = freq * f[1] + f[2];
                        output = 0.5 * f[mode];
    
                        // second pass
                        f[3] = input - damp * f[2];
                        f[0] = f[0] + freq * f[2];
                        f[1] = f[3] - f[0];
                        f[2] = freq * f[1] + f[2];
                        output += 0.5 * f[mode];
                        
                        output = (input * depth0) + (output * depth1);
                        
                        cell[i] = output;
                    }
                    
                    for (i = imax; i--; ) {
                        cell[i] = cell[i] * mul + add;
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
                this.seq_id = seq_id;
            }
            
            return cell;
        };
        
        return ResonantFilter;
    }());
    timbre.fn.register("rfilter", ResonantFilter);
    timbre.fn.register("rlpf", ResonantFilter, function(_args) {
        return new ResonantFilter(["lpf"].concat(_args));
    });
    timbre.fn.register("rhpf", ResonantFilter, function(_args) {
        return new ResonantFilter(["hpf"].concat(_args));
    });
    timbre.fn.register("rbpf", ResonantFilter, function(_args) {
        return new ResonantFilter(["bpf"].concat(_args));
    });
    timbre.fn.register("rbrf", ResonantFilter, function(_args) {
        return new ResonantFilter(["brf"].concat(_args));
    });
    
    
    var EfxDelay = (function() {
        var EfxDelay = function() {
            initialize.apply(this, arguments);
        }, $this = EfxDelay.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "time", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.delayTime = value;
                }
            },
            get: function() { return this._.delayTime; }
        });
        Object.defineProperty($this, "fb", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.feedback = value;
                }
            },
            get: function() { return this._.feedback; }
                            
        });
        Object.defineProperty($this, "wet", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.wet = value;
                }
            },
            get: function() { return this._.wet; }
        });
        
        var initialize = function(_args) {
            var bits, i, _;
            
            this._ = _ = {};
            bits = Math.ceil(Math.log(timbre.samplerate * 1.5) * Math.LOG2E)
            
            _.buffer = new Float32Array(1 << bits);
            _.buffer_mask = (1 << bits) - 1;
            _.pointerWrite = 0;
            _.pointerRead  = 0;
            _.delayTime = 250;
            _.feedback = 0.25;
            _.wet = 0.25;
            
            i = 0;
            if (typeof _args[i] === "number") {
                _.delayTime = _args[i++];
            }    
            if (typeof _args[i] === "number") {
                _.feedback = _args[i++];
            }    
            if (typeof _args[i] === "number") {
                _.wet = _args[i++];
            }
            
            set_params.call(this, _.delayTime, _.feedback, _.wet);
            this.args = timbre.fn.valist.call(this, _args.slice(i));
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("efx.delay", _.delayTime, _.feedback, _.wet);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        var set_params = function(delayTime, feedback, wet) {
            var offset, _ = this._;
            offset = delayTime * timbre.samplerate / 1000;
            
            _.pointerWrite = (_.pointerRead + offset) & _.buffer_mask;
            if (feedback >= 1.0) {
                _.feedback = +0.9990234375;
            } else if (feedback <= -1.0) {
                _.feedback = -0.9990234375;
            } else {
                _.feedback = feedback;
            }
            if (wet < 0) {
                _.wet = 0;
            } else if (wet > 1.0) {
                _.wet = 1.0;
            } else {
                _.wet = wet;
            }
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell;
            var tmp, i, imax, j, jmax;
            var mul, add;
            var x, feedback, wet, dry;
            var buffer, buffer_mask, pointerRead, pointerWrite;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                buffer = _.buffer;
                buffer_mask = _.buffer_mask;
                feedback = _.feedback;
                wet = _.wet;
                dry = 1 - wet;
                pointerRead  = _.pointerRead;
                pointerWrite = _.pointerWrite;
                mul = _.mul;
                add = _.add;
                
                if (_.ison) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        x = buffer[pointerRead];
                        buffer[pointerWrite] = cell[i] - x * feedback;
                        cell[i] *= dry;
                        cell[i] += x * wet;
                        cell[i] = cell[i] * mul + add;
                        pointerWrite = (pointerWrite + 1) & buffer_mask;
                        pointerRead  = (pointerRead  + 1) & buffer_mask;
                    }
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        x = buffer[pointerRead];
                        buffer[pointerWrite] = cell[i] - x * feedback;
                        pointerWrite = (pointerWrite + 1) & buffer_mask;
                        pointerRead  = (pointerRead  + 1) & buffer_mask;
                        cell[i] = cell[i] * mul + add;
                    }
                }
                _.pointerRead  = pointerRead;
                _.pointerWrite = pointerWrite;
            }
            return cell;
        };
        
    
        return EfxDelay;
    }());
    timbre.fn.register("efx.delay", EfxDelay);
    
    
    var EfxDistortion = (function() {
        var EfxDistortion = function() {
            initialize.apply(this, arguments);
        }, $this = EfxDistortion.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "pre", {
            set: function(value) {
                this._.preGain = timbre(value);
            },
            get: function() { return this._.preGain; }
                            
        });
        Object.defineProperty($this, "post", {
            set: function(value) {
                this._.postGain = timbre(value);
            },
            get: function() { return this._.postGain; }
                            
        });
        Object.defineProperty($this, "freq", {
            set: function(value) {
                this._.lpfFreq = timbre(value);
            },
            get: function() { return this._.lpfFreq; }
                            
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.preGain = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.preGain = timbre(_args[i++]);
            } else {
                _.preGain = timbre(-60);
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.postGain = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.postGain = timbre(_args[i++]);
            } else {
                _.postGain = timbre(18);
            }
            
            if (typeof _args[i] === "object" && _args[i].isKr) {
                _.lpfFreq = _args[i++];    
            } else if (typeof _args[i] === "number") {
                _.lpfFreq = timbre(_args[i++]);
            } else {
                _.lpfFreq = timbre(2400);
            }
            
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            _.prev_preGain  = undefined;
            _.prev_postGain = undefined;
            _.prev_lpfFreq  = undefined;
            _.in1 = _.in2 = _.out1 = _.out2 = 0;
            _.a1  = _.a2  = 0;
            _.b0  = _.b1  = _.b2 = 0;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("efx.dist", _.preGain, _.postGain, _.lpfFreq);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        var THRESHOLD = 0.0000152587890625;
        
        var set_params = function(preGain, postGain, lpfFreq, lpfSlope) {
            var _ = this._;
            var postScale, omg, cos, sin, alp, n, ia0;
            
            postScale = Math.pow(2, -postGain / 6);
            _.preScale = Math.pow(2, -preGain / 6) * postScale;
            _.limit = postScale;
            
            if (lpfFreq) {
                omg = lpfFreq * 2 * Math.PI / timbre.samplerate;
                cos = Math.cos(omg);
                sin = Math.sin(omg);
                n = 0.34657359027997264 * lpfSlope * omg / sin;
                alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
                ia0 = 1 / (1 + alp);
                _.a1 = -2 * cos  * ia0;
                _.a2 = (1 - alp) * ia0;
                _.b1 = (1 - cos) * ia0;
                _.b2 = _.b0 = _.b1 * 0.5;
            }
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, args;
            var tmp, i, imax, j, jmax;
            var preGain, postGain, lpfFreq;
            var preScale, limit;
            var mul, add;
            var a1, a2, b0, b1, b2;
            var in1, in2, out1, out2;
            var input, output;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                mul = _.mul;
                add = _.add;
                
                // filter
                if (_.ison) {
                    preGain  = _.preGain.seq(seq_id)[0];
                    postGain = _.postGain.seq(seq_id)[0];
                    lpfFreq  = _.lpfFreq.seq(seq_id)[0];
                    if (preGain  !== _.prev_preGain ||
                        postGain !== _.prev_postGain ||
                        lpfFreq  !== _.prev_lpfFreq) {
                        set_params.call(this, preGain, postGain, lpfFreq, 1);
                    }
                    
                    preScale = _.preScale;
                    limit    = _.limit;
                    
                    if (_.lpfFreq) {
                        a1 = _.a1; a2 = _.a2;
                        b0 = _.b0; b1 = _.b1; b2 = _.b2;
                        in1  = _.in1;  in2  = _.in2;
                        out1 = _.out1; out2 = _.out2;
                        
                        if (out1 < THRESHOLD) out2 = out1 = 0;
                        
                        for (i = 0, imax = cell.length; i < imax; ++i) {
                            input = cell[i] * preScale;
                            if (input > limit) {
                                input = limit;
                            } else if (input < -limit) {
                                input = -limit;
                            }
                            
                            output = b0 * input + b1 * in1 + b2 * in2 - a1 * out1 - a2 * out2;
                            
                            if (output > 1.0) {
                                output = 1.0;
                            } else if (output < -1.0) {
                                output = -1.0;
                            }
                            
                            in2  = in1;
                            in1  = input;
                            out2 = out1;
                            out1 = output;
                            
                            cell[i] = output * mul + add;
                        }
                        _.in1  = in1;  _.in2  = in2;
                        _.out1 = out1; _.out2 = out2;
                    } else {
                        for (i = 0, imax = cell.length; i < imax; ++i) {
                            input = cell[i] * preScale;
                            if (input > limit) {
                                input = limit;
                            } else if (input < -limit) {
                                input = -limit;
                            }
                            cell[i] = input * mul + add;
                        }
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            }
            return cell;
        };
        
        return EfxDistortion;
    }());
    timbre.fn.register("efx.dist", EfxDistortion);
    
    
    var EfxChorus = (function() {
        var EfxChorus = function() {
            initialize.apply(this, arguments);
        }, $this = EfxChorus.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "depth", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.depth = value;
                    _.lfo.mul = _.depth * _.offset;
                }
            },
            get: function() { return this._.depth; }
        });
        Object.defineProperty($this, "rate", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.rate = value;
                    _.lfo.freq.value = value;
                }
            },
            get: function() { return this._.rate; }
        });
        Object.defineProperty($this, "wet", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (0 <= value && value <= 1.0) {
                        _.wet = value;
                        _.wet0 = Math.sin(0.25 * Math.PI * value);
                        _.dry0 = Math.cos(0.25 * Math.PI * value);
                    }
                }
            },
            get: function() { return this._.wet; }
        });
        
        var initialize = function(_args) {
            var bits, i, _;
            
            this._ = _ = {};
            bits = Math.ceil(Math.log(timbre.samplerate * 0.02) * Math.LOG2E);
            
            _.buffer = new Float32Array(1 << bits);
            _.buffer_mask = (1 << bits) - 1;
            
            i = 0;
            _.delay = 10;
            _.depth = (typeof _args[i] === "number") ? _args[i] : 0.8;
            _.rate  = (typeof _args[i] === "number") ? _args[i] : 0.5;
            _.wet   = (typeof _args[i] === "number") ? _args[i] : 0.5;
            
            _.wet0 = Math.sin(0.25 * Math.PI * _.wet);
            _.dry0 = Math.cos(0.25 * Math.PI * _.wet);
            
            _.sr   = timbre.samplerate / 1000;
            _.offset = (_.sr * _.delay)|0;
            _.pointerRead  = 0;
            _.pointerWrite = _.offset;
            _.lfo = timbre("sin", _.rate, _.depth * _.offset).kr();
            
            this.args = timbre.fn.valist.call(this, _args.slice(i));
        };
    
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("efx.chorus", _.depth, _.rate, _.wet);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell;
            var tmp, i, imax, j, jmax;
            var buffer, buffer_mask, pointerWrite, pointerRead0, pointerRead1;
            var wet, dry, fb, offset, x0, x1, xx;
            var mul, add;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                buffer = _.buffer;
                buffer_mask  = _.buffer_mask;
                pointerWrite = _.pointerWrite;
                
                for (j = 0; j < jmax; ++j) {
                    buffer[pointerWrite] = 0;
                    pointerWrite = (pointerWrite + 1) & buffer_mask;
                }            
                
                pointerWrite = _.pointerWrite;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = 0; j < jmax; ++j) {
                        buffer[pointerWrite] += tmp[j];
                        pointerWrite = (pointerWrite + 1) & buffer_mask;
                    }
                }
                
                mul = _.mul;
                add = _.add;
                
                if (_.ison) {
                    wet = _.wet0;
                    dry = _.dry0;
                    fb  = _.fb;
                    offset = _.lfo.seq(seq_id)[0]|0;
                    
                    pointerRead0 = _.pointerRead;
                    pointerRead1 = (pointerRead0 + offset + buffer.length) & buffer_mask;
                    pointerWrite = _.pointerWrite;
                    
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        x0 = buffer[pointerRead0];
                        x1 = buffer[pointerRead1];
                        xx = (x0 * dry) + (x1 * wet);
                        cell[i] = xx * mul + add;
                        pointerRead0 = (pointerRead0 + 1) & buffer_mask;
                        pointerRead1 = (pointerRead1 + 1) & buffer_mask;
                        pointerWrite = (pointerWrite + 1) & buffer_mask;
                    }
                } else {
                    pointerRead0 = _.pointerRead;
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = buffer[pointerRead0] * mul + add;
                        pointerRead0 = (pointerRead0 + 1) & buffer_mask;
                    }
                }
                _.pointerRead  = pointerRead0;
                _.pointerWrite = pointerWrite;
            }
            return cell;
        };
        
        return EfxChorus;
    }());
    timbre.fn.register("efx.chorus", EfxChorus);
    
    
    var AudioDecoder = {
        initialize: function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            _.src  = (typeof _args[i] === "string" ) ? _args[i++] : "";
            _.loop = (typeof _args[i] === "boolean") ? _args[i++] : false;
            
            if (typeof _args[i] === "function") {
                if (_.loop) {
                    this.onlooped = _args[i++];
                } else {
                    this.onended  = _args[i++];
                }
            }
            
            _.buffer   = new Float32Array(0);
            _.duration = 0;
            _.phase    = 0;
            _.reversed = false;
            _.isloaded = false;
        },
        setPrototype: function() {
            Object.defineProperty(this, "src", {
                set: function(value) {
                    if (typeof value === "string") {
                        if (this._.src !== value) {
                            this._.src = value;
                            this._.isloaded = false;
                        }
                    }
                },
                get: function() { return this._.src; }
            });
            Object.defineProperty(this, "loop", {
                set: function(value) { this._.loop = !!value; },
                get: function() { return this._.loop; }
            });
            Object.defineProperty(this, "reversed", {
                set: function(value) {
                    var _ = this._;
                    _.reversed = !!value;
                    if (_.reversed && _.phase === 0) {
                        _.phase = Math.max(0, _.buffer.length - 1);
                    }
                },
                get: function() { return this._.reversed; }
            });
            Object.defineProperty(this, "isLoaded", {
                get: function() { return this._.isloaded; }
            });
            Object.defineProperty(this, "duration", {
                get: function() { return this._.duration; }
            });
            Object.defineProperty(this, "currentTime", {
                set: function(value) {
                    var _ = this._;
                    if (typeof value === "number") {
                        if (0 <= value && value <= _.duration) {
                            _.phase = ((value / 1000) * timbre.samplerate)|0;
                        }
                    }
                },
                get: function() { return (this._.phase / timbre.samplerate) * 1000; }
            });
            
            this.clone = function(deep) {
                var klassname, newone, _ = this._;
                klassname = this._.proto._.klassname;
                newone = timbre(klassname, _.src, _.loop);
                newone._.reversed = _.reversed;
                newone._.isloaded = _.isloaded;
                newone._.buffer   = _.buffer;
                newone._.duration = _.duration;
                newone._.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
                return timbre.fn.copyBaseArguments(this, newone, deep);
            };
            
            this.slice = function(begin, end) {
                var klassname, newone, _ = this._, tmp, reversed;
                klassname = this._.proto._.klassname;
                
                reversed = _.reversed;
                if (typeof begin === "number") {
                    begin = (begin / 1000) * timbre.samplerate;
                } else begin = 0;
                if (typeof end   === "number") {
                    end   = (end   / 1000) * timbre.samplerate;
                } else end = _.buffer.length;
                if (begin > end) {
                    tmp   = begin;
                    begin = end;
                    end   = tmp;
                    reversed = !reversed;
                }
                
                newone = timbre(klassname);
                newone._.loop = _.loop;
                newone._.reversed = reversed;
                newone._.buffer   = _.buffer.subarray(begin, end);
                newone._.duration = (end - begin / timbre.samplerate) * 1000;
                newone._.phase = (reversed) ? Math.max(0, newone._.buffer.length - 1) : 0;
                return timbre.fn.copyBaseArguments(this, newone);
            };
            
            this.bang = function() {
                var _ = this._;
                _.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
                timbre.fn.doEvent(this, "bang");
                return this;
            };
            
            this.seq = function(seq_id) {
                var _ = this._;
                var cell, buffer, mul, add;
                var i, imax;
                
                if (!_.ison) return timbre._.none;
                
                cell = this.cell;
                if (seq_id !== this.seq_id) {
                    this.seq_id = seq_id;
                    buffer = _.buffer;
                    mul    = _.mul
                    add    = _.add;
                    if (_.reversed) {
                        for (i = 0, imax = cell.length; i < imax; ++i) {
                            cell[i] = (buffer[_.phase--]||0) * mul + add;
                            if (_.phase < 0) {
                                if (_.loop) {
                                    _.phase = Math.max(0, _.buffer.length - 1);
                                    timbre.fn.doEvent(this, "looped");
                                } else {
                                    timbre.fn.doEvent(this, "ended");
                                }
                            }
                        }
                    } else {
                        for (i = 0, imax = cell.length; i < imax; ++i) {
                            cell[i] = (buffer[_.phase++]||0) * mul + add;
                            if (_.phase >= buffer.length) {
                                if (_.loop) {
                                    _.phase = 0;
                                    timbre.fn.doEvent(this, "looped");
                                } else {
                                    timbre.fn.doEvent(this, "ended");
                                }
                            }
                        }
                    }
                }
                return cell;
            };
            
            return this;
        }
    };
    
    
    /**
     * WebKitAudio: 0.1.0
     * Store audio samples (Web Audio API)
     * [ar-only]
     */
    var WebKitAudio = (function() {
        var WebKitAudio = function() {
            AudioDecoder.initialize.apply(this, arguments);
        }, $this = AudioDecoder.setPrototype.call(WebKitAudio.prototype);
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        $this.load = function() {
            var self = this, _ = this._;
            var ctx, xhr, opts;
            
            ctx  = new webkitAudioContext();
            xhr  = new XMLHttpRequest();
            opts = { buffer:null, samplerate:ctx.sampleRate };
            
            if (_.src !== "") {
                xhr.open("GET", _.src, true);
                xhr.responseType = "arraybuffer";
                xhr.onreadystatechange = function(event) {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            timbre.fn.doEvent(self, "error", [xhr]);
                        }
                    }
                };
                xhr.onload = function() {
                    _.buffer = ctx.createBuffer(xhr.response, true).getChannelData(0);
                    _.duration  = _.buffer.length / timbre.samplerate * 1000;
                    opts.buffer = _.buffer;
                    
                    timbre.fn.doEvent(self, "loadedmetadata", [opts]);
                    _.isloaded = true;
                    timbre.fn.doEvent(self, "loadeddata", [opts]);
                };
                xhr.send();
            } else {
                timbre.fn.doEvent(self, "error", [xhr]);
            }
            _.isloaded = false;
            _.buffer   = new Float32Array(0);
            _.phase    = 0;
            return this;
        };
        
        return WebKitAudio;
    }());
    timbre.fn.register("-webkit-audio", WebKitAudio);
    
    
    /**
     * MozAudio: <draft>
     * Store audio samples (Audio Data API)
     * [ar-only]
     */
    var MozAudio = (function() {
        var MozAudio = function() {
            AudioDecoder.initialize.apply(this, arguments);
        }, $this = AudioDecoder.setPrototype.call(MozAudio.prototype);
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        $this.load = function(callback) {
            var self = this, _ = this._;
            var audio, output, buffer_index, istep, opts;
            
            opts = { buffer:null, samplerate:0 };
            
            if (_.src !== "") {
                audio = new Audio(_.src);
                audio.loop = false;
                audio.addEventListener("error", function(e) {
                    timbre.fn.doEvent(self, "error", [e]);
                }, false);
                audio.addEventListener("loadedmetadata", function(e) {
                    audio.volume = 0.0;
                    _.buffer = new Float32Array((audio.duration * audio.mozSampleRate)|0);
                    _.duration = audio.duration * 1000;
                    buffer_index = 0;
                    istep = audio.mozSampleRate / timbre.samplerate;
                    audio.play();
                    opts.buffer = _.buffer;
                    opts.samplerate = audio.mozSampleRate;
                    timbre.fn.doEvent(self, "loadedmetadata", [opts]);
                }, false);
                audio.addEventListener("MozAudioAvailable", function(e) {
                    var samples, buffer, i, imax;
                    samples = e.frameBuffer;
                    buffer  = _.buffer;
                    for (i = 0, imax = samples.length; i < imax; i += istep) {
                        buffer[buffer_index++] = samples[i|0];
                    }
                }, false);
                audio.addEventListener("ended", function(e) {
                    _.isloaded = true;
                    timbre.fn.doEvent(self, "loadeddata", [opts]);
                }, false);
                audio.load();
            }
            _.isloaded = false;
            _.buffer   = new Float32Array(0);
            _.phase    = 0;
            return this;
        };
        
        return MozAudio;
    }());
    timbre.fn.register("-moz-audio", MozAudio);
    
    
    var WavDecoder = (function() {
        var WavDecoder = function() {
            initialize.apply(this, arguments);
        }, $this = WavDecoder.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "src", {
            set: function(value) {
                if (typeof value === "string") {
                    if (this._.src !== value) {
                        this._.src = value;
                        this._.isloaded = false;
                    }
                }
            },
            get: function() { return this._.src; }
        });
        Object.defineProperty($this, "loop", {
            set: function(value) { this._.loop = !!value; },
            get: function() { return this._.loop; }
        });
        Object.defineProperty($this, "reversed", {
            set: function(value) {
                var _ = this._;
                _.reversed = !!value;
                if (_.reversed && _.phase === 0) {
                    _.phase = Math.max(0, _.buffer.length - 1);
                }
            },
            get: function() { return this._.reversed; }
        });
        Object.defineProperty($this, "isLoaded", {
            get: function() { return this._.isloaded; }
        });
        Object.defineProperty($this, "duration", {
            get: function() { return this._.duration; }
        });
        Object.defineProperty($this, "currentTime", {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 <= value && value <= this._.duration) {
                        this._.phase = (value / 1000) * this._.samplerate;
                    }
                }
            },
            get: function() { return (this._.phase / this._.samplerate) * 1000; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            _.src  = (typeof _args[i] === "string" ) ? _args[i++] : "";
            _.loop = (typeof _args[i] === "boolean") ? _args[i++] : false;
            
            _.loaded_src = undefined;
            _.buffer     = new Int16Array(0);
            _.samplerate = 0;
            _.duration   = 0;
            _.phaseStep  = 0;
            _.phase      = 0;
            _.reversed   = false;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("wav");
            newone._.src  = _.src;
            newone._.loop = _.loop;
            newone._.reversed = _.reversed;
            newone._.isloaded = _.isloaded;
            newone._.loaded_src = _.loaded_src;
            newone._.buffer     = _.buffer;
            newone._.samplerate = _.samplerate;
            newone._.duration   = _.duration;
            newone._.phaseStep  = _.phaseStep;
            newone._.phase = 0;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.slice = function(begin, end) {
            var newone, _ = this._, tmp, reversed;
            if (typeof begin === "number") {
                begin = (begin / 1000) * _.samplerate;
            } else begin = 0;
            if (typeof end   === "number") {
                end   = (end   / 1000) * _.samplerate;
            } else end = _.buffer.length;
            if (begin > end) {
                tmp   = begin;
                begin = end;
                end   = tmp;
                reversed = !reversed;
            }
            newone = timbre("wav");
            newone._.src  = _.src;
            newone._.loop = _.loop;
            newone._.reversed = _.reversed;
            newone._.isloaded = _.isloaded;
            newone._.loaded_src = _.loaded_src;
            newone._.buffer     = _.buffer.subarray(begin, end);
            newone._.samplerate = _.samplerate;
            newone._.duration   = (end - begin / _.samplerate) * 1000;
            newone._.phaseStep  = _.phaseStep;
            newone._.phase = (reversed) ? Math.max(0, newone._.buffer.length - 1) : 0;
            return timbre.fn.copyBaseArguments(this, newone);
        };
        
        var send = function(type, result, callback) {
            if (type === "loadedmetadata") {
                timbre.fn.doEvent(this, "loadedmetadata", [result]);
            } else if (type === "loadeddata") {
                if (typeof callback === "function") {
                    callback.call(this, result);
                } else if (typeof callback === "object") {
                    if (result.buffer) {
                        callback.self       = this;
                        callback.samplerate = result.samplerate;
                        callback.duration   = (result.buffer.length / samplerate) * 1000;
                        callback.buffer     = result.buffer;
                        console.log("wav.load: done.");
                    }
                }
                timbre.fn.doEvent(this, "loadeddata", [result]);
            } else if (type === "error") {
                if (typeof callback === "function") {
                    callback.call(this, "error");
                } else if (typeof callback === "object") {
                    console.log("wav.load: error.");
                }
                timbre.fn.doEvent(this, "error");
            }
        };
        
        $this.load = function(callback) {
            var self = this, _ = this._;
            var worker, src, m, buffer, samplerate;        
            if (_.loaded_src === _.src) {
                if (_.samplerate === 0) {
                    send.call(this, "error", {}, callback);
                } else {
                    send.call(this, "loadedmetadata",
                              {samplerate:_.samplerate,
                               buffer    :_.buffer}, callback);    
                    send.call(this, "loadeddata",
                              {samplerate:_.samplerate,
                               buffer    :_.buffer}, callback);    
                }
            } else if (_.src !== "") {
                timbre.fn.doEvent(this, "loading");
                if (timbre.platform === "web" && timbre._.workerpath) {
                    src = timbre.utils.relpath2rootpath(_.src);
                    worker = new Worker(timbre._.workerpath);
                    worker.onmessage = function(e) {
                        var data = e.data;
                        switch (data.result) {
                        case "metadata":
                            buffer     = new Int16Array(data.bufferSize);
                            samplerate = data.samplerate;
                            _.buffer     = buffer;
                            _.samplerate = samplerate;
                            send.call(self, "loadedmetadata",
                                      {samplerate:_.samplerate,
                                       buffer    :_.buffer}, callback);    
                            break;
                        case "data":
                            buffer.set(data.array, data.offset);
                            break;
                        case "ended":
                            _.isloaded   = true;
                            _.loaded_src = _.src;
                            _.duration   = (buffer.length / samplerate) * 1000;
                            _.phaseStep  = samplerate / timbre.samplerate;
                            if (_.reversed) {
                                _.phase = Math.max(0, newone._.buffer.length - 1);
                            } else {
                                _.phase = 0;    
                            }
                            send.call(self, "loadeddata",
                                      {samplerate:samplerate,
                                       buffer    :buffer}, callback);
                            break;
                        default:
                            send.call(self, "error", {}, callback);
                            break;
                        }
                    };
                    worker.postMessage({action:"wav.decode", src:src});
                } else {
                    timbre.utils.binary.load(_.src, function(binary) {
                        timbre.utils.wav.decode(binary, function(res) {
                            if (res.err) {
                                _.loaded_src = undefined;
                                _.buffer     = new Int16Array(0);
                                _.samplerate = 0;
                                _.duration   = 0;
                                _.phaseStep  = 0;
                                _.phase = 0;
                                send.call(self, "error", {}, callback);
                            } else {
                                _.isloaded   = true;
                                _.loaded_src = _.src;
                                _.buffer     = res.buffer;
                                _.samplerate = res.samplerate;
                                _.duration   = (res.buffer.length / res.samplerate) * 1000;
                                _.phaseStep  = res.samplerate / timbre.samplerate;
                                if (_.reversed) {
                                    _.phase = Math.max(0, newone._.buffer.length - 1);
                                } else {
                                    _.phase = 0;
                                }
                                send.call(self, "loadedmetadata",
                                          {samplerate:_.samplerate,
                                           buffer    :_.buffer}, callback);    
                                send.call(self, "loadeddata",
                                          { samplerate:_.samplerate,
                                            buffer    :_.buffer }, callback);
                            }
                        });
                    });
                }
            } else {
                send.call(this, {}, callback);
            }
            this._.isloaded = false;
            return this;
        };
        
        $this.bang = function() {
            this._.phase = 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, mul, add;
            var buffer, phase, phaseStep;
            var index, delta, x0, x1;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                mul    = _.mul;
                add    = _.add;
                buffer = _.buffer;
                phaseStep = _.phaseStep;
                
                if (_.reversed) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        index = _.phase|0;
                        delta = _.phase - index;
                        
                        x0 = (buffer[index - 1] || 0) / 32768;
                        x1 = (buffer[index    ] || 0) / 32768;
                        cell[i] = ((1.0 - delta) * x0 + (delta * x1)) * mul + add;
                        
                        _.phase -= phaseStep;
                        if (_.phase < 0) {
                            if (_.loop) {
                                _.phase = Math.max(0, _.buffer.length - 1);
                                timbre.fn.doEvent(this, "looped");
                            } else {
                                timbre.fn.doEvent(this, "ended");
                            }
                        }
                    }
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        index = _.phase|0;
                        delta = _.phase - index;
                        
                        x0 = (buffer[index    ] || 0) / 32768;
                        x1 = (buffer[index + 1] || 0) / 32768;
                        cell[i] = ((1.0 - delta) * x0 + (delta * x1)) * mul + add;
                        
                        _.phase += phaseStep;
                        if (_.phase >= buffer.length) {
                            if (_.loop) {
                                _.phase = 0;
                                timbre.fn.doEvent(this, "looped");
                            } else {
                                timbre.fn.doEvent(this, "ended");
                            }
                        }
                    }
                }
            }
            return cell;
        };
        
        return WavDecoder;
    }());
    timbre.fn.register("wav", WavDecoder);
    
    
    var Buddy = (function() {
        var Buddy = function() {
            initialize.apply(this, arguments);
        }, $this = Buddy.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        var initialize = function(_args) {
            this.args = timbre.fn.valist.call(this, _args);
        };
        
        $this._.init = function() {
            $this._._play  = this.play;
            $this._._pause = this.pause;
            $this._._on    = this.on;
            $this._._off   = this.off;
            $this._._bang  = this.bang;
            
            this.play  = $this._.$play;
            this.pause = $this._.$pause;
            this.on    = $this._.$on;
            this.off   = $this._.$off;
            this.bang  = $this._.$bang;
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("buddy"), deep);
        };
        
        $this._.$play = function() {
            var args, i, imax;
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                timbre.fn.doEvent(args[i], "play");
            }
            return $this._._play.call(this);
        };
        $this._.$pause = function() {
            var args, i, imax;
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                timbre.fn.doEvent(args[i], "pause");
            }
            return $this._._pause.call(this);
        };
        $this._.$on = function() {
            var args, i, imax;
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                args[i].on();
            }
            return $this._._on.call(this);
        };
        $this._.$off = function() {
            var args, i, imax;
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                args[i].off();
            }
            return $this._._off.call(this);
        };
        $this._.$bang = function() {
            var args, i, imax;
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                args[i].bang();
            }
            return $this._._bang.call(this);
        };
        $this.send = function(name, _args) {
            var args, i, imax;
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (typeof args[i][name] === "function") {
                    args[i][name].apply(args[i], _args);
                }
            }
            return this;
        };
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell;
            var mul, add;
            var tmp, i, imax, j, jmax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                mul  = _.mul;
                add  = _.add;
                jmax = timbre.cellsize;
                args = this.args.slice(0);
                if (_.ar) {
                    for (j = jmax; j--; ) {
                        cell[j] = 0;
                    }
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            cell[j] += tmp[j];
                        }
                    }
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                } else {
                    tmp  = 0;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp += args[i].seq(seq_id)[0];
                    }
                    tmp = tmp * mul + add;
                    for (j = jmax; j--; ) {
                        cell[j] = tmp;
                    }
                }
            }
            return cell;
        };
        
        return Buddy;
    }());
    timbre.fn.register("buddy", Buddy);
    
    var Easing = (function() {
        var Easing = function() {
            initialize.apply(this, arguments);
        }, $this = Easing.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
    
        Object.defineProperty($this, "type", {
            set: function(value) {
                var f;
                if (typeof value === "string") {
                    if ((f = Easing.Functions[value]) !== undefined) {
                        this._.type = value;
                        this._.func = f;
                    }
                } else if (typeof value === "function") {
                    this._.type = "function";
                    this._.func = value;
                }
            },
            get: function() { return this._.type; }
        });
        Object.defineProperty($this, "delay", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.delay = value;
                }
            },
            get: function() { return this._.delay; }
        });
        Object.defineProperty($this, "duration", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.duration = value;
                }
            },
            get: function() { return this._.duration; }
        });
        Object.defineProperty($this, "currentTime", {
            get: function() { return this._.currentTime; }
        });
        
    
        Object.defineProperty($this, "start", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.start = value;
                }
            },
            get: function() { return this._.start; }
        });
        Object.defineProperty($this, "stop", {
            set: function(value) {
                if (typeof value === "number") {
                    this._.stop = value;
                }
            },
            get: function() { return this._.stop; }
        });
        Object.defineProperty($this, "value", {
            get: function() { return this._.value; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "string" &&
                (Easing.Functions[_args[i]]) !== undefined) {
                this.type = _args[i++];
            } else if (typeof _args[i] === "function") {
                this.type = _args[i++];
            } else {
                this.type = "linear";
            }
            _.duration = (typeof _args[i] === "number") ? _args[i++] : 1000;
            _.start    = (typeof _args[i] === "number") ? _args[i++] : 0;
            _.stop     = (typeof _args[i] === "number") ? _args[i++] : 1;
            
            if (typeof _args[i] === "function") {
                this.onchanged = _args[i++];
            }
            
            _.delay = 0;
            
            _.status  = -1;
            _.value   =  0;
            _.samples = Infinity;
            _.x0 = 0;
            _.dx = 0;
            _.currentTime = 0;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("ease");
            newone._.type = _.type;
            newone._.func = _.func;
            newone._.duration = _.duration;
            newone._.value = _.value;
            newone._.start = _.start;
            newone._.stop  = _.stop;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            var _ = this._;
            
            _.status = 0;
            _.value  = 0;
            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
            _.x0 = 0; _.dx = 0;
            _.currentTime = 0;
            
            timbre.fn.doEvent(this, "bang");
            return this;
        };
    
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, x, value, i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                while (_.samples <= 0) {
                    if (_.status === 0) {
                        _.status = 1;
                        _.samples = (timbre.samplerate * (_.duration / 1000))|0;
                        _.x0 = 0;
                        _.dx = timbre.cellsize / _.samples;
                        continue;
                    }
                    if (_.status === 1) {
                        _.status = 2;
                        _.samples = Infinity;
                        _.x0 = 1;
                        _.dx = 0;
                        x = _.func(1);
                        _.value = (x * (_.stop-_.start) + _.start) * _.mul + _.add;
                        timbre.fn.doEvent(this, "ended");
                        continue;
                    }
                }
                if (_.status !== 2) {
                    x = (_.status === 1) ? _.func(_.x0) : 0;
                    value = (x * (_.stop - _.start) + _.start) * _.mul + _.add;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = value;
                    }
                    if (_.status === 1) {
                        timbre.fn.doEvent(this, "changed", [value]);
                    }
                    _.value = value;
                    _.x0 += _.dx;
                    _.samples -= imax;
                } else {
                    value = _.value;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = value;
                    }
                }
                _.currentTime += imax * 1000 / timbre.samplerate;
            }
            return cell;
        };
        
        $this.getFunction = function(name) {
            return Easing.Functions[name];
        };
        
        $this.setFunction = function(name, func) {
            if (typeof func === "function") {
                Easing.Functions[name] = func;
            }
        };
        
        return Easing;
    }());
    timbre.fn.register("ease", Easing);
    
    Easing.Functions = {
        "linear": function(k) {
            return k;
        },
        "quadratic.in": function(k) {
            return k * k;
        },
        "quadratic.out": function(k) {
            return k * ( 2 - k );
        },
        "quadratic.inout": function(k) {
    		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
    		return - 0.5 * ( --k * ( k - 2 ) - 1 );
        },
        "cubic.in": function(k) {
    		return k * k * k;
        },
        "cubic.out": function(k) {
            return --k * k * k + 1;
        },
        "cubic.inout": function(k) {
    		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
    		return 0.5 * ( ( k -= 2 ) * k * k + 2 );
        },
        "quartic.in": function(k) {
            return k * k * k * k;
        },
        "quartic.out": function(k) {
    		return 1 - --k * k * k * k;
        },
        "quartic.inout": function(k) {
    		if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
    		return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );
        },
        "quintic.in": function(k) {
            return k * k * k * k * k;
        },
        "quintic.out": function(k) {
    		return --k * k * k * k * k + 1;
        },
        "quintic.inout": function(k) {
    		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
    		return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
        },
        "sinusoidal.in": function(k) {
            return 1 - Math.cos( k * Math.PI / 2 );
        },
        "sinusoidal.out": function(k) {
            return Math.sin( k * Math.PI / 2 );
        },
        "sinusoidal.inout": function(k) {
            return 0.5 * ( 1 - Math.cos( Math.PI * k ) );
        },
        "exponential.in": function(k) {
    		return k === 0 ? 0 : Math.pow( 1024, k - 1 );
        },
        "exponential.out": function(k) {
    		return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );
        },
        "exponential.inout": function(k) {
    		if ( k === 0 ) return 0;
    		if ( k === 1 ) return 1;
    		if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
    		return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );
        },
        "circular.in": function(k) {
    		return 1 - Math.sqrt( 1 - k * k );
        },
        "circular.out": function(k) {
    		return Math.sqrt( 1 - --k * k );
        },
        "circular.inout": function(k) {
    		if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
    		return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
        },
        "elastic.in": function(k) {
    		var s, a = 0.1, p = 0.4;
    		if ( k === 0 ) return 0;
    		if ( k === 1 ) return 1;
    		if ( !a || a < 1 ) { a = 1; s = p / 4; }
    		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    		return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
        },
        "elastic.out": function(k) {
    		var s, a = 0.1, p = 0.4;
    		if ( k === 0 ) return 0;
    		if ( k === 1 ) return 1;
    		if ( !a || a < 1 ) { a = 1; s = p / 4; }
    		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    		return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
        },
        "elastic.inout": function(k) {
    		var s, a = 0.1, p = 0.4;
    		if ( k === 0 ) return 0;
    		if ( k === 1 ) return 1;
    		if ( !a || a < 1 ) { a = 1; s = p / 4; }
    		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    		if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
    		return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
        },
        "back.in": function(k) {
    		var s = 1.70158;
    		return k * k * ( ( s + 1 ) * k - s );
        },
        "back.out": function(k) {
    		var s = 1.70158;
    		return --k * k * ( ( s + 1 ) * k + s ) + 1;
        },
        "back.inout": function(k) {
    		var s = 1.70158 * 1.525;
    		if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
    		return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
        },
        "bounce.in": function(k) {
    		return 1 - Easing.Functions["bounce.out"]( 1 - k );
        },
        "bounce.out": function(k) {
    		if ( k < ( 1 / 2.75 ) ) {
    			return 7.5625 * k * k;
    		} else if ( k < ( 2 / 2.75 ) ) {
    			return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
    		} else if ( k < ( 2.5 / 2.75 ) ) {
    			return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
    		} else {
    			return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
    		}
        },
        "bounce.inout": function(k) {
    		if ( k < 0.5 ) return Easing.Functions["bounce.in"]( k * 2 ) * 0.5;
    		return Easing.Functions["bounce.out"]( k * 2 - 1 ) * 0.5 + 0.5;
        },
    };
    
    
    var Glide = (function() {
        var Glide = function() {
            initialize.apply(this, arguments);
        }, $this = Glide.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
        
        var Easing = timbre.fn.getClass("ease");
        
        timbre.fn.copyPropertyDescriptors($this,
                                         Easing.prototype,
                                         ["type","delay","duration","currentTime"]);
        timbre.fn.copyFunctions($this,
                                Easing.prototype,
                                ["seq","getFunction","setFunction"]);
        
        Object.defineProperty($this, "value", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.status = 0;
                    _.start  = _.value;
                    _.stop   = value;
                    _.samples = (timbre.samplerate * (_.delay / 1000))|0;
                    _.x0 = 0; _.dx = 0;
                }
            },
            get: function() { return this._.value; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "string" &&
                (Easing.Functions[_args[i]]) !== undefined) {
                this.type = _args[i++];
            } else if (typeof _args[i] === "function") {
                this.type = _args[i++];
            } else {
                this.type = "linear";
            }
            _.duration = (typeof _args[i] === "number") ? _args[i++] : 1000;
            _.value    = (typeof _args[i] === "number") ? _args[i++] : 0;
            
            if (typeof _args[i] === "function") {
                this.onchanged = _args[i++];
            }
            
            _.delay = 0;
            
            _.status = -1;
            _.start  = _.value;
            _.stop   = _.value;
            _.samples = Infinity;
            _.x0 = 0; _.dx = 0;
            _.currentTime = 0;
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("glide");
            newone._.type = _.type;
            newone._.func = _.func;
            newone._.duration = _.duration;
            newone._.value = _.value;
            newone._.start = _.value;
            newone._.stop  = _.value;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            var _ = this._;
            
            _.status = 0;
            _.start  = _.value;
            _.stop   = _.value;
            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
            _.x0 = 0; _.dx = 0;
            _.currentTime = 0;
            
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        return Glide;
    }());
    timbre.fn.register("glide", Glide);
    
    
    var Record = (function() {
        var Record = function() {
            initialize.apply(this, arguments);
        }, $this = Record.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        timbre.fn.setPrototypeOf.call($this, "listener");
        
        Object.defineProperty($this, "buffer", {
            get: function() { return this._.buffer; }
        });
        Object.defineProperty($this, "recTime", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number" && value > 0) {
                    _.recTime = value;
                    _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
                }
            },
            get: function() { return this._.recTime; }
        });
        Object.defineProperty($this, "currentTime", {
            get: function() { return this._.index / timbre.samplerate * 1000; }
        });
        Object.defineProperty($this, "isRecording", {
            get: function() { return this._.ison; }
        });
        Object.defineProperty($this, "overwrite", {
            set: function(value) { this._.overwrite = !!value; },
            get: function() { return this._.overwrite; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "number" && _args[i] > 0) {
                _.recTime = _args[i++];
            } else {
                _.recTime = 1000;
            }
            if (typeof _args[i] === "function") {
                this.onrecorded = _args[i++];
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
            _.index  = _.currentTime = 0;
            _.overwrite = false;
        };
    
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("rec", _.recTime);
            newone._.overwrite = _.overwrite;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.on = function() {
            var buffer, i, _ = this._;
            _.ison = true;
            if (_.index >= _.buffer.length) {
                _.index = _.currentTime = 0;
                if (!_.overwrite) {
                    buffer = _.buffer;
                    for (i = buffer.length; i--; ) {
                        buffer[i] = 0;
                    }
                }
            }
            timbre.fn.doEvent(this, "on");
            return this;
        };
        $this.off = function() {
            if (this._.ison) {
                onrecorded.call(this);
            }
            this._.ison = false;
            timbre.fn.doEvent(this, "off");
            return this;
        };
        $this.bang = function() {
            var buffer, i, _ = this._;
            _.index = _.currentTime = 0;
            if (!_.overwrite) {
                buffer = _.buffer;
                for (i = buffer.length; i--; ) {
                    buffer[i] = 0;
                }
            }
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        var onrecorded = function() {
            var _ = this._;
            timbre.fn.doEvent(this, "recorded",
                               [_.buffer.subarray(0, _.index)]);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell;
            var buffer;
            var mul, add;
            var tmp, i, imax, j, jmax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                buffer = _.buffer;
                mul  = _.mul;
                add  = _.add;
                jmax = timbre.cellsize;
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                args = this.args.slice(0);
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                if (_.ison) {
                    for (j = 0; j < jmax; ++j) {
                        buffer[_.index++] = cell[j];
                        cell[j] = cell[j] * mul + add;
                    }
                    if (_.index >= buffer.length) {
                        _.ison = false;
                        onrecorded.call(this);
                        timbre.fn.doEvent(this, "ended");
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            }
            return cell;
        };
        
        return Record;
    }());
    timbre.fn.register("rec", Record);
    
    
    var Buffer = (function() {
        var Buffer = function() {
            initialize.apply(this, arguments);
        }, $this = Buffer.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "buffer", {
            set: function(value) {
                var buffer, i, _ = this._;
                if (typeof value === "object") {
                    if (value instanceof Float32Array) {
                        _.buffer = value;
                    } else if (value instanceof Array ||
                               value.buffer instanceof ArrayBuffer) {
                        buffer = new Float32Array(value.length);
                        for (i = buffer.length; i--; ) {
                            buffer[i] = value[i];
                        }
                        _.buffer = buffer;
                        _.duration = buffer.length / timbre.samplerate * 1000;
                        if (_.reversed) {
                            _.phase = Math.max(0, _.buffer.length - 1);
                        } else {
                            _.phase = 0;
                        }
                    }
                }
            },
            get: function() { return this._.buffer; }
        });
        Object.defineProperty($this, "loop", {
            set: function(value) { this._.loop = !!value; },
            get: function() { return this._.loop; }
        });
        Object.defineProperty($this, "reversed", {
            set: function(value) {
                var _ = this._;
                _.reversed = !!value;
                if (_.reversed && _.phase === 0) {
                    _.phase = Math.max(0, _.buffer.length - 1);
                }
            },
            get: function() { return this._.reversed; }
        });
        Object.defineProperty($this, "duration", {
            get: function() { return this._.duration; }
        });
        Object.defineProperty($this, "currentTime", {
            set: function(value) {
                if (typeof value === "number") {
                    if (0 <= value && value <= this._.duration) {
                        this._.phase = (value / 1000) * this._.samplerate;
                    }
                }
            },
            get: function() { return (this._.phase / this._.samplerate) * 1000; }
        });
    
        var initialize = function(_args) {
            var buffer, tmp, i, j, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "object") {
                if (_args[i] instanceof Float32Array) {
                    buffer = _args[i++];
                } else if (_args[i] instanceof Array ||
                           _args[i].buffer instanceof ArrayBuffer) {
                    tmp = _args[i++];
                    buffer = new Float32Array(tmp.length);
                    for (j = buffer.length; j--; ) {
                        buffer[j] = tmp[j];
                    }
                }
            }
            if (buffer === undefined) buffer = new Float32Array(0);
            
            _.loop   = (typeof _args[i] === "boolean") ? _args[i++] : false;
            
            _.buffer = buffer;
            _.duration = buffer.length / timbre.samplerate * 1000;
            _.phase    = 0;
            _.reversed = false;
        };
    
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("buffer", _.buffer, _.loop);
            newone._.reversed = _.reversed;
            newone._.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.slice = function(begin, end) {
            var newone, _ = this._, tmp, reversed;
            
            reversed = _.reversed;
            if (typeof begin === "number") {
                begin = (begin / 1000) * timbre.samplerate;
            } else begin = 0;
            if (typeof end   === "number") {
                end   = (end   / 1000) * timbre.samplerate;
            } else end = _.buffer.length;
            if (begin > end) {
                tmp   = begin;
                begin = end;
                end   = tmp;
                reversed = !reversed;
            }
            
            newone = timbre("buffer");
            newone._.loop = _.loop;
            newone._.reversed = reversed;
            newone._.buffer   = _.buffer.subarray(begin, end);
            newone._.duration = (end - begin / timbre.samplerate) * 1000;
            newone._.phase = (reversed) ? Math.max(0, newone._.buffer.length - 1) : 0;
            timbre.fn.copy_for_clone(this, newone);
            return newone;
        };
        
        $this.bang = function() {
            var _ = this._;
            _.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, buffer, mul, add;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                buffer = _.buffer;
                mul    = _.mul
                add    = _.add;
                if (_.reversed) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = (buffer[_.phase--]||0) * mul + add;
                        if (_.phase < 0) {
                            if (_.loop) {
                                _.phase = Math.max(0, _.buffer.length - 1);
                                timbre.fn.doEvent(this, "looped");
                            } else {
                                timbre.fn.doEvent(this, "ended");
                            }
                        }
                    }
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = (buffer[_.phase++]||0) * mul + add;
                        if (_.phase >= buffer.length) {
                            if (_.loop) {
                                _.phase = 0;
                                timbre.fn.doEvent(this, "looped");
                            } else {
                                timbre.fn.doEvent(this, "ended");
                            }
                        }
                    }
                }
            }
            return cell;
        };
        
        return Buffer;
    }());
    timbre.fn.register("buffer", Buffer);
    
    
    var FFT = (function() {
        var FFT = function() {
            initialize.apply(this, arguments);
        }, $this = FFT.prototype;
        
        var PI2 = Math.PI * 2;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        timbre.fn.setPrototypeOf.call($this, "listener");
        
        Object.defineProperty($this, "size", {
            get: function() { return this._.buffersize >> 1; }
        });
        Object.defineProperty($this, "window", {
            set: function(value) {
                var f;
                if (typeof value === "string") {
                    if ((f = FFT.WindowFunctions[value]) !== undefined) {
                        this._.window = value;
                        this._.windowfunc = f;
                    }
                } else if (typeof value === "function") {
                    this._.window = "function";
                    this._.windowfunc = value;
                }
            },
            get: function() { return this._.window; }
        });
        Object.defineProperty($this, "interval", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.interval = value;
                    _.interval_samples = (timbre.samplerate * (value / 1000))|0;
                    if (_.interval_samples < _.buffersize) {
                        _.interval_samples = _.buffersize;
                        _.interval = _.buffersize * timbre.samplerate / 1000;
                    }
                }
            },
            get: function() { return this._.interval; }
        });
        Object.defineProperty($this, "spectrum", {
            get: function() { return this._.spectrum; }
        });
        Object.defineProperty($this, "noSpectrum", {
            set: function(value) { this._.noSpectrum = !!value; },
            get: function() { return this._.noSpectrum; }
        });
        
        
        var initialize = function(_args) {
            var n, i, _;
            var sintable, costable, k;
            
            this._ = _ = {};
    
            i = 0;
            n = (typeof _args[i] === "number") ? _args[i++] : 512;
            if (n < 256) n = 256;
            else if (2048 < n) n = 2048;
            n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);
            
            if (typeof _args[i] === "string" &&
                (FFT.WindowFunctions[_args[i]]) !== undefined) {
                this.window = _args[i++];
            } else {
                this.window = "Hann";
            }
            
            if (typeof _args[i] === "function") {
                this.onfft = _args[i++];
            }
            
            timbre.fn.valist.call(this, _args.slice(i));
            
            this.interval = 100;
            _.status   = 0;
            _.samples  = 0;
            _.buffersize = n;
            _.samplerate = timbre.samplerate;
            _.buffer = new Float32Array(n);
            _.index  = 0;
    
            _.real = new Float32Array(n);
            _.imag = new Float32Array(n);
            
            _.bitrev = (function() {
                var x, i, j, k, n2;
                x = new Int16Array(n);
                n2 = n >> 1;
                i = j = 0;
                for (;;) {
                    x[i] = j;
                    if (++i >= n) break;
                    k = n2;
                    while (k <= j) { j -= k; k >>= 1; }
                    j += k;
                }
                return x;
            }());
            
            k = Math.floor(Math.log(n) / Math.LN2);
            sintable = new Float32Array((1<<k)-1);
            costable = new Float32Array((1<<k)-1);
            
            for (i = sintable.length; i--; ) {
                sintable[i] = Math.sin(PI2 * (i / n));
                costable[i] = Math.cos(PI2 * (i / n));
            }
            _.sintable = sintable;
            _.costable = costable;
            
            _.noSpectrum = false;
            _.spectrum   = new Float32Array(n>>1);
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("fft", _.buffersize);
            newone._.window     = _.window;
            newone._.windowfunc = _.windowfunc;
            newone._.interval   = _.interval;
            newone._.interval_samples = _.interval_samples;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, amp, center;
            var tmp, i, j, jmax;
            var buffer, buffersize;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = args.length; i--; ) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                buffer     = _.buffer;
                buffersize = _.buffersize;
                
                for (j = 0; j < jmax; ++j) {
                    if (_.samples <= 0) {
                        if (_.status === 0) {
                            _.status = 1;
                            _.samples += _.interval_samples;
                            _.index = 0;
                        }
                    }
                    if (_.status === 1) {
                        buffer[_.index++] = cell[j];
                        if (buffersize <= _.index) {
                            if (_.ison) {
                                process.call(this, buffer);
                            }
                            _.status = 0;
                        }
                    }
                    --_.samples;
                }
            }
            return cell;
        };
        
        var process = function(buffer) {
            var _ = this._;
            var bitrev, real, imag;
            var sintable, costable, windowfunc;
            var i, j, n, m, k, k2, h, d, c, s, ik, dx, dy;
            var rval, ival, mag, spectrum, sqrt;
            
            bitrev = _.bitrev;
            real   = _.real;
            imag   = _.imag;
            sintable = _.sintable;
            costable = _.costable;
            windowfunc = _.windowfunc;
            n = _.buffersize;
    
            for (i = n; i--; ) {
                buffer[i] *= windowfunc(i / n);
            }        
            
            for (i = n; i--; ) {
                real[i] = buffer[bitrev[i]];
                imag[i] = 0.0;
            }
            
            for (k = 1; k < n; k = k2) {
                h = 0; k2 = k + k; d = n / k2;
                for (j = 0; j < k; j++) {
                    c = costable[h];
                    s = sintable[h];
                    for (i = j; i < n; i += k2) {
                        ik = i + k;
                        dx = s * imag[ik] + c * real[ik];
                        dy = c * imag[ik] - s * real[ik];
                        real[ik] = real[i] - dx; real[i] += dx;
                        imag[ik] = imag[i] - dy; imag[i] += dy;
                    }
                    h += d;
                }
            }
            
            // calc spectrum
            if (!_.noSpectrum) {
                sqrt = Math.sqrt;
                spectrum = _.spectrum;
                m = n >> 1;
                for (i = n; i--; ) {
                    rval = real[i];
                    ival = imag[i];
                    mag  = n * sqrt(rval * rval + ival * ival);
                    spectrum[i] = mag;
                }
            }
            
            timbre.fn.doEvent(this, "fft", [real, imag]);
        };
        
        $this.getWindowFunction = function(name) {
            return FFT.WindowFunctions[name];
        };
        
        $this.setWindowFunction = function(name, func) {
            if (typeof value === "function") {
                FFT.WindowFunctions[name] = func;
            }
        };
        
        return FFT;
    }());
    timbre.fn.register("fft", FFT);
    
    FFT.WindowFunctions = {};
    (function() {
        var PI2 = Math.PI * 2;
        FFT.WindowFunctions["Hann"] = function(x) {
            return 0.5 * (1 - Math.cos(PI2 * x));
        };
    }());
    
    
    var Interval = (function() {
        var Interval = function() {
            initialize.apply(this, arguments);
        }, $this = Interval.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
        timbre.fn.setPrototypeOf.call($this, "timer");
        
        Object.defineProperty($this, "interval", {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.interval = value;
                    this._.interval_samples = (timbre.samplerate * (value / 1000))|0;
                }
            },
            get: function() { return this._.interval; }
        });
        Object.defineProperty($this, "count", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    _.count = value;
                }
            },
            get: function() { return this._.count; }
        });
        Object.defineProperty($this, "currentTime", {
            get: function() { return this._.currentTime; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "number") {
                this.interval = _args[i++];
            } else {
                this.interval = 1000;
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            _.ison = false;
            _.samples = 0;
            _.count = 0;
            _.currentTime = 0;
        };
        
        $this.clone = function(deep) {
            return timbre("interval", this._.interval);
        };
        
        $this.bang = function() {
            var _ = this._;
            
            _.samples = 0;
            _.count =  0;
            _.currentTime = 0;
            timbre.fn.doEvent(this, "bang");
            
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, i, imax;
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                _.samples -= timbre.cellsize;
                if (_.samples <= 0) {
                    _.samples += _.interval_samples;
                    args = this.args.slice(0);
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        args[i].bang();
                    }
                    ++_.count;
                }
                _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
            }
            return this.cell;
        };
        
        return Interval;
    }());
    timbre.fn.register("interval", Interval);
    
    
    var Timeout = (function() {
        var Timeout = function() {
            initialize.apply(this, arguments);
        }, $this = Timeout.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "kr-only");
        timbre.fn.setPrototypeOf.call($this, "timer");
        
        Object.defineProperty($this, "timeout", {
            set: function(value) {
                if (typeof value === "number" && value > 0) {
                    this._.timeout = value;
                    this._.timeout_samples = (timbre.samplerate * (value / 1000))|0;
                }
            },
            get: function() { return this._.timeout; }
        });
        Object.defineProperty($this, "currentTime", {
            get: function() { return this._.currentTime; }
        });
        
        var initialize = function(_args) {
            var i, _;
    
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "number") {
                this.timeout = _args[i++];
            } else {
                this.timeout = 1000;
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            _.ison = false;
            _.samples = 0;
            _.currentTime = 0;
        };
        
        $this.clone = function(deep) {
            return timbre("timeout", this._.timeout);
        };
    
        $this._.on = function() {
            this._.samples = this._.timeout_samples;
        };
        
        $this.bang = function() {
            var _ = this._;
            
            _.samples = _.timeout_samples;
            _.currentTime = 0;
            timbre.fn.doEvent(this, "bang");
            
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, i, imax;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                _.samples -= timbre.cellsize;
                if (_.samples <= 0) {
                    _.samples = 0;
                    args = this.args.slice(0);
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        args[i].bang();
                    }
                    if (_.samples <= 0) this.off();
                }
                _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
            }
            return this.cell;
        };
        
        return Timeout;
    }());
    timbre.fn.register("timeout", Timeout);
    
    
    var AwesomeTimbre = (function() {
        var AwesomeTimbre = function() {
            initialize.apply(this, arguments);
        }, $this = AwesomeTimbre.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-only");
        
        Object.defineProperty($this, "version", {
            set: function(value) {
                var synth, _ = this._;
                if (typeof value === "string") {
                    if (value !== _.version) {
                        if ((synth = AwesomeTimbre.Versions[value]) !== undefined) {
                            _.version = value;
                            if (_.synth && _.synth.destroy) {
                                _.synth.destroy(this);
                            }
                            _.synth = synth(this);
                        }
                    }
                }
            },
            get: function() { return this._.version; }
        });
        
        var initialize = function(_args) {
            var i, _;
            this._ = _ = {};
    
            i = 0;
            if (typeof _args[i] === "string" &&
                (AwesomeTimbre.Versions[_args[i]]) !== undefined) {
                this.version = _args[i++];
            } else {
                this.version = "0.1";
            }
        };
        
        $this.clone = function(deep) {
            var newone;
            newone = timbre("timbre", this._.version);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            if (this._.synth) this._.synth.bang();
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, mul, add;
            var tmp, i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                if (_.synth) {
                    tmp = _.synth.seq(seq_id);
                    mul = _.mul;
                    add = _.add;
                    for (i = tmp.length; i--; ) {
                        cell[i] = tmp[i] * mul + add;
                    }
                }
            }
            return cell;
        };
        
        return AwesomeTimbre;
    }());
    timbre.fn.register("timbre", AwesomeTimbre);
    
    AwesomeTimbre.Versions = {};
    AwesomeTimbre.Versions["0.1"] = function(parent) {
        var synth = T("+");
        
        synth.onbang = function() {
            var coin, pul, env;
            coin = T("*");
            pul  = T("pulse", 987.7666, 0.25);
            env  = T("adsr" , 0, 80, 1, 720).bang();
            coin.append(pul, env);
            env.onS = function() {
                pul.freq.value = 1318.5102;
                env.keyoff();
            };
            env.onended = function() {
                synth.remove(coin);
            };
            synth.append(coin);
        };
        
        return synth;
    };

    timbre.utils = (function(timbre) {
        var utils = { $exports:{} };
        utils.mtof = (function() {
            var freq_table = (function() {
                var result = new Float32Array(128);
                for (var i = 0; i < 128; i++) {
                    result[i] = 440 * Math.pow(Math.pow(2, (1/12)), i - 69);
                }
                return result;
            }());
            return function(m) {
                if (0 <= m && m < 128) {
                    return freq_table[m|0];
                } else {
                    return 0;
                }
            };
        }());
        
        utils.ftom = function(f) {
            return Math.round((Math.log(f / 440) * Math.LOG2E) * 12 + 69);
        };
        
        utils.mtoa = (function() {
            var tone_table = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            return function(a) {
                var i = (a|0) % 12;
                var j = (a|0) / 12;
                return tone_table[i] + ((j|0)-2);
            };
        }());
        
        utils.ftoa = function(f) {
            return utils.mtoa(utils.ftom(f));
        };
        
        utils.atom = (function() {
            var re = /^([CDEFGAB])([-+#b]?)([0-9]?)$/;
            var map = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
            return function(a) {
                var m, result = 0;
                if ((m = a.match(re)) !== null) {
                    result = map[m[1]];
                    switch (m[2]) {
                    case "+": case "#":
                        ++result;
                        break;
                    case "-": case "b":
                        --result;
                        break;
                    }
                    result += 12 * ((m[3]|0)+2);
                }
                return result;
            };
        }());
        
        utils.atof = function(a) {
            return utils.mtof(utils.atom(a));
        };
        
        utils.bpm2msec = function(bpm, len) {
            if (typeof len === "undefined") len = 4;
            return (60 / bpm) * (4 / len) * 1000;
        };
        
        utils.msec2bpm = function(msec, len) {
            if (typeof len === "undefined") len = 4;
            return 60 / (msec / 1000) * (4 / len);
        };
        
        utils.msec2hz = function(msec) {
            return 1000 / msec;
        };
        
        utils.hz2msec = function(Hz) {
            return 1000 / Hz;
        };
        
        utils.bpm2hz = function(bpm, len) {
            if (typeof len === "undefined") len = 4;
            return 1000 / ((60 / bpm) * (4 / len) * 1000);
        };
        
        utils.hz2bpm = function(hz, len) {
            if (typeof len === "undefined") len = 4;
            return 60 / (1000 / msec / 1000) * (4 / len);
        };
        
        utils.$exports["converter"] = [
            "mtof", "ftom", "mtoa", "ftoa", "atom", "atof",
            "bpm2msec", "msec2bpm", "msec2hz", "msec2hz", "bpm2hz", "hz2bpm",
        ];
        
        
        utils.wavb = function(src) {
            var lis, i, imax, j, k, x;
            lis = new Float32Array(1024);
            for (i = k = 0, imax = src.length/2; i < imax; ++i) {
                x = parseInt(src.substr(i * 2, 2), 16);
                x = (x & 0x80) ? (x - 256) / 128.0 : x / 127.0;
                for (j = 1024 / imax; j--; ) {
                    lis[k++] = x;
                }
            }
            return lis;
        };
        
        
        (function(binary) {
            
            var send = function(callback, bytes) {
                if (typeof callback === "function") {
                    callback(bytes);
                } else if (typeof callback === "object") {
                    callback.buffer = bytes;
                }
            };
            
            var web_load = function(src, callback) {
                if (typeof src === "string") {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", src, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = function() {
                        send(callback, xhr.response);
                    };
                    xhr.send();
                }
            };
            
            binary.load = function(src, callback) {
                if (typeof callback === "function" || typeof callback === "object") {
                    if (timbre.platform === "web") {
                        web_load(src, callback);
                    } else if (timbre.platform === "node") {
                        // TODO: node_load(src, callback);
                    }
                }        
            };
            
        }( utils.binary = {} ));
        
        
        (function(wav) {
            var send = function(samplerate, buffer, callback, err) {
                if (typeof callback === "function") {
                    callback({samplerate:samplerate, buffer:buffer, err:err});
                } else if (typeof callback === "object") {
                    callback.samplerate = samplerate;
                    callback.buffer     = buffer;
                    callback.err        = err;
                }
            };
            
            wav.decode = function(bytes, callback) {
                var buffer;
                var i, imax;
                var l1, l2;
                var byteLength, linearPCM, channels, samplerate, dataSpeed;
                var blockSize , bitSize, duration, data;
                
                if (! bytes instanceof ArrayBuffer) {
                    send(0, null, callback,
                         "TypeError: wave.decode is expected an ArrayBuffer");
                    return;
                }
                
                bytes = new Uint8Array(bytes);
                if (bytes[0] !== 0x52 || bytes[1] !== 0x49 ||
                    bytes[2] !== 0x46 || bytes[3] !== 0x46) { // 'RIFF'
                        send(0, null, callback,
                             "HeaderError: not exists 'RIFF'");
                    return;
                }
                
                l1 = bytes[4] + (bytes[5]<<8) + (bytes[6]<<16) + (bytes[7]<<24);
                if (l1 + 8 !== bytes.length) {
                    send(0, null, callback,
                         "HeaderError: invalid data size");
                    return;
                }
                
                if (bytes[ 8] !== 0x57 || bytes[ 9] !== 0x41 ||
                    bytes[10] !== 0x56 || bytes[11] !== 0x45) { // 'WAVE'
                        send(0, null, callback,
                             "HeaderError: not exists 'WAVE'");
                    return;
                }
                
                if (bytes[12] !== 0x66 || bytes[13] !== 0x6D ||
                    bytes[14] !== 0x74 || bytes[15] !== 0x20) { // 'fmt '
                        send(0, null, callback,
                             "HeaderError: not exists 'fmt '");
                    return;
                }
                
                byteLength = bytes[16] + (bytes[17]<<8) + (bytes[18]<<16) + (bytes[19]<<24);
                linearPCM  = bytes[20] + (bytes[21]<<8);
                channels   = bytes[22] + (bytes[23]<<8);
                samplerate = bytes[24] + (bytes[25]<<8) + (bytes[26]<<16) + (bytes[27]<<24);
                dataSpeed  = bytes[28] + (bytes[29]<<8) + (bytes[30]<<16) + (bytes[31]<<24);
                blockSize  = bytes[32] + (bytes[33]<<8);
                bitSize    = bytes[34] + (bytes[35]<<8);
                
                if (bytes[36] !== 0x64 || bytes[37] !== 0x61 ||
                    bytes[38] !== 0x74 || bytes[39] !== 0x61) { // 'data'
                        send(0, null, callback,
                             "HeaderError: not exists 'data'");
                    return;
                }
                
                l2 = bytes[40] + (bytes[41]<<8) + (bytes[42]<<16) + (bytes[43]<<24);
                duration = ((l2 / channels) >> 1) / samplerate;
                
                if (l2 > bytes.length - 44) {
                    send(0, null, callback,
                         "HeaderError: not exists data");
                    return;
                }
                
                buffer = new Int16Array((duration * samplerate)|0);
        
                if (bitSize === 8) {
                    data = new Int8Array(bytes.buffer, 44);
                } else if (bitSize === 16) {
                    data = new Int16Array(bytes.buffer, 44);
                } else if (bitSize === 32) {
                    data = new Int32Array(bytes.buffer, 44);
                } else if (bitSize === 24) {
                    data = (function() {
                        var data;
                        var b0, b1, b2, bb, x;
                        var i, imax, j;
                        data = new Int32Array((bytes.length - 44) / 3);
                        j = 0;
                        for (i = 44, imax = bytes.length; i < imax; ) {
                            b0 = bytes[i++] ,b1 = bytes[i++], b2 = bytes[i++];
                            bb = b0 + (b1 << 8) + (b2 << 16);
                            x = (bb & 0x800000) ? -((bb^0xFFFFFF)+1) : bb;
                            data[j++] = x;
                        }
                        return data;
                    }());
                }
                
                if (data) {
                    if (channels === 1) {
                        (function() {
                            var i, amp0, amp1;
                            amp0 = 1 / ((1 << (bitSize-1))  ) * ((1<<15)  );
                            amp1 = 1 / ((1 << (bitSize-1))-1) * ((1<<15)-1);
                            for (i = buffer.length; i--; ) {
                                buffer[i] = data[i] * (data[i] < 0 ? amp0 : amp1);
                            }
                            send(samplerate, buffer, callback);
                        }());
                        return;
                    } else if (channels === 2) {
                        (function() {
                            var i, j, jmax, x, xL, xR, amp0, amp1;
                            amp0 = 1 / ((1 << (bitSize-1))  );
                            amp1 = 1 / ((1 << (bitSize-1))-1);
                            for (i = j = 0, jmax = buffer.length; j < jmax; i+=2, ++j) {
                                xL = data[i  ] * (data[i  ] < 0 ? amp0 : amp1);
                                xR = data[i+1] * (data[i+1] < 0 ? amp0 : amp1);
                                x = (xL + xR) * 0.5;
                                buffer[j] = x * ((x < 0) ? 32768 : 32767);
                            }
                            send(samplerate, buffer, callback);
                        }());
                        return;
                    }
                }
                send(0, null, callback, "not implementation");
            };    
        }( utils.wav = {} ));
        
        
        utils.exports = function(name) {
            var list, i, x, res = [];
            if ((list = utils.$exports[name]) !== undefined) {
                for (i = list.length; i--; ) {
                    x = list[i];
                    timbre.context[x] = utils[x];
                    res.unshift(x);
                }
            }
            return res.join(",");
        };
        return utils;
    }(timbre));
    
    typeof window === "object" && (function(window, timbre) {
        var MutekiTimer = (function() {
            var MutekiTimer = function() {
                initialize.apply(this, arguments);
            }, $this = MutekiTimer.prototype;
            
            var TIMER_PATH = (function() {
                var BlobBuilder, URL, builder;
                BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                URL = window.URL || window.webkitURL;
                if (BlobBuilder && URL) {
                    builder = new BlobBuilder();
                    builder.append("onmessage=t=function(e){clearInterval(t);if(i=e.data)t=setInterval(function(){postMessage(0)},i)}");
                    return URL.createObjectURL(builder.getBlob());
                }
                return null;
            }());
            
            var initialize = function() {
                if (TIMER_PATH) {
                    this._timer = new Worker(TIMER_PATH);
                } else {
                    this._timer = null;
                }
                this._timerId = 0;
                this._ugly_patch = 0;
            };
            
            $this.setInterval = function(func, interval) {
                if (this._timer !== null) {
                    this._timer.onmessage = func;
                    this._timer.postMessage(interval);
                    if (/mac.*firefox/i.test(window.navigator.userAgent)) {
                        window.clearInterval(this._ugly_patch);
                        this._ugly_patch = window.setInterval(function() {}, 1000);
                    }
                } else {
                    if (this._timerId !== 0) {
                        window.clearInterval(this._timerId);
                    }
                    this._timerId = window.setInterval(func, interval);
                }
            };
            
            $this.clearInterval = function() {
                if (this._timer !== null) {
                    this._timer.postMessage(0);
                    if (this._ugly_patch) {
                        window.clearInterval(this._ugly_patch);
                        this._ugly_patch = 0;
                    }
                } else if (this._timerId !== 0) {
                    window.clearInterval(this._timerId);
                    this._timerId = 0;
                }
            };
            
            return MutekiTimer;
        }());
        
        
        var setupTimbre = function(defaultSamplerate) {
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
        
        
        var WebKitPlayer = function(sys) {
            var self = this;
            var ctx, onaudioprocess;
            var samplerate, dx;
            
            ctx = new webkitAudioContext();
            samplerate = ctx.sampleRate;
            
            this.setup = function() {
                setupTimbre(samplerate);
                this.streamsize = timbre.streamsize;
                
                if (timbre.samplerate === samplerate) {
                    onaudioprocess = function(e) {
                        var inL, inR, outL, outR, i;
                        sys.process();
                        
                        inL  = sys.L;
                        inR  = sys.R;
                        outL = e.outputBuffer.getChannelData(0);
                        outR = e.outputBuffer.getChannelData(1);
                        for (i = outL.length; i--; ) {
                            outL[i] = inL[i];
                            outR[i] = inR[i];
                        }
                    };
                } else {
                    dx = timbre.samplerate / samplerate;
                    onaudioprocess = function(e) {
                        var inL, inR, outL, outR, outLen;
                        var streamsize, x, prevL, prevR;
                        var index, delta, x0, x1, xx;
                        var i, imax;
                        
                        inL = sys.L;
                        inR = sys.R;
                        outL = e.outputBuffer.getChannelData(0);
                        outR = e.outputBuffer.getChannelData(1);
                        outLen = outL.length;
                        
                        streamsize = self.streamsize;
                        x = self.x;
                        prevL = self.prevL;
                        prevR = self.prevR;
                        for (i = 0, imax = outL.length; i < imax; ++i) {
                            if (x >= streamsize) {
                                sys.process();
                                x -= streamsize;
                            }
                            
                            index = x|0;
                            delta = 1- (x - index);
                            
                            x1 = inL[index];
                            xx = (1.0 - delta) * prevL + delta * x1;
                            prevL = x1;
                            outL[i] = xx;
                            
                            x1 = inR[index];
                            xx = (1.0 - delta) * prevR + delta * x1;
                            prevR = x1;
                            outR[i] = xx;
                            
                            x += dx;
                        }
                        self.x = x;
                        self.prevL = prevL;
                        self.prevR = prevR;
                    };
                }
                
                return this;
            };
            
            this.on = function() {
                this.x = this.streamsize;
                this.prevL = this.prevR = 0;
                this.node = ctx.createJavaScriptNode(sys.streamsize, 1, sys.channels);
                this.node.onaudioprocess = onaudioprocess;
                this.node.connect(ctx.destination);
            };
            this.off = function() {
                this.node.disconnect();
                this.node = null;
            };
            
            return this;
        };
        
        var MozPlayer = function(sys) {
            var timer = new MutekiTimer();
            
            this.setup = function() {
                var self = this;
                
                setupTimbre(44100);
                
                this.audio = new Audio();
                this.audio.mozSetup(timbre.channels, timbre.samplerate);
                timbre.samplerate = this.audio.mozSampleRate;
                timbre.channels   = this.audio.mozChannels;
                
                this.interval = (timbre.streamsize / timbre.samplerate) * 1000;
                this.interleaved = new Float32Array(timbre.streamsize * timbre.channels);
                
                this.onaudioprocess = function() {
                    var interleaved;
                    var inL, inR, i, j;
                    
                    interleaved = self.interleaved;
                    self.audio.mozWriteAudio(interleaved);
                    sys.process();
                    
                    inL  = sys.L;
                    inR  = sys.R;
                    
                    i = interleaved.length;
                    j = inL.length;
                    while (j--) {
                        interleaved[--i] = inR[j];            
                        interleaved[--i] = inL[j];
                    }
                };
                
                return this;
            };
            
            this.on = function() {
                timer.setInterval(this.onaudioprocess, this.interval);
            };
            
            this.off = function() {
                var interleaved = this.interleaved;
                for (var i = interleaved.length; i--; ) {
                    interleaved[i] = 0.0;
                }
                timer.clearInterval();
            }
            
            return this;
        };
        
        if (typeof webkitAudioContext === "function") {
            timbre.env = "webkit";
            timbre.sys.bind(WebKitPlayer);
        } else if (typeof Audio === "function" && typeof (new Audio).mozSetup === "function") {
            timbre.env = "moz";
            timbre.sys.bind(MozPlayer);
        }
        
        
        timbre.utils.relpath2rootpath = function(relpath) {
            if (/^https?:\/\//.test(relpath)) {
                return relpath;
            } else if (relpath[0] === "/") {
                return relpath;
            } else {
                var rootpath = window.location.pathname;
                rootpath = rootpath.substr(0, rootpath.lastIndexOf("/"));
                rootpath = rootpath.split("/").filter(function(x) {
                    return x !== "";
                });
                relpath = relpath.split("/");
                for (var i = 0; i < relpath.length; ++i) {
                    if (relpath[i] === "..") {
                        rootpath.pop();
                    } else if (relpath[i] !== ".") {
                        rootpath.push(relpath[i]);
                    }
                }
                return "/" + rootpath.join("/");
            }
        };
        
        
        timbre.platform = "web";
        timbre.context  = window;
        
        // start message
        (function() {
            var x = [];
            x.push("Timbre.js "  + timbre.VERSION);
            x.push(" (build: " + timbre.BUILD   + ")");
            if (timbre.env === "webkit") {
                x.push(" on WebAudioAPI");
            } else if (timbre.env === "moz") {
                x.push(" on AudioDataAPI");
            }
            console.log(x.join(""));
        }());
        
        window.timbre = window.T = timbre;
    }(context, timbre));
    
    typeof importScripts === "function" && (function(worker, timbre) {
        worker.actions = {};
        worker.actions["wav.decode"] = function(data) {
            var src;
            src = data.src;
            if (/\.wav$/.test(src)) {
                timbre.utils.binary.load(src, function(binary) {
                    timbre.utils.wav.decode(binary, function(res) {
                        var buf, i, array;
                        if (res.err) {
                            worker.postMessage({result:undefined, err:res.err});
                        } else {
                            buf = res.buffer;
                            worker.postMessage({result:"metadata", samplerate:res.samplerate,
                                                bufferSize:buf.length});
                            i = 0;
                            do {
                                array = buf.subarray(i, i + 8192);
                                worker.postMessage({result:"data", array:array, offset:i});
                                i += array.length;
                            } while (array.length);
                            worker.postMessage({result:"ended"});
                        }
                    });
                });
            }
        };
        
        
        worker.onmessage = function(e) {
            var func = worker.actions[e.data.action];
            if (func !== undefined) func(e.data);
        };
        
        timbre.platform = "web";
        timbre.context  = worker;
    }(context, timbre));
    
    typeof process === "object" && process.title === "node" && (function(node, timbre) {
        timbre.platform = "node";
        timbre.context  = global;
        
        module.exports = timbre;
    }(context, timbre));
    
    timbre.isEnabled = !!timbre.sys._.impl;
            
    return timbre;
}(this));
