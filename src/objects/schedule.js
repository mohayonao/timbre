/**
 * Schedule
 * v 0. 3. 1: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

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
