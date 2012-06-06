/**
 * Glide: 0.1.1
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
require("./easing");
// __BEGIN__

var Glide = (function() {
    var Glide = function() {
        initialize.apply(this, arguments);
    }, $this = Glide.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    var Easing = timbre.fn.getClass("ease");
    
    timbre.fn.copyPropertyDescriptors($this,
                                     Easing.prototype,
                                     ["type","delay","duration","currentTime"]);
    timbre.fn.copyFunctions($this,
                            Easing.prototype,
                            ["seq","getFunction","setFunction"]);
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number") {
                _.status = 0;
                _.start  = _.value;
                _.stop   = value;
                _.samples = (timbre.samplerate * (_.delay / 1000))|0;
                _.x0 = 0; _.dx = 0;
            }
        },
        get: function() { return this._.value; }
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
        
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    return Glide;
}());
timbre.fn.register("glide", Glide);

// __END__

describe("glide", function() {
    object_test(Glide, "glide");
});
