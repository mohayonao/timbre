/**
 * utils/exports
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

(function(utils) {
    
    var _export = function(name) {
        var list, items, i, x, res = [];
        
        if ((list = utils.$exports[name]) !== undefined) {
            for (i = list.length; i--; ) {
                x = list[i];
                timbre.context[x] = utils[x];
                res.unshift(x);
            }
        } else {
            items = name.split(".");
            for (x = utils; x && items.length; x = x[name]) {
                name = items.shift();
            }
            if (x && items.length === 0) {
                timbre.context[name] = x;
                res = [name];
            }
        }
        
        return res.join(",");
    };
    
    
    utils.exports = function() {
        var i, imax, x, res = [];
        for (i = 0, imax = arguments.length; i < imax; i++) {
            if (typeof arguments[i] === "string") {
                x = _export(arguments[i]);
                if (x) res = res.concat(x);
            }
        }
        return res.join(",");
    };
}(utils));

// __END__
