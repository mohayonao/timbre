/**
 * timbre 0.0.0 / JavaScript Library for Objective Sound Programming
 * build: Tue May 15 2012 15:21:12 GMT+0900 (JST)
 */
;
var timbre = (function(context, timbre) {
    "use strict";
    
    var timbre = {};
    timbre.VERSION    = "0.0.0";
    timbre.BUILD      = "Tue May 15 2012 15:21:12 GMT+0900 (JST)";
    timbre.env        = "";
    timbre.platform   = "";
    timbre.samplerate = 44100;
    timbre.channels   = 2;
    timbre.cellsize   = 128;
    timbre.streamsize = 1024;
    timbre.verbose    = true;
    timbre._sys       = timbre;
    timbre._global    = {};
    
    typeof window === "object" && (function(window, timbre) {
        timbre.platform = "web";
        timbre._global  = window;
        
        window.T = timbre;
    }(context, timbre));
    
    typeof importScripts === "function" && (function(worker, timbre) {
        timbre.platform = "web";
        timbre._global  = worker;
    }(context, timbre));
    
    typeof process === "object" && process.title === "node" && (function(node, timbre) {
        timbre.platform = "node";
        timbre._global  = global;
    }(context, timbre));
    
    return timbre;
}(this));
