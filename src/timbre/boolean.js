/**
 * BooleanWrapper: 0.1.0
 * Constant signal of 0 or 1
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var BooleanWrapper = (function() {
    var BooleanWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = BooleanWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            this._.value = !!value;
            changeTheValue.call(this);
        },
        get: function() { return this._.value; }
    });
    Object.defineProperty($this, "mul", {
        set: function(value) {
            if (typeof value === "number") {
                this._.mul = value;
                changeTheValue.call(this);
            }
        },
        get: function() { return this._.mul; }
    });
    Object.defineProperty($this, "add", {
        set: function(value) {
            if (typeof value === "number") {
                this._.add = value;
                changeTheValue.call(this);
            }
        },
        get: function() { return this._.add; }
    });
    
    var initialize = function(_args) {
        this._ = {};
        if (typeof _args[0] === "boolean") {
            this._.value = _args[0];
        } else{
            this._.value = false;
        }
    };
    
    var changeTheValue = function() {
        var x, cell, i, _ = this._;
        x = (_.value ? 1 : 0) * _.mul + _.add;
        cell = this.cell;
        for (i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    
    $this._.init = function() {
        this.value = this._.value;
    };
    
    $this.clone = function() {
        var newone = timbre(this._.value);
        newone._.mul = this._.mul;
        newone._.add = this._.add;
        changeTheValue.call(newone);
        return newone;
    };
    
    $this.bang = function() {
        this._.value = !this._.value;
        changeTheValue.call(this);
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    return BooleanWrapper;
}());
timbre.fn.register("boolean", BooleanWrapper);

// __END__
global.BooleanWrapper = BooleanWrapper;

if (module.parent && !module.parent.parent) {
    describe("BooleanWrapper", function() {
        object_test(BooleanWrapper, true);
        describe("#value", function() {
            it("should equal true", function() {
                var instance = timbre(true);
                instance.value.should.equal(true);
            });
            it("should changed", function() {
                var instance = timbre(true);
                instance.value = false;
                instance.value.should.equal(false);
                instance.cell.should.eql(timbre(0).cell);
                
                instance.value = true;
                instance.value.should.equal(true);
                instance.cell.should.eql(timbre(1).cell);
                
                instance.value = false;
                instance.value = 1000;
                instance.value.should.equal(true);
            });
            it("should multiply", function() {
                var instance = timbre(true);
                instance.mul = 2;
                instance.cell.should.eql(timbre(2).cell);
            });
            it("should add", function() {
                var instance = timbre(false);
                instance.add = 3;
                instance.cell.should.eql(timbre(3).cell);
            });
            it("should multiply and add", function() {
                var instance = timbre(false);
                instance.mul = 2;
                instance.add = 3;
                instance.value = 10;
                instance.cell.should.eql(timbre(5).cell);
            });
        });
        describe("#bang()", function() {
            it("should toggle values", function() {
                var instance = timbre(true);
                instance.cell.should.eql(timbre(1).cell);
                instance.bang();
                instance.cell.should.eql(timbre(0).cell);
                instance.bang();
                instance.cell.should.eql(timbre(1).cell);
            });
        });
        describe("#clone()", function() {
            it("should have same values", function() {
                var instance = timbre(true);
                timbre(instance).value.should.equal(instance.value);
            });
        });
    });
}
