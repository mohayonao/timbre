fs   = require("fs")
path = require("path")
exec = require("child_process").exec

TIMBRE_SOURCES = [
    "timbre"
    "timbre/dac"
    "timbre/operators"
    "timbre/oscillators"
    "timbre/buddy"
    "timbre/envelopes"
    "timbre/filters"
    "timbre/efx.delay"
    "timbre/efx.dist"
    "timbre/efx.chorus"
    "timbre/timers"
    "timbre/wav"
    "timbre/audio"
    "timbre/buffer"
    "timbre/easing"
    "timbre/record"
    "timbre/fft"
    "timbre/timbre"
]

UTILS_SOURCES = [
    "utils/converters"
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
]

PRODUCT_NAME = "timbre"
SRC_DIR = path.normalize "#{__dirname}/../src"
DST_DIR = path.normalize "#{__dirname}/.."

VERSION    = fs.readFileSync("#{DST_DIR}/version.txt", "utf-8").split("\n")[0].trim()
BUILD_DATE = new Date().toUTCString()


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
    return res.join "\n"

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


# build timbre.js
source = fs.readFileSync "#{SRC_DIR}/timbre.txt", "utf-8"
source = replace_souce source, "TIMBRE_CODE", concat_source TIMBRE_SOURCES
source = replace_souce source, "UTILS_CODE" , concat_source UTILS_SOURCES
source = replace_souce source, "WINDOW_CODE", concat_source WINDOW_SOURCES
source = replace_souce source, "WORKER_CODE", concat_source WORKER_SOURCES
source = replace_souce source, "NODE_CODE"  , concat_source NODE_SOURCES
source = source.replace /\${VERSION}/g, VERSION
source = source.replace /\${DATE}/g   , BUILD_DATE
console.log "build: #{VERSION} (#{BUILD_DATE})"

fs.writeFileSync "#{DST_DIR}/#{PRODUCT_NAME}.js", source, "utf-8"
console.log "build  >> #{DST_DIR}/#{PRODUCT_NAME}.js"


# minify
tmp_path = "#{DST_DIR}/#{PRODUCT_NAME}.min.tmp"
min_path = "#{DST_DIR}/#{PRODUCT_NAME}.min.js"

uglify "#{DST_DIR}/#{PRODUCT_NAME}.js", tmp_path, ->
    src = fs.readFileSync(tmp_path, "utf-8").trim()
    fs.unlink tmp_path

    src = src.replace /^\s+[*]\s+build.+\n/m, ""

    fs.writeFileSync min_path, src, "utf-8"
    console.log "minify >> #{min_path}"
