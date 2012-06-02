ex4 = (function() {
    return T("*", T("sin", 440, 0.5),
                  T("+sin",  8));
}());

ex5 = (function() {
    return T("*", T("saw", 660, 0.25),
                  T("adsr", 150, 2500).bang());
}());
