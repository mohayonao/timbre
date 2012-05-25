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
                this._.interval = value;
                this._.interval_samples = (timbre.samplerate * (value / 1000))|0;
            }
        },
        get: function() { return this._.interval; }
    });
    Object.defineProperty($this, "count", {
        set: function(value) {
            if (typeof value === "number") {
                this._.count = value;
            }
        },
        get: function() { return this._.count; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "number") {
            this.interval = _args[i++];
        }
        this.args = _args.slice(i);
        
        _.ison = false;
        _.samples = 0;
        _.count = 0;
        _.next_count  = 0;
    };
    timbre.fn.set_kr_only($this);
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("interval", _.interval);
        return newone;
    };
    
    $this.on = function() {
        this._.ison = true;
        this._.samples = 0;
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._.ison = false;
        timbre.timers.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.play = $this.pause = function() {
        return this;
    };
    
    $this.bang = function() {
        if (this._.ison) {
            this._.samples = 0;
            this._.count = 0;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var samples, count, args, i, imax;
        if (seq_id !== this.seq_id) {
            if (_.interval_samples !== 0) {
                samples = _.samples - timbre.cellsize;
                if (samples <= 0) {
                    _.samples = samples + _.interval_samples;
                    count = _.count = _.next_count;
                    args = this.args;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        if (typeof args[i] === "function") {
                            args[i](count);
                        } else if (args[i].bang === "function") {
                            args[i].bang();
                        }
                    }
                    ++_.next_count;
                    samples = _.samples;
                }
                _.samples = samples;
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
                this._.timeout = value;
                this._.timeout_samples = (timbre.samplerate * (value / 1000))|0;
            }
        },
        get: function() { return this._.timeout; }
    });
    
    var initialize = function(_args) {
        var i, _;

        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "number") {
            this.timeout = _args[i++];
        }
        this.args = _args.slice(i);
        
        _.ison = false;
        _.samples = 0;
    };
    timbre.fn.set_kr_only($this);
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("timeout", _.timeout);
        return newone;
    };
    
    $this.on = function() {
        this._.ison = true;
        this._.samples = this._timeout_samples;
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._.ison = false;
        timbre.timers.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.play = $this.pause = function() {
        return this;
    };
    
    $this.bang = function() {
        if (this._.ison) {
            this._.samples = this._.timeout_samples;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var samples, args, i, imax;
        if (seq_id !== this.seq_id) {
            if (_.timeout_samples !== 0) {
                samples = _.samples - timbre.cellsize;
                if (samples <= 0) {
                    _.samples = 0;
                    args = this.args;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        if (typeof args[i] === "function") {
                            args[i]();
                        } else if (args[i].bang === "function") {
                            args[i].bang();
                        }
                    }
                    samples = _.samples;
                    if (samples <= 0) this.off();
                }
                _.samples = samples;
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
        get: function() { return this._.mode; }
    });
    
    var initialize = function(_args) {
        var list, i, j, _;
        
        this._ = _ = {};
        
        _.mode = "msec";
        _.msec = 1;
        _.timetable = [];
        _.index = 0;
        _.init = true;
        
        i = 0;
        if (typeof _args[i] === "string") {
            setMode.call(this, _args[i++]);
        }
        if (typeof _args[i] === "object" && _args[i] instanceof Array) {
            list = _args[i++];
            for (j = list.length; j--; ) {
                this.append(list[j]);
            }
            _.timetable.sort(function(a, b) { return a[0] - b[0]; });
        }
        if (typeof _args[i] === "boolean") {
            _.loop = _args[i++];
        } else {
            _.loop = false;
        }
        
        _.ison  = false;
        _.currentTime = 0;
        _.loopcount   = 0;
        
        delete _.init;
    };
    timbre.fn.set_kr_only($this);
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("schedule");
        newone._.mode = _.mode;
        newone._.msec = _.msec;
        return newone;
    };
    
    var setMode = function(mode) {
        var m;
        if ((m = /^bpm\s*\(\s*(\d+(?:\.\d*)?)\s*(?:,\s*(\d+))?\s*\)/.exec(mode))) {
            this._.mode = "bpm";
            this._.msec = timbre.utils.bpm2msec(m[1], m[2] || 16);
        }
    };
    
    $this.on = function() {
        var _ = this._;
        _.ison = true;
        _.index = 0;
        _.currentTime = 0;
        _.loopcount   = 0;
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        var _ = this._;
        _.ison = false;
        _.index = 0;
        _.currentTime = 0;
        _.loopcount   = 0;
        timbre.timers.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.play = function() {
        this._.ison = true;
        timbre.fn.do_event(this, "play");
        return this;
    };
    
    $this.pause = function() {
        this._.ison = false;
        timbre.fn.do_event(this, "pause");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        if (_.ison) {
            _.index = 0;
            _.currentTime = 0;
            _.loopcount   = 0;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.append = function(items) {
        var _ = this._;
        var tt, schedule;
        
        if (typeof items !== "object") return this;
        if (!(items instanceof Array)) return this;
        if (items.length === 0) return this;

        tt = _.timetable;
        schedule = tt[_.index];
        
        items[0] *= _.msec;
        tt.push(items);
        
        if (! _.init) {
            if (schedule && items[0] < schedule[0]) {
                _.index += 1;
            }
            tt.sort(function(a, b) { return a[0] - b[0]; });
        }
        return this;
    };
    
    $this.remove = function(items) {
        var _ = this._;
        var tt, cnt;
        
        if (typeof items !== "object") return this;
        if (!(items instanceof Array)) return this;
        if (items.length === 0) return this;
        
        tt = _.timetable;
        schedule = tt[_.index];
        
        items[0] *= _.msec;

        cnt = 0;
        for (i = tt.length; i--; ) {
            if (tt[i][0] === items[0] &&
                tt[i][1] == items[1] && tt[i][2] === items[2]) {
                tt.slice(i, 1);
                cnt += 1;
            }
        }
        
        if (schedule && schedule[0] < items[0]) {
            _.index -= cnt;
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var tt, schedule, target;
        if (seq_id !== this.seq_id) {
            if (_.ison) {
                tt = _.timetable;
                while ((schedule = tt[_.index]) !== undefined) {
                    if (_.currentTime < schedule[0]) {
                        break;
                    } else {
                        if ((target = schedule[1]) !== undefined) {
                            if (typeof target === "function") {
                                target.apply(target, schedule[2]);
                            } else if (typeof target.bang === "function") {
                                if (target.bang) target.bang();
                            }
                        }
                        if ((++_.index) >= tt.length) {
                            if (_.index >= tt.length) {
                                if (_.loop) {
                                    timbre.fn.do_event(this, "looped",
                                                       [++_.loopcount]);
                                    _.index = 0;
                                    _.currentTime -= schedule[0];
                                } else {
                                    timbre.fn.do_event(this, "ended");
                                    this.off();
                                }
                            }
                        }
                    }
                }
                _.currentTime += (timbre.cellsize / timbre.samplerate) * 1000;
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
