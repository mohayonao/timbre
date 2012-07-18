/**
 * Envelope
 * Envelope generator
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Envelope = (function() {
    var Envelope = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Envelope, {
        base: "kr-ar",
        properties: {
            table: {
                set: function(val) {
                    var dx, name, _ = this._;
                    if (typeof val === "string") {
                        if (val === "~") {
                            name = _.tableName;
                            if (name.charAt(0) === "~") {
                                name = name.substr(1);
                            } else {
                                name = "~" + name;
                            }
                        } else {
                            name = val;
                        }
                        
                        if ((dx = Envelope.AmpTables[name]) !== undefined) {
                            if (typeof dx === "function") dx = dx();
                            _.tableName = name;
                            _.table = dx;
                        }
                    }
                },
                get: function() { return this._.tableName; }
            },
            delay: {
                set: function(val) {
                    if (typeof val === "number") this._.delay = val;
                },
                get: function() { return this._.delay; }
            },
            reversed: {
                set: function(val) {
                    this._.reversed = !!val;
                },
                get: function() { return this._.reversed; }
            },
            currentTime: {
                get: function() { return this._.currentTime; }
            }
        }, // properties
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        _.changeState = function() {};
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            _.changeState.call(this);
            
            var tbl = _.table;
            var mul = _.mul, add = _.add;
            var i, imax = cell.length;
            
            var x0 = _.x0     ; if (x0 > 0.999) x0 = 0.999;
            var x1 = x0 + _.dx; if (x1 > 0.999) x1 = 0.999;
            x0 = tbl[(x0 * 512)|0]; x1 = tbl[(x1 * 512)|0];
            
            if (_.reversed) {
                x0 = 1 - x0; x1 = 1 - x1;
            }
            
            if (_.ar) { // ar-mode (v12.07.12)
                var dx = (x1 - x0) / imax;
                for (i = 0; i < imax; ++i) {
                    cell[i] = x0 * mul + add;
                    x0 += dx;
                }
            } else {   // kr-mode
                x0 = x0 * mul + add;
                for (i = 0; i < imax; ++i) cell[i] = x0;
            }
            _.x0 += _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;
        }
        return cell;
    };
    
    return Envelope;
}());
timbre.fn.register("env", Envelope);

Envelope.AmpSize = 512;
Envelope.AmpTables = {};
Envelope.AmpTables["linear"] = function() {
    var l = new Float32Array(Envelope.AmpSize);
    for (var i = 0, imax = l.length; i < imax; ++i) 
        l[i] = i / (imax - 1);
    return l;
};

(function(list) {
    list.forEach(function(db) {
        Envelope.AmpTables[db + "db"] = function() {
            var l  = new Float32Array(Envelope.AmpSize);
            var x0 = Math.pow(10, db * ((l.length-1) / l.length) / -20);
            var x1 = 0;
            var dx = 1 / (1 - x0);
            for (var i = 0, imax = l.length; i < imax; ++i) {
                x1 = Math.pow(10, (db * (i / imax) / -20));
                l[imax - i - 1] = (x1 - x0) * dx;
            }
            return l;
        };
        Envelope.AmpTables["~" + db + "db"] = function() {
            var l  = new Float32Array(Envelope.AmpSize);
            var x0 = Math.pow(10, db * ((l.length-1) / l.length) / -20);
            var x1 = 0;
            var dx = 1 / (1 - x0);
            for (var i = 0, imax = l.length; i < imax; ++i) {
                x1 = Math.pow(10, (db * (i / imax) / -20));
                l[i] = 1 - ((x1 - x0) * dx);
            }
            return l;
        };
    });
}([24,32,48,64,96]));

// __END__
