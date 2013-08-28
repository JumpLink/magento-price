jumplink.magento.factory("DatabaseService", ['STORE_VIEW', 'CONFIG', 'MagentoService', 'DatabaseProductService', function(storeView, config, magento_api, DatabaseProductService) {
	return {
		magento: magento_api.xmlrpc.manual,
		products: DatabaseProductService
	}
}]);