/**
 * Glide
 * v 0. 1. 0: first version
 * v12.07.18: add ar-mode
 */
"use strict";

var timbre = require("../timbre");
require("./easing");
// __BEGIN__

var Glide = (function() {
    var Glide = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Glide, {
        base: "kr-ar",
        properties: {
            value: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        _.status = 0;
                        _.start  = _.value;
                        _.stop   = val;
                        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
                        _.x0 = 0; _.dx = 0;
                    }
                },
                get: function() { return this._.value; }
            }
        }, // properties
        copies: [
            "ease.type", "ease.delay", "ease.duration","ease.currentTime",
            "ease.seq()", "ease.getFunction()", "ease.setFunction()"
        ]
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            (Easing.Functions[_args[i]]) !== undefined) {
            this.type = _args[i++];
        } else if (typeof _args[i] === "function") {
            this.type = _args[i++];
        } else {
            this.type = "linear";
        }
        _.duration = (typeof _args[i] === "number") ? _args[i++] : 1000;
        _.value    = (typeof _args[i] === "number") ? _args[i++] : 0;
        
        if (typeof _args[i] === "function") {
            this.onchanged = _args[i++];
        }
        
        _.delay = 0;
        
        _.status = -1;
        _.start  = _.value;
        _.stop   = _.value;
        _.samples = Infinity;
        _.x0 = 0; _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("glide");
        newone._.type = _.type;
        newone._.func = _.func;
        newone._.duration = _.duration;
        newone._.value = _.value;
        newone._.start = _.value;
        newone._.stop  = _.value;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;
        
        _.status = 0;
        _.start  = _.value;
        _.stop   = _.value;
        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
        _.x0 = 0; _.dx = 0;
        _.currentTime = 0;
        
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    return Glide;
}());
timbre.fn.register("glide", Glide);

// __END__
if (module.parent && !module.parent.parent) {
    describe("glide", function() {
        object_test(Glide, "glide");
    });
}
