/**
 * Buffer
 * Store audio samples
 * v 0. 1. 0
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Buffer = (function() {
    var Buffer = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Buffer, {
        base: "ar-only",
        properties: {
            buffer: {
                set: function(val) {
                    var buffer, i, _ = this._;
                    if (typeof val === "object") {
                        if (val instanceof Float32Array) {
                            _.buffer = val;
                        } else if (val instanceof Array ||
                                   val.buffer instanceof ArrayBuffer) {
                            buffer = new Float32Array(val.length);
                            for (i = buffer.length; i--; ) {
                                buffer[i] = val[i];
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
            },
            loop: {
                set: function(val) { this._.loop = !!val; },
                get: function() { return this._.loop; }
            },
            reversed: {
                set: function(val) {
                    var _ = this._;
                    _.reversed = !!val;
                    if (_.reversed && _.phase === 0) {
                        _.phase = Math.max(0, _.buffer.length - 1);
                    }
                },
                get: function() { return this._.reversed; }
            },
            duration: {
                get: function() { return this._.duration; }
            },
            currentTime: {
                set: function(val) {
                    if (typeof val === "number") {
                        if (0 <= val && val <= this._.duration) {
                            this._.phase = (val / 1000) * this._.samplerate;
                        }
                    }
                },
                get: function() { return (this._.phase / this._.samplerate) * 1000; }
            }
        } // properties
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
        return timbre.fn.copyBaseArguments(this, newone, deep);
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
        timbre.fn.doEvent(this, "bang");
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
                            timbre.fn.doEvent(this, "looped");
                        } else {
                            timbre.fn.doEvent(this, "ended");
                        }
                    }
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[_.phase++]||0) * mul + add;
                    if (_.phase >= buffer.length) {
                        if (_.loop) {
                            _.phase = 0;
                            timbre.fn.doEvent(this, "looped");
                        } else {
                            timbre.fn.doEvent(this, "ended");
                        }
                    }
                }
            }
        }
        return cell;
    };
    
    return Buffer;
}());
timbre.fn.register("buffer", Buffer);

// __END__
if (module.parent && !module.parent.parent) {
    describe("buffer", function() {
        object_test(Buffer, "buffer");
    });
}
