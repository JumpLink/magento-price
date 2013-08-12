app.directive("productview", ['MagentoService', 'JadeService', 'ProductService', function (MagentoService, JadeService, ProductService) {
  return {
    restrict: "E",
    template: JadeService('/templates/productview.jade'),
    link: function ($scope, $element, $attrs) {

      $scope.load_product = function (id, storeview) {
        MagentoService.xmlrpc.auto.catalog.product.info(id, storeview, function (error, result) {
          if (error) console.log(error);
          else {
            $scope.product_info = ProductService.normalise_product_info (result);
            //$scope.product_info_json = JSON.stringify($scope.product_info, null, "  ");
            $scope.$apply();
          }
        });
      }
      if( $attrs.productid && $attrs.storeview)
        this.load_product ( $attrs.productid, $attrs.storeview);
    }
  }
}]);

app.directive("productsbar", ['JadeService', function (JadeService) {
  return {
    restrict: "E",
    template: JadeService('/templates/productsbar.jade'),
    controller: function ($scope, $element, $attrs, MagentoService) {
      $scope.sku = "";
      MagentoService.xmlrpc.helper.get_all_products_from_storeview ($attrs.storeview, function (error, result) {
        if (error) console.log(error);
        $scope.products = result;
        $scope.$apply();
      });
    }
  }
}]);

app.directive("navbar", ['JadeService', function (JadeService) {
  return {
    restrict: "E",
    template: JadeService('/templates/navbar.jade'),
    controller: function ($scope, $element, $attrs, AlertService) {
      $scope.nav_collapse = false;
      $scope.remove_alert = function (index) {
        AlertService.remove(index);
      }
    }
  }
}]);