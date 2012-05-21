/**
 * utils/binary
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

(function(binary) {
    
    var send = function(callback, bytes) {
        if (typeof callback === "function") {
            callback(bytes);
        } else if (typeof callback === "object") {
            callback.buffer = bytes;
        }
    };
    
    var web_load = function(src, callback) {
        if (typeof src === "string") {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", src, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function() {
                send(callback, xhr.response);
            };
            xhr.send();
        }
    };
    
    binary.load = function(src, callback) {
        if (typeof callback === "function" || typeof callback === "object") {
            if (timbre.platform === "web") {
                web_load(src, callback);
            } else if (timbre.platform === "node") {
                // TODO: node_load(src, callback);
            }
        }        
    };
    
}( utils.binary = {} ));

// __END__
