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
    
    Object.defineProperty($this, "dac", {
        get: function() { return this; }
    });
    Object.defineProperty($this, "pan", {
        set: function(value) {
            if (typeof value !== "object") {
                this._.pan = timbre(value);
            } else {
                this._.pan = value;
            }
        },
        get: function() { return this._.pan; }
    });
    Object.defineProperty($this, "amp", {
        set: function(value) {
            if (typeof value === "number") {
                this._.mul = value;
            }
        },
        get: function() { return this._.mul; }
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        this.args = timbre.fn.valist.call(this, _args);
        this.pan = 0.5;
        this.L = new Float32Array(timbre.cellsize);
        this.R = new Float32Array(timbre.cellsize);
        _.prev_pan = undefined;
    };
    timbre.fn.set_ar_only($this);
    
    $this._post_init = function() {
        var i, args;
        args = this.args;
        for (i = args.length; i--; ) {
            args[i].dac = this;
        }
    };
    
    $this.clone = function(deep) {
        var newone;
        newone = timbre("dac");
        newone._.pan = (deep) ? this._.pan.clone(true) : this._.pan;
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.on = $this.play = function() {
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.do_event(this, "play");        
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = $this.pause = function() {
        this._.ison = false;
        timbre.dacs.remove(this);
        timbre.fn.do_event(this, "off");
        timbre.fn.do_event(this, "pause");        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, L, R;
        var mul, pan, panL, panR;
        var tmp, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            args = this.args;
            L = this.L;
            R = this.R;
            pan = _.pan.seq(seq_id)[0];
            if (pan !== _.prev_pan) {
                _.panL = Math.cos(0.5 * Math.PI * pan);
                _.panR = Math.sin(0.5 * Math.PI * pan);
                _.prev_pan = pan;
            }
            mul  = _.mul;
            panL = _.panL * mul;
            panR = _.panR * mul;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = L[j] = R[j] = 0;
            }
            for (i = 0, imax = args.length; i < imax; ++i) {
                if ((tmp = args[i]) !== undefined) {
                    tmp = tmp.seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j] * mul;
                        L[j] += tmp[j] * panL;
                        R[j] += tmp[j] * panR;
                    }
                }
            }
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return Dac;
}());
timbre.fn.register("dac", Dac);

timbre.fn.register("pandac", Dac, function(_args) {
    var instance = new Dac(_args.slice(1));
    instance.pan = _args[0];
    return instance;
});

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
