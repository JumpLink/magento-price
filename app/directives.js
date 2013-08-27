jumplink.magento.directive("productview", ['DatabaseService', function (DatabaseService) {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productview.html',
    link: function ($scope, $element, $attrs) {

      $scope.load_product = function (id, storeview) {
        DatabaseService.products.local.updateOne (id, function (error, result) {
          if (error) console.log( "error with product_id is "+id+" " + require('util').inspect(error, showHidden=false, depth=2, colorize=true) );
          $scope.product_info.object = result;
          $scope.$apply();
        });
      }
      if( $attrs.productid && $attrs.storeview)
        this.load_product ( $attrs.productid, $attrs.storeview);
    }
  }
}]);

jumplink.magento.directive("productsbar", [function () {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productsbar.html',
    controller: function ($scope, $element, $attrs, DatabaseService, ConfigService) {
      $scope.sku = "";
      $scope.paths = {
        product_image : __dirname + ConfigService.paths.product_image
      }

      $scope.open_file = function (file) {
        require('nw.gui').Shell.openItem(file);
      }

      DatabaseService.products.local.find ({}, function (error, result) {
        if (error) console.log(error);
        $scope.products = result;
        $scope.$apply();
      });
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