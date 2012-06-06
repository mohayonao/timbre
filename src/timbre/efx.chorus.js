/**
 * EfxChorus: 0.1.0
 * [ar-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxChorus = (function() {
    var EfxChorus = function() {
        initialize.apply(this, arguments);
    }, $this = EfxChorus.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    Object.defineProperty($this, "depth", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number") {
                _.depth = value;
                _.lfo.mul = _.depth * _.offset;
            }
        },
        get: function() { return this._.depth; }
    });
    Object.defineProperty($this, "rate", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number") {
                _.rate = value;
                _.lfo.freq.value = value;
            }
        },
        get: function() { return this._.rate; }
    });
    Object.defineProperty($this, "wet", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number") {
                if (0 <= value && value <= 1.0) {
                    _.wet = value;
                    _.wet0 = Math.sin(0.25 * Math.PI * value);
                    _.dry0 = Math.cos(0.25 * Math.PI * value);
                }
            }
        },
        get: function() { return this._.wet; }
    });
    
    var initialize = function(_args) {
        var bits, i, _;
        
        this._ = _ = {};
        bits = Math.ceil(Math.log(timbre.samplerate * 0.02) * Math.LOG2E);
        
        _.buffer = new Float32Array(1 << bits);
        _.buffer_mask = (1 << bits) - 1;
        
        i = 0;
        _.delay = 10;
        _.depth = (typeof _args[i] === "number") ? _args[i] : 0.8;
        _.rate  = (typeof _args[i] === "number") ? _args[i] : 0.5;
        _.wet   = (typeof _args[i] === "number") ? _args[i] : 0.5;
        
        _.wet0 = Math.sin(0.25 * Math.PI * _.wet);
        _.dry0 = Math.cos(0.25 * Math.PI * _.wet);
        
        _.sr   = timbre.samplerate / 1000;
        _.offset = (_.sr * _.delay)|0;
        _.pointerRead  = 0;
        _.pointerWrite = _.offset;
        _.lfo = timbre("sin", _.rate, _.depth * _.offset).kr();
        
        this.args = timbre.fn.valist.call(this, _args.slice(i));
    };

    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("efx.chorus", _.depth, _.rate, _.wet);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell;
        var tmp, i, imax, j, jmax;
        var buffer, buffer_mask, pointerWrite, pointerRead0, pointerRead1;
        var wet, dry, fb, offset, x0, x1, xx;
        var mul, add;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            buffer = _.buffer;
            buffer_mask  = _.buffer_mask;
            pointerWrite = _.pointerWrite;
            
            for (j = 0; j < jmax; ++j) {
                buffer[pointerWrite] = 0;
                pointerWrite = (pointerWrite + 1) & buffer_mask;
            }            
            
            pointerWrite = _.pointerWrite;
            for (i = 0, imax = args.length; i < imax; ++i) {
                tmp = args[i].seq(seq_id);
                for (j = 0; j < jmax; ++j) {
                    buffer[pointerWrite] += tmp[j];
                    pointerWrite = (pointerWrite + 1) & buffer_mask;
                }
            }
            
            mul = _.mul;
            add = _.add;
            
            if (_.ison) {
                wet = _.wet0;
                dry = _.dry0;
                fb  = _.fb;
                offset = _.lfo.seq(seq_id)[0]|0;
                
                pointerRead0 = _.pointerRead;
                pointerRead1 = (pointerRead0 + offset + buffer.length) & buffer_mask;
                pointerWrite = _.pointerWrite;
                
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    x0 = buffer[pointerRead0];
                    x1 = buffer[pointerRead1];
                    xx = (x0 * dry) + (x1 * wet);
                    cell[i] = xx * mul + add;
                    pointerRead0 = (pointerRead0 + 1) & buffer_mask;
                    pointerRead1 = (pointerRead1 + 1) & buffer_mask;
                    pointerWrite = (pointerWrite + 1) & buffer_mask;
                }
            } else {
                pointerRead0 = _.pointerRead;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = buffer[pointerRead0] * mul + add;
                    pointerRead0 = (pointerRead0 + 1) & buffer_mask;
                }
            }
            _.pointerRead  = pointerRead0;
            _.pointerWrite = pointerWrite;
        }
        return cell;
    };
    
    return EfxChorus;
}());
timbre.fn.register("efx.chorus", EfxChorus);

// __END__

describe("efx.chorus", function() {
    object_test(EfxChorus, "efx.chorus", 0);
});
