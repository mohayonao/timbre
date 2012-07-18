fs   = require("fs")
path = require("path")
exec = require("child_process").exec

TIMBRE_SOURCES = [
    "timbre"
    "core/fn"
    "core/soundsystem"

    "objects/number"
    "objects/boolean"
    "objects/array"
    "objects/function"
    "objects/scale"

    "objects/dac"

    "objects/add"
    "objects/subtract"
    "objects/mul"
    "objects/divide"
    "objects/modulo"
    "objects/math"

    "objects/osc"
    "objects/func"
    "objects/noise"
    "objects/pink"
    "objects/oscx"
    "objects/phasor"
    "objects/pwm"
    "objects/fnoise"

    "objects/env"
    "objects/adsr"

    "objects/aux"
    "objects/filter"
    "objects/rfilter"
    "objects/efx.delay"
    "objects/efx.reverb"
    "objects/efx.dist"
    "objects/efx.chorus"
    "objects/efx.comp"

    "objects/audio"
    "objects/wav"

    "objects/buddy"
    "objects/delay"
    "objects/sah"
    "objects/pong"
    "objects/clip"
    "objects/easing"
    "objects/glide"

    "objects/record"
    "objects/buffer"
    "objects/fft"

    "objects/interval"
    "objects/timeout"
    "objects/schedule"
    "objects/mml"

    "objects/timbre"
]

UTILS_SOURCES = [
    "utils/converters"
    "utils/range"
    "utils/random"
    "utils/fft"
    "utils/wavelet"
    "utils/binary"
    "utils/wav"
    "utils/exports"
]

WINDOW_SOURCES = [
    "window/mutekitimer"
    "window/player"
    "window/utils"
    "window/exports"
]

WORKER_SOURCES = [
    "worker/wav"
    "worker/exports"
]

NODE_SOURCES = [
    "node/exports"
    "node/player"
]

PRODUCT_NAME = "timbre"
SRC_DIR = path.normalize "#{__dirname}/../src"
DST_DIR = path.normalize "#{__dirname}/.."


VERSION    = do ->
    dt = new Date()
    YY = dt.getFullYear().toString().substr(-2)
    MM = ("00" + (dt.getMonth() + 1)).substr(-2)
    DD = ("00" + dt.getDate()).substr(-2)
    "v#{YY}.#{MM}.#{DD}"

BUILD_DATE = new Date().toUTCString()

class InlineFunction
    constructor: (@filepath)->
        lines = fs.readFileSync(filepath, "utf-8").split "\n"
        line = lines.shift().trim()
        line = line.replace /\$\d/g, "([_\\w]+[_\\w\\d]*)"
        @name = path.basename @filepath
        @re = new RegExp "^(\\s*)" + line + "\\s*$"
        @va = []
        @fn = []
        for line in lines
            line = line.trimRight()
            if line.trim() is "" then continue
            if /var /.test line
                line = line.trim()
                line = line.replace /^var\s+/, ""
                line = line.replace /;$/, ""
                @va = @va.concat line.split(",").map (x)->x.trim()
            else @fn.push line

class VarDefine
    constructor: ->
        @va = []
        @pos = 0
        @indent = ""

    reset: (i, line)->
        @pos = i
        @indent = "    " + /^\s*/.exec(line)[0]
        @va = []

    exec: (i, line)->
        @pos = i
        @indent = /^\s*/.exec(line)[0]
        line = line.trim()
        line = line.replace /^var\s+/, ""
        line = line.replace /;$/, ""
        items = line.split ","
        items = items.map (x)->
            x.split("=")[0].trim()
        @va = @va.concat items

inline_functions = do ->
    files = fs.readdirSync("#{SRC_DIR}/inline").filter (x)->x.substr(-4) is ".txt"
    new InlineFunction "#{SRC_DIR}/inline/#{file}" for file in files

# build-functions
concat_source = (list)->
    ((fetch_source name for name in list).join "\n").trim()

