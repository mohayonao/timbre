/**
 * cnvui.js
 * version: 0.1.1
 */
var CnvUI = (function() {
    "use strict";
    
    var WIDGETS = {}, IDS = {};
    
    var extend = function(C, P) {
        var F = function() {};
        F.prototype = P.prototype;
        C.prototype = new F();
        C.prototype.superclass = P.prototype;
        return C.prototype;
    };
    
    var Widget = (function() {
        var Widget = function() {
            initialize.apply(this, arguments);
        }, $this = Widget.prototype;
        
        var initialize = function(ui, opts) {
            this.ui = ui;
            this.id = opts.id;
            this.x  = (ui.x + opts.x) || 0;
            this.y  = (ui.y + opts.y) || 0;
            this.width  = opts.width  || 0;
            this.height = opts.height || 0;
            this.context    = ui.context;
            this.foreground = opts.foreground  || ui.foreground || "black";
            this.background = opts.background  || ui.background || "white";
            this.lineWidth  = opts.lineWidth   || ui.lineWidth  || 2;
            
            if (this.id !== undefined) IDS[opts.id] = this;
        };

        var nop = function() {};
        
        $this.set  = nop;
        $this.draw = nop;
        $this.update = nop;
        $this.mousedown = nop;
        $this.mousemove = nop;
        $this.mouseup   = nop;
        
        $this.touch = function(x, y) {
            var x0 = this.x;
            var x1 = x0 + this.width;
            var y0 = this.y;
            var y1 = y0 + this.height;
            
            if (x0 <= x && x < x1 && y0 <= y && y < y1) {
                var dx = x - this.x;
                var dy = y - this.y;
                return this.distance = Math.sqrt(dx * dx + dy * dy);
            } else {
                return Infinity;
            }
        };
        
        return Widget;
    }());
    
    
    WIDGETS["panel"] = (function() {
        var Panel = function() {
            initialize.apply(this, arguments);
        }, $this = extend(Panel, Widget);
        
        var initialize = function(ui, opts) {
            Widget.call(this, ui, opts);
            this.widgets = [];
            this.draw();
        };
        
        $this.set = function(opts) {
            var k;
            if ((k = WIDGETS[opts.type]) !== undefined) {
                var i = new k(this, opts);
                this.widgets.push(i);
                return i;
            }
        };
        
        $this.getWidgetById = function(id) {
            return IDS[id];
        };
        
        $this.draw = function() {
            var context;
            
            context = this.context;
            context.save();
            
            context.fillStyle = this.background;
            context.fillRect(this.x, this.y, this.width, this.height);
            
            context.restore();
        };
        
        return Panel;
    }());
    
    
    WIDGETS["label"] = (function() {
        var Label = function() {
            initialize.apply(this, arguments);
        }, $this = extend(Label, Widget);
        
        var initialize = function(ui, opts) {
            Widget.call(this, ui, opts);
            this.align = opts.align || "left";
            this.value = opts.value || "";
            this.draw();
        };
        
        $this.draw = function() {
            var context, tw, w, h;
            
            context = this.context;
            context.save();
            
            context.font = "bold 12px 'Courier New', monospace";
            tw = context.measureText(this.value).width;
            if (this.width === 0) {
                w = tw;
            } else {
                w = this.width;
            }
            if (this.height === 0) {
                h = 12;
            } else {
                h = this.height;
            }
            
            switch (this.align) {
            case "center":
                context.fillStyle = this.background;
                context.fillRect(this.x - (w/2), this.y, w, h);
                context.fillStyle = this.foreground;
                context.fillText(this.value, this.x - (tw/2), this.y+h-2, (w + tw)/2);
                break;
            case "right":
                context.fillStyle = this.background;
                context.fillRect(this.x - w, this.y, w, h);
                context.fillStyle = this.foreground;
                context.fillText(this.value, this.x - tw, this.y+h-2, tw);
                break
            case "left":
            default:
                context.fillStyle = this.background;
                context.fillRect(this.x, this.y, w, h);
                context.fillStyle = this.foreground;
                context.fillText(this.value, this.x, this.y+h-2, w);
                break;
            }
            context.restore();
        };
        
        $this.update = function(value) {
            this.value = value;
            this.draw();
        };
        
        return Label;
    }());
    
    
    WIDGETS["switch"] = (function() {
        var Switch = function() {
            initialize.apply(this, arguments);
        }, $this = extend(Switch, Widget);
        
        var initialize = function(ui, opts) {
            Widget.call(this, ui, opts);
            this.value  = opts.value  || false;
            this.width  = opts.width  ||    10;
            this.height = opts.height ||    30;
            if (typeof opts.change === "function") {
                this.onchange = opts.change;
            }
            this.draw();
        };

        $this.draw = function() {
            var context, w, h, y0, y1;
            
            w = this.width;
            h = this.height;
            
            context = this.context;
            context.save();
            
            context.fillStyle = this.background;
            context.fillRect(this.x, this.y, w, h);
            
            context.strokeStyle = this.foreground;
            context.lineWidth   = this.lineWidth;
            
            context.beginPath();
            context.strokeRect(this.x, this.y, w, h);
            context.stroke();
            
            context.fillStyle = this.foreground;
            y0 = (this.value) ? this.y : this.y+h/2;
            y1 = h/2;
            context.fillRect(this.x, y0, w, y1);
            context.fill();
            
            context.restore();
        };
        
        $this.mousedown = function(x, y, dx, dy) {
            this.value = !this.value;
            if (this.onchange) this.onchange.call(this, this.value);
            this.draw();
        };
        
        $this.update = function(value) {
            this.value = !!value;
            this.draw();
        };
        
        return Switch;
    }());
    
    
    WIDGETS["knob"] = (function() {
        var Knob = function() {
            initialize.apply(this, arguments);
        }, $this = extend(Knob, Widget);
        
        var PI2 = Math.PI * 2;
        
        var initialize = function(ui, opts) {
            Widget.call(this, ui, opts);
            
            this.value  = opts.value  ||   0;
            this.min    = opts.min    ||   0;
            this.max    = opts.max    || 100;
            this.step   = opts.step   || ((this.max - this.min) + 1);
            this.radius = opts.radius ||  20;
            this.width  = this.radius * 2;
            this.height = this.radius * 2;
            if (typeof opts.change === "function") {
                this.onchange = opts.change;
            }
            this._value0 = (this.value - this.min) / (this.max - this.min);
            if (this._value0 < 0)      this._value0 = 0;
            else if (1 < this._value0) this._value0 = 1;
            this._value1 = this._value0;
            
            this.draw();
        };
        
        $this.draw = function() {
            var context, r, rad, dx, dy;

            r = this.radius;
            context = this.context;
            context.save();

            context.fillStyle = this.background;
            context.fillRect(this.x - r, this.y - r, this.width, this.height);

            r *= 0.9;
            
            context.strokeStyle = this.foreground;
            context.lineWidth   = this.lineWidth;
            
            context.beginPath();
            context.arc(this.x, this.y, r, 0, PI2, true);
            context.stroke();
            
            context.beginPath();
            context.moveTo(this.x, this.y);
            rad = (this._value1 * 0.75) * PI2 + (0.25 * Math.PI);
            dx  = -Math.sin(rad) * r;
            dy  = +Math.cos(rad) * r;
            context.lineTo(this.x + dx, this.y + dy);
            context.stroke();
            
            context.restore();
        };
        
        $this.mousemove = function(x, y, dx, dy) {
            var value = this._value0 - (dy / 100);
            if (value < 0)      value = 0;
            else if (1 < value) value = 1;
            
            this._value0 = value;
            this._value1 = ((value * (this.step-1))|0) / (this.step-1);
            value = (((this.max - this.min) * this._value1)|0) + this.min;
            if (this.value !== value) {
                this.value = value;
                if (this.onchange) this.onchange.call(this, this.value);
            }
            this.draw();
        };
        
        $this.touch = function(x, y) {
            var dx = x - this.x;
            var dy = y - this.y;
            var dd = Math.sqrt(dx * dx + dy * dy);
            return (dd < this.radius) ? dd : Infinity;
        };
        
        $this.update = function(value) {
            value = (value - this.min) / (this.max - this.min);
            if (value < 0)      value = 0;
            else if (1 < value) value = 1;
            
            this._value0 = value;
            this._value1 = ((value * (this.step-1))|0) / (this.step-1);
            value = (((this.max - this.min) * this._value1)|0) + this.min;
            if (this.value !== value) {
                this.value = value;
                if (this.onchange) this.onchange.call(this, this.value);
            }
            this.draw();
        };
        
        return Knob;
    }());
    
    
    WIDGETS["vslider"] = (function() {
        var VSlider = function() {
            initialize.apply(this, arguments);
        }, $this = extend(VSlider, Widget);
        
        var initialize = function(ui, opts) {
            Widget.call(this, ui, opts);
            this.value  = opts.value  ||   0;
            this.min    = opts.min    ||   0;
            this.max    = opts.max    || 100;
            this.step   = opts.step   || (this.max - this.min);
            this.width  = opts.width  ||  10;
            this.height = opts.height ||  80;
            if (typeof opts.change === "function") {
                this.onchange = opts.change;
            }
            this._value0 = (this.value - this.min) / (this.max - this.min);
            if (this._value0 < 0)      this._value0 = 0;
            else if (1 < this._value0) this._value0 = 1;
            this._value1 = this._value0;
            
            this.draw();
        };

        $this.draw = function() {
            var context, w, h, y0, y1;
            
            w = this.width;
            h = this.height;
            
            context = this.context;
            context.save();

            context.fillStyle = this.background;
            context.fillRect(this.x, this.y, w, h);
            
            context.strokeStyle = this.foreground;
            context.lineWidth   = this.lineWidth;
            
            context.beginPath();
            context.strokeRect(this.x, this.y, w, h);
            context.stroke();
            
            context.fillStyle = this.foreground;
            y0 = this.y + h - 5 - (this._value1 * h);
            y1 = 10;
            if (y0 < this.y) y0 = this.y;
            else if (this.y + h - 10 < y0) y0 = this.y + h - 10;
            context.fillRect(this.x, y0, w, y1);
            context.fill();
            
            context.restore();
        };
        
        $this.mousedown = function(x, y) {
            var value = 1 - (y / this.height);
            if (value < 0)      value = 0;
            else if (1 < value) value = 1;
            
            this._value0 = value;
            this._value1 = ((value * (this.step-1))|0) / (this.step-1);
            value = (((this.max - this.min) * this._value1)|0) + this.min;
            if (this.value !== value) {
                this.value = value;
                if (this.onchange) this.onchange.call(this, this.value);
            }
            this.draw();
        };
        
        $this.mousemove = function(x, y, dx, dy) {
            var value = this._value0 - (dy / 100);
            if (value < 0)      value = 0;
            else if (1 < value) value = 1;
            
            this._value0 = value;
            this._value1 = ((value * (this.step-1))|0) / (this.step-1);
            value = (((this.max - this.min) * this._value1)|0) + this.min;
            if (this.value !== value) {
                this.value = value;
                if (this.onchange) this.onchange.call(this, this.value);
            }
            this.draw();
        };
        
        $this.update = function(value) {
            value = (value - this.min) / (this.max - this.min);
            if (value < 0)      value = 0;
            else if (1 < value) value = 1;
            
            this._value0 = value;
            this._value1 = ((value * (this.step-1))|0) / (this.step-1);
            value = (((this.max - this.min) * this._value1)|0) + this.min;
            if (this.value !== value) {
                this.value = value;
                if (this.onchange) this.onchange.call(this, this.value);
            }
            this.draw();
        };
        
        return VSlider;
    }());
    
    
    var CnvUI = (function() {
        var CnvUI = function() {
            initialize.apply(this, arguments);
        }, $this = CnvUI.prototype;
        
        var initialize = function(opts) {
            var self = this, elem;
            Widget.call(this, this, opts);

            opts = opts || {};
            elem = opts.elem;
            if (typeof elem === "string" && elem.charAt(0) === "#") {
                this.elem = document.getElementById(elem.substr(1));
            } else if (typeof elem === "object") {
                if (elem instanceof HTMLCanvasElement) {
                    this.elem = elem;
                }
            }
            if (! (this.elem instanceof HTMLCanvasElement)) {
                this.elem = document.createElement("canvas");
            }
            this.elem.width  = this.width  = opts.width  || 320;
            this.elem.height = this.height = opts.height || 240;
            this.context     = this.elem.getContext("2d");
            
            this.widgets = [];
            this._hold   = { target:null, x:0, y:0 };
            
            this.context.save();
            this.context.fillStyle = this.background;
            this.context.fillRect(0, 0, this.width, this.height);
            this.context.restore();
            
            var $elem = $(elem);
            
            window.addEventListener("mousedown", function(e) {
                var offset = $elem.offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                
                function itr(widgets, list) {
                    var i, imax;
                    for (i = 0; i < widgets.length; i++) {
                        if (widgets[i].widgets) {
                            list.concat(itr(widgets[i].widgets, list));
                        } else {
                            list.push(widgets[i]);
                        }
                    }
                    return list;
                };
                var widgets = itr(self.widgets, []);
                var cands = widgets.filter(function(w) {
                    return w.touch(x, y) !== Infinity;
                });
                cands.sort(function(a, b) { return a.distance - b.distance; });
                
                var target; 
                if ((target = cands[0]) !== undefined) {
                    self._hold.target = target;
                    self._hold.x = x;
                    self._hold.y = y;
                    target.mousedown(x - target.x, y - target.y);
                    e.preventDefault();
                }
            }, false);
            window.addEventListener("mousemove", function(e) {
                var target;
                if (e.which === 1 && (target = self._hold.target) !== null) {
                    var offset = $elem.offset();
                    var x = e.pageX - offset.left;
                    var y = e.pageY - offset.top;
                    target.mousemove(x - target.x, y - target.y,
                                     x - self._hold.x, y - self._hold.y);
                    self._hold.x = x;
                    self._hold.y = y;
                }
            }, false);
            window.addEventListener("mouseup", function(e) {
                var target;
                if (e.which === 1 && (target = self._hold.target) !== null) {
                    var offset = $elem.offset();
                    var x = e.pageX - offset.left;
                    var y = e.pageY - offset.top;
                    target.mouseup(x - target.x, y - target.y);
                    self._hold.target = null;
                }
            }, false);
        };
        
        $this.set = function(opts) {
            var k;
            if ((k = WIDGETS[opts.type]) !== undefined) {
                var i = new k(this, opts);
                this.widgets.push(i);
                return i;
            }
        };
        
        $this.getWidgetById = function(id) {
            return IDS[id];
        };
        
        $this.draw = function() {
            this.widgets.forEach(function(w) {
                w.draw();
            });
        };
        
        return CnvUI;
    }());
    
    return CnvUI;
}());
