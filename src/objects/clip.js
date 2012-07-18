/**
 * Clip
 * v 0. 3. 3: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Clip = (function() {
    var Clip = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Clip, {
        base: "ar-kr",
        properties: {
            min: {
                set: function(val) {
                    if (typeof val === "number") this._.min = val;
                },
                get: function() { return this._.min; }
            },
            max: {
                set: function(val) {
                    if (typeof val === "number") this._.max = val;
                },
                get: function() { return this._.max; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, nums, _;

        this._ = _ = {};
        nums = [];
        
        i = 0;
        if (typeof _args[i] === "number") {
            nums.push(_args[i++]);
            if (typeof _args[i] === "number") {
                nums.push(_args[i++]);
            }
        }
        switch (nums.length) {
        case 1:
            if (nums[0] < 0) {
                _.min =  nums[0];
                _.max = -nums[0];
            } else {
                _.min = -nums[0];
                _.max =  nums[0];
            }
            break;
        case 2:
            if (nums[0] < nums[1]) {
                _.min = nums[0];
                _.max = nums[1];
            } else {
                _.min = nums[1];
                _.max = nums[0];
            }
            break;
        default:
            _.min = -1;
            _.max = +1;
            break;
        }
        
        this.args = _args.slice(i).map(timbre);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var min, max, x, i;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            min  = _.min;
            max  = _.max;
            
            if (_.ar) {
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                for (i = cell.length; i--; ) {
                    x = cell[i];
                    if (x < min) {
                        x = min;
                    } else if (max < x) {
                        x = max;
                    }
                    cell[i] = x * mul + add;
                }
            } else {
                x = timbre.fn.sumargsKR(this, args, seq_id);
                if (x < min) {
                    x = min;
                } else if (max < x) {
                    x = max;
                }
                x = x * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    return Clip;
}());
timbre.fn.register("clip", Clip);

// __END__
if (module.parent && !module.parent.parent) {
    describe("clip", function() {
        object_test(Clip, "clip");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([0.0, 0.1, 0.2, 0.3, -0.4, -0.5, -0.6, -0.7]); 
            i2.cell = new Float32Array([0.2,-0.4, 0.9,-1.0, -0.8,  1.6, 10.6, -0.2]);
            
            it("ar-mode", function() {
                var instance = timbre("clip", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([0.2, -0.3, 1.0, -0.7, -1.0, 1.0, 1.0, -0.9])
                );
            });
            it("kr", function() {
                var instance = timbre("clip", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2])
                );
            });
        });
    });
}
