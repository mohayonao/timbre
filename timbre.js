/**
 * timbre 0.0.0 / JavaScript Library for Objective Sound Programming
 * build: Sat May 19 2012 00:11:32 GMT+0900 (JST)
 */
;
var timbre = (function(context, timbre) {
    "use strict";
    
    var timbre = function() {
        return timbre.fn.init.apply(timbre, arguments);
    };
    timbre.VERSION    = "0.0.0";
    timbre.BUILD      = "Sat May 19 2012 00:11:32 GMT+0900 (JST)";
    timbre.env        = "";
    timbre.platform   = "";
    timbre.samplerate = 44100;
    timbre.channels   = 2;
    timbre.cellsize   = 128;
    timbre.streamsize = 1024;
    timbre.amp        = 0.8;
    timbre.verbose    = true;
    timbre.dacs       = [];
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
            var seq_id, dacs, dac;
            var i, imax, j, jmax, k, kmax, n, nmax;
            var saved_i, tmpL, tmpR, amp, x;
            
            cell = this._cell;
            L = this.L;
            R = this.R;
            amp = timbre.amp;
            dacs = timbre.dacs;
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
                for (j = dacs.length; j--; ) {
                    dac = dacs[j];
                    dac.seq(seq_id);
                    tmpL = dac._L;
                    tmpR = dac._R;
                    for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                        L[i] += tmpL[k];
                        R[i] += tmpR[k];
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
        defaults.ar = function() {
            this._ar = true;
            return this;
        };
        defaults.kr = function() {
            this._ar = false;
            return this;
        };
        defaults.nop = function() {
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
            if (!this.ar) {
                if (this._kr_only || this._ar_only) {
                    this.ar = defaults.nop;
                } else {
                    this.ar = defaults.ar;
                }
            }
            if (!this.kr) {
                if (this._kr_only || this._ar_only) {
                    this.kr = defaults.nop;
                } else {
                    this.kr = defaults.kr;
                }
            }
            Object.defineProperty(this, "isAr", {
                get: function() { return this._ar; }
            });
            Object.defineProperty(this, "isKr", {
                get: function() { return !this._ar; }
            });
            if (typeof this._ar !== "boolean") {
                this._ar = !!this._ar_only;
            }
            
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
        $this._kr_only = true;
        
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
        $this._kr_only = true;
        
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
        $this._kr_only = true;
        
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
    UndefinedWrapper.prototype._kr_only = true;
    timbre.fn.register("undefined", UndefinedWrapper);
    
    var NullWrapper = function() {};
    NullWrapper.prototype._kr_only = true;
    timbre.fn.register("null", NullWrapper);
    
    
    
    var Dac = (function() {
        var Dac = function() {
            initialize.apply(this, arguments);
        }, $this = Dac.prototype;
        
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
        };
        $this._ar_only = true;
        
        $this.on = function() {
            this._ison = true;
            timbre.dacs.append(this);
            timbre.fn.do_event(this, "on");
            return this;
        };
        
        $this.off = function() {
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
        };
        $this._ar_only = true;
        
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
        };
        $this._ar_only = true;
        
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
            } else {
                this.mul = 1.0;
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];    
            } else {
                this.add = 0.0;
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
                    if (this._freq.ar) {
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
            } else {
                this.mul = 1.0;
            }
            if (typeof _args[i] === "number") {
                this.add = _args[i++];
            } else {
                this.add = 0.0;
            }
    
            this._mode = 0;
            this._samplesMax = (timbre.samplerate * (this._a / 1000))|0;
            this._samples    = 0;
        };
        $this._kr_only = true;
        
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
                if (this._ar) {
                    // TODO:
                } else {
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
                            mode = 4;
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
                        x = (1.0 - x) * s1;
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
            }
            return cell;
        };
        
        return ADSR;
    }());
    timbre.fn.register("adsr", ADSR);
    
    
    var Perc = (function() {
        var Perc = function() {
            initialize.apply(this, arguments);
        }, $this = Perc.prototype;
        
        Object.defineProperty($this, "duration", {
            set: function(value) {
                if (typeof value === "number") {
                    this._duration = value;
                }
            },
            get: function() {
                return this._duration;
            }
        });
        
        var nop = function() {};
        
        var initialize = function(_args) {
            var i;
            
            i = 0;
            if (typeof _args[i] === "number") {
                this.duration = _args[i++];
            } else {
                this.duration = 0.0;
            }
            if (typeof _args[i] === "function") {
                this.onended = _args[i++];
            } else {
                this.onended = nop;
            }
            
            this._samples = (timbre.samplerate * (this._duration/1000))|0;
            this._dx = 1.0 / this._samples;
            this._x  = 1.0;
        };
        
        $this.bang = function() {
            this._samples = (timbre.samplerate * (this._duration/1000))|0;
            this._dx = 1.0 / this._samples;
            this._x  = 1.0;
            timbre.fn.do_event(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var cell;
            var x, dx, samples;
            var i, imax;
            cell = this._cell;
            if (seq_id !== this._seq_id) {
                x  = this._x;
                dx = this._dx;
                samples = this._samples;
                if (this._ar) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = x;
                        x -= dx;
                        if (x < 0.0) x = 0.0;
                        if (samples > 0) {
                            samples -= 1;
                            if (samples <= 0) {
                                this._samples = 0;
                                this.onended();
                                x  = this._x;
                                dx = this._dx;
                                samples = this._samples;
                            }
                        }
                    }
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = x;
                    }
                    x -= dx * imax;
                    if (x < 0.0) x = 0.0;
                    if (samples > 0) {
                        samples -= imax;
                        if (samples <= 0) {
                            this._samples = 0;
                            this.onended();
                            x  = this._x;
                            dx = this._dx;
                            samples = this._samples;
                        }
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
