/**
 * timbre/envelopes
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

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
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
                x -= dx;
                if (x < 0.0) x = 0.0;                
                if (--samples === 0.0) {
                    this._samples = 0;
                    this.onended();
                    x  = this._x;
                    dx = this._dx;
                    samples = this._samples;
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

// __END__

describe("perc", function() {
    var instance = timbre("perc", 1000);
    object_test(Perc, instance);
});
