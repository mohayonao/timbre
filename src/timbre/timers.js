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
    
    $this.on = function() {
        this._ison = true;
        this._samples = this._interval_samples;
        this._interval_count = 0;
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
    
    $this.bang = function() {
        if (this._ison) {
            this._samples = this._interval_samples;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var samples, count, args, i;
        if (seq_id !== this._seq_id) {
            if (this._interval_samples !== 0) {
                samples = this._samples - timbre.cellsize;
                if (samples <= 0) {
                    this._samples = samples + this._interval_samples;
                    count = ++this._interval_count;
                    args = this.args;
                    for (i = args.length; i--; ) {
                        if (typeof args[i] === "function") {
                            args[i](count);
                        } else if (args[i].bang === "function") {
                            args[i].bang();
                        }
                    }
                    samples = this._samples;
                }
                this._samples = samples;
            }
            this._seq_id = seq_id;
        }
        return this._cell;
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
    
    $this.bang = function() {
        if (this._ison) {
            this._samples = this._timeout_samples;
            timbre.fn.do_event(this, "bang");
        }
        return this;
    };
    
    $this.seq = function(seq_id) {
        var samples, args, i;
        if (seq_id !== this._seq_id) {
            if (this._timeout_samples !== 0) {
                samples = this._samples - timbre.cellsize;
                if (samples <= 0) {
                    this._samples = 0;
                    args = this.args;
                    for (i = args.length; i--; ) {
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
            this._seq_id = seq_id;
        }
        return this._cell;
    };
    
    return Timeout;
}());
timbre.fn.register("timeout", Timeout);

// __END__

describe("interval", function() {
    var instance = timbre("interval", 100);
    object_test(Interval, instance);
});
describe("timeout", function() {
    var instance = timbre("timeout", 100);
    object_test(Timeout, instance);
});
