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
  var magento = require('magento')(config);
  magento.helper = {
    get_all_products_from_storeview: function (storeView, cb) {
      var filter = magento.auto.set_filter.like_sku ("151");
      magento.auto.catalog.product.list(filter, storeView, cb);
    }
  }
  return magento;
});

function HomeController($scope) {

}

function ProductController($scope, MagentoService) {
  //$scope.active_product_id = 0;
  $scope.change_product_view = function (product_id) {
    console.log("product_id");
    $scope.active_product_id = product_id;
    //$scope.$apply();
  }
}


app.directive("productview", ['MagentoService', function (MagentoService) {
  return {
    restrict: "E",
    templateUrl: "productview.html",
    link: function ($scope, $element, $attrs) {
      $scope.load_product = function (id, storeview) {
        MagentoService.auto.catalog.product.info(id, storeview, function (error, result) {
          if (error) console.log(error);
          $scope.product_info = result;
          $scope.$apply();
        });
      }
      if( $attrs.id  && $attrs.storeview)
        this.load_product ( $attrs.id, $attrs.storeview);
    }
  }
}]);

app.directive("productsbar", function () {
  return {
    restrict: "E",
    templateUrl: "productsbar.html",
    controller: function ($scope, $element, $attrs, MagentoService) {
      $scope.sku = "";
      MagentoService.helper.get_all_products_from_storeview ($attrs.storeview, function (error, result) {
        if (error) console.log(error);
        $scope.products = result;
        window.products = $scope.products;
        $scope.$apply();
      });
    }
  }
});

