run:
	-make run64
	-make run32

run64:
	./bin/node-webkit-v0.6.2-linux-x64/nw .

run32:
	./bin/node-webkit-v0.6.2-linux-ia32/nw .

build: node-expat

node_modules:
	npm install
	cd node_modules/magento; npm install;

bower_components:
	bower install

# required by valabind
# ref: node_modules
# 	cd node_modules/ref; \
# 	node-gyp clean; \
# 	../nw-gyp/bin/nw-gyp.js configure --target=0.6.2; \
# 	../nw-gyp/bin/nw-gyp.js build

node-expat: node_modules
	cd node_modules/magento/node_modules/soap/node_modules/node-expat; \
	node-gyp clean; \
	../../../../../nw-gyp/bin/nw-gyp.js configure --target=0.6.2; \
	../../../../../nw-gyp/bin/nw-gyp.js build

clean:
	-rm -rf node_modules core