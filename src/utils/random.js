/**
 * utils/random
 * Generate pseudo-random numbers
 * http://docs.python.org/library/random.html
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

(function(random) {
    
    var Random = function(seed) {
        var x = new Uint32Array(32);
        
        this.seed = function(seed) {
            var i;
            
            if (typeof seed !== "number") {
                seed = (+new Date() * 1000) + Math.random() * 1000;
            }
            seed |= 0;
            x[0] = 3;
            x[1] = seed;
            for (i = 2; i <= 31; ++i) {
                seed = (16807 * seed) & 0x7FFFFFFF;
                x[i] = seed;
            }
            for (i = 310; i--; ) this.next();
        };
        
        this.next = function() {
            var n = x[0];
            n = (n === 31) ? 1 : n + 1;
            
            x[0] = n;
            x[n] += (n > 3) ? x[n-3] : x[n+31-3];
            
            return (x[n]>>>1) / 2147483647;
        };
        
        this.seed(seed);
    };
    random.Random = Random;
    
    var rand = new Random();
    
    var seed = function(seed) {
        rand.seed(seed);
    };
    random.seed = seed;
    
    var rangerange = function() {
        return choice(utils.range.apply(null ,arguments));
    };
    random.randrange = rangerange;
    
    var randint = function(a, b) {
        return (a + (b - a + 1) * rand.next())|0;
    };
    random.randint = randint;
    
    var choice = function(seq) {
        return seq[(seq.length * rand.next())|0];
    };
    random.choice = choice;
    
    var shuffle = function(x, seed) {
        var r;
        if (typeof seed === "number") {
            r = new Random(seed);
        } else r = rand;
        
        x.sort(function() { return r.next() - r.next(); });
        return x;
    };
    random.shuffle = shuffle;
    
    var random = function() {
        return rand.next();
    };
    random.random = random;
    
    var uniform = function(a, b) {
        return a + (b - a) * rand.next();
    };
    random.uniform = uniform;
    
    utils.$exports["random"] = [ "random" ];
    
}( utils.random = {} ));


// __END__
if (module.parent && !module.parent.parent) {
    describe("random", function() {
        
    });
}