fetch_source = (name)->
    filepath = "#{SRC_DIR}/#{name}.js"
    flg = 0
    res = for line in fs.readFileSync(filepath, "utf-8").split "\n"
        if flg is 0
            flg = 1 if line.trim() is "// __BEGIN__"
            continue
        break if line.trim() is "// __END__"
        line

    res.shift() while res[0].trim() is ""
    res.unshift "///// #{name}.js /////"

    # inline function
    res2 = []
    va = new VarDefine
    for line, i in res
        if /\s*[:=]\s*function\s*\(.*\)\s*{\s*/.test line
            res2.push line
            va.reset res2.length, line
            continue

        if /\s*var\s/.test line
            res2.push line
            va.exec res2.length, line
            continue

        exists = false
        for inlf in inline_functions
            m = inlf.re.exec line
            if not m then continue
            exists = true

            m.shift()

            items = inlf.va.filter (x)-> va.va.indexOf(x) is -1
            if not (items.length is 0)
                line2 = va.indent + "var " + items.join(", ") + ";"
                va.va = va.va.concat items
                res2.splice va.pos, 0, line2
            res2.push "#{m[0]}// inline -----: #{line.trim()}"
            for line2 in inlf.fn
                for j in [1..10]
                    m[j] ="" if not m[j]
                    line2 = line2.replace new RegExp("\\$#{j}", "g"), m[j]
                res2.push "#{m[0]}#{line2}"
            res2.push "#{m[0]}// ----- inline"
        res2.push line if not exists

    return res2.join "\n"

replace_souce = (wrapper, placeholder, source)->
    wrapper = wrapper.split "\n"

    re = new RegExp("^(\\s*)\\${#{placeholder}}\\s*$");
    items = do -> for x, i in wrapper
        return {line:i, indent:m[1]} if (m = re.exec x) != null

    if items != undefined
        source = ("#{items.indent}#{line}" for line in source.split "\n").join "\n"
        wrapper.splice items.line, 1, source

    wrapper.join "\n"

uglify = (src, dst, callback)->
    cmd = "node #{__dirname}/uglify.js --unsafe #{src} > #{dst}"
    exec cmd, (error, stdout, stderr)->
        console.log "stdout: #{stdout}"    if stdout
        console.log "stderr: #{stderr}"    if stderr
        console.log "exec error: #{error}" if error
        callback src, dst if callback

filesize = (filepath)->
    ((fs.statSync filepath).size / 1024).toFixed 2


# build timbre.js
source = fs.readFileSync "#{SRC_DIR}/timbre.txt", "utf-8"
source = replace_souce source, "TIMBRE_CODE", concat_source TIMBRE_SOURCES
source = replace_souce source, "UTILS_CODE" , concat_source UTILS_SOURCES
source = replace_souce source, "WINDOW_CODE", concat_source WINDOW_SOURCES
source = replace_souce source, "WORKER_CODE", concat_source WORKER_SOURCES
source = replace_souce source, "NODE_CODE"  , concat_source NODE_SOURCES
source = source.replace /\${VERSION}/g, VERSION
# source = source.replace /\${DATE}/g   , BUILD_DATE
console.log "build: #{VERSION} (#{BUILD_DATE})"

fs.writeFileSync "#{DST_DIR}/#{PRODUCT_NAME}.js", source, "utf-8"
fsize = filesize "#{DST_DIR}/#{PRODUCT_NAME}.js"
console.log "build  >> #{DST_DIR}/#{PRODUCT_NAME}.js (#{fsize}kB)"


# minify
tmp_path = "#{DST_DIR}/#{PRODUCT_NAME}.min.tmp"
min_path = "#{DST_DIR}/#{PRODUCT_NAME}.min.js"

uglify "#{DST_DIR}/#{PRODUCT_NAME}.js", tmp_path, ->
    src = fs.readFileSync(tmp_path, "utf-8").trim()
    fs.unlink tmp_path

    src = src.replace /^\s+[*]\s+build.+\n/m, ""

    fs.writeFileSync min_path, src, "utf-8"
    fsize = filesize min_path
    console.log "minify >> #{min_path} (#{fsize}kB)"
