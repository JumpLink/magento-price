'use strict';

var app = angular.module("app", []);

app.config(function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: 'home.html',
    controller: 'HomeController'
  });

  $routeProvider.when('/products', {
    templateUrl: 'products.html',
    controller: 'ProductController'
  });

  $routeProvider.otherwise({ redirectTo: '/home' });
});

app.factory("ExecService", function() {
  return require('child_process').exec;
});

app.factory("AsyncService", function() {
  return require('async');
});

app.factory("MagentoService", function(ExecService, AsyncService) {
  var config = require ('../config.json');
  return require('magento')(config);
});

function HomeController($scope) {

}

function ProductController($scope, MagentoService) {
  $scope.products = [];

/*var filter = magento.auto.set_filter.sku("021-198-009/B");
magento.auto.catalog.product.list(filter, config.mageplus.store_view[0].code, function (error, result) {
  console.log(result);
});*/

  $scope.sku_changed = function() {
    console.log ($scope.sku);
    var filter = MagentoService.auto.set_filter.like_sku ($scope.sku);
    MagentoService.auto.catalog.product.list(filter, "shop_de", function (error, result) {
      $scope.products = result;
      console.log($scope.products);
    });
  };
 
/*  'use strict';

  
  var exec = require('child_process').exec;

  exec('gsettings get org.jumplink.magento host',function(err, stdout, stderr){
    if (err || stderr) {
      util.puts(err);
      util.puts(stderr);
    }

    util.puts(stdout);

  });*/


}