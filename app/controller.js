function HomeController($scope) {

}

function CreditmemoController($scope, MagentoService, NotifyService) {
  MagentoService.xmlrpc.manual.init(function(err) {
    MagentoService.xmlrpc.manual.sales_order_creditmemo.list(function (error, result) {
      
      if (error || !result) {
        // AlertService.push("Error: ", "Could not save Group Price: "+error, 'danger');
        //NotifyService.notify("Error: Could not save Group Price: "+error, { title: 'Magento' });
      } else {
        // AlertService.push("Success: ", "Group Price saved: "+result, 'success');
        //NotifyService.notify("Success: Group Price saved", { title: 'Magento' });
        $scope.sales_order_creditmemos = result;
        $scope.$apply();
      }
      
    });
  });

  $scope.cancel_creditmemo = function (creditmemoIncrementId) {
    console.log("cancel_creditmemo");
    MagentoService.xmlrpc.manual.init(function(err) {
      MagentoService.xmlrpc.manual.sales_order_creditmemo.cancel(creditmemoIncrementId, function (error, result) {
        if (error || !result) {
          NotifyService.notify("Error: Could not cancel Cedit Memo: "+error, { title: 'Magento' });
        } else {
          NotifyService.notify("Success: Cedit Memo canceled", { title: 'Magento' });
        }
      });
    });
  }

  $scope.delete_creditmemo = function (creditmemoIncrementId) {
    console.log("delete_creditmemo");
    MagentoService.xmlrpc.manual.init(function(err) {
      MagentoService.xmlrpc.manual.jumplink_order_creditmemo.delete(creditmemoIncrementId, function (error, result) {
        if (error || !result) {
          NotifyService.notify("Error: Could not delete Cedit Memo: "+error, { title: 'Magento' });
        } else {
          NotifyService.notify("Success: Cedit Memo deleted", { title: 'Magento' });
        }
      });
    });
  }
}

