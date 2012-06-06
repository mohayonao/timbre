/**
 * FunctionWrapper: 0.1.0
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var FunctionWrapper = (function() {
    var FunctionWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = FunctionWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            if (typeof value === "function") {
                this._.value = value;
            }
        },
        get: function() { return this._.value; }
    });
    Object.defineProperty($this, "args", {
        set: function(value) {
            if (typeof value === "object" && value instanceof Array) {
                this._.args = value;
            }
        },
        get: function() { return this._.args; }
    });
    
    var initialize = function(_args) {
        var i, _;
        this._ = _ = {};

        i = 0;
        if (typeof _args[i] === "function") {
            _.value = _args[i++];
        } else {
            _.value = null;
        }
        if (typeof _args[i] === "object" && _args[i] instanceof Array) {
            _.args = _args[i++];
        } else {
            _.args = [];
        }
    };
    
    $this.clone = function(deep) {
        var newone = timbre("function", this._.value, this._.args);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;
        if (_.value !== null) {
            _.value.apply(this, _.args);
        }
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    return FunctionWrapper;
}());
timbre.fn.register("function", FunctionWrapper);

// __END__
global.FunctionWrapper = FunctionWrapper;

if (module.parent && !module.parent.parent) {
    describe("FunctionWrapper", function() {
        var y, func = function(x) { y = x * 2; };
        object_test(FunctionWrapper, func);
        describe("#bang()", function() {
            var instance = timbre(func, [ 100 ]);
            instance.bang();
            y.should.equal(200);
            instance.args = [ 50 ];
            instance.bang();
            y.should.equal(100);
        });
    });
}
