/**
 * Interval
 * Calls a bang() repeatedly at regular intervals
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Interval = (function() {
    var Interval = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Interval, {
        base: ["kr-only", "timer"],
        properties: {
            interval: {
                set: function(val) {
                    if (typeof val === "number" && val >= 0) {
                        this._.interval = val;
                    }
                },
                get: function() { return this._.interval; }
            },
            delay: {
                set: function(val) {
                    if (typeof val === "number" && val >= 0) {
                        this._.delay = val;
                        this._.delaySamples = (timbre.samplerate * (val / 1000))|0;
                    }
                },
                get: function() { return this._.delay; }
            },
            count: {
                set: function(val) {
                    if (typeof val === "number") this._.count = val;
                },
                get: function() { return this._.count; }
            },
            currentTime: {
                get: function() { return this._.currentTime; }
            }
        } // properties
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.ison = false;
        _.samples = _.count = _.currentTime = 0;
        
        var i = 0;
        var nums = [];
        while (typeof _args[i] === "number") {
            nums.push(_args[i++]);
        }
        
        switch (nums.length) {
        case 1:
            this.delay    = 0;
            this.interval = nums[0];
            break;
        case 2:
            this.delay    = nums[0];
            this.interval = nums[1];
            break;
        default:
            this.delay    = 0;
            this.interval = 1000;
            break;
        }
        
        this.args = _args.slice(i).map(timbre);
    };
    
    $this.clone = function(deep) {
        return timbre("interval", this._.delay, this._.interval);
    };
    
    $this.bang = function() {
        var _ = this._;
        _.delaySamples = (timbre.samplerate * (_.delay / 1000))|0;
        _.samples = _.count = _.currentTime = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            if (_.delaySamples > 0) {
                _.delaySamples -= timbre.cellsize;
            }
            
            if (_.delaySamples <= 0) {
                _.samples -= timbre.cellsize;
                if (_.samples <= 0) {
                    _.samples += (timbre.samplerate * _.interval / 1000)|0;
                    var args = this.args.slice(0);
                    for (var i = 0, imax = args.length; i < imax; ++i) {
                        args[i].bang();
                    }
                    ++_.count;
                }
            }
            _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
        }
        return this.cell;
    };
    
    return Interval;
}());
timbre.fn.register("interval", Interval);

// __END__
if (module.parent && !module.parent.parent) {
    describe("interval", function() {
        object_test(Interval, "interval");
        describe("arguments", function() {
            it("arg..0", function() {
                var instance = T("interval");
                instance.delay.should.equal(0);
                instance.interval.should.equal(1000);
            });
            it("arg..1", function() {
                var instance = T("interval", 1500);
                instance.delay.should.equal(0);
                instance.interval.should.equal(1500);
            });
            it("arg..2", function() {
                var instance = T("interval", 500, 1500);
                instance.delay.should.equal(500);
                instance.interval.should.equal(1500);
            });
        });
        describe("properties", function() {
            it("get count", function() {
                var instance = T("interval");
                instance.count.should.be.a("number");
            });
            it("set count", function() {
                var instance = T("interval");
                instance.count = 1000;
                instance._.count.should.equal(1000);
            });
            it("get currentTime", function() {
                var instance = T("interval");
                instance.currentTime.should.be.a("number");
            });
            it("set currentTime", function() {
                (function() {
                    var instance = T("interval");
                    instance.currentTime = 1000;
                }).should.throw(/only a getter/);
            });
        });
    });
}
