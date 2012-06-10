/**
 * utils/range
 * Create lists containing arithmetic progressions.
 * http://docs.python.org/library/functions.html#range
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

utils.range = function() {
    var start, stop, step;
    var i, result = [];
    
    switch (arguments.length) {
    case 1:
        start = 0;
        stop  = arguments[0]|0;
        step  = 1;
        break;
    case 2:
        start = arguments[0]|0;
        stop  = arguments[1]|0;
        step  = 1;
        break;
    case 3:
        start = arguments[0]|0;
        stop  = arguments[1]|0;
        step  = arguments[2]|0;
        break;
    }
    if (step > 0) {
        for (i = start; i < stop; i += step) {
            result.push(i);
        }
    } else {
        for (i = start; i > stop; i += step) {
            result.push(i);
        }
    }
    return result;
};

// __END__
if (module.parent && !module.parent.parent) {
    describe("range", function() {
        it("range(10)", function() {
            utils.range(10).should.be.eql([0,1,2,3,4,5,6,7,8,9]);
        });
        it("range(1,10)", function() {
            utils.range(1,11).should.be.eql([1,2,3,4,5,6,7,8,9,10]);
        });
        it("range(0,30,5)", function() {
            utils.range(0,30,5).should.be.eql([0,5,10,15,20,25]);
        });
        it("range(0,10,3)", function() {
            utils.range(0,10,3).should.be.eql([0,3,6,9]);
        });
        it("range(0,-10,-1)", function() {
            utils.range(0,-10,-1).should.be.eql([0,-1,-2,-3,-4,-5,-6,-7,-8,-9]);
        });
        it("range(0)", function() {
            utils.range(0).should.be.eql([]);
        });
        it("range(1,0)", function() {
            utils.range(1,0).should.be.eql([]);
        });
    });
}
