all: timbre

timbre:
	coffee ./build/compiler.coffee

test:
	mocha ./src/*/*.js

clean:
	rm -rf ./timbre.js
	rm -rf ./timbre.min.js
