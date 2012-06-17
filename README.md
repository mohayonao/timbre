Timbre.js
========

#### JavaScript Library for Objective Sound Programming ####

[Project Page](http://mohayonao.github.com/timbre/) — [Documentation](http://mohayonao.github.com/timbre/documents) — [Example01](http://mohayonao.github.com/timbre/examples/002_rhythmsequencer.html)  — [Example02](http://mohayonao.github.com/timbre/examples/003_loadwavfiles.html)  — [Example03](http://mohayonao.github.com/timbre/examples/004_timbresynth.html)


### Usage ###

Download the [minified library](http://mohayonao.github.com/timbre/timbre.min.js) and include it in your html.
```html
<script src="timbre.js"></script>
```

Timbre.js is so easy.
```js
// generate a 523Hz(C4) sine
T("sin", 523.25).play();
```

It's useful and powerful.
```js
// generate a chord C-major 
T("+", T("sin", 523.35),
       T("sin", 659.25),
       T("sin", 783.99)).set("mul", 0.25).play();
```

Looks a bit like CUI Max/MSP??? SuperCollider??
```js
// tremolo & decay  
T("*", T("+", T("sin", 523.35),
              T("sin", 659.25),
              T("sin", 783.99)).set("mul", 0.25),
       T("+tri", 2),
       T("adsr", 100, 2500)).play();
```

### License ###

MIT

### ChangeLog ###
2012 06 17 - **v0.3.2** (292.79 KB, min: 107.25 KB)
* Update `compiler.coffee` for Inline-expands functions, improve performance??


2012 06 14 - **v0.3.1**
* Improved `T("schedule")`


2012 06 12 - **v0.3.0** (241.66 KB, min: 94.13 KB)
* Added `T("schedule")`, `T("scale")`


2012 06 07 - **v0.2.1**
* Added `timbre.setup()` that the initial configuration


2012 06 04 - **v0.2.0** (217.75 KB, min: 84.00 KB)
* Added `T("phasor")`, `T("oscx")`
* Added `T().isUndefined` property


2012 06 02 - **v0.1.0** (206.26 KB, min: 79.67 KB)

* Initial release of Timbre.js
