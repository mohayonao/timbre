/**
 * window/mutekitimer
 */
"use strict";

var window = {};
// __BEGIN__

var MutekiTimer = (function() {
    var MutekiTimer = function() {
        initialize.apply(this, arguments);
    }, $this = MutekiTimer.prototype;
    
    var TIMER_PATH = (function() {
        var BlobBuilder, URL, builder;
        BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        URL = window.URL || window.webkitURL;
        if (BlobBuilder && URL) {
            builder = new BlobBuilder();
            builder.append("onmessage=t=function(e){clearInterval(t);if(i=e.data)t=setInterval(function(){postMessage(0)},i)}");
            return URL.createObjectURL(builder.getBlob());
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
            if (/mac.*firefox/i.test(window.navigator.userAgent)) {
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
