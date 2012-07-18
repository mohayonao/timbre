/**
 * ArrayWrapper
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ArrayWrapper = (function() {
    var ArrayWrapper = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(ArrayWrapper, {
        base: "kr-only",
        properties: {
            value: {
                set: function(val) {
                    if (typeof val === "object" && 
                        (val instanceof Array ||
                         val.buffer instanceof ArrayBuffer)) {
                        this._.value = compile(val);
                        this._.index = 0;
                    }
                },
                get: function() { return this._.value; }
            },
            index: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "number") {
                        val = val|0;
                        if (val < 0) val = _.value.length + val;
                        if (0 <= val && val < _.value.length) {
                            _.index = val;
                            changeTheValue.call(this, val);
                        }
                    }
                },
                get: function() { return this._.index; }
            },
            repeat: {
                set: function(val) {
                    if (typeof val === "number") this._.repeat1 = val;
                },
                get: function() { return this._.repeat1; }
            },
            mul: {
                set: function(val) {
                    if (typeof val === "number") {
                        this._.mul = val;
                        changeTheValue.call(this, this._.index);
                    }
                },
                get: function() { return this._.mul; }
            },
            add: {
                set: function(val) {
                    if (typeof val === "number") {
                        this._.add = val;
                        changeTheValue.call(this, this._.index);
                    }
                },
                get: function() { return this._.add; }
            },
            isEnded: {
                get: function() { return this._.status === 1; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var value, i, _;
        
        this._ = _ = {};
        
        i = 0; value = [];
        if (typeof _args[i] === "object") {
            if (_args[i] instanceof Array) {
                value = _args[i++];
            }
        }
        _.value = compile(value);
        _.repeat1 = Infinity;        
        _.index   = -1;
        _.repeat2 = 0;
        _.ended = false;
    };
    
    var compile = function(array) {
        var lis, x, i, imax;
        lis = [];
        for (i = 0, imax = array.length; i < imax; i++) {
            x = array[i];
            if (typeof x === "object" && x instanceof Array) {
                lis[i] = timbre("array", x);
            } else {
                lis[i] = x;
            }
        }
        return lis;
    };
    
    var changeTheValue = function(index) {
        var x, cell, i, _ = this._;
        
        _.index = index;
        x = _.value[index] || 0;
        if (x instanceof ArrayWrapper) {
            x = x.cell[0];
        }
        x = x * _.mul + _.add;
        cell = this.cell;
        for (i = cell.length; i--; ) {
            cell[i] = x;
        }
    };
    
    $this._.init = function() {
        this.reset();
    };
    
    $this.clone = function(deep) {
        var newone = timbre(this._.value);
        newone._.repeat = this._.repeat;
        timbre.fn.copyBaseArguments(this, newone, deep);
        return newone.reset();
    };
    
    $this.reset = function() {
        var v, _ = this._;
        v = _.value;
        _.index   = -1;
        _.repeat2 = 0;
        _.ended   = false;
        changeTheValue.call(this, -1);
        return this;
    };
    
    $this.bang = function() {
        var i, v, _ = this._;
        
        i = _.index;
        v = _.value;
        if (v[i] instanceof ArrayWrapper && !v[i]._.ended) {
            v[i].bang();
            if (v[i]._.ended) return this.bang();
            changeTheValue.call(this, i);
        } else {
            i += 1;
            if (i < v.length) {
                _.index = i;
                if (v[i] instanceof ArrayWrapper) {
                    v[i].reset().bang();
                }
                changeTheValue.call(this, i);
            } else {                
                ++_.repeat2;
                if (_.repeat2 >= _.repeat1) {
                    _.ended = true;
                    timbre.fn.doEvent(this, "ended");
                } else {
                    // loop;
                    _.index = i = 0;
                    if (v[0] instanceof ArrayWrapper) {
                        v[0].reset().bang();
                    }
                    changeTheValue.call(this, i);
                    timbre.fn.doEvent(this, "looped");
                }
            }
        }
        
        timbre.fn.doEvent(this, "bang");
        return this;
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
            it("loop iteration", function() {
                var i, instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.index.should.equal(-1);
                instance.cell.should.eql(timbre(0).cell);
                for (i = 0; i < 100; i++) {
                    instance.bang();
                    instance.index.should.equal(i % 6);
                    instance.cell[0].should.equal([2, 3, 5, 7, 11, 13][i % 6]);
                }
            });
        });
        describe("#index", function() {
            var instance = timbre([2, 3, 5, 7, 11, 13]);
            it("init is 0", function() {
                instance.cell.should.eql(timbre(0).cell);
            });
            it("[3] is 7", function() {
                instance.index = 3;
                instance.cell.should.eql(timbre(7).cell);
            });
            it("[-1] is 13", function() {
                instance.index = -1;
                instance.cell.should.eql(timbre(13).cell);
            });
        });
        describe("#value", function() {
            it("should multiply", function() {
                var instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.bang();
                instance.cell.should.eql(timbre(2).cell);
                instance.mul = 2;
                instance.cell.should.eql(timbre(4).cell);
            });
            it("should add", function() {
                var instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.bang();
                instance.cell.should.eql(timbre(2).cell);
                instance.add = 3;
                instance.cell.should.eql(timbre(5).cell);
            });
            it("should multiply and add", function() {
                var instance = timbre([2, 3, 5, 7, 11, 13]);
                instance.bang();
                instance.cell.should.eql(timbre(2).cell);
                instance.mul = 2;
                instance.cell.should.eql(timbre(4).cell);
                
                instance.bang();
                instance.cell.should.eql(timbre(6).cell);
                instance.add = 3;
                instance.cell.should.eql(timbre(9).cell);
                
                instance.bang().cell.should.eql(timbre(13).cell);
            });
        });
        describe("pattern", function() {
            describe("[1, [2, 3]:0, 4, 5]", function() {
                var instance = timbre([1, [2, 3], 4, 5]);
                instance.value[1].repeat = 0;
                it("{0}", function() {
                    instance.bang().cell.should.eql(timbre(1).cell);
                });
                it("{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("{2}", function() {
                    instance.bang().cell.should.eql(timbre(4).cell);
                });
                it("{3}", function() {
                    instance.bang().cell.should.eql(timbre(5).cell);
                });
                it("*{0}", function() {
                    instance.bang().cell.should.eql(timbre(1).cell);
                });
                it("*{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("*{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("*{2}", function() {
                    instance.bang().cell.should.eql(timbre(4).cell);
                });
                it("*{3}", function() {
                    instance.bang().cell.should.eql(timbre(5).cell);
                });
                it("**{0}", function() {
                    instance.bang().cell.should.eql(timbre(1).cell);
                });
            });
            describe("[1, [2, 3]:inf, 4, 5]", function() {
                var instance = timbre([1, [2, 3], 4, 5]);
                it("{0}", function() {
                    instance.bang().cell.should.eql(timbre(1).cell);
                });
                it("{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("*{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("*{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("**{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("**{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
            });
            describe("[1, [2, 3]:2, 4, 5]", function() {
                var instance = timbre([1, [2, 3], 4, 5]);
                instance.value[1].repeat = 2;
                it("{0}", function() {
                    instance.bang().cell.should.eql(timbre(1).cell);
                });
                it("{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("*{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("*{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("{2}", function() {
                    instance.bang().cell.should.eql(timbre(4).cell);
                });
                it("{3}", function() {
                    instance.bang().cell.should.eql(timbre(5).cell);
                });
                it("*{0}", function() {
                    instance.bang().cell.should.eql(timbre(1).cell);
                });
                it("*{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("*{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("**{1,0}", function() {
                    instance.bang().cell.should.eql(timbre(2).cell);
                });
                it("**{1,1}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("*{2}", function() {
                    instance.bang().cell.should.eql(timbre(4).cell);
                });
                it("*{3}", function() {
                    instance.bang().cell.should.eql(timbre(5).cell);
                });
            });
            describe("[0,1,2,3]:4", function() {
                var instance = timbre([0, 1, 2, 3]).set("repeat", 3);
                it("{0..3}", function() {
                    instance.bang().cell.should.eql(timbre(0).cell);
                    instance.bang().cell.should.eql(timbre(1).cell);
                    instance.bang().cell.should.eql(timbre(2).cell);
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("*{0..3}", function() {
                    instance.bang().cell.should.eql(timbre(0).cell);
                    instance.bang().cell.should.eql(timbre(1).cell);
                    instance.bang().cell.should.eql(timbre(2).cell);
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("**{0..3}", function() {
                    instance.bang().cell.should.eql(timbre(0).cell);
                    instance.bang().cell.should.eql(timbre(1).cell);
                    instance.bang().cell.should.eql(timbre(2).cell);
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
                it("***{0..3}", function() {
                    instance.bang().cell.should.eql(timbre(3).cell);
                    instance.bang().cell.should.eql(timbre(3).cell);
                    instance.bang().cell.should.eql(timbre(3).cell);
                    instance.bang().cell.should.eql(timbre(3).cell);
                });
            });
        });
    });
}
