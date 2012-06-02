/**
 * timbre/metronome
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Metronome: <draft>
 * Calls a bang() at a metronomic bpm
 * [kr-only]
 */
var Metronome = (function() {
    var Metronome = function() {
        initialize.apply(this, arguments);
    }, $this = Metronome.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    timbre.fn.setPrototypeOf.call($this, "timer");
    
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
        var newone, _ = this._;
        newone = timbre("metro", _.bpm, _.beat, _.shuffle);
        return newone;
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
    
    return Metronome;
}());
timbre.fn.register("metro", Metronome);

// __END__

describe("metro", function() {
    object_test(Metronome, "metro");
});
