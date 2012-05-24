/**
 * timbre/timers
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

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
    timbre.fn.set_kr_only($this);
    
    $this._raw_args = true;
    
    $this.on = function() {
        this._ison = true;
        this._samples = 0;
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._ison = false;
        timbre.timers.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.play = $this.pause = function() {
        return this;
    };
    
    $this.bang = function() {
        if (this._ison) {
            this._samples = 0;
            this._interval_count = 0;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var samples, count, args, i, imax;
        if (seq_id !== this.seq_id) {
            if (this._interval_samples !== 0) {
                samples = this._samples - timbre.cellsize;
                if (samples <= 0) {
                    this._samples = samples + this._interval_samples;
                    count = this._interval_count;
                    args = this.args;
                    for (i = 0, imax = args.length; i < imax; ++i) {
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
            this.seq_id = seq_id;
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
    timbre.fn.set_kr_only($this);
    
    $this._raw_args = true;
    
    $this.on = function() {
        this._ison = true;
        this._samples = this._timeout_samples;
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._ison = false;
        timbre.timers.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.play = $this.pause = function() {
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
        var samples, args, i, imax;
        if (seq_id !== this.seq_id) {
            if (this._timeout_samples !== 0) {
                samples = this._samples - timbre.cellsize;
                if (samples <= 0) {
                    this._samples = 0;
                    args = this.args;
                    for (i = 0, imax = args.length; i < imax; ++i) {
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
            this.seq_id = seq_id;
        }
        return this.cell;
    };
    
    return Timeout;
}());
timbre.fn.register("timeout", Timeout);


var Schedule = (function() {
    var Schedule = function() {
        initialize.apply(this, arguments);
    }, $this = Schedule.prototype;
    
    Object.defineProperty($this, "mode", {
        get: function() { return this._mode; }
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
        var i, list, j;
        
        this._mode = "msec";
        this._msec = 1;
        this._timetable = [];
        this._index = 0;
        this._init = true;
        
        i = 0;
        if (typeof _args[i] === "string") {
            setMode.call(this, _args[i++]);
        }
        if (typeof _args[i] === "object" && _args[i] instanceof Array) {
            list = _args[i++];
            for (j = list.length; j--; ) {
                this.append(list[j]);
            }
            this._timetable.sort(function(a, b) { return a[0] - b[0]; });
        }
        if (typeof _args[i] === "boolean") {
            this._loop = _args[i++];
        } else {
            this._loop = false;
        }
        
        this._ison  = false;
        this._currentTime = 0;
        this._loopcount   = 0;
        
        delete this._init;
    };
    timbre.fn.set_kr_only($this);
    
    $this._raw_args = true;
    
    var setMode = function(mode) {
        var m;
        if ((m = /^bpm\s*\(\s*(\d+(?:\.\d*)?)\s*(?:,\s*(\d+))?\s*\)/.exec(mode))) {
            this._mode = "bpm";
            this._msec = timbre.utils.bpm2msec(m[1], m[2] || 16);
        }
    };
    
    $this.on = function() {
        this._ison = true;
        this._index = 0;
        this._currentTime = 0;
        this._loopcount   = 0;
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._ison = false;
        this._index = 0;
        this._currentTime = 0;
        this._loopcount   = 0;
        timbre.timers.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.play = function() {
        this._ison = true;
        timbre.fn.do_event(this, "play");
        return this;
    };
    
    $this.pause = function() {
        this._ison = false;
        timbre.fn.do_event(this, "pause");
        return this;
    };
    
    $this.bang = function() {
        if (this._ison) {
            this._index = 0;
            this._currentTime = 0;
            this._loopcount   = 0;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.append = function(items) {
        var tt, schedule;
        
        if (typeof items !== "object") return this;
        if (!(items instanceof Array)) return this;
        if (items.length === 0) return this;

        tt = this._timetable;
        schedule = tt[this._index];
        
        items[0] *= this._msec;
        tt.push(items);
        
        if (! this._init) {
            if (schedule && items[0] < schedule[0]) {
                this._index += 1;
            }
            tt.sort(function(a, b) { return a[0] - b[0]; });
        }
        return this;
    };
    
    $this.remove = function(items) {
        var tt, cnt;
        
        if (typeof items !== "object") return this;
        if (!(items instanceof Array)) return this;
        if (items.length === 0) return this;
        
        tt = this._timetable;
        schedule = tt[this._index];
        
        items[0] *= this._msec;

        cnt = 0;
        for (i = tt.length; i--; ) {
            if (tt[i][0] === items[0] &&
                tt[i][1] == items[1] && tt[i][2] === items[2]) {
                tt.slice(i, 1);
                cnt += 1;
            }
        }
        
        if (schedule && schedule[0] < items[0]) {
            this._index -= cnt;
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var tt, schedule, target;
        if (seq_id !== this.seq_id) {
            if (this._ison) {
                tt = this._timetable;
                while ((schedule = tt[this._index]) !== undefined) {
                    if (this._currentTime < schedule[0]) {
                        break;
                    } else {
                        if ((target = schedule[1]) !== undefined) {
                            if (typeof target === "function") {
                                target.apply(target, schedule[2]);
                            } else if (typeof target.bang === "function") {
                                if (target.bang) target.bang();
                            }
                        }
                        if ((++this._index) >= tt.length) {
                            if (this._index >= tt.length) {
                                if (this._loop) {
                                    timbre.fn.do_event(this, "looped",
                                                       [++this._loopcount]);
                                    this._index = 0;
                                    this._currentTime -= schedule[0];
                                } else {
                                    timbre.fn.do_event(this, "ended");
                                    this.off();
                                }
                            }
                        }
                    }
                }
                this._currentTime += (timbre.cellsize / timbre.samplerate) * 1000;
            }
            this.seq_id = seq_id;
        }
        return this.cell;
    };
    
    return Schedule;
}());
timbre.fn.register("schedule", Schedule);

// __END__

describe("interval", function() {
    var instance = timbre("interval", 100);
    object_test(Interval, instance);
});
describe("timeout", function() {
    var instance = timbre("timeout", 100);
    object_test(Timeout, instance);
});
