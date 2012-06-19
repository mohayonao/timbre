/**
 * Envelope: 0.3.3
 * Envelope generator
 * [kr-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Envelope = (function() {
    var Envelope = function() {
        initialize.apply(this, arguments);
    }, $this = Envelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");

    Object.defineProperty($this, "table", {
        set: function(value) {
            var dx;
            if (typeof value === "string") {
                if ((dx = Envelope.AmpTables[value]) !== undefined) {
                    if (typeof dx === "function") dx = dx();
                    this._.tableName = value;
                    this._.table = dx;
                }
            }
        },
        get: function(value) { return this._.tableName; }
    });
    
    Object.defineProperty($this, "delay", {
        set: function(value) {
            if (typeof value === "number") {
                this._.delay = value;
            }
        },
        get: function() { return this._.delay; }
    });
    Object.defineProperty($this, "reversed", {
        set: function(value) {
            this._.reversed = !!value;
        },
        get: function() { return this._.reversed; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
    };
    
    return Envelope;
}());
timbre.fn.register("env", Envelope);

Envelope.AmpTables = {};
Envelope.AmpTables["linear"] = function() {
    var l, i;
    l = new Float32Array(512);
    for (i = 0; i < 512; ++i) {
        l[i] = i / 512;
    }
    return l;
};

(function(list) {
    list.forEach(function(db) {
        Envelope.AmpTables[db + "db"] = function() {
            var l, i;
            l = new Float32Array(512);
            for (i = 0; i < 512; ++i) {
                l[512-i] = Math.pow(10, (db * (i/512) / -20));
            }
            return l;
        };
        Envelope.AmpTables["~" + db + "db"] = function() {
            var l, i;
            l = new Float32Array(512);
            for (i = 0; i < 512; ++i) {
                l[i] = 1 - Math.pow(10, (db * (i/512) / -20));
            }
            return l;
        };
    });
}([32,48,64,96]));

// __END__
