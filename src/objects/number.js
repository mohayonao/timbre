/**
 * NumberWrapper
 * Constant signal of a number
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var NumberWrapper = (function() {
    var NumberWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(NumberWrapper, {
        base: "kr-only",
        properties: {
            value: {
                set: function(val) {
                    if (typeof val === "number") {
                        this._.value = val;
                        changeTheValue.call(this);
                    }
                },
                get: function() { return this._.value; }
            },
            mul: {
                set: function(val) {
                    if (typeof val === "number") {
                        this._.mul = val;
                        changeTheValue.call(this);
                    }
                },
                get: function() { return this._.mul; }
            },
            add: {
                set: function(val) {
                    if (typeof val === "number") {
                        this._.add = val;
                        changeTheValue.call(this);
                    }
                },
                get: function() { return this._.add; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        this._ = {};
        if (typeof _args[0] === "number") {
            this._.value = _args[0];
        } else{
            this._.value = 0;
        }
    };
    
    var changeTheValue = function() {
        var x, cell, i, _ = this._;
        x = _.value * _.mul + _.add;
        cell = this.cell;
        for (i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    
    $this._.init = function() {
        this.value = this._.value;
    };
    
    $this.clone = function(deep) {
        var newone = timbre(this._.value);
        newone._.mul = this._.mul;
        newone._.add = this._.add;
        changeTheValue.call(newone);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    return NumberWrapper;
}());
timbre.fn.register("number", NumberWrapper);

// __END__
global.NumberWrapper = NumberWrapper;

if (module.parent && !module.parent.parent) {
    describe("NumberWrapper", function() {
        object_test(NumberWrapper, 100);
        describe("#value", function() {
            it("should equal 100", function() {
                var instance = timbre(100);
                instance.value.should.equal(100);
            });
            it("should changed", function() {
                var instance = timbre(100);
                instance.value = 10;
                instance.value.should.equal(10);
                instance.cell.should.eql(timbre(10).cell);
            });
            it("should not changed with no number", function() {
                var instance = timbre(100);
                instance.value = "1";
                instance.value.should.equal(100);
            });
            it("should multiply", function() {
                var instance = timbre(100);
                instance.mul = 2;
                instance.cell.should.eql(timbre(200).cell);
            });
            it("should add", function() {
                var instance = timbre(100);
                instance.add = 3;
                instance.cell.should.eql(timbre(103).cell);
            });
            it("should multiply and add", function() {
                var instance = timbre(100);
                instance.mul = 2;
                instance.add = 3;
                instance.value = 10;
                instance.cell.should.eql(timbre(23).cell);
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                var instance = timbre(100);
                timbre(instance).value.should.equal(instance.value);
            });
        });
    });
}
