/**
 * AwesomeTimbre
 * Do something fun
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var AwesomeTimbre = (function() {
    var AwesomeTimbre = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(AwesomeTimbre, {
        base: "ar-kr",
        properties: {
            version: {
                set: function(val) {
                    var synth, _ = this._;
                    if (typeof val === "string") {
                        if (val !== _.version) {
                            if ((synth = AwesomeTimbre.Versions[val]) !== undefined) {
                                _.version = val;
                                if (_.synth && _.synth.destroy) {
                                    _.synth.destroy(this);
                                }
                                _.synth = synth(this);
                            }
                        }
                    }
                },
                get: function() { return this._.version; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;
        this._ = _ = {};

        i = 0;
        if (typeof _args[i] === "string" &&
            (AwesomeTimbre.Versions[_args[i]]) !== undefined) {
            this.version = _args[i++];
        } else {
            this.version = "0.1";
        }
    };
    
    $this.clone = function(deep) {
        var newone;
        newone = timbre("timbre", this._.version);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        if (this._.synth) this._.synth.bang();
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, mul, add;
        var tmp, i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            if (_.synth) {
                tmp = _.synth.seq(seq_id);
                mul = _.mul;
                add = _.add;
                for (i = tmp.length; i--; ) {
                    cell[i] = tmp[i] * mul + add;
                }
            }
        }
        return cell;
    };
    
    return AwesomeTimbre;
}());
timbre.fn.register("timbre", AwesomeTimbre);

AwesomeTimbre.Versions = {};
AwesomeTimbre.Versions["0.1"] = function(parent) {
    var synth = T("+");
    
    synth.onbang = function() {
        var coin, pul, env;
        coin = T("*");
        pul  = T("pulse", 987.7666, 0.25);
        env  = T("adsr" , 0, 80, 1, 720).bang();
        coin.append(pul, env);
        env.onS = function() {
            pul.freq.value = 1318.5102;
            env.keyoff();
        };
        env.onended = function() {
            synth.remove(coin);
        };
        synth.append(coin);
    };
    
    return synth;
};

// __END__
if (module.parent && !module.parent.parent) {
    describe("timbre", function() {
        object_test(AwesomeTimbre, "timbre");
    });
}
