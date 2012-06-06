/**
 * Scale: <draft>
 * [kr-only]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Scale = (function() {
    var Scale = function() {
        initialize.apply(this, arguments);
    }, $this = Scale.prototype;
    
    Object.defineProperty($this, "root", {
        set: function(value) {
            this._.root = timbre(value);
        },
        get: function() { return this._.root; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            Scale.Scales[_args[i]] !== undefined) {
            _.list = Scale.Scales[_args[i++]];
        } else {
            _.list = Scale.Scales["major"];
        }
        if (typeof _args[i] !== "undefined") {
            this.root = _args[i++];
        } else {
            this.root = 440;
        }
        _.octave = typeof _args[i] === "number" ? _args[i++] : 0;
        
        _.prev_value  = undefined;
        _.prev_index  = undefined;
        _.prev_octave = undefined;
        
        this.args = timbre.fn.valist.call(this, _args.slice(i));
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, root, value, index, octave;
        var cell, x, i;
        
        if (!_.ison || this.args.length === 0) {
            return timbre._.none;
        }
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            root  = _.root.seq(seq_id)[0];
            value = this.args[0].seq(seq_id)[0]|0;
            if (value !== _.prev_value) {
                if (value >= 0) {
                    index  = value % _.list.length;
                    octave = ((value / _.list.length)|0);
                } else {
                    index  = _.list.length - (-value % _.list.length);
                    octave = -(((value+1) / _.list.length)|0);
                }
                _.prev_value  = value;
                _.prev_index  = index;
                _.prev_octave = octave;
            } else {
                index  = _.prev_index;
                octave = _.prev_octave;
            }
            octave += _.octave;
            x = root * Math.pow(2, (_.list[index] + octave * 12) / 12);
            x = x * _.mul + _.add;
            for (i = cell.length; i--; ) {
                cell[i] = x;
            }
        }
        return cell;
    };
    
    $this.getScale = function(name) {
        return Scale.Scales[name];
    };
    
    $this.setScale = function(name, value) {
        if (value instanceof Array) {
            Scale.Scales[name] = value;
        }
        return this;
    };
    
    return Scale;
}());
timbre.fn.register("scale", Scale);

Scale.Scales = {};
Scale.Scales["major"] = [0, 2, 4, 5, 7, 9, 11];
Scale.Scales["minor"] = [0, 2, 3, 5, 7, 8, 10];
Scale.Scales["ionian"]     = [0, 2, 4, 5, 7, 9, 11];
Scale.Scales["dorian"]     = [0, 2, 3, 5, 7, 9, 10];
Scale.Scales["phrigian"]   = [0, 1, 3, 5, 7, 8, 10];
Scale.Scales["lydian"]     = [0, 2, 4, 6, 7, 9, 11];
Scale.Scales["mixolydian"] = [0, 2, 4, 5, 7, 9, 10];
Scale.Scales["aeolian"]    = [0, 2, 3, 5, 7, 8, 10];
Scale.Scales["locrian"]    = [0, 1, 3, 5, 6, 8, 10];

Scale.Scales["wholetone"] = [0, 2, 4, 6, 8, 10];
Scale.Scales["chromatic"] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

Scale.Scales["ryukyu"] = [0, 4, 5, 7, 11];

timbre.fn.register("major", Scale, function(_args) {
    return new Scale(["major"].concat(_args));
});
timbre.fn.register("minor", Scale, function(_args) {
    return new Scale(["minor"].concat(_args));
});

// __END__

describe("scale", function() {
    object_test(Scale, "scale");
});
