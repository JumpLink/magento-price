run:
	./bin/node-webkit-v0.6.2-linux-x64/nw .

node_modules:
	npm install

# required by valabind
# ref: node_modules
# 	cd node_modules/ref; \
# 	node-gyp clean; \
# 	../nw-gyp/bin/nw-gyp.js configure --target=0.6.2; \
# 	../nw-gyp/bin/nw-gyp.js build

clean:
	-rm -rf node_modules core