/**
 * PercussiveEnvelope: 0.1.0
 * Percussive envelope generator
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var PercussiveEnvelope = (function() {
    var PercussiveEnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = PercussiveEnvelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");

    var STATUSES = ["off","delay","a","r"];
    
    Object.defineProperty($this, "status", {
        get: function() { return STATUSES[this._.status+1]; }
    });
    
    Object.defineProperty($this, "delay", {
        set: function(value) {
            if (typeof value === "number") {
                this._.delay = value;
            }
        },
        get: function() { return this._.delay; }
    });
    Object.defineProperty($this, "a", {
        set: function(value) {
            if (typeof value === "number") {
                this._.a = value;
            }
        },
        get: function() { return this._.a; }
    });
    Object.defineProperty($this, "r", {
        set: function(value) {
            if (typeof value === "number") {
                this._.r = value;
            }
        },
        get: function() { return this._.r; }
    });
    Object.defineProperty($this, "al", {
        set: function(value) {
            if (typeof value === "number") {
                this._.al = value;
            }
        },
        get: function() { return this._.al; }
    });
    Object.defineProperty($this, "reversed", {
        set: function(value) {
            if (typeof value === "boolean") {
                this._.reversed = value;
            }
        },
        get: function() { return this._.reversed; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
        var i, _;

        this._ = _ = {};
        
        i = 0;
        _.r = (typeof _args[i] === "number") ? _args[i++] : 0;
        
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        _.delay = 0;
        _.a  = 0;
        _.al = 0;
        _.reversed = false;
        
        _.status  = -1;        
        _.samples = Infinity;
        _.x0 = 0; _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = timbre("perc", _.r);
        newone._.delay = _.delay;
        newone._.a     = _.a;
        newone._.al    = _.al;
        newone._.reversed = _.reversed;
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.bang = function() {
        var _ = this._;

        // off -> delay
        _.status  = 0;
        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
        _.x0 = 0;
        _.dx = -(timbre.cellsize * _.al) / _.samples;
        _.currentTime = 0;
        
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x, i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    _.samples += (timbre.samplerate * (_.a / 1000))|0;
                    _.x0 = _.al;
                    _.dx = -(timbre.cellsize * (1 -_.al)) / _.samples;
                    timbre.fn.do_event(this, "A");
                    continue;
                }
                if (_.status === 1) {
                    // A -> R
                    _.status  = 2;
                    _.samples = (timbre.samplerate * (_.r / 1000))|0;
                    _.x0 = 1;
                    _.dx = timbre.cellsize / _.samples;
                    timbre.fn.do_event(this, "R");
                    continue;
                }
                if (_.status === 2) {
                    // R -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.dx = 0;
                    timbre.fn.do_event(this, "ended");
                    continue;
                }
            }
            
            if (_.reversed) {
                x = (1.0 - _.x0) * _.mul + _.add;
            } else {
                x = _.x0 * _.mul + _.add;
            }
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            _.x0 -= _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;;
        }
        return cell;
    };
    
    return PercussiveEnvelope;
}());
timbre.fn.register("perc", PercussiveEnvelope);

// __END__

describe("perc", function() {
    object_test(PercussiveEnvelope, "perc");
});
