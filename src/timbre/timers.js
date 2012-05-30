/**
 * timbre/timers
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Interval: 0.1.0
 * Calls a bang() repeatedly at regular intervals
 * [kr-only]
 */
var Interval = (function() {
    var Interval = function() {
        initialize.apply(this, arguments);
    }, $this = Interval.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
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
        get: function() { return this._.count; }
        // TODO: implement 'set'
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
    
    $this.on = function() {
        this._.ison = true;
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
    
    $this.play = function() {
        timbre.fn.do_event(this, "play");
        return this;
    };
    
    $this.pause = function() {
        timbre.fn.do_event(this, "pause");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        
        _.samples = 0;
        _.count =  0;
        _.currentTime = 0;
        timbre.fn.do_event(this, "bang");
        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, i, imax;
        
        if (seq_id !== this.seq_id) {
            if (_.interval_samples !== 0) {
                _.samples -= timbre.cellsize;
                if (_.samples <= 0) {
                    _.samples += _.interval_samples;
                    args = this.args;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        args[i].bang();
                    }
                    ++_.count;
                }
            }
            _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
            this.seq_id = seq_id;
        }
        return this.cell;
    };
    
    return Interval;
}());
timbre.fn.register("interval", Interval);


/**
 * Timeout: 0.1.0
 * Calls a bang() after specified delay
 * [kr-only]
 */
var Timeout = (function() {
    var Timeout = function() {
        initialize.apply(this, arguments);
    }, $this = Timeout.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "timeout", {
        set: function(value) {
            if (typeof value === "number") {
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
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.ison = false;
        _.samples = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        return timbre("timeout", this._.timeout);
    };
    
    $this.on = function() {
        var _ = this._;
        
        _.ison = true;
        _.samples = _.timeout_samples;
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
    
    $this.play = function() {
        timbre.fn.do_event(this, "play");
        return this;
    };
    
    $this.pause = function() {
        timbre.fn.do_event(this, "pause");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        
        _.samples = _.timeout_samples;
        _.currentTime = 0;
        timbre.fn.do_event(this, "bang");
        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, i, imax;
        if (seq_id !== this.seq_id) {
            if (_.timeout_samples !== 0) {
                _.samples -= timbre.cellsize;
                if (_.samples <= 0) {
                    _.samples = 0;
                    args = this.args;
                    for (i = 0, imax = args.length; i < imax; ++i) {
                        args[i].bang();
                    }
                    if (_.samples <= 0) this.off();
                }
            }
            _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
            this.seq_id = seq_id;
        }
        return this.cell;
    };
    
    return Timeout;
}());
timbre.fn.register("timeout", Timeout);


/**
 * Metronome: <draft>
 * Calls a bang() at a metronomic bpm
 * [kr-only]
 */
var Mertonome = (function() {
    var Mertonome = function() {
        initialize.apply(this, arguments);
    }, $this = Mertonome.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "bpm", {
        set: function(value) {
            var  _ = this._;
            if (typeof value === "number") {
                _.bpm = value;
                calc_interval.call(this);
            }
        },
        get: function() { return this._.bpm; }
    });
    Object.defineProperty($this, "beats", {
        set: function(value) {
            var  _ = this._;
            if (typeof value === "number") {
                _.beats = value;
                calc_interval.call(this);
            }
        },
        get: function() { return this._.beat; }
    });
    Object.defineProperty($this, "shuffle", {
        set: function(value) {
            var x, _ = this._;
            if (typeof value === "number") {
                while (value >= 1.0) value -= 1.0;
                while (value <  0.0) value += 1.0;
                _.shuffle = value;
                calc_interval.call(this);
            }
        },
        get: function() { return this._.beat; }
    });
    Object.defineProperty($this, "measure", {
        get: function() { return this._.measure; }
    });
    Object.defineProperty($this, "beat", {
        get: function() { return this._.beat; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        _.bpm     = (typeof _args[i] === "number") ? _args[i++] : 120;
        _.beats   = (typeof _args[i] === "number") ? _args[i++] :   4;
        _.shuffle = (typeof _args[i] === "number") ? _args[i++] : 0.5;
        
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.ison = false;
        _.samples = _.measure = _.beat = _.currentTime = 0;
        calc_interval.call(this);
    };
    
    var calc_interval = function() {
        var x,  _ = this._;
            x = (60 / _.bpm) * (4 / _.beats) * timbre.samplerate * 2;
        _.interval_samples = [ x * (1 - _.shuffle), x * _.shuffle ];
    };
    
    $this.clone = function(deep) {
        return timbre("metro", this._.bpm, this._.beat);
    };
    
    $this.on = function() {
        this._.ison = true;
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
    
    $this.play = function() {
        timbre.fn.do_event(this, "play");
        return this;
    };
    
    $this.pause = function() {
        timbre.fn.do_event(this, "pause");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        _.samples = _.measure = _.beat = _.currentTime = 0;
        timbre.fn.do_event(this, "bang");
        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, i, imax;
        
        if (seq_id !== this.seq_id) {
            _.samples -= timbre.cellsize;
            if (_.samples <= 0) {
                args = this.args;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    args[i].bang();
                }
                ++_.beat;
                if (_.beat === _.beats) {
                    _.beat = 0;
                    ++_.measure;
                }
                _.samples += _.interval_samples[_.beat & 1];                    
            }
            _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
            this.seq_id = seq_id;
        }
        return this.cell;
    };
    
    return Mertonome;
}());
timbre.fn.register("metro", Mertonome);


/**
 * Scheulde: <draft>
 * [kr-only]
 */
var Schedule = (function() {
    var Schedule = function() {
        initialize.apply(this, arguments);
    }, $this = Schedule.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
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
        timbre.timers.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        var _ = this._;
        _.ison = false;
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
        _.index = 0;
        _.currentTime = 0;
        _.loopcount   = 0;
        timbre.fn.do_event(this, "bang");
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
    object_test(Interval, "interval");
});
describe("timeout", function() {
    object_test(Timeout, "timeout");
});
describe("schedule", function() {
    object_test(Schedule, "schedule");
});
