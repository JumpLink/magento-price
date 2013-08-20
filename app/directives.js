app.directive("productview", ['DatabaseService', function (DatabaseService) {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productview.html',
    link: function ($scope, $element, $attrs) {

      $scope.load_product = function (id, storeview) {
        DatabaseService.products.local.updateOne (id, function (error, result) {
          if (error) console.log( "error with product_id is "+id+" " + require('util').inspect(error, showHidden=false, depth=2, colorize=true) );
          console.log( "error with product_id is "+id+" " + require('util').inspect(result, showHidden=false, depth=2, colorize=true) );
          console.log("product loaded");
          $scope.product_info = result;
          $scope.$apply();
        });
      }
      if( $attrs.productid && $attrs.storeview)
        this.load_product ( $attrs.productid, $attrs.storeview);
    }
  }
}]);

app.directive("productsbar", [function () {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productsbar.html',
    controller: function ($scope, $element, $attrs, DatabaseService) {
      $scope.sku = "";
      DatabaseService.products.local.find ({}, function (error, result) {
        console.log( require('util').inspect(result, showHidden=false, depth=2, colorize=true) );
        if (error) console.log(error);
        $scope.products = result;
        $scope.$apply();
      });
    }
  }
}]);

app.directive("navbar", [function () {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/navbar.html',
    controller: function ($scope, $element, $attrs, AlertService) {
      $scope.nav_collapse = false;
      $scope.remove_alert = function (index) {
        AlertService.remove(index);
      }
    }
  }
}]);