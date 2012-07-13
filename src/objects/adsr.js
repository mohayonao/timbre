/**
 * ADSREnvelope: v12.07.13
 * ADSR envelope generator
 * v12.07.12: add ar-mode
 */
"use strict";

var timbre = require("../timbre");
require("./env");
// __BEGIN__

var ADSREnvelope = (function() {
    var ADSREnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(ADSREnvelope, {
        base: "kr-ar",
        properties: {
            status: {
                get: function() { return STATUSES[this._.status+1]; }
            },
            a: { // atack-time
                set: function(value) {
                    if (typeof value === "number") this._.a = value;
                },
                get: function() { return this._.a; }
            },
            d: { // decay-time
                set: function(value) {
                    if (typeof value === "number") this._.d = value;
                },
                get: function() { return this._.d; }
            },
            s: { // sustain-time
                set: function(value) {
                    if (typeof value === "number") this._.s = value;
                },
                get: function() { return this._.s; }
            },
            r: { // release-time
                set: function(value) {
                    if (typeof value === "number") this._.r = value;
                },
                get: function() { return this._.r; }
            },
            al: { // attack-level
                set: function(value) {
                    if (typeof value === "number") this._.al = value;
                },
                get: function() { return this._.al; }
            },
            dl: { // decay-level
                set: function(value) {
                    if (typeof value === "number") this._.dl = value;
                },
                get: function() { return this._.dl; }
            },
            sl: { // sustain-level
                set: function(value) {
                    if (typeof value === "number") this._.sl = value;
                },
                get: function() { return this._.sl; }
            },
            rl: { // release-level
                set: function(value) {
                    if (typeof value === "number") this._.rl = value;
                },
                get: function() { return this._.rl; }
            }
        }, // properties
        copies: [
            "env.table", "env.delay", "env.reversed", "env.currentTime"
        ]
    });
    
    var STATUSES = ["off","delay","a","d","s","r"];
    
    
    var initialize = function(_args) {
        var i, nums, _;
        
        _ = this._ = {};
        
        i = 0;
        if (typeof _args[i] === "string") {
            this.table = _args[i++];
        }
        if (_.table === undefined) this.table = "linear";
        
        nums = [];
        while (typeof _args[i] === "number") {
            nums.push(_args[i++]);
        }
        
        _.delay = 0;
        _.a = 0;
        _.d = 0;
        _.s = Infinity;
        _.r = 0;
        _.al = 0;
        _.dl = 1;
        _.sl = 0;
        _.rl = 0;
        
        switch (nums.length) {
        case 0: // T("adsr");
            break;
        case 1: // T("adsr", decay);
            _.d = nums[0];
            break;
        case 2: // T("adsr", attack, decay);
            _.a = nums[0]; _.d = nums[1];
            break;
        case 3: // T("adsr", attack, decay, release);
            _.a = nums[0]; _.d = nums[1]; _.r = nums[2];
            break;
        case 4: // T("adsr", attack, decay, sustain-level, release);
            _.a = nums[0]; _.d = nums[1]; _.sl = nums[2]; _.r = nums[3];
            break;
        case 5: // T("adsr", delay, attack, decay, sustain-level, release);
            _.delay = nums[0];
            _.a = nums[1]; _.d = nums[2]; _.sl = nums[3]; _.r = nums[4];
            break;
        case 6: // T("adsr", delay, attack, decay, sustain, release, sustain-level);
            _.delay = nums[0];
            _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r   = nums[4];
            _.sl = nums[5];
            break;
        case 7: // T("adsr", delay, attack, decay, sustain, release, attack-release-level, sustain-level);
            _.delay = nums[0];
            _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r  = nums[4];
            _.al = nums[5]; _.sl = nums[6]; _.rl = nums[5];
            break;
        case 8: // T("adsr", delay, attack, decay, sustain, release, attack-release-level, decay-level, sustain-level);
            _.delay = nums[0];
            _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r  = nums[4];
            _.al = nums[5]; _.dl = nums[6]; _.sl = nums[7]; _.rl = nums[5];
            break;
        default: // // T("adsr", delay, attack, decay, sustain, release, attack-level, decay-level, sustain-level, release-level);
            _.delay = nums[0];
            _.a  = nums[1]; _.d  = nums[2]; _.s  = nums[3]; _.r  = nums[4];
            _.al = nums[5]; _.dl = nums[6]; _.sl = nums[7]; _.rl = nums[8];
            break;
        }
        
        _.reversed = false;
        if (typeof _args[i] === "boolean") {
            _.reversed = _args[i++];
        }
        
        _.status = -1;
        _.samples = Infinity;
        _.x0 = _.rl;
        _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("adsr", _.tableName);
        newone._.delay = _.delay;
        newone._.a = _.a; newone._.al = _.al;
        newone._.d = _.d; newone._.dl = _.dl;
        newone._.s = _.s; newone._.sl = _.sl;
        newone._.r = _.r; newone._.rl = _.rl;
        newone._.reversed = _.reversed;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function(mode) {
        var _ = this._;
        
        // off -> delay
        _.status  = 0;
        if (_.delay < 0) {
            _.samples = 0;
            _.dx = 0;
        } else {
            _.samples = (timbre.samplerate * (_.delay / 1000))|0;
            _.dx = timbre.cellsize * (_.al - _.rl) / _.samples;
        }
        _.x0 = _.rl;
        _.currentTime = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.keyoff = function() {
        var _ = this._;
        
        if (_.status <= 3) {
            // (delay, A, D, S) -> R
            _.status  = 4;
            if (_.r < 0 || _.r === Infinity) {
                _.samples = Infinity;
                _.dx = 0;
            } else {
                _.samples = (timbre.samplerate * (_.r / 1000))|0;
                _.dx = -timbre.cellsize * (_.x0 - _.rl) / _.samples;
            }
            timbre.fn.doEvent(this, "R");
        }
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x0, x1, dx, i, imax;
        var mul, add;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    if (_.a < 0 || _.a === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * (_.a / 1000))|0;
                        _.dx = (timbre.cellsize * (_.dl -_.al)) / _.samples;
                    }
                    _.x0 = _.al;
                    timbre.fn.doEvent(this, "A");
                    continue;
                }
                if (_.status === 1) { // A -> D
                    _.status = 2;
                    if (_.d < 0) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * (_.d / 1000))|0;
                        _.dx = -timbre.cellsize * (_.dl - _.sl) / _.samples;
                    }
                    _.x0 = _.dl;
                    timbre.fn.doEvent(this, "D");
                    continue;
                }
                if (_.status === 2) { // D -> S
                    if (_.sl === 0) {
                        _.status = 4;
                        continue;
                    }
                    _.status = 3;
                    _.x0 = _.sl;
                    if (_.s < 0 || _.s === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * (_.s / 1000))|0;
                        _.dx = -timbre.cellsize * (_.sl - _.rl) / _.samples;
                    }
                    timbre.fn.doEvent(this, "S");
                    continue;
                }
                if (_.status <= 4) { // (S, R) -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.rl;
                    _.dx = 0;
                    timbre.fn.doEvent(this, "ended");
                    continue;
                }
            }
            
            if (_.ar) { // ar-mode (v12.07.12)
                
                mul = _.mul;
                add = _.add;

                if (_.x0 === 1) {
                    x0 = x1 = 1;
                } else {
                    x0 = _.table[((_.x0       ) * 512)|0];
                    x1 = _.table[((_.x0 + _.dx) * 512)|0];
                    if (x1 === undefined) x1 = x0;
                }
                if (_.reversed) {
                    x0 = 1 - x0; x1 = 1 - x1;
                }
                dx = (x1 - x0) / cell.length;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x0 * mul + add;
                    x0 += dx;
                }
                
            } else {   // kr-mode
            
                x0 = (_.x0 === 1) ? 1 : _.table[(_.x0 * 512)|0];
                if (_.reversed) x = 1 - x0;
                
                x0 = x0 * _.mul + _.add;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = x0;
                }
            }
            _.x0 += _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;
        }
        return cell;
    };
    
    return ADSREnvelope;
}());
timbre.fn.register("adsr", ADSREnvelope);

// __END__
if (module.parent && !module.parent.parent) {
    describe("adsr", function() {
        object_test(ADSREnvelope, "adsr");
    });
}
