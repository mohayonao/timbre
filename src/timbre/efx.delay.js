/**
 * timbre/efx.delay
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxDelay = (function() {
    var EfxDelay = function() {
        initialize.apply(this, arguments);
    }, $this = EfxDelay.prototype;
    
    Object.defineProperty($this, "time", {
        set: function(value) {
            if (typeof value === "number") {
                this._delayTime = value;
            }
        },
        get: function() { return this._delayTime; }
    });
    Object.defineProperty($this, "fb", {
        set: function(value) {
            if (typeof value === "number") {
                this._feedback = value;
            }
        },
        get: function() { return this._feedback; }
                        
    });
    Object.defineProperty($this, "wet", {
        set: function(value) {
            if (typeof value === "number") {
                this._wet = value;
            }
        },
        get: function() { return this._wet; }
    });
    
    var initialize = function(_args) {
        var i, bits;
        bits = Math.ceil(Math.log(timbre.samplerate * 1.5) * Math.LOG2E)

        this._buffer = new Float32Array(1 << bits);
        this._buffer_mask = (1 << bits) - 1;
        this._pointerWrite = 0;
        this._pointerRead  = 0;
        this._delayTime = 250;
        this._feedback = 0.25;
        this._wet = 0.25;
        
        i = 0;
        if (typeof _args[i] === "number") {
            this._delayTime = _args[i++];
        }    
        if (typeof _args[i] === "number") {
            this._feedback = _args[i++];
        }    
        if (typeof _args[i] === "number") {
            this._wet = _args[i++];
        }    
        this._set_params(this._delayTime, this._feedback, this._wet);
        
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        this._enabled = true;
    };

    $this._set_params = function(delayTime, feedback, wet) {
        var offset;
        offset = delayTime * timbre.samplerate / 1000;
        
        this._pointerWrite = (this._pointerRead + offset) & this._buffer_mask;
        if (feedback >= 1.0) {
            this._feedback = +0.9990234375;
        } else if (feedback <= -1.0) {
            this._feedback = -0.9990234375;
        } else {
            this._feedback = feedback;
        }
        if (wet < 0) {
            this._wet = 0;
        } else if (wet > 1.0) {
            this._wet = 1.0;
        } else {
            this._wet = wet;
        }
    };
    
    $this.on = function() {
        this._enabled = true;
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._enabled = false;
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var args, cell;
        var tmp, i, imax, j, jmax;
        var mul, add;
        var x, feedback, wet, dry;
        var buffer, buffer_mask, pointerRead, pointerWrite;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            buffer = this._buffer;
            buffer_mask = this._buffer_mask;
            feedback = this._feedback;
            wet = this._wet;
            dry = 1 - wet;
            pointerRead  = this._pointerRead;
            pointerWrite = this._pointerWrite;
            mul = this._mul;
            add = this._add;
            
            // filter
            if (this._enabled) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    x = buffer[pointerRead];
                    buffer[pointerWrite] = cell[i] - x * feedback;
                    cell[i] *= dry;
                    cell[i] += x * wet;
                    cell[i] = cell[i] * mul + add;
                    pointerWrite = (pointerWrite + 1) & buffer_mask;
                    pointerRead  = (pointerRead  + 1) & buffer_mask;
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    x = buffer[pointerRead];
                    buffer[pointerWrite] = cell[i] - x * feedback;
                    pointerWrite = (pointerWrite + 1) & buffer_mask;
                    pointerRead  = (pointerRead  + 1) & buffer_mask;
                    cell[i] = cell[i] * mul + add;
                }
            }
            this._pointerRead  = pointerRead;
            this._pointerWrite = pointerWrite;
            
            this._seq_id = seq_id;
        }
        return cell;
    };
    

    return EfxDelay;
}());
timbre.fn.register("efx.delay", EfxDelay);

// __END__