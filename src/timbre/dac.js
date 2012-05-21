/**
 * timbre/dac
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Dac = (function() {
    var Dac = function() {
        initialize.apply(this, arguments);
    }, $this = Dac.prototype;
    
    Object.defineProperty($this, "dac", { get: function() { return this; } });
    
    Object.defineProperty($this, "amp", {
        set: function(value) {
            if (typeof value === "number") {
                this._mul = value;
            }
        },
        get: function() {
            return this._mul;
        }
    });
    Object.defineProperty($this, "pan", {
        set: function(value) {
            if (typeof value === "number") {
                this._pan  = value;
                this._panL = Math.cos(0.5 * Math.PI * this._pan);
                this._panR = Math.sin(0.5 * Math.PI * this._pan);
            }
        },
        get: function() {
            return this._pan;
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
        this.args = timbre.fn.valist.call(this, _args);
        this._L = new Float32Array(timbre.cellsize);
        this._R = new Float32Array(timbre.cellsize);
        this._pan  = 0.5;
        this._panL = Math.cos(0.5 * Math.PI * this._pan);
        this._panR = Math.sin(0.5 * Math.PI * this._pan);
        this._mul  = 1.0;
        this._ison = false;
        this._ar = true;
    };

    $this._post_init = function() {
        var i, args;
        args = this.args;
        for (i = args.length; i--; ) {
            args[i].dac = this;
        }
    };
    
    $this.on = $this.play = function() {
        this._ison = true;
        timbre.dacs.append(this);
        timbre.fn.do_event(this, "play");        
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = $this.pause = function() {
        this._ison = false;
        timbre.dacs.remove(this);
        timbre.fn.do_event(this, "off");
        timbre.fn.do_event(this, "pause");        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var args, cell, L, R;
        var mul, panL, panR;
        var tmp, i, j, jmax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            L = this._L;
            R = this._R;
            mul = this._mul;
            panL = this._panL * mul;
            panR = this._panR * mul;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = L[j] = R[j] = 0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j] * mul;
                    L[j] += tmp[j] * panL;
                    R[j] += tmp[j] * panR;
                }
            }
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    return Dac;
}());
timbre.fn.register("dac", Dac);

// __END__

describe("dac", function() {
    var instance = timbre("dac", 10, false, null);
    object_test(Dac, instance);
    describe("#clone()", function() {
        it("should have same values", function() {
            timbre(instance).args.should.eql(instance.args);
        });
    });
});
