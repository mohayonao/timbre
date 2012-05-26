fs      = require "fs"
ejs     = require "ejs"
express = require "express"

app = module.exports = express.createServer()

app.configure ->
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use app.router
    app.use express.static __dirname

app.get "/timbre.js", (req, res)->
    res.send (fs.readFileSync "#{__dirname}/../timbre.js", "utf-8"),
     {"Content-Type":"text/javascript"}

app.get "/test/:test", (req, res)->
    res.send( ejs.render EJS_VIEW, {js:"#{req.params.test}.js"} )

app.listen process.env.PORT or 3000


EJS_VIEW = """
<html>
  <head>
    <meta charset="utf-8" />
    <title>timbre : test <%= js %></title>
    <link type="text/css" media="screen" rel="stylesheet" href="/css/test.css" />
    <link type="text/css" media="screen" rel="stylesheet" href="/css/prettify.css" />
  </head>
  <body>
    <canvas id="waveviewer"></canvas>
    <section id="body"><h1>test <%= js %></h1><div id="tests"></div></section>
  </body>
  <script type="text/javascript" src="/timbre.js"></script>
  <script type="text/javascript" src="/<%= js %>"></script>
  <script type="text/javascript" src="/js/waveviewer.js"></script>
  <script type="text/javascript" src="/js/prettify.js"></script>
  <script type="text/javascript" src="/js/jquery.min.js"></script>

  <script type="text/javascript">
  $(function() {
      "use strict";
      var synth_list = [];
      timbre.amp = 0.5;

      tests.forEach(function(x) {
          var synth, src;
          var viewer = new WaveViewer(timbre.sys.cell, 60, "waveviewer", 512, 256);

          timbre.addEventListener("on", function() {
              viewer.start();
          });
          timbre.addEventListener("off", function() {
              viewer.pause();
          });

          synth = x.call(null);

          synth.dac.addEventListener("play" , function() {
              timbre.on();
          });
          synth.dac.addEventListener("pause", function() {
              if (synth_list.every(function(ex) { return ex.dac.isOff; })) timbre.off();
          });

          src = x.toString().split("\\n");
          src = src.slice(1, src.length-1).map(function(x) {
              return x.substr(8);
          });
          src[src.length-1] = src[src.length-1].replace(/^return /, "");
          src = src.join("\\n");

          $("<div>")
            .append($("<h3>").text(x.desc||""))
            .append($("<button>").text("play").on("click", function() {
              synth.play();
            }))
            .append($("<button>").text("pause").on("click", function() {
              synth.pause();
            }))
            .append($("<pre>").text(src).addClass("prettyprint"))
            .appendTo("#tests");

          synth_list.push(synth);
      });
      prettyPrint();
  });
  </script>
</html>
"""