function ProductController($scope, MagentoService, ProductService, PriceService, NotifyService) {

  $scope.whitelist = ProductService.whitelist;

  $scope.product_info = {};

  // FIXME
  if (ProductService.whitelist.json) {
    $scope.product_info_json = "";
    // applays the change on product_info to product_info_json
    $scope.$watch('product_info', function (newVal) {
      console.log("data changed!");
      $scope.product_info_json = JSON.stringify(newVal, null, "  ");
      $scope.json_refresh = true;
    }, true);

    // applays the change on product_info_json (codemirror) to product_info 
    $scope.$watch('product_info_json', function (newVal) {
      console.log("json changed!");
      $scope.product_info = ProductService.normalise_product_info(JSON.parse(newVal));
    }, true);

    $scope.reParseJson = function() {
      console.log("reParseJson");
      $scope.product_info = ProductService.normalise_product_info(JSON.parse($scope.product_info_json));
    }
  }

  if (ProductService.whitelist.tier_price) {
    $scope.tier_price_price_percent_changed = function (price_percent, i) {
      console.log('percent changed: '+price_percent+' index: '+i);
      $scope.product_info.tier_price[i].price = PriceService.get_price (price_percent, $scope.product_info.price)
    }

    $scope.tier_price_normal_changed = function (price, i) {
      console.log('normal changed: '+price+' i: '+i);
      $scope.product_info.tier_price[i].price_percent = PriceService.get_percent (price, $scope.product_info.price);
    }

    $scope.add_tierprice = function () {
      var default_percent = 100 - ($scope.product_info.tier_price.length + 1) * 10;
      var new_tier_price = {
        qty: ($scope.product_info.tier_price.length + 1) * 10,
        price: PriceService.get_price (default_percent, $scope.product_info.price),
        website: 0,
        customer_group_id: $scope.product_info.tier_price.length,
        price_percent: default_percent
      }
      $scope.product_info.tier_price.push(new_tier_price);
    }

    $scope.remove_tierprice = function (index) {
      $scope.product_info.tier_price.splice(index, 1);
    }
  }

  if (ProductService.whitelist.group_price) {
    $scope.group_price_price_percent_changed = function (price_percent, i) {
      console.log('percent changed: '+price_percent+' index: '+i);
      $scope.product_info.group_price[i].price = PriceService.get_price (price_percent, $scope.product_info.price)
    }

    $scope.group_price_normal_changed = function (price, i) {
      console.log('normal changed: '+price+' i: '+i);
      $scope.product_info.group_price[i].price_percent = PriceService.get_percent (price, $scope.product_info.price);
    }

    $scope.add_groupprice = function () {
      var default_percent = 100 - ($scope.product_info.group_price.length + 1) * 10;
      var new_group_price = {
        qty: ($scope.product_info.group_price.length + 1) * 10,
        price: PriceService.get_price (default_percent, $scope.product_info.price),
        website_id: 0,
        cust_group: $scope.product_info.group_price.length,
        price_percent: default_percent
      }
      $scope.product_info.group_price.push(new_group_price);
    }

    $scope.remove_groupprice = function (index) {
      $scope.product_info.group_price.splice(index, 1);
    }
  }

  $scope.save = function() {
    var storeView = "shop_de"; //TODO

    var total_qty = $scope.product_info.stock_strichweg_qty + $scope.product_info.stock_vwheritage_qty;
    var is_in_stock = (total_qty > 0) ? 1 : 0;

    $scope.product_info.stock_data = {
      qty: total_qty,
      use_config_manage_stock: 1,
      is_in_stock: is_in_stock
    };

    MagentoService.xmlrpc.manual.init(function(err) {
      if (ProductService.whitelist.group_price) {
        MagentoService.xmlrpc.manual.jumplink_product_attribute_groupprice.update($scope.product_info.product_id, $scope.product_info.group_price, function (error, result) {
          
          if (error || result !== true) {
            // AlertService.push("Error: ", "Could not save Group Price: "+error, 'danger');
            NotifyService.notify("Error: Could not save Group Price: "+error, { title: 'Magento' });
          } else {
            // AlertService.push("Success: ", "Group Price saved: "+result, 'success');
            NotifyService.notify("Success: Group Price saved", { title: 'Magento' });
          }
          
        });
      }
      if (ProductService.whitelist.tier_price) {
        MagentoService.xmlrpc.auto.catalog.product.attribute.tier_price.update ($scope.product_info.product_id, {tier_price:$scope.product_info.tier_price}, function (error, result, sku) {
          if (error || result !== true) {
            // AlertService.push("Error: ", "Could not save Tier Price: "+error, 'danger');
            NotifyService.notify("Error: Could not save Tier Price: "+error, { title: 'Magento' });
          } else {
            // AlertService.push("Success: ", "Tier Price saved: "+result, 'success');
            NotifyService.notify("Success: Tier Price saved", { title: 'Magento' });
          }
          var tier_price = $scope.product_info.tier_price;
          delete $scope.product_info.tier_price;
          MagentoService.xmlrpc.auto.catalog.product.update ($scope.product_info.product_id, $scope.product_info, storeView, function (error, result, sku) {
            if (error || result !== true) {
              // AlertService.push("Error: ", "Error: Could not save Product: "+error, 'danger');
              NotifyService.notify("Error: Could not save Product: "+error, { title: 'Magento' });
            } else {
              // AlertService.push("Success: ", "Product saved: "+result, 'success');
              NotifyService.notify("Success: Product saved", { title: 'Magento' });
            }
            $scope.product_info.tier_price = tier_price;
          });
        });
      } else {
        MagentoService.xmlrpc.auto.catalog.product.update ($scope.product_info.product_id, $scope.product_info, storeView, function (error, result, sku) {
          if (error || result !== true) {
            // AlertService.push("Error: ", "Error: Could not save Product: "+error, 'danger');
            NotifyService.notify("Error: Could not save Product: "+error, { title: 'Magento' });
          } else {
            // AlertService.push("Success: ", "Product saved: "+result, 'success');
            NotifyService.notify("Success: Product saved", { title: 'Magento' });
          }
        });
      }
    });
  }
}