/**
 * timbre/clip
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * DspClip: 0.1.0
 * Limit signal amplitude
 * [ar-kr]
 */
var DspClip = (function() {
    var DspClip = function() {
        initialize.apply(this, arguments);
    }, $this = DspClip.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    Object.defineProperty($this, "min", {
        set: function(value) {
            if (typeof value === "number" && value <= this._.max) {
                this._.min = value;
            }
        },
        get: function() { return this._.min; }
    });
    Object.defineProperty($this, "max", {
        set: function(value) {
            if (typeof value === "number" && value >= this._.min) {
                this._.max = value;
            }
        },
        get: function() { return this._.max; }
    });
    
    var initialize = function(_args) {
        var tmp, i, _;
        
        this._ = _ = {};
        
        i = 0;
        _.min = (typeof _args[i] === "number") ? _args[i++] : -0.5;
        _.max = (typeof _args[i] === "number") ? _args[i++] : +0.5;
        if (_.min > _.max) {
            tmp = _.min;
            _.min = _.max;
            _.max = tmp;
        }
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));

        _.ison = true;
    };

    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var x, min, max;
        var tmp, i, imax, j, jmax;

        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            min = _.min;
            max = _.max;
            mul = _.mul;
            add = _.add;
            if (_.ar) {
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp = args[i].cell;
                    } else {
                        tmp = args[i].seq(seq_id);
                    }
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                if (_.ison) {
                    for (j = jmax; j--; ) {
                        x = cell[j];
                        if (x < min) x = min;
                        else if (max < x) x = max;
                        cell[j] = x * mul + add;
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {
                tmp = 0;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp += args[i].cell[0];
                    } else {
                        tmp += args[i].seq(seq_id)[0];
                    }
                }
                if (_.ison) {
                    if (tmp < min) tmp = min;
                    else if (max < tmp) tmp = max;
                }
                tmp = tmp * mul + add;
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    return DspClip;
}());
timbre.fn.register("clip", DspClip);


/**
 * DspSoftClip: 0.1.0
 * Limit signal amplitude
 * [ar-kr]
 */
var DspSoftClip = (function() {
    var DspSoftClip = function() {
        initialize.apply(this, arguments);
    }, $this = DspSoftClip.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    Object.defineProperty($this, "min", {
        set: function(value) {
            if (typeof value === "number" && value <= this._.max) {
                this._.min = value;
            }
        },
        get: function() { return this._.min; }
    });
    Object.defineProperty($this, "max", {
        set: function(value) {
            if (typeof value === "number" && value >= this._.min) {
                this._.max = value;
            }
        },
        get: function() { return this._.max; }
    });
    
    var initialize = function(_args) {
        var tmp, i, _;
        
        this._ = _ = {};
        
        i = 0;
        _.min = (typeof _args[i] === "number") ? _args[i++] : -0.5;
        _.max = (typeof _args[i] === "number") ? _args[i++] : +0.5;
        if (_.min > _.max) {
            tmp = _.min;
            _.min = _.max;
            _.max = tmp;
        }
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        this.args = timbre.fn.valist.call(this, _args.slice(i));

        _.ison = true;
    };

    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var x, min, max, hmin, hmax;
        var tmp, i, imax, j, jmax;

        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            min = _.min;
            max = _.max;
            hmin = min / 2;
            hmax = max / 2;
            mul = _.mul;
            add = _.add;
            if (_.ar) {
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = 0.0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp = args[i].cell;
                    } else {
                        tmp = args[i].seq(seq_id);
                    }
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                if (_.ison) {
                    for (j = jmax; j--; ) {
                        x = cell[j];
                        if (x < min) {
                            x = ((1 - (min / x)) * min + min);
                        } else if (max < x) {
                            x = ((1 - (max / x)) * max + max);
                        }
                        cell[j] = x * mul + add;
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                }
            } else {
                tmp = 0;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp += args[i].cell[0];
                    } else {
                        tmp += args[i].seq(seq_id)[0];
                    }
                }
                if (_.ison) {
                    if (tmp < min) {
                        tmp = ((1 - (min / tmp)) * min + min);
                    } else if (max < tmp) {
                        tmp = ((1 - (max / tmp)) * max + max);
                    }
                }
                tmp = tmp * mul + add;
                for (j = jmax = cell.length; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    return DspSoftClip;
}());
timbre.fn.register("softclip", DspSoftClip);

// __END__

describe("clip", function() {
    object_test(DspClip, "clip");
    describe("constructor", function() {
        it("should min < max", function() {
            var instance = timbre("clip", 0.5, 0.2);
            instance.min.should.equal(0.2);
            instance.max.should.equal(0.5);
        });
    });
    describe("processing", function() {
        it("should add signals", function() {
            var instance = timbre("clip", -0.5, 0.2);
            instance.append(timbre(-20))
            instance.seq(0);
            instance.cell.should.eql(timbre(-0.5).cell);
            
            instance.append(timbre(100))
            instance.seq(1);
            instance.cell.should.eql(timbre(0.2).cell);
        });
    });
});
describe("softclip", function() {
    object_test(DspSoftClip, "softclip");
    describe("constructor", function() {
        it("should min < max", function() {
            var instance = timbre("softclip", 0.5, 0.2);
            instance.min.should.equal(0.2);
            instance.max.should.equal(0.5);
        });
    });
    describe("processing", function() {
        it("should add signals", function() {
            var instance = timbre("softclip");
            instance.append(timbre(-1))
            instance.seq(0);
            instance.cell.should.eql(timbre(-0.75).cell);
            
            instance.append(timbre(2))
            instance.seq(1);
            instance.cell.should.eql(timbre(+0.75).cell);
        });
    });
});
