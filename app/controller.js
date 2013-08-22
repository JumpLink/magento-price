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

function ProductController($scope, DatabaseService, PriceService, NotifyService) {

  $scope.magento = DatabaseService.products.magento;

  $scope.whitelist = DatabaseService.products.whitelist;
  console.log("whitelist");
  console.log($scope.whitelist);

  function product_info_class(obj){
    var object = obj;
    var json_string = JSON.stringify(obj, null, "  ");

    this.__defineGetter__("object", function(){
      return object;
    });
   
    this.__defineSetter__("object", function(obj){
      object = obj;
    });

    this.__defineGetter__("json_string", function(){
      return JSON.stringify(object, null, "  ");
    });
   
    this.__defineSetter__("json_string", function(json_str){
      object = JSON.parse(json_str);
      //json_string = json_str;
    });
  }

  $scope.product_info = new product_info_class({});

  if ($scope.whitelist.json) {
    $scope.codemirrorOptions = {
      mode: 'javascript',
      lineWrapping: true,
      lineNumbers: true,
      theme:'ambiance'
    }
  }

  if ($scope.whitelist.tier_price) {
    $scope.tier_price_price_percent_changed = function (price_percent, i) {
      console.log('percent changed: '+price_percent+' index: '+i);
      $scope.product_info.object.tier_price[i].price = PriceService.get_price (price_percent, $scope.product_info.object.price)
    }

    $scope.tier_price_normal_changed = function (price, i) {
      console.log('normal changed: '+price+' i: '+i);
      $scope.product_info.object.tier_price[i].price_percent = PriceService.get_percent (price, $scope.product_info.object.price);
    }

    $scope.add_tierprice = function () {
      var default_percent = 100 - ($scope.product_info.object.tier_price.length + 1) * 10;
      var new_tier_price = {
        qty: ($scope.product_info.object.tier_price.length + 1) * 10,
        price: PriceService.get_price (default_percent, $scope.product_info.object.price),
        website: 0,
        customer_group_id: $scope.product_info.object.tier_price.length,
        price_percent: default_percent
      }
      $scope.product_info.object.tier_price.push(new_tier_price);
    }

    $scope.remove_tierprice = function (index) {
      $scope.product_info.object.tier_price.splice(index, 1);
    }
  }

  if ($scope.whitelist.group_price) {
    $scope.group_price_price_percent_changed = function (price_percent, i) {
      console.log('percent changed: '+price_percent+' index: '+i);
      $scope.product_info.object.group_price[i].price = PriceService.get_price (price_percent, $scope.product_info.object.price)
    }

    $scope.group_price_normal_changed = function (price, i) {
      console.log('normal changed: '+price+' i: '+i);
      $scope.product_info.object.group_price[i].price_percent = PriceService.get_percent (price, $scope.product_info.object.price);
    }

    $scope.add_groupprice = function () {
      var default_percent = 100 - ($scope.product_info.object.group_price.length + 1) * 10;
      var new_group_price = {
        qty: ($scope.product_info.object.group_price.length + 1) * 10,
        price: PriceService.get_price (default_percent, $scope.product_info.object.price),
        website_id: 0,
        cust_group: $scope.product_info.object.group_price.length,
        price_percent: default_percent
      }
      $scope.product_info.object.group_price.push(new_group_price);
    }

    $scope.remove_groupprice = function (index) {
      $scope.product_info.object.group_price.splice(index, 1);
    }
  }
}