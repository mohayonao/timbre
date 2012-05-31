/**
 * timbre/buffer
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * DspBuffer: 0.1.0
 * Store audio samples
 * [ar-only]
 */
var DspBuffer = (function() {
    var DspBuffer = function() {
        initialize.apply(this, arguments);
    }, $this = DspBuffer.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    Object.defineProperty($this, "buffer", {
        set: function(value) {
            var buffer, i, _ = this._;
            if (typeof value === "object") {
                if (value instanceof Float32Array) {
                    _.buffer = value;
                } else if (value instanceof Array ||
                           value.buffer instanceof ArrayBuffer) {
                    buffer = new Float32Array(value.length);
                    for (i = buffer.length; i--; ) {
                        buffer[i] = value[i];
                    }
                    _.buffer = buffer;
                    _.duration = buffer.length / timbre.samplerate * 1000;
                    if (_.reversed) {
                        _.phase = Math.max(0, _.buffer.length - 1);
                    } else {
                        _.phase = 0;
                    }
                }
            }
        },
        get: function() { return this._.buffer; }
    });
    Object.defineProperty($this, "loop", {
        set: function(value) { this._.loop = !!value; },
        get: function() { return this._.loop; }
    });
    Object.defineProperty($this, "reversed", {
        set: function(value) {
            var _ = this._;
            _.reversed = !!value;
            if (_.reversed && _.phase === 0) {
                _.phase = Math.max(0, _.buffer.length - 1);
            }
        },
        get: function() { return this._.reversed; }
    });
    Object.defineProperty($this, "duration", {
        get: function() { return this._.duration; }
    });
    Object.defineProperty($this, "currentTime", {
        set: function(value) {
            if (typeof value === "number") {
                if (0 <= value && value <= this._.duration) {
                    this._.phase = (value / 1000) * this._.samplerate;
                }
            }
        },
        get: function() { return (this._.phase / this._.samplerate) * 1000; }
    });

    var initialize = function(_args) {
        var buffer, tmp, i, j, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "object") {
            if (_args[i] instanceof Float32Array) {
                buffer = _args[i++];
            } else if (_args[i] instanceof Array ||
                       _args[i].buffer instanceof ArrayBuffer) {
                tmp = _args[i++];
                buffer = new Float32Array(tmp.length);
                for (j = buffer.length; j--; ) {
                    buffer[j] = tmp[j];
                }
            }
        }
        if (buffer === undefined) buffer = new Float32Array(0);
        
        _.loop   = (typeof _args[i] === "boolean") ? _args[i++] : false;
        
        _.ison = true;
        _.buffer = buffer;
        _.duration = buffer.length / timbre.samplerate * 1000;
        _.phase    = 0;
        _.reversed = false;
    };

    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("buffer", _.buffer, _.loop);
        newone._.reversed = _.reversed;
        newone._.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };

    $this.slice = function(begin, end) {
        var newone, _ = this._, tmp, reversed;
        
        reversed = _.reversed;
        if (typeof begin === "number") {
            begin = (begin / 1000) * timbre.samplerate;
        } else begin = 0;
        if (typeof end   === "number") {
            end   = (end   / 1000) * timbre.samplerate;
        } else end = _.buffer.length;
        if (begin > end) {
            tmp   = begin;
            begin = end;
            end   = tmp;
            reversed = !reversed;
        }
        
        newone = timbre("buffer");
        newone._.loop = _.loop;
        newone._.reversed = reversed;
        newone._.buffer   = _.buffer.subarray(begin, end);
        newone._.duration = (end - begin / timbre.samplerate) * 1000;
        newone._.phase = (reversed) ? Math.max(0, newone._.buffer.length - 1) : 0;
        timbre.fn.copy_for_clone(this, newone);
        return newone;
    };
    
    $this.bang = function() {
        var _ = this._;
        _.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, buffer, mul, add;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            buffer = _.buffer;
            mul    = _.mul
            add    = _.add;
            if (_.reversed) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[_.phase--]||0) * mul + add;
                    if (_.phase < 0) {
                        if (_.loop) {
                            _.phase = Math.max(0, _.buffer.length - 1);
                            timbre.fn.do_event(this, "looped");
                        } else {
                            timbre.fn.do_event(this, "ended");
                        }
                    }
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[_.phase++]||0) * mul + add;
                    if (_.phase >= buffer.length) {
                        if (_.loop) {
                            _.phase = 0;
                            timbre.fn.do_event(this, "looped");
                        } else {
                            timbre.fn.do_event(this, "ended");
                        }
                    }
                }
            }
        }
        return cell;
    };
    
    return DspBuffer;
}());
timbre.fn.register("buffer", DspBuffer);

// __END__

describe("buffer", function() {
    object_test(DspBuffer, "buffer");
});
