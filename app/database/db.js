module.exports = function(storeView) {
	return {
		products: require('./products.js')(storeView)
	}
}