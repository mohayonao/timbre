/**
 * Record: 0.3.2
 * Record sound into a buffer
 * [ar-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Record = (function() {
    var Record = function() {
        initialize.apply(this, arguments);
    }, $this = Record.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    timbre.fn.setPrototypeOf.call($this, "listener");
    
    Object.defineProperty($this, "buffer", {
        get: function() { return this._.buffer; }
    });
    Object.defineProperty($this, "recTime", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number" && value > 0) {
                _.recTime = value;
                _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
            }
        },
        get: function() { return this._.recTime; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.index / timbre.samplerate * 1000; }
    });
    Object.defineProperty($this, "isRecording", {
        get: function() { return this._.ison; }
    });
    Object.defineProperty($this, "overwrite", {
        set: function(value) { this._.overwrite = !!value; },
        get: function() { return this._.overwrite; }
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
        if (typeof _args[i] === "function") {
            this.onrecorded = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        
        _.buffer = new Float32Array((timbre.samplerate * _.recTime / 1000)|0);
        _.index  = _.currentTime = 0;
        _.overwrite = false;
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
        if (_.index >= _.buffer.length) {
            _.index = _.currentTime = 0;
            if (!_.overwrite) {
                buffer = _.buffer;
                for (i = buffer.length; i--; ) {
                    buffer[i] = 0;
                }
            }
        }
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
        var buffer, i, _ = this._;
        _.index = _.currentTime = 0;
        if (!_.overwrite) {
            buffer = _.buffer;
            for (i = buffer.length; i--; ) {
                buffer[i] = 0;
            }
        }
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
            
            if (_.ison) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    buffer[_.index++] = cell[i];
                    cell[i] = cell[i] * mul + add;
                }
                if (_.index >= buffer.length) {
                    _.ison = false;
                    onrecorded.call(this);
                    timbre.fn.doEvent(this, "ended");
                }
            } else {
                for (i = cell.length; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            }
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
