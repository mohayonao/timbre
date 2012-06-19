/**
 * PercussiveEnvelope: 0.3.3
 * Percussive envelope generator
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
require("./env");
// __BEGIN__

var PercussiveEnvelope = (function() {
    var PercussiveEnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = PercussiveEnvelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
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
        if (typeof _args[i] === "string" && Envelope.AmpTables[_args[i]]) {
            this.table = _args[i++];
        } else {
            this.table = "linear";
        }
        
        if (typeof _args[i] === "number") {
            nums.push(_args[i++]);
            if (typeof _args[i] === "number") {
                nums.push(_args[i++]);
                if (typeof _args[i] === "number") {
                    nums.push(_args[i++]);
                }
            }
        }
        switch (nums.length) {
        case 1:
            _.delay = 0;
            _.a = 0;
            _.r = nums[0];
            break;
        case 2:
            _.delay = 0;
            _.a = nums[0];
            _.r = nums[1];
            break;
        case 3:
            _.delay = nums[0];
            _.a = nums[1];
            _.r = nums[2];
            break;
        default:
            _.delay = 0;
            _.a = 0;
            _.r = 0;
            break;
        }
        
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        _.al = 0;
        _.reversed = false;
        
        _.status  = -1;        
        _.samples = Infinity;
        _.x0 = 0;
        _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = timbre("perc", _.delay, _.a, _.r);
        newone._.al    = _.al;
        newone._.reversed = _.reversed;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;

        // off -> delay
        _.status  = 0;
        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
        _.x0 = 0;
        _.dx = -(timbre.cellsize * _.al) / _.samples;
        _.currentTime = 0;
        
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, table, x, i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    _.samples += (timbre.samplerate * (_.a / 1000))|0;
                    _.x0 = _.al;
                    _.dx = -(timbre.cellsize * (1 -_.al)) / _.samples;
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
            
            x = (_.x0 === 1) ? 1 : _.table[(_.x0 * 512)|0];
            if (_.reversed) x = 1 - x;
            x = x * _.mul + _.add;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
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
