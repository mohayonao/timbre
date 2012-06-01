/**
 * timbre/system
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Dac: 0.0.0
 * Audio output
 * [ar-only]
 */
var Dac = (function() {
    var Dac = function() {
        initialize.apply(this, arguments);
    }, $this = Dac.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    Object.defineProperty($this, "dac", {
        get: function() { return this; }
    });
    Object.defineProperty($this, "pan", {
        set: function(value) {
            this._.pan = timbre(value);
        },
        get: function() { return this._.pan; }
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        this.args = timbre.fn.valist.call(this, _args);
        this.pan = 0.5;
        this.L = new Float32Array(timbre.cellsize);
        this.R = new Float32Array(timbre.cellsize);
        _.prev_pan = undefined;
        _.ison = false;
    };
    
    $this._post_init = function() {
        var i, args;
        args = this.args;
        for (i = args.length; i--; ) {
            args[i].dac = this;
        }
    };
    
    $this.clone = function(deep) {
        var newone = timbre("dac");
        newone._.pan = (deep) ? this._.pan.clone(true) : this._.pan;
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.on = function() {
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    $this.off = function() {
        this._.ison = false;
        timbre.dacs.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    $this.play = function() {
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.do_event(this, "play");        
        return this;
    };
    $this.pause = function() {
        this._.ison = false;
        timbre.dacs.remove(this);
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
            this.seq_id = seq_id;
            pan = _.pan.seq(seq_id)[0];
            if (pan !== _.prev_pan) {
                _.panL = Math.cos(0.5 * Math.PI * pan);
                _.panR = Math.sin(0.5 * Math.PI * pan);
                _.prev_pan = pan;
            }
            L = this.L;
            R = this.R;
            mul  = _.mul;
            panL = _.panL * mul;
            panR = _.panR * mul;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = L[j] = R[j] = 0;
            }
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (args[i] !== undefined) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j] * mul;
                        L[j] += tmp[j] * panL;
                        R[j] += tmp[j] * panR;
                    }
                }
            }
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
    object_test(Dac, "dac");
    describe("#play()", function() {
        it("should append self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.should.equal(timbre.dacs[timbre.dacs.length-1]);
        });
    });
    describe("#pause()", function() {
        it("should remove self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.pause();
            timbre.dacs.length.should.equal(i);
        });
    });
    describe("#on()", function() {
        it("should append self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.should.equal(timbre.dacs[timbre.dacs.length-1]);
        });
    });
    describe("#off()", function() {
        it("should remove self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.pause();
            timbre.dacs.length.should.equal(i);
        });
    });
    describe("processing", function() {
        it("should add signals", function() {
            var instance = timbre("dac");
            var a = timbre(10);
            var b = timbre(20);
            instance.append(a, b)
            instance.seq(0);
            instance.cell.should.eql(timbre(30).cell);
        })
    });
});
