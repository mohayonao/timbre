/**
 * timbre 0.0.0 / JavaScript Library for Objective Sound Programming
 * build: Sun May 20 2012 16:09:15 GMT+0900 (JST)
 */
;
var timbre = (function(context, timbre) {
    "use strict";
    
    var timbre = function() {
        return timbre.fn.init.apply(timbre, arguments);
    };
    timbre.VERSION    = "0.0.0";
    timbre.BUILD      = "Sun May 20 2012 16:09:15 GMT+0900 (JST)";
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
            timbre.fn.init_set.call(instance.args);
            
            if (!instance._ev) {
                instance._ev = {};
            }
            if (typeof instance._ar !== "boolean") {
                instance._ar = false;
            }
            instance._seq = instance.seq;
            
            if (instance._post_init) {
                instance._post_init();
            }
            
            return instance;
        };
        
        var noneseq = (function() {
            var nonecell = new Float32Array(timbre.cellsize);
            return function() { return nonecell; };
        }());
        
        var defaults = {};
        defaults.play = function() {
            this.dac.on();
        };
        defaults.pause = function() {
            this.dac.off();
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
        
        defaults.properties = {};
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
    
    
    
    var Dac = (function() {
        var Dac = function() {
            initialize.apply(this, arguments);
        }, $this = Dac.prototype;
        
        Object.defineProperty($this, "dac", { get: function() { return this; } });
        
        Object.defineProperty($this, "amp", {
            set: function(value) {
                if (typeof value === "number") {
                    this._amp = value;
                }
            },
            get: function() {
                return this._amp;
            }
        });
        Object.defineProperty($this, "pan", {
            set: function(value) {
                if (typeof value === "number") {
                    this._pan  = value;
                    this._panL = Math.cos(0.5 * Math.PI * this._pan);
                    this._panR = Math.sin(0.5 * Math.PI * this._pan);
                }
            },
            get: function() {
                return this._pan;
            }
        });
        Object.defineProperty($this, "isOn", {
            get: function() {
                return this._ison;
            }
        });
        Object.defineProperty($this, "isOff", {
            get: function() {
                return !this._ison;
            }
        });
        
        var initialize = function(_args) {
            this.args = timbre.fn.valist.call(this, _args);
            this._L = new Float32Array(timbre.cellsize);
            this._R = new Float32Array(timbre.cellsize);
            this._pan  = 0.5;
            this._panL = Math.cos(0.5 * Math.PI * this._pan);
            this._panR = Math.sin(0.5 * Math.PI * this._pan);
            this._amp  = 1.0;
            this._ison = false;
            this._ar = true;
        };
        
        $this.on = $this.play = function() {
            this._ison = true;
            timbre.dacs.append(this);
            timbre.fn.do_event(this, "on");
            return this;
        };
        
        $this.off = $this.pause = function() {
            this._ison = false;
            timbre.dacs.remove(this);
            timbre.fn.do_event(this, "off");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var args, cell, L, R;
            var amp, panL, panR;
            var tmp, i, j, jmax;
            
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                args = this.args;
                L = this._L;
                R = this._R;
                amp = this._amp;
                panL = this._panL * amp;
                panR = this._panR * amp;
                jmax = timbre.cellsize;
                for (j = jmax; j--; ) {
                    cell[j] = L[j] = R[j] = 0;
                }
                for (i = args.length; i--; ) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j] * amp;
                        L[j] += tmp[j] * panL;
                        R[j] += tmp[j] * panR;
                    }
                }
                this._seq_id = seq_id;
            }
            return cell;
        };
        
        return Dac;
    }());
    timbre.fn.register("dac", Dac);
    
    var Add = (function() {
        var Add = function() {
            initialize.apply(this, arguments);
        }, $this = Add.prototype;
        
        var initialize = function(_args) {
            this.args = timbre.fn.valist.call(this, _args);
            this._ar = true;
        };
        
        $this.seq = function(seq_id) {
            var args, cell;
            var tmp, i, j, jmax;
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                args = this.args;
                jmax = timbre.cellsize;
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                for (i = args.length; i--; ) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }        
                this._seq_id = seq_id;
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
        
        var initialize = function(_args) {
            this.args = timbre.fn.valist.call(this, _args);
            this._ar = true;
        };
        
        $this.seq = function(seq_id) {
            var args, cell;
            var tmp, i, j, jmax;
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                args = this.args;
                jmax = timbre.cellsize;
                for (j = jmax; j--; ) {
                    cell[j] = 1;
                }
                for (i = args.length; i--; ) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] *= tmp[j];
                    }
                }        
                this._seq_id = seq_id;
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
        
        Object.defineProperty($this, "wavelet", {
            set: function(value) {
                var wavelet, i, dx;
                wavelet = this._wavelet;
                if (typeof value === "function") {
                    for (i = 0; i < 1024; i++) {
                        wavelet[i] = value(i / 1024);
                    }
                } else if (typeof value === "string" && value instanceof Float32Array) {
                    dx = value.length / 1024;
                    for (i = 0; i < 1024; i++) {
                        wavelet[i] = value[(i * dx)|0] || 0.0;
                    }
                } else if (typeof value === "string") {
                    if ((dx = Oscillator.wavelets[value]) !== undefined) {
                        for (i = 0; i < 1024; i++) {
                            wavelet[i] = dx[i];
                        }
                    }
                }
            },
            get: function() {
                return this._wavelet;
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
                    this._phase = value;
                    this._x = 1024 * this._phase;
                }
            },
            get: function() {
                return this._phase;
            }
        });
        
        var initialize = function(_args) {
            var i ;
            
            i = 0;
            this._wavelet = new Float32Array(1024);        
            
            if (typeof _args[i] === "function") {
                this.wavelet = _args[i++];
            } else if (typeof _args[i] === "object" && _args[i] instanceof Float32Array) {
                this.wavelet = _args[i++];
            } else if (typeof _args[i] === "string") {
                this.wavelet = _args[i++];
            }
            this.freq = _args[i++];
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
            
            this._x = 1024 * this._phase;
            this._coeff = 1024 / timbre.samplerate;
            
            this._ar = true;
        };
        
        $this.clone = function() {
            return new Oscillator([this.wavelet, this.freq, this.phase, this.mul, this.add]);
        };
        
        $this.bang = function() {
            this._x = 1024 * this._phase;
            timbre.fn.do_event(this, "bang");
            return this;
        };
        
        $this.ar = function() {
            this._ar = true;
            return this;
        };
        
        $this.kr = function() {
            this._ar = false;
            return this;
        };
        
        $this.seq = function(seq_id) {
            var cell;
            var freq, mul, add, wavelet;
            var x, dx, coeff;
            var index, delta, x0, x1, xx;
            var i, imax;
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                freq = this._freq.seq(seq_id);
                mul  = this._mul * this._mul;
                add  = this._add;
                wavelet = this._wavelet;
                x = this._x;
                coeff = this._coeff;
                if (this._ar) {
                    if (this._freq._ar) {
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            index = x|0;
                            delta = x - index;
                            x0 = wavelet[(index  ) & 1023];
                            x1 = wavelet[(index+1) & 1023];
                            xx = (1.0 - delta) * x0 + delta * x1;
                            cell[i] = xx * mul + add;
                            x += freq[i] * coeff;
                        }
                    } else {
                        dx = freq[0] * coeff;
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            index = x|0;
                            delta = x - index;
                            x0 = wavelet[(index  ) & 1023];
                            x1 = wavelet[(index+1) & 1023];
                            xx = (1.0 - delta) * x0 + delta * x1;
                            cell[i] = xx * mul + add;
                            x += dx;
                        }
                    }
                } else {
                    index = x|0;
                    delta = x - index;
                    x0 = wavelet[(index  ) & 1023];
                    x1 = wavelet[(index+1) & 1023];
                    xx = (1.0 - delta) * x0 + delta * x1;
                    xx = xx * mul + add;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = xx;
                    }
                    x += freq[0] * coeff * imax;
                }
                this._x = x;
                this._seq_id = seq_id;
            }
            return cell;
        }
        
        return Oscillator;
    }());
    timbre.fn.register("osc", Oscillator);
    
    Oscillator.wavelets = {};
    Oscillator.wavelets.sin = (function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = Math.sin(2 * Math.PI * (i/1024));
        }
        return l;
    }());
    Oscillator.wavelets.cos = (function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = Math.cos(2 * Math.PI * (i/1024));
        }
        return l;
    }());
    Oscillator.wavelets.pulse = (function() {
        var l, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            l[i] = i < 512 ? -1 : +1;
        }
        return l;
    }());
    Oscillator.wavelets.tri = (function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024) - 0.25;
            l[i] = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }
        return l;
    }());
    Oscillator.wavelets.sawup = (function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024);
            l[i] = +2.0 * (x - Math.round(x));
        }
        return l;
    }());
    Oscillator.wavelets.saw = Oscillator.wavelets.sawup;
    Oscillator.wavelets.sawdown = (function() {
        var l, x, i;
        l = new Float32Array(1024);
        for (i = 0; i < 1024; ++i) {
            x = (i / 1024);
            l[i] = -2.0 * (x - Math.round(x));
        }
        return l;
    }());
    Oscillator.wavelets.fami = (function() {
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
    }());
    Oscillator.wavelets.konami = (function() {
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
    }());
    
    
    timbre.fn.register("sin", function(_args) {
        return new Oscillator(["sin"].concat(_args));
    });
    timbre.fn.register("cos", function(_args) {
        return new Oscillator(["cos"].concat(_args));
    });
    timbre.fn.register("pulse", function(_args) {
        return new Oscillator(["pulse"].concat(_args));
    });
    timbre.fn.register("tri", function(_args) {
        return new Oscillator(["tri"].concat(_args));
    });
    timbre.fn.register("saw", function(_args) {
        return new Oscillator(["saw"].concat(_args));
    });
    timbre.fn.register("sawup", function(_args) {
        return new Oscillator(["sawup"].concat(_args));
    });
    timbre.fn.register("sawdown", function(_args) {
        return new Oscillator(["sawdown"].concat(_args));
    });
    timbre.fn.register("fami", function(_args) {
        return new Oscillator(["fami"].concat(_args));
    });
    timbre.fn.register("konami", function(_args) {
        return new Oscillator(["konami"].concat(_args));
    });
    
    var Noise = (function() {
        var Noise = function() {
            initialize.apply(this, arguments);
        }, $this = Noise.prototype;
        
        var initialize = function(_args) {
            var i;
    
            i = 0;
            if (typeof _args[i] === "number") {
                this.mul = _args[i++];
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];
            }
            this._ar = true;
        };
        
        $this.ar = function() {
            this._ar = true;
            return this;
        };
        
        $this.kr = function() {
            this._ar = false;
            return this;
        };
        
        $this.seq = function(seq_id) {
            var cell;
            var mul, add, x, i;
            
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                mul = this._mul;
                add = this._add;
                if (this._ar) {
                    for (i = cell.length; i--; ) {
                        cell[i] = (Math.random() * 2.0 - 1.0) * mul + add;
                    }
                } else {
                    x = (Math.random() * 2.0 - 1.0) * mul + add;
                    for (i = cell.length; i--; ) {
                        cell[i] = x;
                    }
                }
                this._seq_id = seq_id;
            }
            return cell;
        };
    
        return Noise;
    }());
    timbre.fn.register("noise", Noise);
    
    
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
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];
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
                        this._mode = 4;
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
                    x = (1.0 - x) * s0;
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
    
    
    var Tween = (function() {
        var Tween = function() {
            initialize.apply(this, arguments);
        }, $this = Tween.prototype;
        
        Object.defineProperty($this, "type", {
            set: function(value) {
                var f;
                if (typeof value === "string") {
                    if ((f = Tween.functions[value]) !== undefined) {
                        this._type = value;
                        this._func = f;
                    }
                }
            },
            get: function() {
                return this._type;
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
        Object.defineProperty($this, "start", {
            set: function(value) {
                if (typeof value === "number") {
                    this._start = value;
                }
            },
            get: function() {
                return this._start;
            }
        });
        Object.defineProperty($this, "stop", {
            set: function(value) {
                if (typeof value === "number") {
                    this._stop = value;
                }
            },
            get: function() {
                return this._stop;
            }
        });
        
        var initialize = function(_args) {
            var i, type;
            
            i = 0;
            if (typeof _args[i] === "string" && (Tween.functions[_args[i]]) !== undefined) {
                type = _args[i++];
            } else {
                type = "linear";
            }
            if (typeof _args[i] === "number") {
                this.d = _args[i++];
            } else {
                this.d = 1000;
            }
            if (typeof _args[i] === "number") {
                this.start = _args[i++];
            } else {
                this.start = 0;
            }
            if (typeof _args[i] === "number") {
                this.stop = _args[i++];
            } else {
                this.stop = 1;
            }
            if (typeof _args[i] === "number") {
                this.mul = _args[i++];
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];
            }
            
            this._phase     = 0;
            this._phaseStep = 0;
            this._value     = 0;
            this._enabled   = false;
            this.type = type;        
        };
        
        $this.bang = function() {
            var diff;
            diff = this._stop - this._start;
            this._phase     = 0;
            this._phaseStep = timbre.cellsize / (this._d / 1000 * timbre.samplerate);
            this._value     = this._func(0) * diff + this._start;
            this._enabled   = true;
            return this;
        };
        
        $this.seq = function(seq_id) {
            var cell;
            var value, diff, changed, ended;
            var i, imax;
            
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                if (this._enabled) {
                    this._phase += this._phaseStep;
                    if (this._phase >= 1.0) {
                        this._phase = 1.0;
                        this._enabled = false;
                        ended = true;
                    } else {
                        ended = false;
                    }
                    diff = this._stop - this._start;
                    this._value = this._func(this._phase) * diff + this._start;
                    changed = true;
                } else {
                    changed = false;
                }
                value = this._value * this._mul + this._add;
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    cell[i] = value;
                }
                if (changed && this.onchanged) this.onchanged(this._value);
                if (ended) timbre.fn.do_event(this, "ended");
            }
            return cell;
        };
        
        return Tween;
    }());
    timbre.fn.register("tween", Tween);
    
    Tween.functions = {
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
    		return 1 - Tween.functions["bounce.out"]( 1 - k );
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
    		if ( k < 0.5 ) return Tween.functions["bounce.in"]( k * 2 ) * 0.5;
    		return Tween.functions["bounce.out"]( k * 2 - 1 ) * 0.5 + 0.5;
        },
    };
    
    
    
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
        
        var initialize = function(_args) {
            var i;
            
            i = 0;
            if (typeof _args[i] === "number") {
                this.d = _args[i++];
            } else {
                this.d = 100.0;
            }
            if (typeof _args[i] === "number") {
                this.mul = _args[i++];
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];
            }
            if (typeof _args[i] === "function") {
                this.onended = _args[i++];
            }
            
            this._samples = 0;
            this._dx = timbre.cellsize / this._samples;
            this._x  = 0;
        };
        
        $this.bang = function() {
            this._samples = (timbre.samplerate * (this._d / 1000))|0;
            this._dx = timbre.cellsize / this._samples;
            this._x  = 1.0;
            timbre.fn.do_event(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var cell, val;
            var x, dx, samples;
            var i, imax;
            
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                x  = this._x;
                dx = this._dx;
                samples = this._samples;
                val = x * this._mul + this._add;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = val;
                }
                x -= dx;
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
    
    
    var Filter = (function() {
        var Filter = function() {
            initialize.apply(this, arguments);
        }, $this = Filter.prototype;
        
        Object.defineProperty($this, "type", {
            set: function(value) {
                var f;
                if (typeof value === "string") {
                    if ((f = Filter.types[value]) !== undefined) {
                        this._type = value;
                        if (typeof this._freq !== "number") this._freq = f.default_freq;
                        if (typeof this._band !== "number") this._band = f.default_band;
                        this._set_params = f.set_params;
                        this._set_params(this._freq, this._band, this._gain);
                    }
                }
            },
            get: function() {
                return this._type;
            }
        });
        Object.defineProperty($this, "freq", {
            set: function(value) {
                if (typeof value === "number") {
                    this._freq = value;
                    this._set_params(this._freq, this._band, this._gain);
                }
            },
            get: function() {
                return this._freq;
            }
        });
        Object.defineProperty($this, "band", {
            set: function(value) {
                if (typeof value === "number") {
                    this._band = value;
                    this._set_params(this._freq, this._band, this._gain);
                }
            },
            get: function() {
                return this._band;
            }
        });
        Object.defineProperty($this, "gain", {
            set: function(value) {
                if (typeof value === "number") {
                    this._gain = value;
                    this._set_params(this._freq, this._band, this._gain);
                }
            },
            get: function() {
                return this._gain;
            }
        });
        
        var initialize = function(_args) {
            var i, type;
            
            this._mul  = 1.0;
            this._add  = 0.0;
            this._gain = 6;
            
            i = 0;
            if (typeof _args[i] === "string" && (Filter.types[_args[i]]) !== undefined) {
                type = _args[i++];
            } else {
                type = "LPF";
            }
            if (typeof _args[i] === "number") {
                this._freq = _args[i++];
            }
            if (typeof _args[i] === "number") {
                this._band = _args[i++];
            }
            if (type === "peaking" || type === "lowboost" || type === "highboost") {
                if (typeof _args[i] === "number") {
                    this._gain = _args[i++];
                }
            }
            if (typeof _args[i] === "number") {
                this._mul = _args[i++];
            }
            if (typeof _args[i] === "number") {
                this._add = _args[i++];
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
    
            this._ison = true;
            this._in1 = this._in2 = this._out1 = this._out2 = 0;
            
            this._ar = true;
            this.type = type;
        };
        
        $this.on = function() {
            this._ison = true;
            timbre.fn.do_event(this, "on");
            return this;
        };
        
        $this.off = function() {
            this._ison = false;
            timbre.fn.do_event(this, "off");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var args, cell, mul, add;
            var tmp, i, imax, j, jmax;
            
            var a1, a2, b0, b1, b2;
            var in1, in2, out1, out2;
            var input, output;
            
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                args = this.args;
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = args.length; i--; ) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                // filter
                if (this._ison) {
                    mul = this._mul;
                    add = this._add;
                    a1 = this._a1; a2 = this._a2;
                    b0 = this._b0; b1 = this._b1; b2 = this._b2;
                    in1  = this._in1;  in2  = this._in2;
                    out1 = this._out1; out2 = this._out2;
                    
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
                        
                        cell[i] = output * mul + add;
                    }
                    
                    this._in1  = in1;  this._in2  = in2;
                    this._out1 = out1; this._out2 = out2;
                }
                this._seq_id = seq_id;
            }
            
            return cell;
        };
        
        return Filter;
    }());
    
    Filter.types = {};
    Filter.types.LPF = {
        default_freq: 800, default_band: 1,
        set_params: function(freq, band) {
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            ia0 = 1 / (1 + alp);
            this._a1 = -2 * cos  * ia0;
            this._a2 = (1 - alp) * ia0;
            // this._b0
            this._b1 = (1 - cos) * ia0;
            this._b2 = this._b0 = this._b1 * 0.5;
        }
    };
    Filter.types.HPF = {
        default_freq: 5500, default_band: 1,
        set_params: function(freq, band) {
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            ia0 = 1 / (1 + alp);
            this._a1 = -2 * cos  * ia0;
            this._a2 = +(1 - alp) * ia0;
            // this.b0
            this._b1 = -(1 + cos) * ia0;
            this._b2 = this._b0 = - this._b1 * 0.5;
        }
    };
    Filter.types.BPF = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band) {
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            ia0 = 1 / (1 + alp);
            this._a1 = -2 * cos  * ia0;
            this._a2 = (1 - alp) * ia0;
            this._b0 = alp * ia0;        
            this._b1 = 0;
            this._b2 = -this._b0;
        }
    };
    Filter.types.BRF = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band) {
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            ia0 = 1 / (1 + alp);
            this._a1 = -2 * cos * ia0;
            this._a2 = +(1 - alp) * ia0;
            this._b0 = 1;
            this._b1 = -(1 + cos) * ia0;
            this._b2 = 1;
        }
    };
    Filter.types.allpass = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band) {
            var omg, cos, sin, alp, n, ia0;
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            ia0 = 1 / (1 + alp);
            this._a1 = -2 * cos * ia0;
            this._a2 = +(1 - alp) * ia0;
            this._b0 = this._a2;
            this._b1 = this._a1;
            this._b2 = 1;
        }
    };
    Filter.types.peaking = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band, gain) {
            var A, omg, cos, sin, alp, alpA, alpiA, n, ia0;
            A = Math.pow(10, gain * 0.025);
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * band * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            alpA  = alp * A;
            alpiA = alp / A;
            ia0 = 1 / (1 + alpiA);
            this._a1 = -2 * cos * ia0;
            this._a2 = +(1 - alpiA) * ia0;
            this._b0 = +(1 + alpA ) * ia0;
            this._b1 = this._a1;
            this._b2 = +(1 - alpA ) * ia0;
        }
    };
    Filter.types.lowboost = {
        default_freq: 3000, default_band: 1,
        set_params: function(freq, band, gain) {
            var A, omg, cos, sin, alp, alpsA2, ia0;
            A = Math.pow(10, gain * 0.025);
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
            alpsA2 = alp * Math.sqrt(A) * 2;
            ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
            this._a1 = -2 * ((A - 1) + (A + 1) * cos         ) * ia0;
            this._a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
            this._b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
            this._b1 =  2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
            this._b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
        }
    };
    Filter.types.highboost = {
        default_freq: 5500, default_band: 1,
        set_params: function(freq, band, gain) {
            var A, omg, cos, sin, alp, alpsA2, ia0;
            A = Math.pow(10, gain * 0.025);
            omg = freq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            alp = sin * 0.5 * Math.sqrt((A + 1 / A) * (1 / band - 1) + 2);
            alpsA2 = alp * Math.sqrt(A) * 2;
            ia0 = 1 / ((A + 1) + (A - 1) * cos + alpsA2);
            this._a1 =  2 * ((A - 1) + (A + 1) * cos         ) * ia0;
            this._a2 =      ((A + 1) + (A - 1) * cos - alpsA2) * ia0;
            this._b0 =      ((A + 1) - (A - 1) * cos + alpsA2) * A * ia0;
            this._b1 = -2 * ((A - 1) - (A + 1) * cos         ) * A * ia0;
            this._b2 =      ((A + 1) - (A - 1) * cos - alpsA2) * A * ia0;
        }
    };
    timbre.fn.register("LPF", Filter, function(_args) {
        return new Filter(["LPF"].concat(_args));
    });
    timbre.fn.register("HPF", Filter, function(_args) {
        return new Filter(["HPF"].concat(_args));
    });
    timbre.fn.register("BPF", Filter, function(_args) {
        return new Filter(["BPF"].concat(_args));
    });
    timbre.fn.register("BRF", Filter, function(_args) {
        return new Filter(["BRF"].concat(_args));
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
        
        ResonantFilter.types = { LPF:0, HPF:1, BPF:2, BRF:3 };
        
        Object.defineProperty($this, "type", {
            set: function(value) {
                var mode;
                if (typeof value === "string") {
                    if ((mode = ResonantFilter.types[value]) !== undefined) {
                        this._type = value;
                        this._mode = mode;
                        this._set_params(this._cutoff, this._Q);
                    }
                }
            },
            get: function() {
                return this._type;
            }
        });
        
        Object.defineProperty($this, "cutoff", {
            set: function(value) {
                if (typeof value === "number") {
                    this._cutoff = value;
                    this._set_params(this._cutoff, this._Q);
                }
            },
            get: function() {
                return this._cutoff;
            }
        });
        Object.defineProperty($this, "Q", {
            set: function(value) {
                if (typeof value === "number") {
                    this._Q = value;
                    this._set_params(this._cutoff, this._Q);
                }
            },
            get: function() {
                return this._Q;
            }
        });
        Object.defineProperty($this, "depth", {
            set: function(value) {
                if (typeof value === "number") {
                    this._depth = value;
                    this._depth0 = Math.cos(0.5 * Math.PI * value);
                    this._depth1 = Math.sin(0.5 * Math.PI * value);
                }
            },
            get: function() {
                return this._depth;
            }
        });
        
        var initialize = function(_args) {
            var i, type;
            
            i = 0;
            if (typeof _args[i] === "string" && (ResonantFilter.types[_args[i]]) !== undefined) {
                type = _args[i++];
            } else {
                type = "LPF";
            }
            if (typeof _args[i] === "number") {
                this._cutoff = _args[i++];
            } else {
                this._cutoff = 2000;
            }
            if (typeof _args[i] === "number") {
                this._Q = _args[i++];
            } else {
                this._Q = 0;
            }
            if (typeof _args[i] === "number") {
                this.depth = _args[i++];
            } else {
                this.depth = 0.5;
            }
            if (typeof _args[i] === "number") {
                this.mul = _args[i++];
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];
            }
            this.args = timbre.fn.valist.call(this, _args.slice(i));
            
            this._ison = true;
            this._f = new Float32Array(4);
            this._mode = 0;
            this._damp = 0;
            this._freq = 0;
            
            this._ar = true;
            this.type = type;
        };
        
        $this._set_params = function(cutoff, Q) {
            var freq = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (timbre.samplerate * 2)));
            this._damp = Math.min(2 * (1 - Math.pow(Q, 0.25)), Math.min(2, 2 / freq - freq * 0.5));
            this._freq = freq;
        };
        
        $this.on = function() {
            this._ison = true;
            timbre.fn.do_event(this, "on");
            return this;
        };
        
        $this.off = function() {
            this._ison = false;
            timbre.fn.do_event(this, "off");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var args, cell, mul, add;
            var tmp, i, imax, j, jmax;
            var f, mode, damp, freq, depth0, depth1;
            var input, output;
            
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                args = this.args;
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = args.length; i--; ) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                // filter
                if (this._ison) {
                    mul = this._mul;
                    add = this._add;
                    f = this._f;
                    mode = this._mode;
                    damp = this._damp;
                    freq = this._freq;
                    depth0 = this._depth0;
                    depth1 = this._depth1;
                    
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
                        
                        cell[i] = output * mul + add;
                    }
                }
                this._seq_id = seq_id;
            }
            
            return cell;
        };
        
        return ResonantFilter;
    }());
    timbre.fn.register("rLPF", ResonantFilter, function(_args) {
        return new ResonantFilter(["LPF"].concat(_args));
    });
    timbre.fn.register("rHPF", ResonantFilter, function(_args) {
        return new ResonantFilter(["HPF"].concat(_args));
    });
    timbre.fn.register("rBPF", ResonantFilter, function(_args) {
        return new ResonantFilter(["BPF"].concat(_args));
    });
    timbre.fn.register("rBRF", ResonantFilter, function(_args) {
        return new ResonantFilter(["BRF"].concat(_args));
    });
    
    
    
    
    
    var Interval = (function() {
        var Interval = function() {
            initialize.apply(this, arguments);
        }, $this = Interval.prototype;
        
        Object.defineProperty($this, "interval", {
            set: function(value) {
                if (typeof value === "number") {
                    this._interval = value;
                    this._interval_samples = (timbre.samplerate * (value / 1000))|0;
                }
            },
            get: function() {
                return this._interval;
            }
        });
        Object.defineProperty($this, "isOn", {
            get: function() {
                return this._ison;
            }
        });
        Object.defineProperty($this, "isOff", {
            get: function() {
                return !this._ison;
            }
        });
        
        var initialize = function(_args) {
            var i;
            
            this._interval_samples = 0;
            
            i = 0;
            if (typeof _args[i] === "number") {
                this.interval = _args[i++];
            }
            this.args = _args.slice(i);
            
            this._ison = false;
            this._samples = 0;
            this._interval_count = 0;
        };
        
        $this.on = $this.play = function() {
            this._ison = true;
            this._samples = this._interval_samples;
            this._interval_count = 0;
            timbre.timers.append(this);
            timbre.fn.do_event(this, "on");
            return this;
        };
        
        $this.off = $this.pause = function() {
            this._ison = false;
            timbre.timers.remove(this);
            timbre.fn.do_event(this, "off");
            return this;
        };
        
        $this.bang = function() {
            if (this._ison) {
                this._samples = this._interval_samples;
                timbre.fn.do_event(this, "bang");
            }
            return this;
        };
        
        $this.seq = function(seq_id) {
            var samples, count, args, i;
            if (seq_id !== this._seq_id) {
                if (this._interval_samples !== 0) {
                    samples = this._samples - timbre.cellsize;
                    if (samples <= 0) {
                        this._samples = samples + this._interval_samples;
                        count = this._interval_count;
                        args = this.args;
                        for (i = args.length; i--; ) {
                            if (typeof args[i] === "function") {
                                args[i](count);
                            } else if (args[i].bang === "function") {
                                args[i].bang();
                            }
                        }
                        ++this._interval_count;
                        samples = this._samples;
                    }
                    this._samples = samples;
                }
                this._seq_id = seq_id;
            }
            return this._cell;
        };
        
        return Interval;
    }());
    timbre.fn.register("interval", Interval);
    
    
    var Timeout = (function() {
        var Timeout = function() {
            initialize.apply(this, arguments);
        }, $this = Timeout.prototype;
        
        Object.defineProperty($this, "timeout", {
            set: function(value) {
                if (typeof value === "number") {
                    this._timeout = value;
                    this._timeout_samples = (timbre.samplerate * (value / 1000))|0;
                }
            },
            get: function() {
                return this._timeout;
            }
        });
        Object.defineProperty($this, "isOn", {
            get: function() {
                return this._ison;
            }
        });
        Object.defineProperty($this, "isOff", {
            get: function() {
                return !this._ison;
            }
        });
        
        var initialize = function(_args) {
            var i;
            
            this._timeout_samples = 0;
            
            i = 0;
            if (typeof _args[i] === "number") {
                this.timeout = _args[i++];
            }
            this.args = _args.slice(i);
            
            this._ison = false;
            this._samples = 0;
        };
        
        $this.on = $this.play = function() {
            this._ison = true;
            this._samples = this._timeout_samples;
            timbre.timers.append(this);
            timbre.fn.do_event(this, "on");
            return this;
        };
        
        $this.off = $this.pause = function() {
            this._ison = false;
            timbre.timers.remove(this);
            timbre.fn.do_event(this, "off");
            return this;
        };
        
        $this.bang = function() {
            if (this._ison) {
                this._samples = this._timeout_samples;
                timbre.fn.do_event(this, "bang");
            }
            return this;
        };
        
        $this.seq = function(seq_id) {
            var samples, args, i;
            if (seq_id !== this._seq_id) {
                if (this._timeout_samples !== 0) {
                    samples = this._samples - timbre.cellsize;
                    if (samples <= 0) {
                        this._samples = 0;
                        args = this.args;
                        for (i = args.length; i--; ) {
                            if (typeof args[i] === "function") {
                                args[i]();
                            } else if (args[i].bang === "function") {
                                args[i].bang();
                            }
                        }
                        samples = this._samples;
                        if (samples <= 0) this.off();
                    }
                    this._samples = samples;
                }
                this._seq_id = seq_id;
            }
            return this._cell;
        };
        
        return Timeout;
    }());
    timbre.fn.register("timeout", Timeout);
    
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
        
        
        var WebKitPlayer = function(sys) {
            var ctx, node;
        
            ctx = new webkitAudioContext();
            timbre.samplerate = ctx.sampleRate;
            node = ctx.createJavaScriptNode(sys.streamsize, 0, sys.channels);
            
            node.onaudioprocess = function(e) {
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
            
            return {
                on : function() {
                    node.connect(ctx.destination);
                },
                off: function() {
                    node.disconnect();
                }
            };
        };
        
        var MozPlayer = function(sys) {
            var audio, timer;
            var interval, interleaved;
            var onaudioprocess;
            
            audio = new Audio();
            audio.mozSetup(sys.channels, timbre.samplerate);
            timbre.samplerate = audio.mozSampleRate;
            timbre.channels   = audio.mozChannels;
            
            timer = new MutekiTimer();
            interval    = (sys.streamsize / timbre.samplerate) * 1000;
            
            interleaved = new Float32Array(sys.streamsize * sys.channels);
            
            onaudioprocess = function() {
                var inL, inR, i, j;
                audio.mozWriteAudio(interleaved);
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
        
            return {
                on : function() {
                    timer.setInterval(onaudioprocess, interval);
                },
                off: function() {
                    timer.clearInterval();
                }
            };
        };
        
        if (typeof webkitAudioContext === "function") {
            timbre.env = "webkit";
            timbre._sys.bind(WebKitPlayer);
        } else if (typeof Audio === "function" && typeof (new Audio).mozSetup === "function") {
            timbre.env = "moz";
            timbre._sys.bind(MozPlayer);
        }
        
        
        timbre.platform = "web";
        timbre._global  = window;
        
        window.T = timbre;
    }(context, timbre));
    
    typeof importScripts === "function" && (function(worker, timbre) {
        timbre.platform = "web";
        timbre._global  = worker;
    }(context, timbre));
    
    typeof process === "object" && process.title === "node" && (function(node, timbre) {
        timbre.platform = "node";
        timbre._global  = global;
        
        module.exports = timbre;
    }(context, timbre));
    
    return timbre;
}(this));
