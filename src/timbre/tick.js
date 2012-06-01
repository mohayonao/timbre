/**
 * timbre/tick
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Tick: 0.0.0
 * Calls a bang() repeatedly at every cycle
 * [kr-only]
 */
var Tick = (function() {
    var Tick = function() {
        initialize.apply(this, arguments);
    }, $this = Tick.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "count", {
        get: function() { return this._.count; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.ison = false;
        _.count = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        return timbre("tick");
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
        _.count =  0;
        _.currentTime = 0;
        timbre.fn.do_event(this, "bang");
        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, i, imax;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args;
            for (i = 0, imax = args.length; i < imax; ++i) {
                args[i].bang();
            }
            
            ++_.count;
            _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
        }
        return this.cell;
    };
    
    return Tick;
}());
timbre.fn.register("tick", Tick);

// __END__

describe("tick", function() {
    object_test(Tick, "tick");
});
