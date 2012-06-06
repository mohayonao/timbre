/**
 * Interval: 0.2.2
 * Calls a bang() repeatedly at regular intervals
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

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

// __END__

describe("interval", function() {
    object_test(Interval, "interval");
});
