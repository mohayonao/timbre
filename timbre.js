/**
 * timbre.js v12.12.12 / JavaScript Library for Objective Sound Programming
 */
;
var timbre = (function(context, timbre) {
    "use strict";
    
    ///// timbre.js /////
    var timbre = function() {
        return timbre.fn.init.apply(timbre, arguments);
    };
    timbre.VERSION    = "v12.12.12";
    timbre.env        = "";
    timbre.platform   = "";
    timbre.samplerate = 0;
    timbre.channels   = 2;
    timbre.cellsize   = 128;
    timbre.streamsize = 1024;
    timbre.dacs       = [];
    timbre.timers     = [];
    timbre.listeners  = [];
    timbre.sys        = null;
    timbre.context    = {};
    timbre.utils      = {};
    timbre._ = { ev:{}, amp:0.8,
                 autorun:true, verbose:true, workerpath:"",
                 none:new Float32Array(timbre.cellsize) };
    
    Object.defineProperties(timbre, {
        amp: {
            set: function(value) {
                if (typeof value === "number") timbre._.amp = value;
            },
            get: function() { return timbre._.amp; }
        },
        autorun: {
            set: function(value) {
                timbre._.autorun = !!value;
            },
            get: function() { return timbre._.autorun; }
        },
        workerpath: {
            set: function(value) {
                if (typeof value === "string") timbre._.workerpath = value;
            },
            get: function() { return timbre._.workerpath; }
        },
        verbose: {
            set: function(value) {
                timbre._.verbose = !!value;
            },
            get: function() { return timbre._.verbose; }
        },
        isOn: {
            get: function() { return timbre.sys._.ison; }
        },
        isOff: {
            get: function() { return !timbre.sys._.ison; }
        }
    });
    
    
    timbre.setup = function(params) {
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
            timbre._.none = new Float32Array(timbre.cellsize);
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
        if (typeof func === "function") {
            if (name[0] === "~") {
                name = name.substr(1);
                func.rm = true;
            }
            var i, list = this._.ev[name];
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
        if (typeof name === "string" && name !== "") {
            var i, list = this._.ev[name];
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
            var args = timbre.fn.valist(arguments);
            for (var i = 0, imax = args.length, b = false; i < imax; ++i) {
                var p = args[i]._.proto;
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
            for (var i = arguments.length, j; i--; ) {
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
        
        for (var x, i = arguments.length; i--; ) {
            x = arguments[i];
            x.append    = append;
            x.remove    = remove;
            x.removeAll = removeAll;
        }
    }(timbre.dacs, timbre.timers, timbre.listeners));
    
    timbre.dacs.type      = 1;
    timbre.timers.type    = 2;
    timbre.listeners.type = 3;
    
    ///// core/fn.js /////
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
    
    ///// core/soundsystem.js /////
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
    
    ///// objects/number.js /////
    var NumberWrapper = (function() {
        var NumberWrapper = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(NumberWrapper, {
            base: "kr-only",
            properties: {
                value: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.value = val;
                            changeTheValue.call(this);
                        }
                    },
                    get: function() { return this._.value; }
                },
                mul: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.mul = val;
                            changeTheValue.call(this);
                        }
                    },
                    get: function() { return this._.mul; }
                },
                add: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.add = val;
                            changeTheValue.call(this);
                        }
                    },
                    get: function() { return this._.add; }
                }
            } // properties
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
    
    ///// objects/boolean.js /////
    var BooleanWrapper = (function() {
        var BooleanWrapper = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(BooleanWrapper, {
            base: "kr-only",
            properties: {
                value: {
                    set: function(val) {
                        this._.value = !!val;
                        changeTheValue.call(this);
                    },
                    get: function() { return this._.value; }
                },
                mul: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.mul = val;
                            changeTheValue.call(this);
                        }
                    },
                    get: function() { return this._.mul; }
                },
                add: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.add = val;
                            changeTheValue.call(this);
                        }
                    },
                    get: function() { return this._.mul; }
                },
            } // properties
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
    
    ///// objects/array.js /////
    var ArrayWrapper = (function() {
        var ArrayWrapper = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(ArrayWrapper, {
            base: "kr-only",
            properties: {
                value: {
                    set: function(val) {
                        if (typeof val === "object" && 
                            (val instanceof Array ||
                             val.buffer instanceof ArrayBuffer)) {
                            this._.value = compile(val);
                            this._.index = 0;
                        }
                    },
                    get: function() { return this._.value; }
                },
                index: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            val = val|0;
                            if (val < 0) val = _.value.length + val;
                            if (0 <= val && val < _.value.length) {
                                _.index = val;
                                changeTheValue.call(this, val);
                            }
                        }
                    },
                    get: function() { return this._.index; }
                },
                repeat: {
                    set: function(val) {
                        if (typeof val === "number") this._.repeat1 = val;
                    },
                    get: function() { return this._.repeat1; }
                },
                mul: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.mul = val;
                            changeTheValue.call(this, this._.index);
                        }
                    },
                    get: function() { return this._.mul; }
                },
                add: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.add = val;
                            changeTheValue.call(this, this._.index);
                        }
                    },
                    get: function() { return this._.add; }
                },
                isEnded: {
                    get: function() { return this._.status === 1; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var value, i, _;
            
            this._ = _ = {};
            
            i = 0; value = [];
            if (typeof _args[i] === "object") {
                if (_args[i] instanceof Array) {
                    value = _args[i++];
                }
            }
            _.value = compile(value);
            _.repeat1 = Infinity;        
            _.index   = -1;
            _.repeat2 = 0;
            _.ended = false;
        };
        
        var compile = function(array) {
            var lis, x, i, imax;
            lis = [];
            for (i = 0, imax = array.length; i < imax; i++) {
                x = array[i];
                if (typeof x === "object" && x instanceof Array) {
                    lis[i] = timbre("array", x);
                } else {
                    lis[i] = x;
                }
            }
            return lis;
        };
        
        var changeTheValue = function(index) {
            var x, cell, i, _ = this._;
            
            _.index = index;
            x = _.value[index] || 0;
            if (x instanceof ArrayWrapper) {
                x = x.cell[0];
            }
            x = x * _.mul + _.add;
            cell = this.cell;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        };
        
        $this._.init = function() {
            this.reset();
        };
        
        $this.clone = function(deep) {
            var newone = timbre(this._.value);
            newone._.repeat = this._.repeat;
            timbre.fn.copyBaseArguments(this, newone, deep);
            return newone.reset();
        };
        
        $this.reset = function() {
            var v, _ = this._;
            v = _.value;
            _.index   = -1;
            _.repeat2 = 0;
            _.ended   = false;
            changeTheValue.call(this, -1);
            return this;
        };
        
        $this.bang = function() {
            var i, v, _ = this._;
            
            i = _.index;
            v = _.value;
            if (v[i] instanceof ArrayWrapper && !v[i]._.ended) {
                v[i].bang();
                if (v[i]._.ended) return this.bang();
                changeTheValue.call(this, i);
            } else {
                i += 1;
                if (i < v.length) {
                    _.index = i;
                    if (v[i] instanceof ArrayWrapper) {
                        v[i].reset().bang();
                    }
                    changeTheValue.call(this, i);
                } else {                
                    ++_.repeat2;
                    if (_.repeat2 >= _.repeat1) {
                        _.ended = true;
                        timbre.fn.doEvent(this, "ended");
                    } else {
                        // loop;
                        _.index = i = 0;
                        if (v[0] instanceof ArrayWrapper) {
                            v[0].reset().bang();
                        }
                        changeTheValue.call(this, i);
                        timbre.fn.doEvent(this, "looped");
                    }
                }
            }
            
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        return ArrayWrapper;
    }());
    timbre.fn.register("array", ArrayWrapper);
    
    ///// objects/function.js /////
    var FunctionWrapper = (function() {
        var FunctionWrapper = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(FunctionWrapper, {
            base: "kr-only",
            properties: {
                value: {
                    set: function(val) {
                        if (typeof val === "function") this._.value = val;
                    },
                    get: function() { return this._.value; }
                },
                args: {
                    set: function(val) {
                        if (typeof val === "object" && val instanceof Array) {
                            this._.args = val;
                        }
                    },
                    get: function() { return this._.args; }
                }
            } // properties
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
    
    ///// objects/scale.js /////
    var Scale = (function() {
        var Scale = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Scale, {
            base: "kr-only",
            properties: {
                scale: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "string" &&
                            Scale.Scales[val] !== undefined) {
                            _.scale = val;
                            _.list = Scale.Scales[val];
                        } else if (val instanceof Array) {
                            _.scale = "";
                            _.list = val;
                        }
                    },
                    get: function() { return this._.scale; }
                },
                root: {
                    set: function(val) {
                        this._.root = timbre(val);
                    },
                    get: function() { return this._.root; }
                },
                octave: {
                    set: function(val) {
                        if (typeof val === "number") this._.octave = val;
                    },
                    get: function() { return this._.octave; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "string" &&
                Scale.Scales[_args[i]] !== undefined) {
                _.scale = _args[i++];
            } else {
                _.scale = "major";
            }
            _.list = Scale.Scales[_.scale];
            if (typeof _args[i] !== "undefined") {
                this.root = _args[i++];
            } else {
                this.root = 440;
            }
            _.octave = typeof _args[i] === "number" ? _args[i++] : 0;
            
            _.scale_value = 0;
            _.prev_value  = undefined;
            _.prev_index  = undefined;
            _.prev_octave = undefined;
            
            this.args = _args.slice(i).map(timbre);
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("scale");
            newone.scale  = _.scale;
            newone._.root = _.root;
            newone._.octave = _.octave;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, args, root, value;
            var index, delta, x0, x1;
            var scale_value, octave;
            var len, x, i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                
                value = timbre.fn.sumargsKR(this, args, seq_id);
                
                if (value !== _.prev_value) {
                    len = _.list.length;
                    if (value >= 0) {
                        index = value % len;
                        octave = (value / len)|0;
                    } else {
                        index = (len + (value % len)) % len;
                        octave = Math.floor(value / len);
                    }
                    delta  = index - (index|0);
                    index |= 0;
                    if (delta === 0) {
                        scale_value = _.list[index];
                    } else {
                        if (index === _.list.length - 1) {
                            x0 = _.list[index];
                            x1 = _.list[0] + 12;
                            scale_value = (1.0 - delta) * x0 + delta * x1;
                        } else {
                            x0 = _.list[index];
                            x1 = _.list[index+1];
                            scale_value = (1.0 - delta) * x0 + delta * x1;
                        }
                    }
                    _.scale_value = scale_value;
                    _.prev_value  = value;
                    _.prev_octave = octave;
                } else {
                    scale_value = _.scale_value;
                    octave = _.prev_octave;
                }
                octave += _.octave;
                root = _.root.seq(seq_id)[0];
                x = root * Math.pow(2, (scale_value + octave * 12) / 12);
                x = x * _.mul + _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
            return cell;
        };
        
        $this.getScale = function(name) {
            return Scale.Scales[name];
        };
        
        $this.setScale = function(name, value) {
            if (value instanceof Array) {
                Scale.Scales[name] = value;
            }
            return this;
        };
        
        return Scale;
    }());
    timbre.fn.register("scale", Scale);
    
    Scale.Scales = {};
    Scale.Scales["major"] = [0, 2, 4, 5, 7, 9, 11];
    Scale.Scales["minor"] = [0, 2, 3, 5, 7, 8, 10];
    Scale.Scales["ionian"]     = [0, 2, 4, 5, 7, 9, 11];
    Scale.Scales["dorian"]     = [0, 2, 3, 5, 7, 9, 10];
    Scale.Scales["phrigian"]   = [0, 1, 3, 5, 7, 8, 10];
    Scale.Scales["lydian"]     = [0, 2, 4, 6, 7, 9, 11];
    Scale.Scales["mixolydian"] = [0, 2, 4, 5, 7, 9, 10];
    Scale.Scales["aeolian"]    = [0, 2, 3, 5, 7, 8, 10];
    Scale.Scales["locrian"]    = [0, 1, 3, 5, 6, 8, 10];
    
    Scale.Scales["wholetone"] = [0, 2, 4, 6, 8, 10];
    Scale.Scales["chromatic"] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
    Scale.Scales["ryukyu"] = [0, 4, 5, 7, 11];
    
    timbre.fn.register("major", Scale, function(_args) {
        return new Scale(["major"].concat(_args));
    });
    timbre.fn.register("minor", Scale, function(_args) {
        return new Scale(["minor"].concat(_args));
    });
    
    ///// objects/dac.js /////
    var Dac = (function() {
        var Dac = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Dac, {
            base: ["ar-only", "dac"],
            properties: {
                dac: {
                    get: function() { return this; }
                },
                pan: {
                    set: function(val) {
                        this._.pan = timbre(val);
                    },
                    get: function() { return this._.pan; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var _ = this._ = {};
            this.args = _args.map(timbre);
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
    
    ///// objects/add.js /////
    var Add = (function() {
        var Add = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Add, {
            base: "ar-kr"
        });
        
        var initialize = function(_args) {
            this.args = _args.map(timbre);
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("+"), deep);
        };
        
        $this.seq = function(seq_id) {
            var tmp, _ = this._;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var args = this.args.slice(0);
                var mul = _.mul, add = _.add;
                
                if (_.ar) { // ar-mode
                    cell = timbre.fn.sumargsAR(this, args, seq_id);
                    for (var i = cell.length; i--; ) {
                        cell[i] = cell[i] * mul + add;
                    }
                } else {    // kr-mode
                    tmp = timbre.fn.sumargsKR(this, args, seq_id);
                    tmp = tmp * mul + add;
                    for (var i = cell.length; i--; ) {
                        cell[i] = tmp;
                    }
                }
            }
            return cell;
        };
        
        return Add;
    }());
    timbre.fn.register("+", Add);
    
    ///// objects/subtract.js /////
    var Subtract = (function() {
        var Subtract = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Subtract, {
            base: "ar-kr"
        });
        
        var initialize = function(_args) {
            this.args = _args.map(timbre);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
                var tmp, i, imax, j, jmax;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var args = this.args.slice(0);
                var mul = _.mul, add = _.add;
    
                if (args.length > 0) {
                    if (_.ar) { // ar-mode
                        tmp = args[0].seq(seq_id);
                        for (j = jmax = cell.length; j--; ) {
                            cell[j] = tmp[j];
                        }
                        for (i = 1, imax = args.length; i < imax; ++i) {
                            tmp = args[i].seq(seq_id);
                            for (j = jmax; j--; ) cell[j] -= tmp[j];
                        }
                        for (j = jmax; j--; ) {
                            cell[j] = cell[j] * mul + add;
                        }
                    } else {    // kr-mode
                        tmp = args[0].seq(seq_id)[0];
                        for (i = 1, imax = args.length; i < imax; ++i) {
                            tmp -= args[i].seq(seq_id)[0];
                        }
                        tmp = tmp * mul + add;
                        for (j = cell.length; j--; ) cell[j] = tmp;
                    }
                } else {        // none args
                    for (i = cell.length; i--; ) cell[i] = add;
                }
            }
            return cell;
        };
        
        return Subtract;
    }());
    timbre.fn.register("-", Subtract);
    
    ///// objects/mul.js /////
    var Multiply = (function() {
        var Multiply = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Multiply, {
            base: "ar-kr"
        });
        
        var initialize = function(_args) {
            this.args = _args.map(timbre);
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("*"), deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var tmp, i, imax, j, jmax;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var args = this.args.slice(0);
                var mul = _.mul, add = _.add;
                
                jmax = timbre.cellsize;
                if (_.ar) { // ar-mode
                    for (j = jmax; j--; ) cell[j] = mul;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) cell[j] *= tmp[j];
                    }
                    if (add) {
                        for (j = jmax; j--; ) cell[j] += add;
                    }
                } else {    // kr-mode
                    tmp = mul;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp *= args[i].seq(seq_id)[0];
                    }
                    tmp += add;
                    for (j = jmax; j--; ) cell[j] = tmp;
                }
            }
            return cell;
        };
        
        return Multiply;
    }());
    timbre.fn.register("*", Multiply);
    
    ///// objects/divide.js /////
    var Divide = (function() {
        var Divide = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Divide, {
            base: "ar-kr",
        });
        
        var initialize = function(_args) {
            this.args = _args.map(timbre);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var tmp, x, i, imax, j, jmax;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var args = this.args.slice(0);
                var mul = _.mul, add = _.add;
                
                if (args.length > 0) {
                    if (_.ar) { // ar-mode
                        tmp = args[0].seq(seq_id);
                        for (j = jmax = cell.length; j--; ) {
                            cell[j] = tmp[j];
                        }
                        for (i = 1, imax = args.length; i < imax; ++i) {
                            tmp = args[i].seq(seq_id);
                            for (j = jmax; j--; ) {
                                x = tmp[j];
                                if (x === 0) {
                                    cell[j] = 0;
                                } else {
                                    cell[j] /= x;
                                }
                            }
                        }
                        for (j = jmax; j--; ) {
                            cell[j] = cell[j] * mul + add;
                        }
                    } else {    // kr-mode
                        tmp = args[0].seq(seq_id)[0];
                        for (i = 1, imax = args.length; i < imax; ++i) {
                            x = args[i].seq(seq_id)[0];
                            if (x === 0) {
                                tmp = 0;
                            } else {
                                tmp /= x
                            }
                        }
                        tmp = tmp * mul + add;
                        for (j = cell.length; j--; ) {
                            cell[j] = tmp;
                        }
                    }
                } else {        // none args
                    for (i = cell.length; i--; ) cell[i] = add;
                }
            }
            return cell;
        };
        
        return Divide;
    }());
    timbre.fn.register("/", Divide);
    
    ///// objects/modulo.js /////
    var Modulo = (function() {
        var Modulo = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Modulo, {
            base: "ar-kr"
        });
        
        var initialize = function(_args) {
            this.args = _args.map(timbre);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var tmp, x, i, imax, j, jmax;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var args = this.args.slice(0);
                var mul = _.mul, add = _.add;
                
                if (args.length > 0) {
                    if (_.ar) { // ar-mode
                        tmp = args[0].seq(seq_id);
                        for (j = jmax = cell.length; j--; ) {
                            cell[j] = tmp[j];
                        }
                        for (i = 1, imax = args.length; i < imax; ++i) {
                            tmp = args[i].seq(seq_id);
                            for (j = jmax; j--; ) {
                                x = tmp[j];
                                if (x === 0) {
                                    cell[j] = 0;
                                } else {
                                    cell[j] %= x;
                                }
                            }
                        }
                        for (j = jmax; j--; ) {
                            cell[j] = cell[j] * mul + add;
                        }
                    } else {    // kr-mode
                        tmp = args[0].seq(seq_id)[0];
                        for (i = 1, imax = args.length; i < imax; ++i) {
                            x = args[i].seq(seq_id)[0];
                            if (x === 0) {
                                tmp = 0;
                            } else {
                                tmp %= x
                            }
                        }
                        tmp = tmp * mul + add;
                        for (j = cell.length; j--; ) {
                            cell[j] = tmp;
                        }
                    }
                } else {        // none args
                    for (i = cell.length; i--; ) cell[i] = add;
                }
            }
            return cell;
        };
        
        return Modulo;
    }());
    timbre.fn.register("%", Modulo);
    
    ///// objects/math.js /////
    var MathFunction = (function() {
        var MathFunction = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(MathFunction, {
            base: "ar-kr",
            properties: {
                func: {
                    get: function() { return this._.func; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var p, i, _;
            
            this._ = _ = {};
            
            i = 0;
            if (typeof _args[i] === "string" &&
                MathFunction.Functions[_args[i]] !== undefined) {
                p = MathFunction.Functions[_args[i++]];
            } else {
                p = MathFunction.Functions["round"];
            }
            _.func = p.func;
            
            this.seq = seqs[p.args + 1];
            if (p.args === 2) {
                _.arg2 = (typeof _args[i] === "number") ? _args[i++] : 0;
            } else if (p.args === -1) {
                _.ar = false;
            }
            this.args = _args.slice(i).map(timbre);
        };
        
        var seqs = [];
        seqs[0] = function(seq_id) {
            var _ = this._;
            var args, cell;
            var value, i ;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                value = _.func * _.mul + _.add;
                for (i = timbre.cellsize; i--; ) {
                    cell[i] = value;
                }
            }
            return cell;
        };
        seqs[1] = function(seq_id) {
            var _ = this._;
            var args, cell;
            var mul, add, func;
            var tmp, i, imax, j, jmax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                mul  = _.mul;
                add  = _.add;
                func = _.func;
                jmax = timbre.cellsize;
                if (_.ar) {
                    for (j = jmax; j--; ) {
                        cell[j] = func() * mul + add;
                    }
                } else {
                    tmp = func() * mul + add;
                    for (j = jmax; j--; ) {
                        cell[j] = tmp;
                    }
                }
            }
            return cell;
        };
        seqs[2] = function(seq_id) {
            var _ = this._;
            var args, cell;
            var mul, add, func;
            var tmp, i, imax, j, jmax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                func = _.func;
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
                        cell[j] = func(cell[j]) * mul + add;
                    }
                } else {
                    tmp = 0;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp += args[i].seq(seq_id)[0];
                    }
                    tmp = func(tmp) * mul + add;
                    for (j = jmax; j--; ) {
                        cell[j] = tmp;
                    }
                }
            }
            return cell;
        };
        seqs[3] = function(seq_id) {
            var _ = this._;
            var args, cell;
            var mul, add, func, arg2;
            var tmp, i, imax, j, jmax;
    
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                func = _.func;
                arg2 = _.arg2;
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
                        cell[j] = func(cell[j], arg2) * mul + add;
                    }
                } else {
                    tmp = 0;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        tmp += args[i].seq(seq_id)[0];
                    }
                    tmp = func(tmp, arg2) * mul + add;
                    for (j = jmax; j--; ) {
                        cell[j] = tmp;
                    }
                }
            }
            return cell;
        };
        
        return MathFunction;
    }());
    timbre.fn.register("math", MathFunction);
    
    MathFunction.Functions = {};
    MathFunction.Functions["PI"]      = {func:Math.PI     , args:-1};
    MathFunction.Functions["E"]       = {func:Math.E      , args:-1};
    MathFunction.Functions["LN2"]     = {func:Math.LN2    , args:-1};
    MathFunction.Functions["LN10"]    = {func:Math.LN10   , args:-1};
    MathFunction.Functions["LOG2E"]   = {func:Math.LOG2E  , args:-1};
    MathFunction.Functions["LOG10E"]  = {func:Math.LOG10E , args:-1};
    MathFunction.Functions["SQRT2"]   = {func:Math.SQRT2  , args:-1};
    MathFunction.Functions["SQRT1_2"] = {func:Math.SQRT1_2, args:-1};
    MathFunction.Functions["random"]  = {func:Math.random , args: 0};
    MathFunction.Functions["sin"]     = {func:Math.sin    , args: 1};
    MathFunction.Functions["cos"]     = {func:Math.cos    , args: 1};
    MathFunction.Functions["tan"]     = {func:Math.tan    , args: 1};
    MathFunction.Functions["asin"]    = {func:Math.asin   , args: 1};
    MathFunction.Functions["acos"]    = {func:Math.acos   , args: 1};
    MathFunction.Functions["atan"]    = {func:Math.atan   , args: 1};
    MathFunction.Functions["ceil"]    = {func:Math.ceil   , args: 1};
    MathFunction.Functions["floor"]   = {func:Math.floor  , args: 1};
    MathFunction.Functions["round"]   = {func:Math.round  , args: 1};
    MathFunction.Functions["abs"]     = {func:Math.abs    , args: 1};
    MathFunction.Functions["sqrt"]    = {func:Math.sqrt   , args: 1};
    MathFunction.Functions["exp"]     = {func:Math.exp    , args: 1};
    MathFunction.Functions["log"]     = {func:Math.log    , args: 1};
    MathFunction.Functions["atan2"]   = {func:Math.atan2  , args: 2};
    MathFunction.Functions["max"]     = {func:Math.max    , args: 2};
    MathFunction.Functions["min"]     = {func:Math.min    , args: 2};
    MathFunction.Functions["pow"]     = {func:Math.pow    , args: 2};
    
    (function() {
        for (var k in MathFunction.Functions) {
            timbre.fn.register("math." + k, MathFunction, (function(k) {
                return function(_args) {
                    return new MathFunction([k].concat(_args));
                };
            }(k)));
        }
    }());
    
    ///// objects/osc.js /////
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
    
    ///// objects/func.js /////
    var FuncOscillator = (function() {
        var FuncOscillator = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(FuncOscillator, {
            base: "ar-kr",
            properties: {
                func: {
                    set: function(val) {
                        if (typeof val === "function") this._.func = val;
                    },
                    get: function() { return this._.func; }
                },
                numOfSamples: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.saved = new Float32Array(val);
                            this._.numOfSamples = val;
                        }
                    },
                    get: function() { return this._.numOfSamples; }
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
                            this._.phase = this._.x = val;
                        }
                    },
                    get: function() { return this._.phase; }
                }
            } // properties
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
    
    ///// objects/noise.js /////
    var WhiteNoise = (function() {
        var WhiteNoise = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(WhiteNoise, {
            base: "ar-kr"
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            var i = 0;
            if (typeof _args[i] === "number") {
                _.mul = _args[i++];
            }
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("noise"), deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            
            if (!_.ison) return timbre._.none;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                var mul = _.mul;
                var add = _.add;
                if (_.ar) {
                    var r = Math.random;
                    for (var i = cell.length; i--; ) {
                        cell[i] = (r() * 2.0 - 1.0) * mul + add;
                    }
                } else {
                    var x = (Math.random() * 2.0 - 1.0) * mul + add;
                    for (var i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
            return cell;
        };
        
        return WhiteNoise;
    }());
    timbre.fn.register("noise", WhiteNoise);
    
    ///// objects/pink.js /////
    var PinkNoise = (function() {
        var PinkNoise = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(PinkNoise, {
            base: "ar-kr"
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.b0 = 0; _.b1 = 0; _.b2 = 0;
            
            var i = 0;
            if (typeof _args[i] === "number") {
                _.mul = _args[i++];
            }
        };
        
        $this.clone = function(deep) {
            return timbre.fn.copyBaseArguments(this, timbre("pink"), deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            
            if (!_.ison) return timbre._.none;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var b0 = _.b0, b1 = _.b1, b2 = _.b2;
                var mul = _.mul, add = _.add;
                
                var rnd = Math.random;
                for (var i = cell.length; i--; ) {
                    var x = rnd() * 2 - 1;
                    b0 = 0.99765 * b0 + x * 0.0990460;
                    b1 = 0.96300 * b1 + x * 0.2965164;
                    b2 = 0.57000 * b2 + x * 1.0526913;
                    x = b0 + b1 + b2 + x * 0.1848;
                    cell[i] = x * mul + add;
                }
                _.b0 = b0; _.b1 = b1; _.b2 = b2;
                
                if (!_.ar) { // kr-mode
                    for (i = cell.length; i--; ) cell[i] = cell[0];
                }
            }
            return cell;
        };
        
        return PinkNoise;
    }());
    timbre.fn.register("pink", PinkNoise);
    
    ///// objects/oscx.js /////
    var PhaseOscillator = (function() {
        var PhaseOscillator = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(PhaseOscillator, {
            base: "ar-kr",
            properties: {
                phase: {
                    set: function(val) {
                        this._.phase = timbre(val);
                    },
                    get: function() { return this._.phase; }
                },
                fb: {
                    set: function(val) {
                        if (typeof val === "number") this._.fb = val;
                    },
                    get: function() { return this._.fb; }
                }
            }, // properties
            copies: [
                "osc.wave", "osc.getWavetable()", "osc.setWavetable()"
            ]
        }), Oscillator = timbre.fn.getClass("osc");
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.wave = new Float32Array(1024);
            _.px   = 0;
            _.fb   = 0;
            
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
        };
        
        $this.clone = function(deep) {
            var _ = this._;
            var newone = T("oscx", _.wave);
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
            var index, delta, x0, x1, xx;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var phase = _.phase.seq(seq_id);
                var fb    = _.fb;
                var mul = _.mul, add = _.add;
                var wave = _.wave, px = _.px;
                
                if (_.ar && _.phase.isAr) { // ar-mode
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        xx = (phase[i] + px) * 1024;
                        while (xx < 0) xx += 1024;
                        index = xx|0; delta = xx - index;
                        x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                        xx = (1.0 - delta) * x0 + delta * x1;
                        px = xx * fb;
                        cell[i] = xx * mul + add;
                    }
                    _.px = px;
                } else {                    // kr-mode
                    xx = phase[0] * 1024;
                    while (xx < 0) xx += 1024;
                    index = xx|0; delta = xx - index;
                    x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                    xx = (1.0 - delta) * x0 + delta * x1;
                    for (i = imax = timbre.cellsize; i--; ) {
                        cell[i] = xx * mul + add;
                    }
                }
            }
            
            return cell;
        };
        
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
    
    ///// objects/phasor.js /////
    var Phasor = (function() {
        var Phasor = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Phasor, {
            base: "ar-kr",
            properties: {
                freq: {
                    set: function(val) {
                        this._.freq = timbre(val);
                    },
                    get: function() { return this._.freq; }
                },
                fmul: {
                    set: function(val) {
                        if (typeof val === "number" && val >= 0) {
                            this._.fmul = val;
                        }
                    },
                    get: function() { return this._.fmul; }
                },
                phase: {
                    set: function(val) {
                        if (typeof val === "number") {
                            while (val >= 1.0) val -= 1.0;
                            while (val <  0.0) val += 1.0;
                            this._.phase = this._.x = val;
                        }
                    },
                    get: function() { return this._.phase; }
                }
            } // properties
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
    
    ///// objects/pwm.js /////
    var Pwm = (function() {
        var Pwm = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Pwm, {
            base: "ar-kr",
            properties: {
                width: {
                    set: function(val) {
                        this._.width = timbre(val);
                    },
                    get: function() { return this._.width; }
                },
                freq: {
                    set: function(val) {
                        this._.freq = timbre(val);
                    },
                    get: function() { return this._.freq; }
                }
            } // properties
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.x     = 0;
            _.coeff = 1 / timbre.samplerate;
            
            var i = 0;
            if (typeof _args[i] !== "undefined") {
                this.width = _args[i++];
            } else {
                this.width = 0.5;
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
        };
        
        $this.clone = function(deep) {
            var _ = this._;
            var newone = T("pwm");
            if (deep) {
                newone._.width = _.width.clone(true);
                newone._.freq  = _.freq.clone(true);
            } else {
                newone._.width = _.width;
                newone._.freq  = _.freq;
            }
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            this._.x = 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            
            if (!_.ison) return timbre._.none;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var width = _.width.seq(seq_id)[0];
                var freq  = _.freq .seq(seq_id);
                var mul = _.mul, add = _.add;
                var x = _.x, coeff = _.coeff;
                
                if (_.ar) { // ar-mode
                    if (_.freq.isAr) {
                        for (var i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = ((x < width) ? +1 : -1) * mul + add;
                            x += freq[i] * coeff;
                            while (x > 1) x -= 1;
                        }
                    } else {
                        var dx = freq[0] * coeff;
                        for (var i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = ((x < width) ? +1 : -1) * mul + add;
                            x += dx;
                            while (x > 1) x -= 1;
                        }
                    }
                } else {    // kr-mode
                    var xx = ((_.x < width) ? +1 : -1) * mul + add;
                    for (var i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = xx;
                    }
                    x += freq[0] * coeff * imax;
                    while (x > 1.0) x -= 1.0;
                }
                _.x = x;
            }
            return cell;
        };
        
        return Pwm;
    }());
    timbre.fn.register("pwm", Pwm);
    
    timbre.fn.register("pwm125", Pwm, function(_args) {
        return new Pwm([0.125].concat(_args));
    });
    timbre.fn.register("pwm25", Pwm, function(_args) {
        return new Pwm([0.25].concat(_args));
    });
    timbre.fn.register("pwm50", Pwm, function(_args) {
        return new Pwm([0.5].concat(_args));
    });
    
    ///// objects/fnoise.js /////
    var FrequencyNoise = (function() {
        var FrequencyNoise = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(FrequencyNoise, {
            base: "ar-kr",
            properties: {
                freq: {
                    set: function(val) {
                        this._.freq = timbre(val);
                    },
                    get: function() { return this._.freq; }
                }
            } // properties
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.x = 0;
            _.y = 1;
            
            var i = 0;
            if (typeof _args[i] !== "undefined") {
                this.freq = _args[i++];
            } else {
                this.freq = 440;
            }
            if (typeof _args[i] === "number") {
                _.mul = _args[i++];
            }
        };
        
        $this.clone = function(deep) {
            var _ = this._;
            var newone = timbre("8bitnoise");
            if (deep) {
                newone._.freq = _.freq.clone(true);
            } else {
                newone._.freq = _.freq;
            }
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function() {
            var _ = this._;
            _.x = 0; _.y = 1;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            
            if (!_.ison) return timbre._.none;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var freq = _.freq.seq(seq_id)[0];
                var x = _.x, y = _.y;
                var mul = _.mul, add = _.add;
                var dx  = freq / timbre.samplerate;
                var rnd = Math.random;
                
                for (var i = 0, imax = cell.length; i < imax; ++i) {
                    if (x >= 0.25) {
                        y = rnd() * 2 - 1;
                        do { x -= 0.25 } while (x >= 0.25);
                    }
                    cell[i] = y * mul + add;
                    x += dx;
                }
                _.x = x; _.y = y;
                
                if (!_.ar) { // kr-mode
                    for (i = imax; i--; ) cell[i] = cell[0];
                }
            }
            
            return cell;
        };
        
        return FrequencyNoise;
    }());
    timbre.fn.register("fnoise", FrequencyNoise);
    
    
    ///// objects/env.js /////
    var Envelope = (function() {
        var Envelope = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Envelope, {
            base: "kr-ar",
            properties: {
                table: {
                    set: function(val) {
                        var dx, name, _ = this._;
                        if (typeof val === "string") {
                            if (val === "~") {
                                name = _.tableName;
                                if (name.charAt(0) === "~") {
                                    name = name.substr(1);
                                } else {
                                    name = "~" + name;
                                }
                            } else {
                                name = val;
                            }
                            
                            if ((dx = Envelope.AmpTables[name]) !== undefined) {
                                if (typeof dx === "function") dx = dx();
                                _.tableName = name;
                                _.table = dx;
                            }
                        }
                    },
                    get: function() { return this._.tableName; }
                },
                delay: {
                    set: function(val) {
                        if (typeof val === "number") this._.delay = val;
                    },
                    get: function() { return this._.delay; }
                },
                reversed: {
                    set: function(val) {
                        this._.reversed = !!val;
                    },
                    get: function() { return this._.reversed; }
                },
                currentTime: {
                    get: function() { return this._.currentTime; }
                }
            }, // properties
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            _.changeState = function() {};
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            
            if (!_.ison) return timbre._.none;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                _.changeState.call(this);
                
                var tbl = _.table;
                var mul = _.mul, add = _.add;
                var i, imax = cell.length;
                
                var x0 = _.x0     ; if (x0 > 0.999) x0 = 0.999;
                var x1 = x0 + _.dx; if (x1 > 0.999) x1 = 0.999;
                x0 = tbl[(x0 * 512)|0]; x1 = tbl[(x1 * 512)|0];
                
                if (_.reversed) {
                    x0 = 1 - x0; x1 = 1 - x1;
                }
                
                if (_.ar) { // ar-mode (v12.07.12)
                    var dx = (x1 - x0) / imax;
                    for (i = 0; i < imax; ++i) {
                        cell[i] = x0 * mul + add;
                        x0 += dx;
                    }
                } else {   // kr-mode
                    x0 = x0 * mul + add;
                    for (i = 0; i < imax; ++i) cell[i] = x0;
                }
                _.x0 += _.dx;
                _.samples -= imax;
                _.currentTime += imax * 1000 / timbre.samplerate;
            }
            return cell;
        };
        
        return Envelope;
    }());
    timbre.fn.register("env", Envelope);
    
    Envelope.AmpSize = 512;
    Envelope.AmpTables = {};
    Envelope.AmpTables["linear"] = function() {
        var l = new Float32Array(Envelope.AmpSize);
        for (var i = 0, imax = l.length; i < imax; ++i) 
            l[i] = i / (imax - 1);
        return l;
    };
    
    (function(list) {
        list.forEach(function(db) {
            Envelope.AmpTables[db + "db"] = function() {
                var l  = new Float32Array(Envelope.AmpSize);
                var x0 = Math.pow(10, db * ((l.length-1) / l.length) / -20);
                var x1 = 0;
                var dx = 1 / (1 - x0);
                for (var i = 0, imax = l.length; i < imax; ++i) {
                    x1 = Math.pow(10, (db * (i / imax) / -20));
                    l[imax - i - 1] = (x1 - x0) * dx;
                }
                return l;
            };
            Envelope.AmpTables["~" + db + "db"] = function() {
                var l  = new Float32Array(Envelope.AmpSize);
                var x0 = Math.pow(10, db * ((l.length-1) / l.length) / -20);
                var x1 = 0;
                var dx = 1 / (1 - x0);
                for (var i = 0, imax = l.length; i < imax; ++i) {
                    x1 = Math.pow(10, (db * (i / imax) / -20));
                    l[i] = 1 - ((x1 - x0) * dx);
                }
                return l;
            };
        });
    }([24,32,48,64,96]));
    
    ///// objects/adsr.js /////
    var ADSREnvelope = (function() {
        var ADSREnvelope = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(ADSREnvelope, {
            base: "kr-ar",
            properties: {
                status: {
                    get: function() { return STATUSES[this._.status+1]; }
                },
                a: { // atack-time
                    set: function(val) {
                        if (typeof val === "number") this._.a = val;
                    },
                    get: function() { return this._.a; }
                },
                d: { // decay-time
                    set: function(val) {
                        if (typeof val === "number") this._.d = val;
                    },
                    get: function() { return this._.d; }
                },
                s: { // sustain-time
                    set: function(val) {
                        if (typeof val === "number") this._.s = val;
                    },
                    get: function() { return this._.s; }
                },
                r: { // release-time
                    set: function(val) {
                        if (typeof val === "number") this._.r = val;
                    },
                    get: function() { return this._.r; }
                },
                al: { // attack-level
                    set: function(val) {
                        if (typeof val === "number") this._.al = val;
                    },
                    get: function() { return this._.al; }
                },
                dl: { // decay-level
                    set: function(val) {
                        if (typeof val === "number") this._.dl = val;
                    },
                    get: function() { return this._.dl; }
                },
                sl: { // sustain-level
                    set: function(val) {
                        if (typeof val === "number") this._.sl = val;
                    },
                    get: function() { return this._.sl; }
                },
                rl: { // release-level
                    set: function(val) {
                        if (typeof val === "number") this._.rl = val;
                    },
                    get: function() { return this._.rl; }
                }
            }, // properties
            copies: [
                "env.table", "env.delay", "env.reversed", "env.currentTime",
                "env.seq()"
            ]
        });
        
        var STATUSES = ["off","delay","a","d","s","r"];
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.a  = 0; _.d  = 0; _.s  = Infinity; _.r  = 0;
            _.al = 0; _.dl = 1; _.sl = 0       ; _.rl = 0;
            _.delay = 0;
            _.status = -1;
            _.samples = Infinity;
            _.x0 = 0;
            _.dx = 0;
            _.currentTime = 0;
            _.reversed = false;
            
            var i = 0;
            if (typeof _args[i] === "string") {
                this.table = _args[i++];
            }
            if (_.table === undefined) this.table = "linear";
            
            var nums = [];
            while (typeof _args[i] === "number") {
                nums.push(_args[i++]);
            }
            
            switch (nums.length) {
            case 0: // T("adsr");
                break;
            case 1: // T("adsr", decay);
                _.d = nums[0];
                break;
            case 2: // T("adsr", attack, decay);
                _.a = nums[0]; _.d = nums[1];
                break;
            case 3: // T("adsr", attack, decay, release);
                _.a = nums[0]; _.d = nums[1]; _.r = nums[2];
                break;
            case 4: // T("adsr", attack, decay, sustain-level, release);
                _.a = nums[0]; _.d = nums[1]; _.sl = nums[2]; _.r = nums[3];
                break;
            case 5: // T("adsr", delay, attack, decay, sustain-level, release);
                _.delay = nums[0];
                _.a = nums[1]; _.d = nums[2]; _.sl = nums[3]; _.r = nums[4];
                break;
            case 6: // T("adsr", delay, attack, decay, sustain, release, sustain-level);
                _.delay = nums[0];
                _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r   = nums[4];
                _.sl = nums[5];
                break;
            case 7: // T("adsr", delay, attack, decay, sustain, release, attack-release-level, sustain-level);
                _.delay = nums[0];
                _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r  = nums[4];
                _.al = nums[5]; _.sl = nums[6]; _.rl = nums[5];
                break;
            case 8: // T("adsr", delay, attack, decay, sustain, release, attack-release-level, decay-level, sustain-level);
                _.delay = nums[0];
                _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r  = nums[4];
                _.al = nums[5]; _.dl = nums[6]; _.sl = nums[7]; _.rl = nums[5];
                break;
            default: // T("adsr", delay, attack, decay, sustain, release, attack-level, decay-level, sustain-level, release-level);
                _.delay = nums[0];
                _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r  = nums[4];
                _.al = nums[5]; _.dl = nums[6]; _.sl = nums[7]; _.rl = nums[8];
                break;
            }
            
            if (typeof _args[i] === "boolean") {
                _.reversed = _args[i++];
            }
            if (typeof _args[i] === "function") {
                this.onended = _args[i++];
            }
            _.changeState = changeState;
        };
        
        $this.clone = function(deep) {
            var _ = this._;
            var newone = timbre("adsr", _.tableName);
            newone._.delay = _.delay;
            newone._.a = _.a; newone._.al = _.al;
            newone._.d = _.d; newone._.dl = _.dl;
            newone._.s = _.s; newone._.sl = _.sl;
            newone._.r = _.r; newone._.rl = _.rl;
            newone._.reversed = _.reversed;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.bang = function(mode) {
            var _ = this._;
            
            // off -> delay
            _.status  = 0;
            if (_.delay <= 0) {
                _.samples = _.dx = 0;
            } else if (_.delay === Infinity) {
                _.samples = Infinity;
                _.dx = 0;
            } else {
                _.samples = (timbre.samplerate * (_.delay / 1000))|0;
                _.dx = timbre.cellsize * (_.al - _.rl) / _.samples;
            }
            _.x0 = _.rl;
            _.currentTime = 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.keyoff = function() {
            var _ = this._;
            
            if (_.status <= 3) {
                // (delay, A, D, S) -> R
                _.status  = 4;
                if (_.r <= 0) {
                    _.samples = _.dx = 0;
                } else if (_.r === Infinity) {
                    _.samples = Infinity;
                    _.dx = 0;
                } else {
                    _.samples = (timbre.samplerate * _.r / 1000)|0;
                    _.dx = -timbre.cellsize * (_.x0 - _.rl) / _.samples;
                }
                timbre.fn.doEvent(this, "R");
            }
        };
    
        var changeState = function() {
            var _ = this._;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    if (_.a <= 0) {
                        _.samples = _.dx = 0;
                    } else if (_.a === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * _.a / 1000)|0;
                        _.dx = (timbre.cellsize * (_.dl -_.al)) / _.samples;
                    }
                    _.x0 = _.al;
                    timbre.fn.doEvent(this, "A");
                    continue;
                }
                if (_.status === 1) { // A -> D
                    _.status = 2;
                    if (_.d <= 0) {
                        _.samples = _.dx = 0;
                    } else if (_.d === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * _.d / 1000)|0;
                        _.dx = -timbre.cellsize * (_.dl - _.sl) / _.samples;
                    }
                    _.x0 = _.dl;
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
                    if (_.s <= 0) {
                        _.samples = _.dx = 0;
                    } else if (_.s === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * _.s / 1000)|0;
                        _.dx = -timbre.cellsize * (_.sl - _.rl) / _.samples;
                    }
                    timbre.fn.doEvent(this, "S");
                    continue;
                }
                if (_.status <= 4) { // (S, R) -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.rl;
                    _.dx = 0;
                    timbre.fn.doEvent(this, "ended");
                    continue;
                }
            }
        };
        
        return ADSREnvelope;
    }());
    timbre.fn.register("adsr", ADSREnvelope);
    
    
    (function() { // PercussiveEnvelope
        
        var changeState = function() {
            var _ = this._;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    if (_.a <= 0) {
                        _.samples = _.dx = 0;
                    } else if (_.a === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * _.a / 1000)|0;
                        _.dx = (timbre.cellsize * (1 -_.al)) / _.samples;
                    }
                    _.x0 = _.al;
                    timbre.fn.doEvent(this, "A");
                    continue;
                }
                if (_.status === 1) {
                    // A -> R
                    _.status  = 4;
                    if (_.r <= 0) {
                        _.x0 = 0;
                        _.samples = 0;
                        _.dx = 0;
                    } else if (_.r === Infinity) {
                        _.x0 = 1;
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.x0 = 1;
                        _.samples = (timbre.samplerate * _.r / 1000)|0;
                        _.dx = -timbre.cellsize / _.samples;
                    }
                    timbre.fn.doEvent(this, "R");
                    continue;
                }
                if (_.status === 4) {
                    // R -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.dx = 0;
                    timbre.fn.doEvent(this, "ended");
                    continue;
                }
            }
        };
        
        timbre.fn.register("perc", ADSREnvelope, function(_args) {
            var i = 0;
            
            var args = [];
            if (typeof _args[i] === "string") {
                args.push(_args[i++]);
            }
            
            var nums = [];
            while (typeof _args[i] === "number") {
                nums.push(_args[i++]);
            }
            
            switch (nums.length) {
            case 0: // T("perc");
                args = args.concat([0,
                                    0, 0, 0, 1000,
                                    0, 1, 0, 0]);
                break;
            case 1: // T("perc", release);
                args = args.concat([0,
                                    0, 0, 0, nums[0],
                                    0, 1, 0, 0]);
                break;
            case 2: // T("perc", attack, release);
                args = args.concat([0,
                                    nums[0], 0, 0, nums[1],
                                    0      , 1, 0, 0]);
                break;
            case 3: // T("perc", delay, attack, release);
                args = args.concat([nums[0],
                                    nums[1], 0, 0, nums[2],
                                    0      , 1, 0, 0]);
                break;
            default: // T("perc", delay, attack, release, attack-level);
                args = args.concat([nums[0],
                                    nums[1], 0, 0, nums[2],
                                    nums[3], 1, 0, 0]);
                break;
            }
            if (typeof _args[i] === "boolean" ) args.push(_args[i++]);
            if (typeof _args[i] === "function") args.push(_args[i++]);
            
            var adsr = new ADSREnvelope(args);
            adsr._.changeState = changeState;
            return adsr;
        });
    }());
    
    ///// objects/aux.js /////
    var Aux = (function() {
        var Aux = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Aux, {
            base: "ar-only",
            properties: {
                list: {
                    set: function(val) {
                        if (val instanceof Array) {
                            this._.list = val;
                            compile.call(this);
                        }
                    },
                    get: function() { return this._.list; }
                }
            }
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.list = [];
            _.workcell = new Float32Array(timbre.cellsize);
            _.stub = { seq: function() { return _.workcell; } };
            
            this.args = _args.map(timbre);
        };
    
        var compile = function() {
            var _ = this._;
            var list = _.list, stub = _.stub;
            for (var i = list.length; i--; ) {
                list[i].args.removeAll().push(stub);
            }
        };
        
        $this.seq = function(seq_id) {
            var tmp, _ = this._;
            
            var cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var args = this.args.slice(0);
                var workcell = _.workcell;
                var list = _.list;
                var mul = _.mul, add = _.add;
                var i, imax;
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                workcell.set(cell);
                var xx = workcell[0];
                for (i = 0, imax = list.length; i < imax; ++i) {
                    workcell.set(list[i].seq(seq_id));
                }
                
                for (i = cell.length; i--; ) {
                    cell[i] = workcell[i] * mul + add;
                }
            }
            return cell;
        };
        
        return Aux;
    }());
    timbre.fn.register("aux", Aux);
    
    ///// objects/filter.js /////
    var Filter = (function() {
        var Filter = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Filter, {
            base: "ar-only",
            properties: {
                type: {
                    set: function(val) {
                        var f;
                        if (typeof val === "string") {
                            if ((f = Filter.Types[val]) !== undefined) {
                                this._.type = val;
                                this._.set_params = f.set_params;
                            }
                        }
                    },
                    get: function() { return this._.type; }
                },
                freq: {
                    set: function(val) {
                        this._.freq = timbre(val);
                    },
                    get: function() { return this._.freq; }
                },
                band: {
                    set: function(val) {
                        this._.band = timbre(val);
                    },
                    get: function() { return this._.band; }
                },
                gain: {
                    set: function(val) {
                        this._.gain = timbre(val);
                    },
                    get: function() { return this._.gain; }
                },
            } // properties
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
            this.args = _args.slice(i).map(timbre);
            
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
                mul = _.mul;
                add = _.add;
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
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
                
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
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
    
    ///// objects/rfilter.js /////
    var ResonantFilter = (function() {
        var ResonantFilter = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(ResonantFilter, {
            base: "ar-only",
            properties: {
                type: {
                    set: function(val) {
                        var mode;
                        if (typeof val === "string") {
                            if ((mode = ResonantFilter.Types[val]) !== undefined) {
                                this._.type = val;
                                this._.mode = mode;
                            }
                        }
                    },
                    get: function() { return this._.type; }
                },
                cutoff: {
                    set: function(val) {
                        this._.cutoff = timbre(val);
                    },
                    get: function() { return this._.cutoff; }
                },
                Q: {
                    set: function(val) {
                        this._.Q = timbre(val);
                    },
                    get: function() { return this._.Q; }
                },
                depth: {
                    set: function(val) {
                        this._.depth = timbre(val);
                    },
                    get: function() { return this._.depth; }
                }
            } // properties
        });
        
        
        ResonantFilter.Types = { lpf:0, hpf:1, bpf:2, brf:3 };
        
        
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
            this.args = _args.slice(i).map(timbre);
            
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
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, mul, add;
            var cutoff, Q, f, mode, damp, freq, depth, depth0, depth1;
            var input, output;
            var i, imax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                if (_.ison) {
                    mode   = _.mode;
                    cutoff = _.cutoff.seq(seq_id)[0];
                    Q      = _.Q.seq(seq_id)[0];
                    
                    if (cutoff !== _.prev_cutoff || Q !== _.prev_Q ) {
                        
                        freq = 2 * Math.sin(3.141592653589793 * Math.min(0.25, cutoff / (timbre.samplerate * 2)));
                        _.damp = Math.min(2 * (1 - Math.pow(Q, 0.25)), Math.min(2, 2 / freq - freq * 0.5));
                        _.freq = freq;
                        
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
                    for (i = cell.length; i--; ) {
                        cell[i] = cell[i] * mul + add;
                    }
                }
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
    
    ///// objects/efx.delay.js /////
    var EfxDelay = (function() {
        var EfxDelay = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(EfxDelay, {
            base: "ar-only",
            properties: {
                time: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.time = val;
                            set_params.call(this, _.time, this._.fb, _.wet);
                        }
                    },
                    get: function() { return this._.time; }
                },
                fb: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.fb = val;
                            set_params.call(this, _.time, _.fb, _.wet);
                        }
                    },
                    get: function() { return this._.fb; }
                },
                wet: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.wet = val;
                            set_params.call(this, _.time, _.fb, _.wet);
                        }
                    },
                    get: function() { return this._.wet; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            var i, bits = Math.ceil(Math.log(timbre.samplerate * 1.5) * Math.LOG2E)
            
            _.buffer = new Float32Array(1<<bits);
            _.mask = (1 << bits) - 1;
            _.idx  = 0;
            _.out  = 0;
            
            _.time = 250;
            _.fb   = 0.25;
            _.wet  = 0.25;
            
            i = 0;
            if (typeof _args[i] === "number") {
                _.time = _args[i++];
            }    
            if (typeof _args[i] === "number") {
                _.fb = _args[i++];
            }    
            if (typeof _args[i] === "number") {
                _.wet = _args[i++];
            }
            
            set_params.call(this, _.time, _.fb, _.wet);
            
            this.args = _args.slice(i).map(timbre);
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("efx.delay", _.time, _.fb, _.wet);
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        var set_params = function(time, fb, wet) {
            var _ = this._;
            
            var offset = time * timbre.samplerate / 1000;
            var mask   = _.mask;
            
            _.out = (_.idx + offset) & mask;
            
            if (fb >= 0.995) {
                _.fb = +0.995;
            } else if (fb <= -0.995) {
                _.fb = -0.995;
            } else {
                _.fb = fb;
            }
            
            if (wet > 1) wet = 1; else if (wet < 0) wet = 0;
            _.wet = wet;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var i, imax, j, jmax;
            
            var cell = this.cell;
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                var args = this.args.slice(0);
    
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                var n, b = _.buffer, mask = _.mask;
                var idx = _.idx, fb  = _.fb, out = _.out;
                var wet = _.wet, dry = 1 - _.wet;
                
                if (_.ison) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        n = b[idx];
                        b[out] = cell[i] - (n * fb);
                        out = (++out) & mask;
                        idx = (++idx) & mask;
                        cell[i] = (cell[i] * dry) + (n * wet);
                    }
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        n = b[idx];
                        b[out] = cell[i] - (n * fb);
                        idx = (++idx) & mask;
                        out = (++out) & mask;                    
                    }
                }
                _.idx = idx;
                _.out = out;
    
                var mul = _.mul, add = _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
            return cell;
        };
        
    
        return EfxDelay;
    }());
    timbre.fn.register("efx.delay", EfxDelay);
    
    ///// objects/efx.reverb.js /////
    var EfxReverb = (function() {
        
        var NUM_OF_DELAY = 6;
        
        var EfxReverb = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(EfxReverb, {
            base: "ar-only",
            properties: {
                time: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.time = val;
                            set_params.call(this, _.time, _.fb, _.wet);
                        }
                    },
                    get: function() { return this._.time; }
                },
                fb: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.fb = val;
                            set_params.call(this, _.time, _.fb, _.wet);
                        }
                    },
                    get: function() { return this._.fb; }
                },
                wet: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.wet = val;
                            set_params.call(this, _.time, _.fb, _.wet);
                        }
                    },
                    get: function() { return this._.wet; }
                }
            } // properties
        });
        
        var Delay = function(size, time, fb, wet) {
            this.buffer = new Float32Array(size);
            this.mask = size - 1;
            this.idx  = 0;
            this.out  = 0;
            
            this.time = time;
            this.fb   = fb;
            this.wet  = wet;
        };
        Delay.prototype = {
            set_params: function(time, fb, wet) {
                var offset = time * timbre.samplerate / 1000;
                var mask   = this.mask;
                
                this.out = (this.idx + offset) & mask;
    
                if (fb >= 0.995) {
                    this.fb = +0.995;
                } else if (fb <= -0.995) {
                    this.fb = -0.995;
                } else {
                    this.fb = fb;
                }
                
                if (wet > 1) wet = 1; else if (wet < 0) wet = 0;
                this.wet = wet;
            },
            process: function(cell) {
                var i, imax;
                
                var n, b = this.buffer, mask = this.mask;
                var idx = this.idx, fb  = this.fb, out = this.out;
                var wet = this.wet, dry = 1 - this.wet;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    n = b[idx];
                    b[out] = cell[i] - (n * fb);
                    out = (++out) & mask;
                    idx = (++idx) & mask;
                    cell[i] = (cell[i] * dry) + (n * wet);
                }
                this.idx = idx;
                this.out = out;
                
                return cell;
            }
        };
        
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            var i, bits = Math.ceil(Math.log(timbre.samplerate * 1) * Math.LOG2E)
            
            var delay = _.delay = new Array(NUM_OF_DELAY);
            for (i = 0; i < NUM_OF_DELAY; ++i) {
                delay[i] = new Delay(1<<bits, 0, 0, 0);
            }
            
            _.time = 700;
            _.fb   = 0.8;
            _.wet  = 0.3;
            _.cell = new Float32Array(timbre.cellsize);
            
            i = 0;
            if (typeof _args[i] === "number") {
                _.time = _args[i++];
            }
            if (typeof _args[i] === "number") {
                _.fb = _args[i++];
            }
            if (typeof _args[i] === "number") {
                _.wet = _args[i++];
            }
            
            set_params.call(this, _.time, _.fb, _.wet);
            
            this.args = _args.slice(i).map(timbre);
        };
        
        var set_params = function(time, fb, wet) {
            var _ = this._;
            
            var i, t = (time / NUM_OF_DELAY), delay = _.delay;
            for (i = NUM_OF_DELAY; i--; ) {
                delay[i].set_params(time, fb, wet);
                time *= 0.5;
                fb   *= 0.5;
            }
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var i, imax, j, jmax;
            
            var cell = this.cell;
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                var args = this.args.slice(0);
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
    
                var _cell = _.cell;
                var delay = _.delay;
                var dry   = 1 - _.wet;
    
                for (i = cell.length; i--; ) {
                    _cell[i] = cell[i];
                }
                for (i = 0; i < NUM_OF_DELAY; ++i) {
                    delay[i].process(cell);
                }
                
                if (_.ison) {
                    for (i = cell.length; i--; ) {
                        cell[i] += _cell[i] * dry;
                    }
                } else {
                    for (i = cell.length; i--; ) {
                        cell[i] = _cell[i];
                    }
                }                
                
                var mul = _.mul, add = _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
            return cell;
        };
        
        return EfxReverb;
    }());
    timbre.fn.register("efx.reverb", EfxReverb);
    
    ///// objects/efx.dist.js /////
    var EfxDistortion = (function() {
        var EfxDistortion = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(EfxDistortion, {
            base: "ar-only",
            properties: {
                pre: {
                    set: function(val) {
                        this._.preGain = timbre(val);
                    },
                    get: function() { return this._.preGain; }
                },
                post: {
                    set: function(val) {
                        this._.postGain = timbre(val);
                    },
                    get: function() { return this._.postGain; }
                },
                freq: {
                    set: function(val) {
                        this._.lpfFreq = timbre(val);
                    },
                    get: function() { return this._.lpfFreq; }
                }
            } // properties
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
            
            this.args = _args.slice(i).map(timbre);
            
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
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, args, mul, add;
            var preGain, postGain, preScale, postScale, lpfFreq, limit;
            var a1, a2, b0, b1, b2, in1, in2, out1, out2;
            var omg, cos, sin, alp, n, ia0;
            var input, output;
            var i, imax;        
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                mul = _.mul;
                add = _.add;
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                if (_.ison) {
                    preGain  = _.preGain.seq(seq_id)[0];
                    postGain = _.postGain.seq(seq_id)[0];
                    lpfFreq  = _.lpfFreq.seq(seq_id)[0];
                    if (preGain  !== _.prev_preGain ||
                        postGain !== _.prev_postGain ||
                        lpfFreq  !== _.prev_lpfFreq) {
                        
                        postScale  = Math.pow(2, -postGain / 6);
                        _.preScale = Math.pow(2, -preGain / 6) * postScale;
                        _.limit = postScale;
                        
                        if (lpfFreq) {
                            omg = lpfFreq * 2 * Math.PI / timbre.samplerate;
                            cos = Math.cos(omg);
                            sin = Math.sin(omg);
                            n = 0.34657359027997264 * omg / sin;
                            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
                            ia0 = 1 / (1 + alp);
                            _.a1 = -2 * cos  * ia0;
                            _.a2 = (1 - alp) * ia0;
                            _.b1 = (1 - cos) * ia0;
                            _.b2 = _.b0 = _.b1 * 0.5;
                        }
                    }
                    
                    preScale = _.preScale;
                    limit    = _.limit;
                    
                    if (_.lpfFreq) {
                        a1 = _.a1; a2 = _.a2;
                        b0 = _.b0; b1 = _.b1; b2 = _.b2;
                        in1  = _.in1;  in2  = _.in2;
                        out1 = _.out1; out2 = _.out2;
                        
                        if (out1 < 0.0000152587890625) out2 = out1 = 0;
                        
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
                    for (i = cell.length; i--; ) {
                        cell[i] = cell[i] * mul + add;
                    }
                }
            }
            return cell;
        };
        
        return EfxDistortion;
    }());
    timbre.fn.register("efx.dist", EfxDistortion);
    
    ///// objects/efx.chorus.js /////
    var EfxChorus = (function() {
        var EfxChorus = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(EfxChorus, {
            base: "ar-only",
            properties: {
                depth: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.depth = val;
                            _.lfo.mul = _.depth * _.offset;
                        }
                    },
                    get: function() { return this._.depth; }
                },
                rate: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.rate = val;
                            _.lfo.freq.value = val;
                        }
                    },
                    get: function() { return this._.rate; }
                },
                wet: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            if (0 <= val && val <= 1.0) {
                                _.wet = val;
                                _.wet0 = Math.sin(0.25 * Math.PI * val);
                                _.dry0 = Math.cos(0.25 * Math.PI * val);
                            }
                        }
                    },
                    get: function() { return this._.wet; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var bits, i, _;
            
            this._ = _ = {};
            bits = Math.ceil(Math.log(timbre.samplerate * 0.02) * Math.LOG2E);
            
            _.buffer = new Float32Array(1 << bits);
            _.buffer_mask = (1 << bits) - 1;
            
            i = 0;
            _.delay = 10;
            _.depth = (typeof _args[i] === "number") ? _args[i++] : 0.8;
            _.rate  = (typeof _args[i] === "number") ? _args[i++] : 0.5;
            _.wet   = (typeof _args[i] === "number") ? _args[i++] : 0.5;
            
            _.wet0 = Math.sin(0.25 * Math.PI * _.wet);
            _.dry0 = Math.cos(0.25 * Math.PI * _.wet);
            
            _.sr   = timbre.samplerate / 1000;
            _.offset = (_.sr * _.delay)|0;
            _.pointerRead  = 0;
            _.pointerWrite = _.offset;
            _.lfo = timbre("sin", _.rate, _.depth * _.offset).kr();
            
            this.args = _args.slice(i).map(timbre);
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
    
    ///// objects/efx.comp.js /////
    var EfxComp = (function() {
        
        var EfxComp = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(EfxComp, {
            base: "ar-only",
            properties: {
                thres: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.thres  = val;
                            _.thres2 = val * val;
                        }
                    },
                    get: function() { return this._.thres; }
                },
                ratio: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.ratio = val;
                            set_params.call(this, _.ratio, _.attack, _.release);
                        }
                    },
                    get: function() { return this._.ratio; }
                },
                attack: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.attack = val;
                            set_params.call(this, _.ratio, _.attack, _.release);
                        }
                    },
                    get: function() { return this._.attack; }
                },
                release: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.release = val;
                            set_params.call(this, _.ratio, _.attack, _.release);
                        }
                    },
                    get: function() { return this._.release; }
                },
                gain: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") _.gain = val;
                    },
                    get: function() { return this._.gain; }
                }
            } // properties
        });
        
        var WINDOW_MSEC = 40;
        
        var initialize = function(_args) {
            var _ = this._ = {};
    
            var i, bits = Math.ceil(Math.log(timbre.samplerate * 0.04) * Math.LOG2E)
            
            _.buffer = new Float32Array(1<<bits);
            _.mask = _.buffer.length - 1;
            _.sum  = 0;
            _.avg  = 1 / _.buffer.length;
            
            _.thres = 0.2;
            _.ratio = 0.25;
            _.attack  = 20;
            _.release = 30;
            _.gain = 1.5;
            
            var i = 0;
            if (typeof _args[i] === "number") {
                _.thres  = _args[i++];
            }
            if (typeof _args[i] === "number") {
                _.ratio = _args[i++];
            }
            if (typeof _args[i] === "number") {
                _.gain = _args[i++];
            }
            
            _.idx = 0;
            _.xrt = 0;
            _.thres2 = _.thres * _.thres;
            _.ratio2 = 0;
            
            set_params.call(this, _.ratio, _.attack, _.release);
            
            this.args = _args.slice(i).map(timbre);
        };
    
        var set_params = function(ratio, attack, release) {
            var _ = this._;
            if (ratio > 0.999755859375) {
                ratio = 0.999755859375;
            } else if (ratio < 0) {
                ratio = 0;
            }
            _.adx = (1-ratio) / (attack  * timbre.samplerate / 1000);
            _.rdx = (1-ratio) / (release * timbre.samplerate / 1000);
            _.xrt = 1;
        }    
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var i, imax;
            
            var cell = this.cell;
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                var args = this.args.slice(0);
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                if (_.ison) {
                    var thres = _.thres;
                    var ratio = _.ratio;
                    var gain  = _.gain;
                    
                    var x, b = _.buffer, mask = _.mask;
                    var idx = _.idx, sum = _.sum, avg = _.avg;
                    var xrt = _.xrt, adx = _.adx, rdx = _.rdx;
                    var thres2 = _.thres2;
                    var rms2;
                    
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        x = cell[i];
                        
                        sum -= b[idx];
                        sum += b[idx] = x * x;
                        idx   = (++idx) & mask;
                        
                        rms2 = sum * avg;
                        
                        if (rms2 > thres2) {
                            if ((xrt -= adx) < ratio) xrt = ratio;
                        } else {
                            if ((xrt += rdx) > 1) xrt = 1;
                        }
                        if (xrt < 1) {
                            if (x > thres) {
                                x = +thres + (x - thres) * xrt;
                            } else if (x < -thres) {
                                x = -thres + (x + thres) * xrt;    
                            }
                        }
                        cell[i] = x * gain;
                    }
                    
                    _.sum = sum;
                    _.idx = idx;
                    _.xrt = xrt;
                }
                
                var mul = _.mul, add = _.add;
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
            return cell;
        };
        
        return EfxComp;
    }());
    timbre.fn.register("efx.comp", EfxComp);
    
    ///// objects/audio.js /////
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
                set: function(val) {
                    if (typeof val === "string") {
                        if (this._.src !== val) {
                            this._.src = val;
                            this._.isloaded = false;
                        }
                    } else if (timbre.platform === "web" && val instanceof File) {
                        this._.src = val;
                        this._.isloaded = false;
                    }
                },
                get: function() { return this._.src; }
            });
            Object.defineProperty(this, "loop", {
                set: function(val) { this._.loop = !!val; },
                get: function() { return this._.loop; }
            });
            Object.defineProperty(this, "reversed", {
                set: function(val) {
                    var _ = this._;
                    _.reversed = !!val;
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
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        if (0 <= val && val <= _.duration) {
                            _.phase = ((val / 1000) * timbre.samplerate)|0;
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
            
            this.getAudioSrc = function() {
                var _ = this._;
                var items, m, saved, i, imax;
                if (timbre.platform === "web") {
                    saved = "";
                    items = _.src.split(/,/).map(function(x) { return x.trim(); });
                    for (i = 0, imax = items.length; i < imax; ++i) {
                        m = /^(.*\.)(aac|mp3|ogg|wav)$/i.exec(saved + items[i]);
                        if (m) {
                            if ((new Audio("")).canPlayType("audio/" + m[2])) {
                                return m[0];
                            }
                            if (saved === "") saved = m[1];
                        }
                    }
                }
                return "";
            };
            
            return this;
        }
    };
    
    
    /**
     * WebKitAudio
     * Store audio samples (WebAudioAPI)
     * v 0. 1. 0: first version
     */
    var WebKitAudio = (function() {
        var WebKitAudio = function() {
            AudioDecoder.initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(WebKitAudio, {
            base: ["ar-only", AudioDecoder.setPrototype]
        });
        
        
        $this.load = function() {
            var self = this, _ = this._;
            var src, ctx, xhr, opts;
            var reader;
            
            ctx  = new webkitAudioContext();
            xhr  = new XMLHttpRequest();
            opts = { buffer:null, samplerate:ctx.sampleRate };
            
            if (_.src instanceof File) {
                reader = new FileReader();
                reader.onload = function(e) {
                    var buffer;
                    
                    try {
                        buffer = ctx.createBuffer(e.target.result, true);
                    } catch (e) {
                        buffer = null;
                    }
                    
                    if (buffer !== null) {
                        _.buffer    = buffer.getChannelData(0);
                        _.duration  = _.buffer.length / timbre.samplerate * 1000;
                        opts.buffer = _.buffer;
                        
                        timbre.fn.doEvent(self, "loadedmetadata", [opts]);
                        _.isloaded = true;
                        timbre.fn.doEvent(self, "loadeddata", [opts]);
                    } else {
                        timbre.fn.doEvent(self, "error", [e]);
                    }
                };
                reader.readAsArrayBuffer(_.src);
            } else {
                src = this.getAudioSrc(_.src);
                if (src !== "") {
                    xhr.open("GET", src, true);
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
            }
            return this;
        };
        
        return WebKitAudio;
    }());
    timbre.fn.register("-webkit-audio", WebKitAudio);
    
    
    /**
     * MozAudio
     * Store audio samples (AudioDataAPI)
     * v 0. 1. 0: first version
     */
    var MozAudio = (function() {
        var MozAudio = function() {
            AudioDecoder.initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(MozAudio, {
            base: ["ar-only", AudioDecoder.setPrototype]
        });
        
        
        var loadAudio = function(audio, opts) {
            var self = this, _ = this._;
            var output, buffer_index, istep;
            
            var loadFunc = function(e) {
                var samples, buffer, i, imax;
                try {
                    samples = e.frameBuffer;
                    buffer  = _.buffer;
                    for (i = 0, imax = samples.length; i < imax; i += istep) {
                        buffer[buffer_index++] = samples[i|0];
                    }
                    audio.removeEventListener("MozAudioAvailable", loadFunc);
                    audio.addEventListener("MozAudioAvailable", function(e) {
                        var samples, buffer, i, imax;
                        samples = e.frameBuffer;
                        buffer  = _.buffer;
                        for (i = 0, imax = samples.length; i < imax; i += istep) {
                            buffer[buffer_index++] = samples[i|0];
                        }
                    }, false);
                } catch (e) {
                    audio.removeEventListener("MozAudioAvailable", loadFunc);
                    audio.pause();
                    timbre.fn.doEvent(self, "error", [e]);
                }
            };
            
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
            audio.addEventListener("MozAudioAvailable", loadFunc, false);
            audio.addEventListener("ended", function(e) {
                _.isloaded = true;
                timbre.fn.doEvent(self, "loadeddata", [opts]);
            }, false);
            audio.load();
        };
        
        $this.load = function(callback) {
            var self = this, _ = this._;
            var src, reader, opts;
            
            opts = { buffer:null, samplerate:0 };
            
            if (_.src instanceof File) {
                reader = new FileReader();
                reader.onload = function(e) {
                    var audio, m;
                    if ((m = /^data:(.*?);/.exec(e.target.result)) !== null) {
                        if ((new Audio("")).canPlayType(m[1])) {
                            audio = new Audio(e.target.result);
                            loadAudio.call(self, audio, opts);
                        } else {
                            timbre.fn.doEvent(self, "error", ["cannot play: '" + m[1] + "'"]);
                        }
                    } else {
                        timbre.fn.doEvent(self, "error", ["file error"]);
                    }
                };
                reader.readAsDataURL(_.src);
            } else {        
                src = this.getAudioSrc(_.src);
                if (src !== "") {
                    loadAudio.call(this, new Audio(src), opts);
                }
                _.isloaded = false;
                _.buffer   = new Float32Array(0);
                _.phase    = 0;
            }
            return this;
        };
        
        return MozAudio;
    }());
    timbre.fn.register("-moz-audio", MozAudio);
    
    ///// objects/wav.js /////
    var WavDecoder = (function() {
        var WavDecoder = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(WavDecoder, {
            base: "ar-only",
            properties: {
                src: {
                    set: function(val) {
                        if (typeof val === "string") {
                            if (this._.src !== val) {
                                this._.src = val;
                                this._.isloaded = false;
                            }
                        }
                    },
                    get: function() { return this._.src; }
                },
                loop: {
                    set: function(val) { this._.loop = !!val; },
                    get: function() { return this._.loop; }
                },
                reversed: {
                    set: function(val) {
                        var _ = this._;
                        _.reversed = !!val;
                        if (_.reversed && _.phase === 0) {
                            _.phase = Math.max(0, _.buffer.length - 1);
                        }
                    },
                    get: function() { return this._.reversed; }
                },
                isLoaded: {
                    get: function() { return this._.isloaded; }
                },
                duration: {
                    get: function() { return this._.duration; }
                },
                currentTime: {
                    set: function(val) {
                        if (typeof val === "number") {
                            if (0 <= val && val <= this._.duration) {
                                this._.phase = (val / 1000) * this._.samplerate;
                            }
                        }
                    },
                    get: function() { return (this._.phase / this._.samplerate) * 1000; }
                }
            } // properties
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
    
    ///// objects/buddy.js /////
    var Buddy = (function() {
        var Buddy = function() {
            console.warn("Buddy is deprecated.");
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
    ///// objects/delay.js /////
    var Delay = (function() {
        var Delay = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Delay, {
            base: "ar-kr",
            properties: {
                delay: {
                    set: function(val) {
                        if (typeof val === "number") this._.delayTime = val;
                    },
                    get: function() { return this._.delayTime; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var bits, i, _;
            
            this._ = _ = {};
            bits = Math.ceil(Math.log(timbre.samplerate * 5) * Math.LOG2E)
            
            _.buffer = new Float32Array(1 << bits);
            _.buffer_mask = (1 << bits) - 1;
            _.pointerWrite = 0;
            _.pointerRead  = 0;
            
            i = 0;
            if (typeof _args[i] === "number") {
                _.delayTime = _args[i++];
            }
            
            var offset = _.delayTime * timbre.samplerate / 1000;
            _.pointerWrite = (_.pointerRead + offset) & _.buffer_mask;
            
            this.args = _args.slice(i).map(timbre);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, tmp, mul, add;
            var buffer, buffer_mask, pointerRead, pointerWrite;
            var i, imax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                
                buffer = _.buffer;
                buffer_mask  = _.buffer_mask;
                pointerWrite = _.pointerWrite;
                pointerRead  = _.pointerRead;
                
                tmp = timbre.fn.sumargsAR(this, args, seq_id);
                for (i = 0, imax = tmp.length; i < imax; ++i) {
                    buffer[pointerWrite] = tmp[i];
                    cell[i] = buffer[pointerRead] * mul + add;
                    pointerWrite = (pointerWrite + 1) & buffer_mask;
                    pointerRead  = (pointerRead  + 1) & buffer_mask;
                }
                _.pointerWrite = pointerWrite;
                _.pointerRead  = pointerRead;
                
                if (!_.ar) {
                    tmp = cell[0];
                    for (i = max; i--; ) {
                        cell[i] = tmp;
                    }
                }
            }
            return cell;
        };
        
        return Delay;
    }());
    timbre.fn.register("delay", Delay);
    
    ///// objects/sah.js /////
    var SampleAndHold = (function() {
        var SampleAndHold = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(SampleAndHold, {
            base: "ar-kr",
            properties: {
                sample: {
                    set: function(val) {
                        if (typeof val === "number") this._.sampleMax = val|0;
                    },
                    get: function() { return this._.sampleMax; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
    
            i = 0;
            if (typeof _args[i] === "number") {
                _.sampleMax = _args[i++]|0;
            } else {
                _.sampleMax = (timbre.samplerate / 10000)|0
            }
            _.sample = 0;
            _.hold = 0;
            
            this.args = _args.slice(i).map(timbre);
        };
        
        $this.bang = function() {
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, tmp, mul, add;
            var sample, hold;
            var i, imax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                sample = _.sample;
                hold   = _.hold;
                mul  = _.mul;
                add  = _.add;
                
                tmp = timbre.fn.sumargsAR(this, args, seq_id);
                for (i = 0, imax = tmp.length; i < imax; ++i) {
                    if (sample <= 0) {
                        hold = tmp[i];
                        sample += _.sampleMax;
                    }
                    cell[i] = hold * mul + add;
                    --sample;
                }
                _.sample = sample;
                _.hold   = hold;
                
                if (!_.ar) {
                    tmp = cell[0];
                    for (i = imax; i--; ) {
                        cell[i] = tmp;
                    }
                }
            }
            return cell;
        };
        
        return SampleAndHold;
    }());
    timbre.fn.register("s&h", SampleAndHold);
    
    ///// objects/pong.js /////
    var Pong = (function() {
        var Pong = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Pong, {
            base: "ar-kr"
        });
        
        
        var initialize = function(_args) {
            this.args = _args.map(timbre);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, mul, add;
            var x, y, i;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                
                if (_.ar) {
                    cell = timbre.fn.sumargsAR(this, args, seq_id);
                    
                    for (i = cell.length; i--; ) {
                        x = cell[i];
                        
                        if (x < -1.0) {
                            x = -x - 1.0;
                            y = x >> 1;
                            x = (y & 1) ? +1 - (x-(y<<1)) : -1 + (x-(y<<1));
                        } else if (1.0 < x) {
                            x = +x - 1.0;
                            y = x >> 1;
                            x = (y & 1) ? -1 + (x-(y<<1)) : +1 - (x-(y<<1));
                        }
                        
                        cell[i] = x * mul + add;
                    }
                } else {
                    x = timbre.fn.sumargsKR(this, args, seq_id);
                    
                    if (x < -1.0) {
                        x = -x - 1.0;
                        y = x >> 1;
                        x = (y & 1) ? +1 - (x-(y<<1)) : -1 + (x-(y<<1));
                    } else if (1.0 < x) {
                        x = +x - 1.0;
                        y = x >> 1;
                        x = (y & 1) ? -1 + (x-(y<<1)) : +1 - (x-(y<<1));
                    }
                    
                    x = x * mul + add;
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
            return cell;
        };
        
        return Pong;
    }());
    timbre.fn.register("pong", Pong);
    
    ///// objects/clip.js /////
    var Clip = (function() {
        var Clip = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Clip, {
            base: "ar-kr",
            properties: {
                min: {
                    set: function(val) {
                        if (typeof val === "number") this._.min = val;
                    },
                    get: function() { return this._.min; }
                },
                max: {
                    set: function(val) {
                        if (typeof val === "number") this._.max = val;
                    },
                    get: function() { return this._.max; }
                }
            } // properties
        });
        
        
        var initialize = function(_args) {
            var i, nums, _;
    
            this._ = _ = {};
            nums = [];
            
            i = 0;
            if (typeof _args[i] === "number") {
                nums.push(_args[i++]);
                if (typeof _args[i] === "number") {
                    nums.push(_args[i++]);
                }
            }
            switch (nums.length) {
            case 1:
                if (nums[0] < 0) {
                    _.min =  nums[0];
                    _.max = -nums[0];
                } else {
                    _.min = -nums[0];
                    _.max =  nums[0];
                }
                break;
            case 2:
                if (nums[0] < nums[1]) {
                    _.min = nums[0];
                    _.max = nums[1];
                } else {
                    _.min = nums[1];
                    _.max = nums[0];
                }
                break;
            default:
                _.min = -1;
                _.max = +1;
                break;
            }
            
            this.args = _args.slice(i).map(timbre);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var args, cell, mul, add;
            var min, max, x, i;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                mul  = _.mul;
                add  = _.add;
                min  = _.min;
                max  = _.max;
                
                if (_.ar) {
                    cell = timbre.fn.sumargsAR(this, args, seq_id);
                    
                    for (i = cell.length; i--; ) {
                        x = cell[i];
                        if (x < min) {
                            x = min;
                        } else if (max < x) {
                            x = max;
                        }
                        cell[i] = x * mul + add;
                    }
                } else {
                    x = timbre.fn.sumargsKR(this, args, seq_id);
                    if (x < min) {
                        x = min;
                    } else if (max < x) {
                        x = max;
                    }
                    x = x * mul + add;
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
            }
            return cell;
        };
        
        return Clip;
    }());
    timbre.fn.register("clip", Clip);
    
    ///// objects/easing.js /////
    var Easing = (function() {
        var Easing = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Easing, {
            base: "kr-ar",
            properties: {
                type: {
                    set: function(val) {
                        var f;
                        if (typeof val === "string") {
                            if ((f = Easing.Functions[val]) !== undefined) {
                                this._.type = val;
                                this._.func = f;
                            }
                        } else if (typeof val === "function") {
                            this._.type = "function";
                            this._.func = val;
                        }
                    },
                    get: function() { return this._.type; }
                },
                delay: {
                    set: function(val) {
                        if (typeof val === "number") this._.delay = val;
                    },
                    get: function() { return this._.delay; }
                },
                duration: {
                    set: function(val) {
                        if (typeof val === "number") this._.duration = val;
                    },
                    get: function() { return this._.duration; }
                },
                currentTime: {
                    get: function() { return this._.currentTime; }
                },
                start: {
                    set: function(val) {
                        if (typeof val === "number") this._.start = val;
                    },
                    get: function() { return this._.start; }
                },
                stop: {
                    set: function(val) {
                        if (typeof val === "number") this._.stop = val;
                    },
                    get: function() { return this._.stop; }
                },
                value: {
                    get: function() { return this._.value; }
                }
            } // properties
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
            var cell, x0, x1, dx, value, i, imax;
            var mul, add;
            
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
                        x0 = _.func(1);
                        _.value = (x0 * (_.stop-_.start) + _.start) * _.mul + _.add;
                        timbre.fn.doEvent(this, "ended");
                        continue;
                    }
                }
                if (_.status !== 2) {
                    x0 = (_.status === 1) ? _.func(_.x0) : 0;
                    
                    value = x0 * (_.stop - _.start) + _.start;
                    
                    if (_.ar) { // ar-mode
                        
                        mul = _.mul;
                        add = _.add;
                        
                        x0 = _.value;
                        x1 =   value;
                        dx = (x1 - x0) / cell.length;
                        
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = x0 * mul + add;
                            x0 += dx;
                        }
                    } else {    // kr-mode
                        x0 = value * _.mul + _.add;
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = x0;
                        }
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
    
    ///// objects/glide.js /////
    var Glide = (function() {
        var Glide = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Glide, {
            base: "kr-ar",
            properties: {
                value: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.status = 0;
                            _.start  = _.value;
                            _.stop   = val;
                            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
                            _.x0 = 0; _.dx = 0;
                        }
                    },
                    get: function() { return this._.value; }
                }
            }, // properties
            copies: [
                "ease.type", "ease.delay", "ease.duration","ease.currentTime",
                "ease.seq()", "ease.getFunction()", "ease.setFunction()"
            ]
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
    
    ///// objects/record.js /////
    var Record = (function() {
        var Record = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Record, {
            base: ["ar-only", "listener"],
            properties: {
                buffer: {
                    get: function() { return this._.buffer; }
                },
                recTime: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number" && val > 0) {
                            _.recTime = val;
                            _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
                        }
                    },
                    get: function() { return this._.recTime; }
                },
                interval: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "number") {
                            _.interval = val;
                            _.interval_samples = (timbre.samplerate * (val / 1000))|0;
                            if (_.interval_samples < _.buffer.length) {
                                _.interval_samples = _.buffer.length;
                                _.interval = _.buffer.length * timbre.samplerate / 1000;
                            }
                        }
                    },
                    get: function() { return this._.interval; }
                },
                currentTime: {
                    get: function() { return this._.index / timbre.samplerate * 1000; }
                },
                isRecording: {
                    get: function() { return this._.ison; }
                },
                overwrite: {
                    set: function(val) { this._.overwrite = !!val; },
                    get: function() { return this._.overwrite; }
                }
            } // properties
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
            _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
            
            if (typeof _args[i] === "number" && _args[i] > 0) {
                this.interval = _args[i++];
            } else {
                this.interval = Infinity;
            }
            if (typeof _args[i] === "function") {
                this.onrecorded = _args[i++];
            }
            this.args = _args.slice(i).map(timbre);
            
            _.index   =  0;
            _.samples =  0;
            _.currentTime = 0;
            _.overwrite = false;
            _.status = 0;
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
            _.samples = 0;
            _.status  = 0;
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
            var _ = this._;
            _.samples = 0;
            _.status  = 0;
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
            var args, cell, buffer, mul, add;
            var i, imax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);            
                buffer = _.buffer;
                mul  = _.mul;
                add  = _.add;
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                if (_.status === 0 && _.samples <= 0) {
                    _.status = 1;
                    _.index = _.currentTime = 0;
                    _.samples += _.interval_samples;
                    if (!_.overwrite) {
                        for (i = buffer.length; i--; ) {
                            buffer[i] = 0;
                        }
                    }
                }
                
                if (_.ison && _.status === 1) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        buffer[_.index++] = cell[i];
                        cell[i] = cell[i] * mul + add;
                    }
                    if (_.index >= buffer.length) {
                        onrecorded.call(this);
                        if (_.interval === Infinity) {
                            _.status = 2;
                            _.ison = false;
                            timbre.fn.doEvent(this, "ended");
                        } else {
                            _.status = 0;
                            timbre.fn.doEvent(this, "looped");
                        }
                    }
                } else {
                    for (i = cell.length; i--; ) {
                        cell[i] = cell[i] * mul + add;
                    }
                }
                _.samples -= cell.length;
            }
            return cell;
        };
        
        return Record;
    }());
    timbre.fn.register("rec", Record);
    
    ///// objects/buffer.js /////
    var Buffer = (function() {
        var Buffer = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Buffer, {
            base: "ar-only",
            properties: {
                buffer: {
                    set: function(val) {
                        var buffer, i, _ = this._;
                        if (typeof val === "object") {
                            if (val instanceof Float32Array) {
                                _.buffer = val;
                            } else if (val instanceof Array ||
                                       val.buffer instanceof ArrayBuffer) {
                                buffer = new Float32Array(val.length);
                                for (i = buffer.length; i--; ) {
                                    buffer[i] = val[i];
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
                },
                loop: {
                    set: function(val) { this._.loop = !!val; },
                    get: function() { return this._.loop; }
                },
                reversed: {
                    set: function(val) {
                        var _ = this._;
                        _.reversed = !!val;
                        if (_.reversed && _.phase === 0) {
                            _.phase = Math.max(0, _.buffer.length - 1);
                        }
                    },
                    get: function() { return this._.reversed; }
                },
                duration: {
                    get: function() { return this._.duration; }
                },
                currentTime: {
                    set: function(val) {
                        if (typeof val === "number") {
                            if (0 <= val && val <= this._.duration) {
                                this._.phase = (val / 1000) * this._.samplerate;
                            }
                        }
                    },
                    get: function() { return (this._.phase / this._.samplerate) * 1000; }
                }
            } // properties
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
    
    ///// objects/fft.js /////
    var FFT = (function() {
        var FFT = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(FFT, {
            base: ["ar-only", "listener"],
            properties: {
                size: {
                    get: function() { return this._.buffersize >> 1; }
                },
                window: {
                    set: function(value) {
                        var f;
                        if (typeof value === "string") {
                            var m = /([A-Z][a-z]+)(?:([01]\.?\d*))?/.exec(value);
                            if (m !== null) {
                                var name = m[1], a = m[2] !== undefined ? +m[2] : 0.25;
                                if ((f = timbre.utils.FFT.WindowFunctions[name]) !== undefined) {
                                    this._.window = name;
                                    this._.fft.setWindow(name, a);
                                }
                            }
                            
                        }
                    },
                    get: function() { return this._.window; }
                },
                interval: {
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
                },
                spectrum: {
                    get: function() { return this._.spectrum; }
                },
                noSpectrum: {
                    set: function(value) { this._.noSpectrum = !!value; },
                    get: function() { return this._.noSpectrum; }
                }
            } // properties
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
            
            _.fft = new timbre.utils.FFT(n);
            
            if (typeof _args[i] === "number") {
                this.interval = _args[i++];    
            } else {
                this.interval = 100;
            }
            
            if (typeof _args[i] === "string" &&
                (timbre.utils.FFT.WindowFunctions[_args[i]]) !== undefined) {
                this.window = _args[i++];
            } else {
                this.window = "Hann";
            }
            
            if (typeof _args[i] === "function") {
                this.onfft = _args[i++];
            }
            
            this.args = _args.slice(i).map(timbre);
            
            _.status   = 0;
            _.samples  = 0;
            _.buffersize = n;
            _.samplerate = timbre.samplerate;
            _.buffer = new Float32Array(n);
            _.index  = 0;
            
            _.noSpectrum = false;
            _.spectrum   = new Float32Array(n>>1);
        };
        
        $this.clone = function(deep) {
            var newone, _ = this._;
            newone = timbre("fft", _.buffersize);
            newone._.window   = _.window;
            newone._.interval = _.interval;
            newone._.interval_samples = _.interval_samples;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell, args, buffer, buffersize, mul, add;
            var i, imax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                args = this.args.slice(0);
                buffer     = _.buffer;
                buffersize = _.buffersize;
                mul  = _.mul;
                add  = _.add;
                
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    if (_.samples <= 0) {
                        if (_.status === 0) {
                            _.status = 1;
                            _.index  = 0;
                            _.samples += _.interval_samples;                        
                        }
                    }
                    if (_.status === 1) {
                        buffer[_.index++] = cell[i];
                        if (buffersize <= _.index) {
                            if (_.ison) process.call(this, buffer);
                            _.status = 0;
                        }
                    }
                    cell[i] = cell[i] * mul + add;
                    --_.samples;
                }
            }
            return cell;
        };
        
        var process = function(buffer) {
            var _ = this._;
            var fft, real, imag, spectrum;
            var sqrt, n, m, i, rval, ival, mag;
            
            fft = _.fft;
            
            fft.forward(buffer);
            real = fft.real;
            imag = fft.imag;
            
            // calc spectrum
            if (!_.noSpectrum) {
                sqrt = Math.sqrt;
                spectrum = _.spectrum;
                n = buffer.length;
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
        
        return FFT;
    }());
    timbre.fn.register("fft", FFT);
    
    
    ///// objects/interval.js /////
    var Interval = (function() {
        var Interval = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Interval, {
            base: ["kr-only", "timer"],
            properties: {
                interval: {
                    set: function(val) {
                        if (typeof val === "number" && val >= 0) {
                            this._.interval = val;
                        }
                    },
                    get: function() { return this._.interval; }
                },
                delay: {
                    set: function(val) {
                        if (typeof val === "number" && val >= 0) {
                            this._.delay = val;
                            this._.delaySamples = (timbre.samplerate * (val / 1000))|0;
                        }
                    },
                    get: function() { return this._.delay; }
                },
                count: {
                    set: function(val) {
                        if (typeof val === "number") this._.count = val;
                    },
                    get: function() { return this._.count; }
                },
                currentTime: {
                    get: function() { return this._.currentTime; }
                }
            } // properties
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.ison = false;
            _.samples = _.count = _.currentTime = 0;
            
            var i = 0;
            var nums = [];
            while (typeof _args[i] === "number") {
                nums.push(_args[i++]);
            }
            
            switch (nums.length) {
            case 1:
                this.delay    = 0;
                this.interval = nums[0];
                break;
            case 2:
                this.delay    = nums[0];
                this.interval = nums[1];
                break;
            default:
                this.delay    = 0;
                this.interval = 1000;
                break;
            }
            
            this.args = _args.slice(i).map(timbre);
        };
        
        $this.clone = function(deep) {
            return timbre("interval", this._.delay, this._.interval);
        };
        
        $this.bang = function() {
            var _ = this._;
            _.delaySamples = (timbre.samplerate * (_.delay / 1000))|0;
            _.samples = _.count = _.currentTime = 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                if (_.delaySamples > 0) {
                    _.delaySamples -= timbre.cellsize;
                }
                
                if (_.delaySamples <= 0) {
                    _.samples -= timbre.cellsize;
                    if (_.samples <= 0) {
                        _.samples += (timbre.samplerate * _.interval / 1000)|0;
                        var args = this.args.slice(0);
                        for (var i = 0, imax = args.length; i < imax; ++i) {
                            args[i].bang();
                        }
                        ++_.count;
                    }
                }
                _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
            }
            return this.cell;
        };
        
        return Interval;
    }());
    timbre.fn.register("interval", Interval);
    
    ///// objects/timeout.js /////
    var Timeout = (function() {
        var Timeout = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Timeout, {
            base: ["kr-only", "timer"],
            properties: {
                timeout: {
                    set: function(val) {
                        if (typeof val === "number" && val > 0) {
                            this._.timeout = val;
                            this._.timeout_samples = (timbre.samplerate * (val / 1000))|0;
                        }
                    },
                    get: function() { return this._.timeout; }
                },
                currentTime: {
                    get: function() { return this._.currentTime; }
                }
            } // properties
        });
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.ison = false;
            _.samples = _.currentTime = 0;
            
            var i = 0;
            if (typeof _args[i] === "number") {
                this.timeout = _args[i++];
            } else {
                this.timeout = 1000;
            }
            this.args = _args.slice(i).map(timbre);
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
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                _.samples -= timbre.cellsize;
                if (_.samples <= 0) {
                    _.samples = 0;
                    var args = this.args.slice(0);
                    for (var i = 0, imax = args.length; i < imax; ++i) {
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
    
    ///// objects/schedule.js /////
    var Schedule = (function() {
        var Schedule = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(Schedule, {
            base: ["kr-only", "timer"],
            properties: {
                mode: {
                    get: function() { return this._.mode; }
                },
                bpm: {
                    set: function(val) {
                        if (this._.mode === "bpm") {
                            if (typeof val === "number" && val > 0) {
                                changeBPM.call(this, val);
                            }
                        }
                    },
                    get: function() { return this._.bpm; }
                },
                currentTime: {
                    get: function() { return this._.currentTime; }
                }
            } // properties
        });
        
        var initialize = function(_args) {
            var _ = this._ = { ev:{} };
            
            _.bpm  = 0;
            _.mode = "msec";
            _.msec = 1;
            _.timetable = [];
            _.index = 0;
            _.ison  = false;
            _.currentTime = 0;
            _.loopcount   = 0;
            _.inseq   = false;
            _.updated = false;
            
            var i = 0;
            if (typeof _args[i] === "string") {
                setMode.call(this, _args[i++]);
            }
            if (typeof _args[i] === "object" && _args[i] instanceof Array) {
                this.append(_args[i++]);
            }
            if (typeof _args[i] === "boolean") {
                _.loop = _args[i++];
            } else {
                _.loop = false;
            }
        };
        
        $this.clone = function(deep) {
            var _ = this._;
            var newone = timbre("schedule");
            newone._.mode = _.mode;
            newone._.msec = _.msec;
            return newone;
        };
        
        var setMode = function(mode) {
            var m, _ = this._;
            if ((m = /^bpm\s*\(\s*(\d+(?:\.\d*)?)\s*(?:,\s*(\d+))?\s*\)/.exec(mode))) {
                _.mode = "bpm";
                _.bpm  = (m[1])|0;
                _.len  = ((m[2])|0) || 16;
                _.msec = timbre.utils.bpm2msec(_.bpm, _.len);
            }
        };
        
        var changeBPM = function(bpm) {
            var msec, x, tt, i, _ = this._;
            msec = timbre.utils.bpm2msec(bpm, _.len);
            x = msec / _.msec;
            
            tt = _.timetable;
            for (i = tt.length; i--; ) tt[i][0] *= x;
            
            _.currentTime *= x;
            _.msec = msec;
            _.bpm  = bpm;
        };
        
        $this.bang = function() {
            var _ = this._;
            _.index = _.currentTime = _.loopcount = 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        $this.append = function() {
            var _ = this._;
            
            var tt = _.timetable;
            var y  = tt[_.index];
            var result = [];
            
            for (var i = 0, imax = arguments.length; i < imax; ++i) {
                var items = arguments[i];
                for (var j = 0, jmax = items.length; j < jmax; ++j) {
                    var x = items[j];
                    if (typeof x !== "object") continue;
                    if (!(x instanceof Array)) continue;
                    if (x.length === 0) continue;
                    tt.push(x);
                    result.push(x);
                    
                    if (x.onappended) x.onappended(this, x[0]);
                    
                    if (y && x[0] < y[0]) _.index += 1;
                }
            }
            
            tt.sort(function(a, b) { return a[0] - b[0]; });
            timbre.fn.doEvent(this, "append", [result]);
            
            return this;
        };
        
        $this.remove = function(schedules) {
            var _ = this._;
            
            var tt = _.timetable, result = [];
            for (var i = arguments.length; i--; ) {
                var items = arguments[i];
                for (var j = items.length; j--; ) {
                    var xx = items[j];
                    if (typeof xx !== "object") continue;
                    if (!(xx instanceof Array)) continue;
                    if (xx.length === 0) continue;
                    
                    var y = tt[_.index];
                    
                    var cnt = 0;
                    for (var k = tt.length; k--; ) {
                        var x = tt[k];
                        if (x[0] === xx[0] && x[1] == xx[1]) {
                            tt.splice(k, 1);
                            result.unshift(x);
                            if (x.onremoved) x.onremoved(this, items[0]);
                            cnt += 1;
                        }
                    }
                    if (y && x[0] < y[0]) {
                        _.index -= cnt;
                    }
                }
            }
            timbre.fn.doEvent(this, "remove", [result]);
            
            return this;
        };
        
        $this.update = function() {
            var _ = this._;
            
            if (_.inseq) {
                _.updated = true;
            } else {
                var tt = _.timetable;
                tt.sort(function(a, b) { return a[0] - b[0]; });
                var i = tt.length - 1;
                var c = _.currentTime;
                var msec = _.msec;
                while (tt[i] && c < tt[i][0] * msec) i -= 1;
                _.index = i;
            }
        };
        
        $this.getSchedules = function(a, b) {
            var _ = this._;
            
            var tt = _.timetable, result = [];
            
            if (a === undefined) {
                a = 0;
                b = Infinity;
            } else if (b === undefined) {
                b = a;
            }
    
            if (a === b) {
                for (var i = tt.length; i--; ) {
                    var x = tt[i];
                    if (a === x[0]) {
                        result.unshift(x);
                    }
                }
            } else {
                for (var i = tt.length; i--; ) {
                    var x = tt[i];
                    if (a <= x[0] && x[0] < b) {
                        result.unshift(x);
                    }
                }
            }
            
            return result;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var schedule, target;
            
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var tt = _.timetable, msec = _.msec;
                
                _.inseq = true;
                while ((schedule = tt[_.index]) !== undefined) {
                    if (_.currentTime < schedule[0] * msec) {
                        break;
                    } else {
                        if ((target = schedule[1]) !== undefined) {
                            if (typeof target === "function") {
                                target.apply(schedule, schedule[2]);
                            } else if (timbre.fn.isTimbreObject(target)) {
                                target.bang();
                            }
                        }
                        ++_.index;
                    }
                }
                _.inseq = false;
                if (_.updated) this.update();
                if (_.index >= tt.length) {
                    var i = tt.length - 1;
                    if (_.loop) {
                        _.currentTime -= (tt[i][0] * msec) || 0;
                        _.index = 0;
                        timbre.fn.doEvent(this, "looped", [++_.loopcount]);
                    } else {
                        timbre.fn.doEvent(this, "ended");
                        var c = _.currentTime;
                        while (tt[i] && c <= tt[i][0] * msec) i -= 1;
                        if (i === tt.length-1) {
                            this.off();
                        } else if (i !== -1) {
                            _.index = i;
                        }
                    }
                }
                _.currentTime += (timbre.cellsize / timbre.samplerate) * 1000;
            }
            return this.cell;
        };
        
        return Schedule;
    }());
    timbre.fn.register("schedule", Schedule);
    
    ///// objects/mml.js /////
    var MML = (function() {
        var MML = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(MML, {
            base: ["kr-only", "timer"],
            properties: {
                mml: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "string") {
                            var track = _.tracks[_.selected];
                            if (track) {
                                track.compile(val);
                            } else {
                                _.tracks[_.selected] = new MMLTrack(this, val);
                            }
                        } else if (val === null) {
                            delete _.tracks[_.selected];
                            
                        } else if (typeof val === "object") {
                            for (var key in val) {
                                var x = val[key], track = _.tracks[key];
                                if (x === null) {
                                    delete _.tracks[key];
                                } else {
                                    if (track) {
                                        track.compile(x);
                                    } else {
                                        _.tracks[key] = new MMLTrack(this, x);
                                    }
                                }
                            }
                        }
                    },
                    get: function() {
                        var _ = this._;
                        return _.tracks[_.selected];
                    }
                },
                bpm: {
                    set: function(val) {
                        if (typeof val === "number") {
                            if (1 <= val && val <= 511) {
                                this._.bpm = val;
                            }
                        }
                    },
                    get: function() { return this._.bpm; }
                },
                selected: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "string" || typeof val === "number") {
                            if (_.tracks[val] instanceof MMLTrack) {
                                _.selected = val;
                            }
                        }
                    },
                    get: function() { return this._.selected; }
                },
                synth: {
                    set: function(val) {
                        if (timbre.fn.isTimbreObject(val)) {
                            this._.synth = val;
                        }
                    },
                    get: function() { return this._.synth; }
                },
                synthdef: {
                    set: function(val) {
                        var _ = this._;
                        if (typeof val === "function") {
                            _.synthdef = val;
                            var synth = _.synth;
                            if (synth) {
                                while (synth.args.length > 0) {
                                    var s = synth.args.shift();
                                    if (s && s.tnum) delete synth.keyon[ s.tnum ];
                                }
                            }
                        }
                    },
                    get: function() { return this._.synthdef; }
                },
                synthpoly: {
                    set: function(val) {
                        if (typeof val === "number") {
                            this._.synthpoly = val;
                        }
                    },
                    get: function() { return this._.synthpoly; }
                },
                currentTime: {
                    get: function() { return this._.currentTime; }
                }
            }
        });
        
        var EOM      = 0;
        var TONE     = 1;
        var STATUS   = 2;
        var CONTROL  = 3;
        var EXTERNAL = 4;
        
        var Command = function(name, sign, length, dot) {
            this.name = name;
            if ("><lovkqt&".indexOf(name) !== -1) {
                this.type = STATUS;
            } else if ("$[|]".indexOf(name) !== -1) {
                this.type = CONTROL;
            } else if (name.charAt(0) === "@") {
                this.type = EXTERNAL;
            } else {
                this.type = TONE;
            }
            this.sign = sign;
            if (length !== "") {
                this.length = length|0;
            } else {
                this.length = undefined;
            }
            this.dot = (dot || "").length;
            this.tie = false;
        };
        
        var ReMML = /([><lovkqt&$\[|\]cdefgabr]|@[_a-z]*)([-+#=]?)(\d*)(\.*)/ig;
        var Dots  = [1, 1.5, 1.75, 1.875];
        var atom = function(name, sign, octave) {
            var x = atom.table[name] || 0;
            if (sign === "-") {
                --x;
            } else if (sign === "+" || sign === "#") {
                ++x;
            }
            x += (octave + 1) * 12;
            return x;
        };
        atom.table = {c:0,d:2,e:4,f:5,g:7,a:9,b:11};
        
        var mmtof = function(mm) {
            return mmtof.table[mm] || 0;
        };
        mmtof.table = (function() {
            var result, dx, i, imax;
            result = new Float32Array(128 * 64);
            dx     = Math.pow(2, (1 / (12 * 64)));
            for (i = 0, imax = result.length; i < imax; ++i) {
                result[i] = 440 * Math.pow(dx, i - (69 * 64));
            }
            return result;
        }());
        
        
        var MMLTrack = (function() {
            var MMLTrack = function() {
                initialize.apply(this, arguments);
            }, $this = MMLTrack.prototype;
    
            var initialize = function(parent, mml) {
                this.parent = parent;
                this.mml = mml;
                
                this.octave   = 4;   // (0 .. 9)
                this.length   = 4;   // (1 .. 1920)
                this.dot      = 0;   // (0 .. 3)
                this.detune   = 0;   // (-8192 .. 8191)
                this.quantize = 6;   // (0 .. 8)
                this.volume   = 8;   // (0 .. 128)
                
                this.compile(mml);
            };
            
            $this.compile = function(mml) {
                var _ = this._;
                
                var m, re = ReMML, commands = [];
                while ((m = re.exec(mml)) !== null) {
                    commands.push(new Command(m[1], m[2], m[3], m[4]));
                }
                this.commands = commands;
                
                this.index      =  0;
                this.segnoIndex = {};
                this.loopStack  = [];
                
                var prev_tone = null, tie_cancel = false;
                var segnoIndex = this.segnoIndex;
                for (var i = 0, imax = commands.length; i < imax; ++i) {
                    var cmd = commands[i];
                    if (cmd.name === "$") {
                        var value = cmd.length;
                        if (value === undefined) value = 0;
                        segnoIndex[value] = i;
                    } else if (cmd.type === TONE) {
                        prev_tone  = cmd;
                        tie_cancel = false;
                    } else if (cmd.type === CONTROL) {
                        tie_cancel = true;
                    } else if (cmd.name === "&") {
                        if (prev_tone && !tie_cancel) prev_tone.tie = true;
                    }
                }
                
                sendkeyoff.call(this.parent);
            };
            
            $this.bang = function() {
                this.index     =  0;
                this.loopStack = [];
            };
    
            $this.segno = function(index) {
                index = this.segnoIndex[index];
                if (index !== undefined) this.index = index;
            };
            
            $this.fetch = function() {
                var cmd = this.commands[this.index++];
                
                if (cmd === undefined) {
                    return { type: EOM };
                }
                
                var value = cmd.length;
                
                if (cmd.type === STATUS) {
                    switch (cmd.name) {
                    case ">":
                        if (this.octave > 0) this.octave -= 1;
                        break;
                    case "<":
                        if (this.octave < 9) this.octave += 1;
                        break;
                    case "l":
                        if (0 <= value && value <= 1920) {
                            this.length = value;
                            this.dot    = cmd.dot;
                        }
                        break;
                    case "o":
                        if (0 <= value && value <= 9) {
                            this.octave = value;
                        }
                        break;
                    case "k":
                        if (0 <= value && value <= 8192) {
                            if (cmd.sign === "-") {
                                this.detune = -value;
                            } else {
                                this.detune = +value;
                            }
                        }
                        break;
                    case "q":
                        if (0 <= value && value <= 8) {
                            this.quantize = value;
                        }
                        break;
                    case "v":
                        if (0 <= value && value <= 128) {
                            this.volume = cmd.length;
                        }
                        break;
                    case "t":
                        if (1 <= value && value <= 511) {
                            this.parent._.bpm = value;
                            timbre.fn.doEvent(this.parent, "bpm", [value]);
                        }
                        break;
                    }
                    cmd = this.fetch();
                    
                } else if (cmd.type === CONTROL) {
                    
                    var loopStack = this.loopStack;
                    
                    switch (cmd.name) {
                    case "[": // loop begin
                        if (value === undefined) value = 2;
                        loopStack.push({
                            count:value, begin:this.index, end:null
                        });
                        break;
                        
                    case "]": // loop end
                        if (loopStack.length !== 0) {
                            var stackTop = loopStack[loopStack.length - 1];
                            if (stackTop.end === null) {
                                stackTop.end = this.index;
                                if (typeof value === "number") {
                                    stackTop.count = value|0;
                                }
                            }
                            if (stackTop.count <= 1) {
                                loopStack.pop();
                            } else {
                                --stackTop.count;
                                this.index = stackTop.begin;
                            }
                        }
                        break;
                        
                    case "|": // loop exit
                        if (loopStack.length !== 0) {
                            var stackTop = loopStack[loopStack.length - 1];
                            if (stackTop.count <= 1) {
                                this.index = stackTop.end;
                                loopStack.pop();
                            }
                        } else {
                            return { type: EOM };
                        }
                        break;
                    }
                    cmd = this.fetch();
                }
                
                return cmd;
            };
            
            return MMLTrack;
        }());
        
        
        var initialize = function(_args) {
            var _ = this._ = {};
            
            _.bpm     = 120; // (1 .. 511)
            _.samples = Infinity;
            _.keyons  = [];
            _.keyons.samples = 0;
            _.tie       = false;
            _.synth     = null;
            _.synthdef  = null;
            _.synthpoly = 4;
            
            var tracks = {};
            if (typeof _args[0] === "object") {
                var mmls = _args[0];
                for (var key in mmls) {
                    tracks[key] = new MMLTrack(this, mmls[key]);
                }
            } else {
                for (var i = 0, imax = _args.length; i < imax; ++i) {
                    tracks[i] = new MMLTrack(this, _args[i]);
                }
            }
            
            _.tracks       = tracks;
            _.selected     = 0;
            _.endedEvent  = false;
            
            if (tracks[_.selected]) _.samples = 0;
            
            this.onmml = onmml;
        };
        
        var sendkeyoff = function() {
            var _ = this._;
            
            var keyons = _.keyons;
            while (keyons.length) {
                timbre.fn.doEvent(this, "mml", [
                    { cmd:"keyoff", tnum:keyons.shift() }
                ]);
            }
            _.samples += keyons.samples;
            keyons.samples = 0;
        };
        
        var onmml = function(opts) {
            var _ = this._
            var synth    = _.synth;
            var synthdef = _.synthdef;
            
            if (!synth || !synthdef) return;
            if (!synth.keyon) synth.keyon = {};
            
            if (opts.cmd === "keyon") {
                var x = synth.keyon[opts.tnum];
                if (x === undefined) {
                    x = synthdef(opts.freq, opts);
                    if (x === undefined) return;
                    x.tnum = opts.tnum;
                    synth.keyon[x.tnum] = x;
                    synth.append(x);
                } else {
                    x.removeFrom(synth).appendTo(synth); // LRU
                }
                if (x.keyon) x.keyon(opts);
                if (synth.args.length > _.synthpoly) {
                    delete synth.keyon[ synth.args.shift().tnum ];
                }
            } else if (opts.cmd === "keyoff") {
                var x = synth.keyon[opts.tnum];
                if (x !== undefined && x.keyoff) x.keyoff(opts);
            }
        };
        
        $this.bang = function() {
            var _ = this._;
    
            sendkeyoff.call(this);
            
            var track = _.tracks[_.selected];
            if (track) {
                track.bang();
                if (_.samples > 0) _.samples = 0;
                _.endedEvent = false;
            } else {
                _.samples = Infinity;
            }
            _.tie = false;
            
            timbre.fn.doEvent(this, "bang");
            
            return this;
        };
        
        $this._.on = function() {
            this.bang();
        };
        
        $this.segno = function(index) {
            var _ = this._;
            var track = _.tracks[_.selected];
            if (track) {
                track.segno(index);
            }
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
    
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                var keyons = _.keyons;
                
                _.sentinel = false;
                while (_.samples <= 0) {
                    
                    // keyoff
                    if (keyons.length > 0 && !_.tie) {
                        sendkeyoff.call(this);
                        continue;
                    }
                    while (true) { // REDO
                        var track = _.tracks[_.selected];
                        if (track === undefined) break;
                        
                        var cmd = track.fetch();
                        
                        if (cmd.type === TONE) {
                            var dot = cmd.dot;
                            if (dot === 0 && cmd.length === undefined) {
                                dot = track.dot;
                            }
                            var length = cmd.length;
                            if (length === undefined) length = track.length;
                            
                            if (cmd.name !== "r") {
                                var m    = atom(cmd.name, cmd.sign, track.octave);
                                var freq = mmtof((m << 6) + track.detune);
                                if (_.tie) {
                                    m = _.keyons[_.keyons.length - 1];
                                } else {
                                    _.keyons.push(m);
                                }
                                
                                // send keyon
                                timbre.fn.doEvent(this, "mml", [{
                                    cmd   : "keyon", freq  : freq,
                                    tnum  : m      , volume: track.volume,
                                    length: length , tie   : _.tie
                                }]);
                                _.tie = cmd.tie;
                                
                            } else {
                                m = 0;
                                _.tie = false;
                            }
                            if (length ===  0) continue; // REDO
                            
                            var samples = timbre.samplerate * (60 / _.bpm) * (4 / length);
                            samples *= Dots[dot] || 1;
                            
                            if (m !== 0 && !_.tie) {
                                var keyonsamples = (samples * (track.quantize / 8))|0;
                                keyons.samples = (samples - keyonsamples);
                                _.samples += keyonsamples;
                            } else {
                                _.samples += samples|0;
                            }
                            
                        } else if (cmd.type === EXTERNAL) {
                            // send external
                            var value = null;
                            if (cmd.length !== undefined) {
                                value = cmd.length;
                                if (cmd.sign === "-") value *= -1;
                            }
                            timbre.fn.doEvent(this, "external", [
                                { cmd:cmd.name, value:value }
                            ]);
                            
                        } else if (cmd.type === EOM) {
                            if (_.sentinel) {
                                _.samples = Infinity;
                            } else {
                                _.sentinel   = true;
                                _.endedEvent = true;                            
                                if (track.segnoIndex[0] === undefined) {
                                    timbre.fn.doEvent(this, "ended");
                                    if (_.endedEvent) _.samples = Infinity;
                                } else {
                                    track.index = track.segnoIndex[0];
                                    timbre.fn.doEvent(this, "segno");
                                }
                                _.endedEvent = false;
                            }
                        }
                        break;
                    }
                }
                _.samples -= timbre.cellsize;
                _.currentTime += (timbre.cellsize / timbre.samplerate) * 1000;
            }
            
            return this.cell;
        };
        
        return MML;
    }());
    timbre.fn.register("mml", MML);
    
    ///// objects/timbre.js /////
    var AwesomeTimbre = (function() {
        var AwesomeTimbre = function() {
            initialize.apply(this, arguments);
        }, $this = timbre.fn.buildPrototype(AwesomeTimbre, {
            base: "ar-kr",
            properties: {
                version: {
                    set: function(val) {
                        var synth, _ = this._;
                        if (typeof val === "string") {
                            if (val !== _.version) {
                                if ((synth = AwesomeTimbre.Versions[val]) !== undefined) {
                                    _.version = val;
                                    if (_.synth && _.synth.destroy) {
                                        _.synth.destroy(this);
                                    }
                                    _.synth = synth(this);
                                }
                            }
                        }
                    },
                    get: function() { return this._.version; }
                }
            } // properties
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
        ///// utils/converters.js /////
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
            var tone_table = ["c", "c+", "d", "d+", "e", "f", "f+", "g", "g+", "a", "a+", "b"];
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
            var re = /^([CDEFGABcdefgab])([-+#b]?)([0-9]?)$/;
            var map = {c:0,d:2,e:4,f:5,g:7,a:9,b:11};
            var atom = function(a) {
                var m, result = 0;
                if ((m = a.match(re)) !== null) {
                    result = map[m[1].toLowerCase()];
                    switch (m[2]) {
                    case "+": case "#":
                        ++result;
                        break;
                    case "-": case "b":
                        --result;
                        break;
                    }
                    result += 12 * ((m[3]|0) + 2 + atom.octaveshift);
                }
                return result;
            };
            atom.octaveshift = 0;
            return atom;
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
        
        utils.num2db = function(num) {
            return -20 * Math.log(num) * Math.LOG10E;
        };
        
        utils.db2num = function(db) {
            return Math.pow(10, (db / -20));
        };
        
        utils.$exports["converter"] = [
            "mtof", "ftom", "mtoa", "ftoa", "atom", "atof",
            "bpm2msec", "msec2bpm", "msec2hz", "msec2hz", "bpm2hz", "hz2bpm",
        ];
        
        ///// utils/range.js /////
        utils.range = function() {
            var start, stop, step;
            var i, result = [];
            
            switch (arguments.length) {
            case 1:
                start = 0;
                stop  = arguments[0]|0;
                step  = 1;
                break;
            case 2:
                start = arguments[0]|0;
                stop  = arguments[1]|0;
                step  = 1;
                break;
            case 3:
                start = arguments[0]|0;
                stop  = arguments[1]|0;
                step  = arguments[2]|0;
                break;
            }
            if (step > 0) {
                for (i = start; i < stop; i += step) {
                    result.push(i);
                }
            } else {
                for (i = start; i > stop; i += step) {
                    result.push(i);
                }
            }
            return result;
        };
        
        ///// utils/random.js /////
        (function(random) {
            
            var Random = function(seed) {
                var x = new Uint32Array(32);
                
                this.seed = function(seed) {
                    var i;
                    
                    if (typeof seed !== "number") {
                        seed = (+new Date() * 1000) + Math.random() * 1000;
                    }
                    seed |= 0;
                    x[0] = 3;
                    x[1] = seed;
                    for (i = 2; i <= 31; ++i) {
                        seed = (16807 * seed) & 0x7FFFFFFF;
                        x[i] = seed;
                    }
                    for (i = 310; i--; ) this.next();
                };
                
                this.next = function() {
                    var n = x[0];
                    n = (n === 31) ? 1 : n + 1;
                    
                    x[0] = n;
                    x[n] += (n > 3) ? x[n-3] : x[n+31-3];
                    
                    return (x[n]>>>1) / 2147483647;
                };
                
                this.seed(seed);
            };
            random.Random = Random;
            
            var rand = new Random();
            
            var seed = function(seed) {
                rand.seed(seed);
            };
            random.seed = seed;
            
            var rangerange = function() {
                return choice(utils.range.apply(null ,arguments));
            };
            random.randrange = rangerange;
            
            var randint = function(a, b) {
                return (a + (b - a + 1) * rand.next())|0;
            };
            random.randint = randint;
            
            var choice = function(seq) {
                return seq[(seq.length * rand.next())|0];
            };
            random.choice = choice;
            
            var shuffle = function(x, seed) {
                var r;
                if (typeof seed === "number") {
                    r = new Random(seed);
                } else r = rand;
                
                x.sort(function() { return r.next() - r.next(); });
                return x;
            };
            random.shuffle = shuffle;
            
            var random = function() {
                return rand.next();
            };
            random.random = random;
            
            var uniform = function(a, b) {
                return a + (b - a) * rand.next();
            };
            random.uniform = uniform;
            
            utils.$exports["random"] = [ "random" ];
            
        }( utils.random = {} ));
        
        
        ///// utils/fft.js /////
        var FFT = (function() {
            var FFT = function() {
                initialize.apply(this, arguments);
            }, $this = FFT.prototype;
            
            var FFT_PARAMS = {
                get: function(n) {
                    return FFT_PARAMS[n] || (function() {
                        var bitrev = (function() {
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
                        var i, k = Math.floor(Math.log(n) / Math.LN2);
                        var sintable = new Float32Array((1<<k)-1);
                        var costable = new Float32Array((1<<k)-1);
                        var PI2 = Math.PI * 2;
                        
                        for (i = sintable.length; i--; ) {
                            sintable[i] = Math.sin(PI2 * (i / n));
                            costable[i] = Math.cos(PI2 * (i / n));
                        }
                        return FFT_PARAMS[n] = {
                            bitrev: bitrev, sintable:sintable, costable:costable
                        };
                    }());
                }
            };
            
            var initialize = function(n) {
                n = (typeof n === "number") ? n : 512;
                n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);
                
                this.length  = n;
                this.buffer  = new Float32Array(n);
                this.real    = new Float32Array(n);
                this.imag    = new Float32Array(n);
                this._real   = new Float32Array(n);
                this._imag   = new Float32Array(n);
                this._window = new Float32Array(n);
                for (var i = n; i--; ) this._window[i] = 1;
                
                var params = FFT_PARAMS.get(n);
                this._bitrev   = params.bitrev;
                this._sintable = params.sintable;
                this._costable = params.costable;
            };
            
            $this.setWindow = function(name, alpha) {
                var f = FFT.WindowFunctions[name];
                if (f !== undefined) {
                    var w = this._window, n = 0, N = this.length;
                    alpha = typeof alpha === "number" ? alpha : 0.25;
                    for (; n < N; ++n) w[n] = f(n, N, alpha);
                }
            };
            
            $this.forward = function(_buffer) {
                var buffer, window, real, imag, bitrev, sintable, costable;
                var i, j, n, k, k2, h, d, c, s, ik, dx, dy;
                
                buffer = this.buffer;
                real   = this.real;
                imag   = this.imag;
                window = this._window;
                bitrev = this._bitrev;
                sintable = this._sintable;
                costable = this._costable;
                n = buffer.length;
                
                for (i = n; i--; ) {
                    buffer[i] = _buffer[i] * window[i];
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
                return {real:real, imag:imag};
            };
            
            $this.inverse = function(_real, _imag) {
                var buffer, real, imag, bitrev, sintable, costable;
                var i, j, n, k, k2, h, d, c, s, ik, dx, dy, t;
                
                buffer = this.buffer;
                real   = this._real;
                imag   = this._imag;
                bitrev = this._bitrev;
                sintable = this._sintable;
                costable = this._costable;
                n = buffer.length;
                
                for (i = n; i--; ) {
                    j = bitrev[i];
                    real[i] = +_real[j];
                    imag[i] = -_imag[j];
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
                
                for (i = n; i--; ) {
                    buffer[i] = real[i] / n;
                }
                return buffer;
            };
            
            return FFT;
        }());
        utils.FFT = FFT;
        
        FFT.WindowFunctions = (function() {
            var PI   = Math.PI;
            var PI2  = Math.PI * 2;
            var abs  = Math.abs;
            var pow  = Math.pow;
            var cos  = Math.cos;
            var sin  = Math.sin;
            var sinc = function(x) { return sin(PI*x) / (PI*x); };
            var E    = Math.E;
            
            return {
                Rectangular: function() {
                    return 1;
                },
                Hann: function(n, N) {
                    return 0.5 * (1 - cos((PI2*n) / (N-1)));
                },
                Hamming: function(n, N) {
                    return 0.54 - 0.46 * cos((PI2*n) / (N-1));
                },
                Tukery: function(n, N, a) {
                    if ( n < (a * (N-1))/2 ) {
                        return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - 1)) );
                    } else if ( (N-1)*(1-(a/2)) < n ) {
                        return 0.5 * ( 1 + cos(PI * (((2*n)/(a*(N-1))) - (2/a) + 1)) );
                    } else {
                        return 1;
                    }
                },
                Cosine: function(n, N) {
                    return sin((PI*n) / (N-1));
                },
                Lanczos: function(n, N) {
                    return sinc(((2*n) / (N-1)) - 1);
                },
                Triangular: function(n, N) {
                    return (2/(N+1)) * (((N+1)/2) - abs(n - ((N-1)/2)));
                },
                Bartlett: function(n, N) {
                    return (2/(N-1)) * (((N-1)/2) - abs(n - ((N-1)/2)));
                },
                Gaussian: function(n, N, a) {
                    return pow(E, -0.5 * pow((n - (N-1) / 2) / (a * (N-1) / 2), 2));
                },
                BartlettHann: function(n, N) {
                    return 0.62 - 0.48 * abs((n / (N-1)) - 0.5) - 0.38 * cos((PI2*n) / (N-1));
                },
                Blackman: function(n, N, a) {
                    var a0 = (1 - a) / 2, a1 = 0.5, a2 = a / 2;
                    return a0 - a1 * cos((PI2*n) / (N-1)) + a2 * cos((4*PI*n) / (N-1));
                }
            };
        }());
        
        
        ///// utils/wavelet.js /////
        utils.wavb = function(src) {
            var lis = new Float32Array(1024);
            var n = src.length >> 1;
            if (n ===  2 || n ===  4 || n ===  8 || 
                n === 16 || n === 32 || n === 64) {
                for (var i = 0, k = 0; i < n; ++i) {
                    var x = parseInt(src.substr(i * 2, 2), 16);
                    x = (x & 0x80) ? (x-256) / 128.0 : x / 127.0;
                    for (var j = 1024 / n; j--; ) lis[k++] = x;
                }
            }
            return lis;
        };
        
        utils.wavc = function(src) {
            var lis = new Float32Array(1024);
            if (src.length === 8) {
                var color = parseInt(src, 16);
                var bar   = new Float32Array(8);
                var PI2   = Math.PI * 2, sin = Math.sin, abs = Math.abs;
                var i, j;
                
                bar[0] = 1;
                for (i = 0; i < 7; ++i, color >>= 4)
                    bar[i+1] = (color & 0x0f) / 16;
                
                var maxx = 0, absx;
                for (i = 0; i < 8; ++i) {
                    var x = 0, dx = (i+1) / 1024;
                    for (j = 0; j < 1024; ++j) {
                        lis[j] += sin(PI2 * x) * bar[i];
                        x += dx;
                        if (maxx < (absx = abs(lis[j]))) maxx = absx;
                    }
                }
                if (maxx > 0) for (i = 1024; i--; ) lis[i] /= maxx;
            }
            return lis;
        };
        
        ///// utils/binary.js /////
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
        
            var node_load = function(src, callback) {
                var m;
                if (typeof src === "string") {
                    if ((m = /^(https?):\/\/(.*?)(\/.*)?$/.exec(src)) !== null) {
                        node_load_from_web(m[1], {host:m[2], path:m[3]||""}, callback);
                    } else {
                        node_load_from_fs(src, callback);
                    }
                }
            };
            
            var node_load_from_web = function(protocol, uri, callback) {
                require(protocol).get(uri, function(res) {
                    var bytes, index;
                    if (res.statusCode === 200) {
                        bytes = new ArrayBuffer(res.headers["content-length"]);
                        index = 0;
                        res.on("data", function(chunk) {
                            var i, imax;
                            for (i = 0, imax = chunk.length; i < imax; ++i) {
                                bytes[index++] = chunk[i];
                            }
                        });
                        res.on("end", function() {
                            send(callback, bytes);
                        });
                    }
                });
            };
            
            var node_load_from_fs = function(src, callback) {
                require("fs").readFile(src, function (err, data) {
                    var bytes, i;
                    if (err) {
                        console.warn(err);
                        return;
                    }
                    bytes = new ArrayBuffer(data.length);
                    for (i = bytes.byteLength; i--; ) {
                        bytes[i] = data[i];
                    }
                    send(callback, bytes);
                });
            };
            
            binary.load = function(src, callback) {
                if (typeof callback === "function" || typeof callback === "object") {
                    if (timbre.platform === "web") {
                        web_load(src, callback);
                    } else if (timbre.platform === "node") {
                        node_load(src, callback);
                    }
                }        
            };
            
        }( utils.binary = {} ));
        
        ///// utils/wav.js /////
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
        
        ///// utils/exports.js /////
        (function(utils) {
            
            var _export = function(name) {
                var list, items, i, x, res = [];
                
                if ((list = utils.$exports[name]) !== undefined) {
                    for (i = list.length; i--; ) {
                        x = list[i];
                        timbre.context[x] = utils[x];
                        res.unshift(x);
                    }
                } else {
                    items = name.split(".");
                    for (x = utils; x && items.length; x = x[name]) {
                        name = items.shift();
                    }
                    if (x && items.length === 0) {
                        timbre.context[name] = x;
                        res = [name];
                    }
                }
                
                return res.join(",");
            };
            
            
            utils.exports = function() {
                var i, imax, x, res = [];
                for (i = 0, imax = arguments.length; i < imax; i++) {
                    if (typeof arguments[i] === "string") {
                        x = _export(arguments[i]);
                        if (x) res = res.concat(x);
                    }
                }
                return res.join(",");
            };
        }(utils));
        return utils;
    }(timbre));
    
    typeof window === "object" && (function(window, timbre) {
        ///// window/mutekitimer.js /////
        var MutekiTimer = (function() {
            var MutekiTimer = function() {
                initialize.apply(this, arguments);
            }, $this = MutekiTimer.prototype;
            
            var TIMER_PATH = (function() {
                var src = "var t=0;onmessage=function(e){clearInterval(t);if(i=e.data)t=setInterval(function(){postMessage(0)},i)}";
                
                var blob = null;
                if (window.Blob) {
                    try { blob = new Blob([src], {type:"text\/javascript"});
                    } catch (e) { blob = null; }
                }
                
                if (blob === null) {
                    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                    if (BlobBuilder) {
                        var builder = new BlobBuilder();
                        builder.append(src);
                        blob = builder.getBlob();
                    }
                }
                
                if (blob !== null) {
                    var URL = window.URL || window.webkitURL;
                    return URL.createObjectURL(blob);
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
                    if (/firefox/i.test(window.navigator.userAgent)) {
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
        
        ///// window/player.js /////
        var WebKitPlayer = function(sys) {
            
            this.ctx = new webkitAudioContext();
            var samplerate = this.ctx.sampleRate;
            
            this.setup = function() {
                timbre.fn._setupTimbre(samplerate);
                this.streamsize = timbre.streamsize;
                
                if (timbre.samplerate === samplerate) {
                    this.onaudioprocess = function(e) {
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
                    var dx = timbre.samplerate / samplerate;
                    this.onaudioprocess = function(e) {
                        var inL, inR, outL, outR, outLen;
                        var streamsize, x, prevL, prevR;
                        var index, delta, x0, x1, xx;
                        var i, imax;
                        
                        inL = sys.L;
                        inR = sys.R;
                        outL = e.outputBuffer.getChannelData(0);
                        outR = e.outputBuffer.getChannelData(1);
                        outLen = outL.length;
                        
                        streamsize = this.streamsize;
                        x = this.x;
                        prevL = this.prevL;
                        prevR = this.prevR;
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
                        this.x = x;
                        this.prevL = prevL;
                        this.prevR = prevR;
                    }.bind(this);
                }
                
                return this;
            };
            
            this.on = function() {
                this.x = this.streamsize;
                this.prevL = this.prevR = 0;
                this.src = this.ctx.createBufferSource();
                this.node = this.ctx.createJavaScriptNode(sys.streamsize, 1, sys.channels);
                this.node.onaudioprocess = this.onaudioprocess;
                this.src.noteOn(0);
                this.src.connect(this.node);
                this.node.connect(this.ctx.destination);
            };
            this.off = function() {
                this.src.disconnect();
                this.node.disconnect();
                this.src = this.node = null;
            };
            
            return this;
        };
        
        var MozPlayer = function(sys) {
            this.timer = new MutekiTimer();
            
            this.setup = function() {
                timbre.fn._setupTimbre(44100);
                
                this.audio = new Audio();
                this.audio.mozSetup(timbre.channels, timbre.samplerate);
                timbre.samplerate = this.audio.mozSampleRate;
                timbre.channels   = this.audio.mozChannels;
        
                this.interleaved = new Float32Array(timbre.streamsize * timbre.channels);
                
                this.onaudioprocess = function() {
                    
                    var mozCurrentSampleOffset = this.audio.mozCurrentSampleOffset();
                    
                    var interleaved = this.interleaved;
                    this.audio.mozWriteAudio(interleaved);
                    sys.process();
                    
                    var inL = sys.L, inR = sys.R;
                    var i = interleaved.length, j = inL.length;
                    
                    while (j--) {
                        interleaved[--i] = inR[j];            
                        interleaved[--i] = inL[j];
                    }
                }.bind(this);
                
                return this;
            };
            
            this.on = function() {
                var interval = timbre.streamsize / timbre.samplerate * 1000;
                this.timer.setInterval(this.onaudioprocess, interval);
            };
            
            this.off = function() {
                var interleaved = this.interleaved;
                for (var i = interleaved.length; i--; ) {
                    interleaved[i] = 0.0;
                }
                this.timer.clearInterval();
            }
            
            return this;
        };
        
        if (typeof webkitAudioContext === "function") {
            // Chrome
            timbre.env = "webkit";
            timbre.sys.bind(WebKitPlayer);
        } else if (typeof webkitAudioContext === "object") {
            // Safari
            timbre.env = "webkit";
            timbre.sys.bind(WebKitPlayer);
        } else if (typeof Audio === "function" && typeof (new Audio).mozSetup === "function") {
            // Firefox
            timbre.env = "moz";
            timbre.sys.bind(MozPlayer);
        }
        
        ///// window/utils.js /////
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
        
        ///// window/exports.js /////
        timbre.platform = "web";
        timbre.context  = window;
        
        // start message
        (function() {
            var x = [];
            x.push("timbre.js "  + timbre.VERSION);
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
        ///// worker/wav.js /////
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
        
        ///// worker/exports.js /////
        worker.onmessage = function(e) {
            var func = worker.actions[e.data.action];
            if (func !== undefined) func(e.data);
        };
        
        timbre.platform = "web";
        timbre.context  = worker;
    }(context, timbre));
    
    typeof process === "object" && process.title === "node" && (function(node, timbre) {
        ///// node/exports.js /////
        timbre.platform = "node";
        timbre.context  = global;
        
        module.exports = timbre;
        
        ///// node/player.js /////
        var ctimbre = null;
        
        var CTimbrePlayer = function(sys) {
            var self = this;
            
            this.setup = function() {
                var samplerate, dx, onaudioprocess;
                
                timbre.fn._setupTimbre(44100);        
                this.jsnode = new ctimbre.JavaScriptOutputNode(timbre.streamsize);
                samplerate = this.jsnode.sampleRate;
                this.streamsize = timbre.streamsize;
                console.log("streamsize", this.streamsize);
                
                if (timbre.samplerate === samplerate) {
                    onaudioprocess = function(e) {
                        var inL, inR, outL, outR, i;
                        sys.process();
                        
                        inL  = sys.L;
                        inR  = sys.R;
                        outL = e.getChannelData(0);
                        outR = e.getChannelData(1);
                        for (i = e.bufferSize; i--; ) {
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
                        outL = e.getChannelData(0);
                        outR = e.getChannelData(1);
                        outLen = outL.length;
                        
                        streamsize = self.streamsize;
                        x = self.x;
                        prevL = self.prevL;
                        prevR = self.prevR;
                        for (i = 0, imax = e.bufferSize; i < imax; ++i) {
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
                this.jsnode.onaudioprocess = onaudioprocess;
                
                return this;
            };
            
            this.on = function() {
                this.x = this.streamsize;
                this.prevL = this.prevR = 0;
                this.jsnode.start();
            };
            this.off = function() {
                this.jsnode.stop();
            };
        };
        
        var NopPlayer = function(sys) {
            this.timerId = 0;
            
            this.setup = function() {
                timbre.fn._setupTimbre(44100);
                
                this.interval = timbre.streamsize * 1000 / timbre.samplerate;
                
                this.onaudioprocess = function() {
                    sys.process();
                }.bind(this);
                
                return this;
            };
            
            this.on = function() {
                if (this.timerId !== 0) {
                    clearInterval(this.timerId);
                }
                this.timerId = setInterval(this.onaudioprocess, this.interval);
            };
            
            this.off = function() {
                if (this.timerId !== 0) {
                    clearInterval(this.timerId);
                }
            }
            
            return this;
        };
        
        try {
            ctimbre = require("ctimbre");
        } catch (e) {
            ctimbre = null;
        }
        
        if (ctimbre !== null) {
            timbre.env = "ctimbre";
            timbre.sys.bind(CTimbrePlayer);
        } else {
            timbre.env = "nop";
            timbre.sys.bind(NopPlayer);
        }
    }(context, timbre));
    
    timbre.isEnabled = !!timbre.sys._.impl;
            
    return timbre;
}(this));
