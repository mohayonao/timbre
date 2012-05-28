/**
 * window/utils
 */
"use strict";

var timbre = require("../timbre");
var window = timbre.utils = {};
// __BEGIN__

timbre.utils.relpath2rootpath = function(relpath) {
    if (/^https?:\/\//.test(relpath)) {
        return relpath;
    } else if (relpath[0] === "/") {
        return relpath;
    } else {
        var rootpath = window.location.pathname;
        rootpath = rootpath.substr(0, rootpath.lastIndexOf("/"));
        rootpath = rootpath.split("/").filter(function(x) {
            return x !== "";
        });
        relpath = relpath.split("/");
        for (var i = 0; i < relpath.length; ++i) {
            if (relpath[i] === "..") {
                rootpath.pop();
            } else if (relpath[i] !== ".") {
                rootpath.push(relpath[i]);
            }
        }
        return "/" + rootpath.join("/");
    }
};

// __END__
