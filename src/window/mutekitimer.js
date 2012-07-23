/**
 * MutekiTimer
 * v 0. 1. 0: first version
 * v12.07.23: BlobBuilder is deprecated, Use "Blob" constructor instead.
 */
"use strict";

var window = {};
// __BEGIN__

var MutekiTimer = (function() {
    var MutekiTimer = function() {
        initialize.apply(this, arguments);
    }, $this = MutekiTimer.prototype;
    
    var TIMER_PATH = (function() {
        var src = "var t=0;onmessage=function(e){clearInterval(t);if(i=e.data)t=setInterval(function(){postMessage(0)},i)}";
        
        var blob = null;
        if (window.Blob) {
            try { blob = new Blob([src], {type:"text\/javascript"});
            } catch (e) { blob = null; }
        }
        
        if (blob === null) {
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            if (BlobBuilder) {
                var builder = new BlobBuilder();
                builder.append(src);
                blob = builder.getBlob();
            }
        }
        
        if (blob !== null) {
            var URL = window.URL || window.webkitURL;
            return URL.createObjectURL(blob);
        }
        return null;
    }());
    
    var initialize = function() {
        if (TIMER_PATH) {
            this._timer = new Worker(TIMER_PATH);
        } else {
            this._timer = null;
        }
        this._timerId = 0;
        this._ugly_patch = 0;
    };
    
    $this.setInterval = function(func, interval) {
        if (this._timer !== null) {
            this._timer.onmessage = func;
            this._timer.postMessage(interval);
            if (/firefox/i.test(window.navigator.userAgent)) {
                window.clearInterval(this._ugly_patch);
                this._ugly_patch = window.setInterval(function() {}, 1000);
            }
        } else {
            if (this._timerId !== 0) {
                window.clearInterval(this._timerId);
            }
            this._timerId = window.setInterval(func, interval);
        }
    };
    
    $this.clearInterval = function() {
        if (this._timer !== null) {
            this._timer.postMessage(0);
            if (this._ugly_patch) {
                window.clearInterval(this._ugly_patch);
                this._ugly_patch = 0;
            }
        } else if (this._timerId !== 0) {
            window.clearInterval(this._timerId);
            this._timerId = 0;
        }
    };
    
    return MutekiTimer;
}());

// __END__
