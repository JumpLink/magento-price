module.exports = function(storeView) {
	var storeView = storeView;
	var Datastore = require('nedb');
	var config = require ('../../config.json');
	var magento_api = require('magento')(config.magento);
	var whitelist = config.product_view;
	var async = require('async');
	return {
		magento: magento_api.xmlrpc.manual,
		products: require('./products.js')(storeView, Datastore, config, magento_api, whitelist, async)
	}
}