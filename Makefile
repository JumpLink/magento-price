export LD_LIBRARY_PATH:=$(shell cd vala && pwd)

run:
	./bin/node-webkit-v0.6.2-linux-x64/nw .

node_modules:
	npm install

all: ref ffi vala-bind

ref: node_modules
	cd node_modules/ref; \
	node-gyp clean; \
	../nw-gyp/bin/nw-gyp.js configure --target=0.6.2; \
	../nw-gyp/bin/nw-gyp.js build

ffi: node_modules
	cd node_modules/ffi; \
	node-gyp clean; \
	../nw-gyp/bin/nw-gyp.js configure --target=0.6.2; \
	../nw-gyp/bin/nw-gyp.js build

vala-bind: vala-c-source libvalamagento.so node_modules
	valabind --node-ffi -m object -N ValaObject -V vala object -o vala_magento_node_bind.js.js

vala-c-source:
	valac -H vala/object.h -C --vapi=vala/object.vapi --library=libvalamagento vala/object.vala

libvalamagento.so:
	valac \
		--enable-experimental    \
		-X -fPIC -X -shared      \
		--library=vala/libvalamagento    \
		--gir=vala/ValaObject-0.1.gir \
		-o vala/libvalamagento.so        \
		vala/object.vala

clean:
	rm node_modules -rf
	rm vala_magento_node_bind.js.js vala/*.so vala/*.vapi vala/*.c vala/*.h vala/*.gir -f