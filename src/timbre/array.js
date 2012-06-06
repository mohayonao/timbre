/**
 * ArrayWrapper: 0.1.0
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ArrayWrapper = (function() {
    var ArrayWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = ArrayWrapper.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "value", {
        set: function(value) {
            if (typeof value === "object" && 
                (value instanceof Array ||
                 value.buffer instanceof ArrayBuffer)) {
                this._.value = value;
                this._.index = 0;
            }
        },
        get: function() { return this._.value; }
    });
    Object.defineProperty($this, "index", {
        set: function(value) {
            var _ = this._;
            if (typeof value === "number") {
                value = value|0;
                if (value < 0) value = _.value.length + value;
                if (0 <= value && value < _.value.length) {
                    _.index = value;
                    changeTheValue.call(this);
                }
            }
        },
        get: function() { return this._.index; }
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
        var value, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "object") {
            if (_args[i] instanceof Array ||
                _args[i].buffer instanceof ArrayBuffer) {
                value = _args[i++];
            }
        }
        _.value = (value !== undefined) ? value : [];
        _.index = 0;
    };
    
    var changeTheValue = function() {
        var x, cell, i, _ = this._;
        x = _.value[_.index] * _.mul + _.add;
        cell = this.cell;
        for (i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    
    $this._.init = function() {
        this.index = 0;
    };
    
    $this.clone = function(deep) {
        var newone = timbre(this._.value);
        newone._.mul = this._.mul;
        newone._.add = this._.add;
        changeTheValue.call(newone);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;
        this.index = (_.index + 1) % _.value.length;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, value, i;
        cell = this.cell;
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            value = _.value[_.index] * _.mul + _.add;
            if (isNaN(value)) value = 0;
            for (i = cell.length; i--; ) {
                cell[i] = value;
            }
        }
        return cell;
    };
    
    return ArrayWrapper;
}());
timbre.fn.register("array", ArrayWrapper);

// __END__
global.ArrayWrapper = ArrayWrapper;

if (module.parent && !module.parent.parent) {
    describe("ArrayWrapper", function() {
        object_test(ArrayWrapper, [2, 3, 5, 7, 11, 13]);
        describe("#bang()", function() {
            var instance = timbre([2, 3, 5, 7, 11, 13]);
            instance.cell.should.eql(timbre(2).cell);
            instance.bang();
            instance.cell.should.eql(timbre(3).cell);
            instance.index = 3;
            instance.cell.should.eql(timbre(7).cell);
            instance.index = -1;
            instance.cell.should.eql(timbre(13).cell);
        });
        describe("#value", function() {
            it("should multiply", function() {
                var instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.mul = 2;
                instance.cell.should.eql(timbre(4).cell);
            });
            it("should add", function() {
                var instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.bang();
                instance.add = 3;
                instance.cell.should.eql(timbre(6).cell);
            });
            it("should multiply and add", function() {
                var instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.bang();
                instance.mul = 2;
                instance.bang();
                instance.add = 3;
                instance.bang();
                instance.cell.should.eql(timbre(17).cell);
            });
        });
    });
}
