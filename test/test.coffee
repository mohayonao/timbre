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
    res.send( ejs.render EJS_VIEW, {js:"#{req.params.test}"} )

app.listen process.env.PORT or 3000


EJS_VIEW = """
<html>
  <head>
    <meta charset="utf-8" />
    <title>test: <%= js %></title>
    <link type="text/css" rel="stylesheet" href="/public/css/test.css" />
    <link type="text/css" rel="stylesheet" href="/public/css/prettify.css" />
  </head>
  <body>
    <canvas id="waveviewer"></canvas>
    <section id="body"><h1>test: <%= js %></h1><div id="tests"></div></section>
  </body>
  <script type="text/javascript" src="/timbre.js"></script>
  <script type="text/javascript" src="/<%= js %>"></script>
  <script type="text/javascript" src="/public/js/waveviewer.js"></script>
  <script type="text/javascript" src="/public/js/prettify.js"></script>
  <script type="text/javascript" src="/public/js/jquery.min.js"></script>
  <script type="text/javascript" src="/public/js/main.js"></script>
</html>
"""
