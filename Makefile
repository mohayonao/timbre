all: timbre

timbre:
	coffee ./build/compiler.coffee

clean:
	rm -rf ./timbre.js
	rm -rf ./timbre.min.js
