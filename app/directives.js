jumplink.magento.directive("productview", ['DebugService', 'DatabaseService', '$rootScope', function (DebugService, DatabaseService, $rootScope) {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productview.html',
    link: function ($scope, $element, $attrs) {

      $scope.load_product = function (product_id, storeview) {
        if ($rootScope.online === true) {
          console.log("online "+$rootScope.online+": local.insertUpdateOne");
          DatabaseService.products.local.insertUpdateOne (product_id, storeview, function (error, result) {
            if (error) console.log( "error with product_id is "+product_id +" " + DebugService(error) );
            console.log(DebugService(result));
            $scope.product_info.object = result;
            $scope.$apply();
          });
        } else {
          console.log("online "+$rootScope.online+": local.findOne");
          DatabaseService.products.local.findOne ({product_id:product_id} , function (error, result) {
            if (error) console.log( "error with product_id is "+product_id +" " + DebugService(error) );
            console.log(DebugService(result));
            $scope.product_info.object = result;
            $scope.$apply();
          });
        }
      }
    }
  }
}]);

jumplink.magento.directive("productsbar", ['ProductService', 'DebugService', 'DatabaseService', 'ConfigService', '$rootScope', function (ProductService, DebugService, DatabaseService, ConfigService, $rootScope) {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productsbar.html',
    controller: function ($scope, $element, $attrs ) {
      $scope.sku = "";
      $scope.paths = {
        product_image : __dirname + ConfigService.paths.product_image
      }

      $scope.open_file = function (file) {
        require('nw.gui').Shell.openItem(file);
      }
      ProductService.setProductList ();
      $scope.resetProductList = ProductService.resetProductList;

      $scope.resetSearchInput = function () {
        $scope.sku = "";
      }
    }
  }
}]);

jumplink.magento.directive("navbar", [function () {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/navbar.html',
    controller: 'NavbarController'
  }
}]);