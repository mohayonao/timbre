/**
 * utils/exports
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

utils.exports = function(name) {
    var list, i, x, res = [];
    if ((list = utils.$exports[name]) !== undefined) {
        for (i = list.length; i--; ) {
            x = list[i];
            timbre.context[x] = utils[x];
            res.unshift(x);
        }
    }
    return res.join(",");
};

// __END__
