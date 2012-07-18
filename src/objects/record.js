/**
 * Record
 * Record sound into a buffer
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Record = (function() {
    var Record = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Record, {
        base: ["ar-only", "listener"],
        properties: {
            buffer: {
                get: function() { return this._.buffer; }
            },
            recTime: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number" && val > 0) {
                        _.recTime = val;
                        _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
                    }
                },
                get: function() { return this._.recTime; }
            },
            interval: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        _.interval = val;
                        _.interval_samples = (timbre.samplerate * (val / 1000))|0;
                        if (_.interval_samples < _.buffer.length) {
                            _.interval_samples = _.buffer.length;
                            _.interval = _.buffer.length * timbre.samplerate / 1000;
                        }
                    }
                },
                get: function() { return this._.interval; }
            },
            currentTime: {
                get: function() { return this._.index / timbre.samplerate * 1000; }
            },
            isRecording: {
                get: function() { return this._.ison; }
            },
            overwrite: {
                set: function(val) { this._.overwrite = !!val; },
                get: function() { return this._.overwrite; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "number" && _args[i] > 0) {
            _.recTime = _args[i++];
        } else {
            _.recTime = 1000;
        }
        _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
        
        if (typeof _args[i] === "number" && _args[i] > 0) {
            this.interval = _args[i++];
        } else {
            this.interval = Infinity;
        }
        if (typeof _args[i] === "function") {
            this.onrecorded = _args[i++];
        }
        this.args = _args.slice(i).map(timbre);
        
        _.index   =  0;
        _.samples =  0;
        _.currentTime = 0;
        _.overwrite = false;
        _.status = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("rec", _.recTime);
        newone._.overwrite = _.overwrite;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.on = function() {
        var buffer, i, _ = this._;
        _.ison = true;
        _.samples = 0;
        _.status  = 0;
        timbre.fn.doEvent(this, "on");
        return this;
    };
    $this.off = function() {
        if (this._.ison) {
            onrecorded.call(this);
        }
        this._.ison = false;
        timbre.fn.doEvent(this, "off");
        return this;
    };
    $this.bang = function() {
        var _ = this._;
        _.samples = 0;
        _.status  = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    var onrecorded = function() {
        var _ = this._;
        timbre.fn.doEvent(this, "recorded",
                           [_.buffer.subarray(0, _.index)]);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, buffer, mul, add;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);            
            buffer = _.buffer;
            mul  = _.mul;
            add  = _.add;
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            if (_.status === 0 && _.samples <= 0) {
                _.status = 1;
                _.index = _.currentTime = 0;
                _.samples += _.interval_samples;
                if (!_.overwrite) {
                    for (i = buffer.length; i--; ) {
                        buffer[i] = 0;
                    }
                }
            }
            
            if (_.ison && _.status === 1) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    buffer[_.index++] = cell[i];
                    cell[i] = cell[i] * mul + add;
                }
                if (_.index >= buffer.length) {
                    onrecorded.call(this);
                    if (_.interval === Infinity) {
                        _.status = 2;
                        _.ison = false;
                        timbre.fn.doEvent(this, "ended");
                    } else {
                        _.status = 0;
                        timbre.fn.doEvent(this, "looped");
                    }
                }
            } else {
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
            _.samples -= cell.length;
        }
        return cell;
    };
    
    return Record;
}());
timbre.fn.register("rec", Record);

// __END__
if (module.parent && !module.parent.parent) {
    describe("rec", function() {
        object_test(Record, "rec");
    });
}
