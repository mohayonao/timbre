/**
 * Schedule: <draft>
 * [kr-only]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Schedule = (function() {
    var Schedule = function() {
        initialize.apply(this, arguments);
    }, $this = Schedule.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    timbre.fn.setPrototypeOf.call($this, "timer");
    
    Object.defineProperty($this, "mode", {
        get: function() { return this._.mode; }
    });
    Object.defineProperty($this, "bpm", {
        set: function(value) {
            if (this._.mode === "bpm") {
                if (typeof value === "number" && value > 0) {
                    changeBPM.call(this, value);
                }
            }
        },
        get: function() { return this._.bpm; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
        var list, i, j, _;
        
        this._ = _ = {};
        
        _.bpm  = 0;
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
        for (i = tt.length; i--; ) {
            tt[i][0] *= x;
        }
        _.currentTime *= x;
        
        _.msec = msec;
        _.bpm  = bpm;
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
            this.seq_id = seq_id;
            
            tt = _.timetable;
            while ((schedule = tt[_.index]) !== undefined) {
                if (_.currentTime < schedule[0]) {
                    break;
                } else {
                    if ((target = schedule[1]) !== undefined) {
                        if (typeof target === "function") {
                            target.apply(target, schedule[2]);
                        } else if (timbre.fn.isTimbreObject(target)) {
                            target.bang();
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
        return this.cell;
    };
    
    return Schedule;
}());
timbre.fn.register("schedule", Schedule);

// __END__
if (module.parent && !module.parent.parent) {
    describe("schedule", function() {
        object_test(Schedule, "schedule");
        describe("arguments", function() {
            
        });
        describe("properties", function() {
            it("get currentTime", function() {
                var instance = T("schedule");
                instance.currentTime.should.be.a("number");
            });
            it("set currentTime", function() {
                (function() {
                    var instance = T("schedule");
                    instance.currentTime = 1000;
                }).should.throw(/only a getter/);
            });
        });
    });
}
