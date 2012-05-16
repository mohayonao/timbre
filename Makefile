all: timbre

timbre:
	coffee ./build/compiler.coffee

test:
	find ./src -name "*.js" | xargs mocha

clean:
	rm -rf ./timbre.js
	rm -rf ./timbre.min.js
