app.directive("productview", ['DatabaseService', function (DatabaseService) {
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

app.directive("productsbar", [function () {
  return {
    restrict: "E",
    templateUrl: __dirname+'/templates/productsbar.html',
    controller: function ($scope, $element, $attrs, DatabaseService) {
      $scope.sku = "";
      DatabaseService.products.local.find ({}, function (error, result) {
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
      $scope.show_dev_tools = function () {
        require('nw.gui').Window.get().showDevTools();
      }
      $scope.reload = function () {
        require('nw.gui').Window.get().reload();
      }
      $scope.fullscreen = require('nw.gui').Window.get().isFullscreen;
      $scope.toggle_fullscreen = function () {
        require('nw.gui').Window.get().toggleFullscreen();
        $scope.fullscreen = !$scope.fullscreen;
      }
      $scope.remove_alert = function (index) {
        AlertService.remove(index);
      }
    }
  }
}]);