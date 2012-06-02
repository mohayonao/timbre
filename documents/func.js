ex0 = (function() {
    return T("func");
}());

ex4 = (function() {
    return T("func", function(x) {
        return (x < 0.1) ? -1 : +1;
    }, 880).set("mul", 0.25);
}());


ex4 = (function() {
    return T("func", 3, function(x) {
        return [x-0.5, 0, 0];
    }, 880);
}());
