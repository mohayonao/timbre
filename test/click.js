tests = (function() {
    "use strict";
    
    var i = 0, tests = [];
    tests.require = ["/draft/click.js"];

    
    tests[i] = function() {
        return T("click");
    }; tests[i++].desc = "click";
    
    return tests;
}());
