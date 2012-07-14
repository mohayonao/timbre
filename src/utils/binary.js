/**
 * utils/binary v12.07.14
 * v12.07.14: node.js
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

    var node_load = function(src, callback) {
        var m;
        if (typeof src === "string") {
            if ((m = /^(https?):\/\/(.*?)(\/.*)?$/.exec(src)) !== null) {
                node_load_from_web(m[1], {host:m[2], path:m[3]||""}, callback);
            } else {
                node_load_from_fs(src, callback);
            }
        }
    };
    
    var node_load_from_web = function(protocol, uri, callback) {
        require(protocol).get(uri, function(res) {
            var bytes, index;
            if (res.statusCode === 200) {
                bytes = new ArrayBuffer(res.headers["content-length"]);
                index = 0;
                res.on("data", function(chunk) {
                    var i, imax;
                    for (i = 0, imax = chunk.length; i < imax; ++i) {
                        bytes[index++] = chunk[i];
                    }
                });
                res.on("end", function() {
                    send(callback, bytes);
                });
            }
        });
    };
    
    var node_load_from_fs = function(src, callback) {
        require("fs").readFile(src, function (err, data) {
            var bytes, i;
            if (err) {
                console.warn(err);
                return;
            }
            bytes = new ArrayBuffer(data.length);
            for (i = bytes.byteLength; i--; ) {
                bytes[i] = data[i];
            }
            send(callback, bytes);
        });
    };
    
    binary.load = function(src, callback) {
        if (typeof callback === "function" || typeof callback === "object") {
            if (timbre.platform === "web") {
                web_load(src, callback);
            } else if (timbre.platform === "node") {
                node_load(src, callback);
            }
        }        
    };
    
}( utils.binary = {} ));

// __END__
