jumplink.magento.factory("DatabaseService", ['STORE_VIEW', 'CONFIG', function(storeView, config) {
	var storeView = storeView;
	var Datastore = require('nedb');
	var magento_api = require('magento')(config.magento);
	var whitelist = config.product_view;
	var async = require('async');
	return {
		magento: magento_api.xmlrpc.manual,
		products: require('./database/products.js')(storeView, Datastore, config, magento_api, whitelist, async)
	}
}]);