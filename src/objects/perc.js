/**
 * PercussiveEnvelope: 12.07.12
 * Percussive envelope generator
 * v12.07.12: add ar-mode
 */
"use strict";

var timbre = require("../timbre");
require("./env");
// __BEGIN__

var PercussiveEnvelope = (function() {
    var PercussiveEnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = PercussiveEnvelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-ar");
    
    var Envelope = timbre.fn.getClass("env");

    timbre.fn.copyPropertyDescriptors($this,
                                      Envelope.prototype,
                                      ["table", "delay", "reversed", "currentTime"]);
    
    var STATUSES = ["off","delay","a","r"];
    
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
    
    var initialize = function(_args) {
        var i, nums, _;

        this._ = _ = {};
        nums = [];
        
        i = 0;
        if (typeof _args[i] === "string") {
            this.table = _args[i++];
        }
        if (_.table === undefined) this.table = "linear";

        nums = [];
        while (typeof _args[i] === "number") {
            nums.push(_args[i++]);
        }

        _.delay = 0;
        _.a  = 0;
        _.r  = 1000;
        _.al = 0;
        
        switch (nums.length) {
        case 0: // T("perc");
            break;
        case 1: // T("perc", release);
            _.r = nums[0];
            break;
        case 2: // T("perc", attack, release);
            _.a = nums[0];
            _.r = nums[1];
            break;
        case 3: // T("perc", delay, attack, release);
            _.delay = nums[0];
            _.a = nums[1];
            _.r = nums[2];
            break;
        default: // T("perc", delay, attack, release, attack-level);
            _.delay = nums[0];
            _.a  = nums[1];
            _.r  = nums[2];
            _.al = nums[3];
            break;
        }

        _.reversed = false;
        if (typeof _args[i] === "boolean") {
            _.reversed = _args[i++];
        }
        
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        _.status  = -1;        
        _.samples = Infinity;
        _.x0 = 0;
        _.dx = 0;
        _.curx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = timbre("perc", _.tableName);
        newone._.delay = _.delay;
        newone._.a = _.a; newone._.al = _.al;
        newone._.r = _.r;
        newone._.reversed = _.reversed;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;

        // off -> delay
        _.status  = 0;
        if (_.delay < 0) {
            _.samples = 0;
            _.dx = 0;
        } else {
            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
            _.dx = -(timbre.cellsize * _.al) / _.samples;
        }
        _.x0 = 0; _.curx = 0;
        _.currentTime = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x0, x1, dx, i, imax;
        var mul, add;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    _.samples += (timbre.samplerate * (_.a / 1000))|0;
                    _.dx = -(timbre.cellsize * (1 -_.al)) / _.samples;
                    _.x0 = _.al;
                    timbre.fn.doEvent(this, "A");
                    continue;
                }
                if (_.status === 1) {
                    // A -> R
                    _.status  = 2;
                    _.samples = (timbre.samplerate * (_.r / 1000))|0;
                    _.x0 = 1;
                    _.dx = timbre.cellsize / _.samples;
                    timbre.fn.doEvent(this, "R");
                    continue;
                }
                if (_.status === 2) {
                    // R -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.dx = 0;
                    timbre.fn.doEvent(this, "ended");
                    continue;
                }
            }
            
            if (_.ar) { // ar-mode (v.12.07.12)
                
                mul = _.mul;
                add = _.add;
                
                if (_.x0 === 1) {
                    x0 = x1 = 1;
                } else {
                    x0 = _.table[((_.x0       ) * 512)|0];
                    x1 = _.table[((_.x0 - _.dx) * 512)|0];
                    if (x1 === undefined) x1 = x0;
                }
                if (_.reversed) {
                    x0 = 1 - x0; x1 = 1 - x1;
                }
                dx = (x1 - x0) / cell.length;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x0 * mul + add;
                    x0 += dx;
                }
                
            } else {    // kr-mode
                
                x0 = (_.x0 === 1) ? 1 : _.table[(_.x0 * Envelope.AmpSize)|0];
                if (_.reversed) x = 1 - x0;
                
                x0 = x0 * _.mul + _.add;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x0;
                }
            }
            
            _.x0 -= _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;;
        }
        return cell;
    };
    
    return PercussiveEnvelope;
}());
timbre.fn.register("perc", PercussiveEnvelope);


// __END__
if (module.parent && !module.parent.parent) {
    describe("perc", function() {
        object_test(PercussiveEnvelope, "perc");
        describe("arguments", function() {
            it("arg..0", function() {
                var instance = T("perc");
                instance.delay.should.equal(0);
                instance.a.should.equal(0);
                instance.r.should.equal(0);
            });
            it("arg..1", function() {
                var instance = T("perc", 1500);
                instance.delay.should.equal(0);
                instance.a.should.equal(0);
                instance.r.should.equal(1500);
            });
            it("arg..2", function() {
                var instance = T("perc", 500, 1500);
                instance.delay.should.equal(0);
                instance.a.should.equal(500);
                instance.r.should.equal(1500);
            });
            it("arg..3", function() {
                var instance = T("perc", 100, 500, 1500);
                instance.delay.should.equal(100);
                instance.a.should.equal(500);
                instance.r.should.equal(1500);
            });
        });
        describe("properties", function() {
            it("get delay", function() {
                var instance = T("perc");
                instance.delay.should.be.a("number");
            });
            it("set delay", function() {
                var instance = T("perc");
                instance.delay = 1000;
                instance._.delay.should.equal(1000);
            });
            it("get a", function() {
                var instance = T("perc");
                instance.a.should.be.a("number");
            });
            it("set a", function() {
                var instance = T("perc");
                instance.a = 1000;
                instance._.a.should.equal(1000);
            });
            it("get r", function() {
                var instance = T("perc");
                instance.r.should.be.a("number");
            });
            it("set r", function() {
                var instance = T("perc");
                instance.r = 1000;
                instance._.r.should.equal(1000);
            });
            it("get al", function() {
                var instance = T("perc");
                instance.al.should.be.a("number");
            });
            it("set al", function() {
                var instance = T("perc");
                instance.al = 0.5;
                instance._.al.should.equal(0.5);
            });
            it("get reversed", function() {
                var instance = T("perc");
                instance.reversed.should.be.a("boolean");
            });
            it("set reversed", function() {
                var instance = T("perc");
                instance.reversed = 0.5;
                instance._.reversed.should.equal(true);
            });
            it("get currentTime", function() {
                var instance = T("perc");
                instance.currentTime.should.be.a("number");
            });
            it("set currentTime", function() {
                (function() {
                    var instance = T("perc");
                    instance.currentTime = 1000;
                }).should.throw(/only a getter/);
            });
        });
    });
}
