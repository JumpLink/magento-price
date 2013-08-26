module.exports = function(storeView) {
	var storeView = storeView;
	var Datastore = require('nedb');
	var config = require ('../../config.json');
	var magento_api = require('magento')(config.magento);
	var whitelist = config.product_view;
	var async = require('async');
	//console.log(magento_api.xmlrpc.manual.length);
	/*for (method in magento_api.xmlrpc.manual)
		console.log(method);*/
	return {
		magento: magento_api.xmlrpc.manual,
		products: require('./products.js')(storeView, Datastore, config, magento_api, whitelist, async)
		//online: magento_api.xmlrpc.manual.core_magento.info
	}
}