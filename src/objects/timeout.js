/**
 * Timeout
 * Calls a bang() after specified delay
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Timeout = (function() {
    var Timeout = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Timeout, {
        base: ["kr-only", "timer"],
        properties: {
            timeout: {
                set: function(val) {
                    if (typeof val === "number" && val > 0) {
                        this._.timeout = val;
                        this._.timeout_samples = (timbre.samplerate * (val / 1000))|0;
                    }
                },
                get: function() { return this._.timeout; }
            },
            currentTime: {
                get: function() { return this._.currentTime; }
            }
        } // properties
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.ison = false;
        _.samples = _.currentTime = 0;
        
        var i = 0;
        if (typeof _args[i] === "number") {
            this.timeout = _args[i++];
        } else {
            this.timeout = 1000;
        }
        this.args = _args.slice(i).map(timbre);
    };
    
    $this.clone = function(deep) {
        return timbre("timeout", this._.timeout);
    };
    
    $this._.on = function() {
        this._.samples = this._.timeout_samples;
    };
    
    $this.bang = function() {
        var _ = this._;
        _.samples = _.timeout_samples;
        _.currentTime = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            _.samples -= timbre.cellsize;
            if (_.samples <= 0) {
                _.samples = 0;
                var args = this.args.slice(0);
                for (var i = 0, imax = args.length; i < imax; ++i) {
                    args[i].bang();
                }
                if (_.samples <= 0) this.off();
            }
            _.currentTime += timbre.cellsize * 1000 / timbre.samplerate;
        }
        return this.cell;
    };
    
    return Timeout;
}());
timbre.fn.register("timeout", Timeout);

// __END__
if (module.parent && !module.parent.parent) {
    describe("timeout", function() {
        object_test(Timeout, "timeout");
        describe("arguments", function() {
            it("arg..0", function() {
                var instance = T("timeout");
                instance.timeout.should.equal(1000);
            });
            it("arg..1", function() {
                var instance = T("timeout", 1500);
                instance.timeout.should.equal(1500);
            });
        });
        describe("properties", function() {
            it("get currentTime", function() {
                var instance = T("timeout");
                instance.currentTime.should.be.a("number");
            });
            it("set currentTime", function() {
                (function() {
                    var instance = T("timeout");
                    instance.currentTime = 1000;
                }).should.throw(/only a getter/);
            });
        });
    });
}
