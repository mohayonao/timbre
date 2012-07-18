/**
 * FunctionWrapper
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var FunctionWrapper = (function() {
    var FunctionWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(FunctionWrapper, {
        base: "kr-only",
        properties: {
            value: {
                set: function(val) {
                    if (typeof val === "function") this._.value = val;
                },
                get: function() { return this._.value; }
            },
            args: {
                set: function(val) {
                    if (typeof val === "object" && val instanceof Array) {
                        this._.args = val;
                    }
                },
                get: function() { return this._.args; }
            }
        } // properties
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
        timbre.fn.doEvent(this, "bang");
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
