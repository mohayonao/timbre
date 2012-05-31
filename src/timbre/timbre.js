/**
 * timbre/timbre
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * AwesomeTimbre: 0.1.0
 * Do something fun
 * [ar-only]
 */
var AwesomeTimbre = (function() {
    var AwesomeTimbre = function() {
        initialize.apply(this, arguments);
    }, $this = AwesomeTimbre.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    Object.defineProperty($this, "version", {
        set: function(value) {
            var synth, _ = this._;
            if (typeof value === "string") {
                if (value !== _.version) {
                    if ((synth = AwesomeTimbre.Versions[value]) !== undefined) {
                        _.version = value;
                        if (_.synth && _.synth.destroy) {
                            _.synth.destroy(this);
                        }
                        _.synth = synth(this);
                    }
                }
            }
        },
        get: function() { return this._.version; }
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
        
        _.ison = true;
    };
    
    $this.clone = function(deep) {
        var newone;
        newone = timbre("timbre", this._.version);
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.bang = function() {
        if (this._.synth) this._.synth.bang();
        timbre.fn.do_event(this, "bang");
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

describe("timbre", function() {
    object_test(AwesomeTimbre, "timbre");
});
