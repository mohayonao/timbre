/**
 * ADSREnvelope: 0.3.3
 * ADSR envelope generator
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ADSREnvelope = (function() {
    var ADSREnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = ADSREnvelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");

    var Envelope = timbre.fn.getClass("env");

    timbre.fn.copyPropertyDescriptors($this,
                                      Envelope.prototype,
                                      ["table", "delay", "reversed", "currentTime"]);
    
    var STATUSES = ["off","delay","a","d","s","r"];
    
    Object.defineProperty($this, "status", {
        get: function() { return STATUSES[this._.status+1]; }
    });
    Object.defineProperty($this, "a", {
        set: function(value) {
            if (typeof value === "number") {
                this._.a = value;
            }
        },
        get: function() { return this._.a; }
    });
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._.d = value;
            }
        },
        get: function() { return this._.d; }
    });
    Object.defineProperty($this, "s", {
        set: function(value) {
            if (typeof value === "number") {
                this._.s = value;
            }
        },
        get: function() { return this._.s; }
    });
    Object.defineProperty($this, "r", {
        set: function(value) {
            if (typeof value === "number") {
                this._.r = value;
            }
        },
        get: function() { return this._.r; }
    });
    Object.defineProperty($this, "al", {
        set: function(value) {
            if (typeof value === "number") {
                this._.al = value;
            }
        },
        get: function() { return this._.al; }
    });
    Object.defineProperty($this, "dl", {
        set: function(value) {
            if (typeof value === "number") {
                this._.dl = value;
            }
        },
        get: function() { return this._.dl; }
    });
    Object.defineProperty($this, "sl", {
        set: function(value) {
            if (typeof value === "number") {
                this._.sl = value;
            }
        },
        get: function() { return this._.sl; }
    });
    Object.defineProperty($this, "rl", {
        set: function(value) {
            if (typeof value === "number") {
                this._.rl = value;
            }
        },
        get: function() { return this._.rl; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        _ = this._ = {};
        
        i = 0;
        if (typeof _args[i] === "string" && Envelope.AmpTables[_args[i]]) {
            this.table = _args[i++];
        } else {
            this.table = "linear";
        }
        
        _.a  = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.d  = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.sl = (typeof _args[i] === "number") ? _args[i++] : 0;                
        _.r  = (typeof _args[i] === "number") ? _args[i++] : 0;
        
        _.delay = 0;
        _.al = 0;
        _.dl = 1;
        _.rl = 0;
        _.s  = Infinity;
        _.reversed = false;
        
        _.status = -1;
        _.samples = Infinity;
        _.x0 = 0;
        _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("adsr", _.a, _.d, _.sl, _.r);
        newone._.delay = _.delay;
        newone._.s = _.s;
        newone._.reversed = _.reversed;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function(mode) {
        var _ = this._;
        
        // off -> delay
        _.status  = 0;
        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
        _.x0 = 0;
        _.dx = (timbre.cellsize * _.al) / _.samples;
        _.currentTime = 0;
        
        timbre.fn.doEvent(this, "bang");
        return this;
    };

    $this.keyoff = function() {
        var _ = this._;
        
        if (_.status <= 3) {
            // (delay, A, D, S) -> R
            _.status  = 4;
            _.samples = (timbre.samplerate * (_.r / 1000))|0;
            _.dx = -timbre.cellsize * (_.x0 - _.rl) / _.samples;
            timbre.fn.doEvent(this, "R");
        }
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x, i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    _.samples += (timbre.samplerate * (_.a / 1000))|0;
                    _.x0 = _.al;
                    _.dx = (timbre.cellsize * (_.dl -_.al)) / _.samples;
                    timbre.fn.doEvent(this, "A");
                    continue;
                }
                if (_.status === 1) { // A -> D
                    _.status = 2;
                    _.samples += (timbre.samplerate * (_.d / 1000))|0;
                    _.x0 = _.dl;
                    _.dx = -timbre.cellsize * (_.dl - _.sl) / _.samples;
                    timbre.fn.doEvent(this, "D");
                    continue;
                }
                if (_.status === 2) { // D -> S
                    if (_.sl === 0) {
                        _.status = 4;
                        continue;
                    }
                    _.status = 3;
                    _.x0 = _.sl;
                    if (_.s === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * (_.s / 1000))|0;
                        _.dx = -timbre.cellsize * (_.sl - _.rl) / _.samples;
                    }
                    timbre.fn.doEvent(this, "S");
                    continue;
                }
                if (_.status <= 4) { // (S, R) -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.dx = 0;
                    timbre.fn.doEvent(this, "ended");
                    continue;
                }
            }
            
            x = (_.x0 === 1) ? 1 : _.table[(_.x0 * 512)|0];
            if (_.reversed) x = 1 - x;
            
            x = x * _.mul + _.add;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            _.x0 += _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;
        }
        return cell;
    };
    
    return ADSREnvelope;
}());
timbre.fn.register("adsr", ADSREnvelope);

// __END__
if (module.parent && !module.parent.parent) {
    describe("adsr", function() {
        object_test(ADSREnvelope, "adsr");
    });
}
