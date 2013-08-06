'use strict';

var __dirname = process.cwd()+'/app';
var util = require('util');

// Dirty workaround
var app = angular.module("app", ['ui.codemirror']);
app.render = function (jade_file) {
  var jade = require('jade');
  var fs = require('fs');
  return jade.compile(fs.readFileSync(__dirname+jade_file, 'utf8'));
}

app.config(function($routeProvider) {

  $routeProvider.when('/home', {
    template: app.render('/templates/home.jade'),
    controller: 'HomeController'
  });

  $routeProvider.when('/products', {
    template: app.render('/templates/products.jade'),
    controller: 'ProductController'
  });

  $routeProvider.when('/about', {
    template: app.render('/templates/about.jade')
  });

  $routeProvider.otherwise({ redirectTo: '/products' });
});

app.factory("ExecService", function() {
  return require('child_process').exec;
});

app.factory("AsyncService", function() {
  return require('async');
});

// I should use jade with a service and without the Workaround
app.factory("JadeService", function() {
  return app.render;
});


/**
 * Notify some stuff with bootstrap alert under the navbar
 */
app.factory("AlertService", function($rootScope) {
  $rootScope.alerts = [];
  return {
    /* type = success | danger | info | warning */
    push: function(title, message, type) {
      var self = this;
      var index = $rootScope.alerts.length+1;
      if (typeof type === 'undefined') {
        type = "info"
      }
      
      $rootScope.alerts.push({
        title: title,
        message: message,
        class: "alert-"+type
      });
      $rootScope.$apply();

      setTimeout(function() {
        var index = index;
        self.remove(index);
        $rootScope.$apply();
      }, 5000);
    },
    remove: function(index) {
      $rootScope.alerts.splice(index, 1);
      //$rootScope.$apply();
    },
    clear: function() {
      $rootScope.alerts = [];
      //$rootScope.$apply();
    }
  };
});

/**
 * Use nativ Notify on Linux __dirname
 */
app.factory("NotifyService", function() {
  var libnotify = require('libnotify');
  return {
    notify: function(msg, options, callback) {
      if (!options) options = {};
      options.image = __dirname + "/images/magento-logo.svg";
      libnotify.notify(msg, options, callback);
    }
  }
  return ;
});

app.factory("PriceService", function() {
  var round = function (num,decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
  }
  return {
    get_percent: function (current_price, base_price) {
      return round ((( current_price / base_price ) * 100), 2);
    },
    get_price: function (current_percent, base_price) {
      return round ((( current_percent / 100 ) * base_price), 2);
    }
  }
});

app.factory("ProductService", ['PriceService', function(PriceService) {
  var whitelist = require ('../config.json').product_view;
  return {
    whitelist: whitelist,
    normalise_product_info : function (product_info) {

      if (whitelist.weight) {
        product_info.weight = parseFloat(product_info.weight);
      } else {
        delete product_info.weight;
      }

      if (!whitelist.status) {
        delete product_info.status;
      }
      if (!whitelist.name) {
        delete product_info.name;
      }
      if (!whitelist.sku) {
        delete product_info.sku;
      }
      if (!whitelist.description) {
        delete product_info.description;
      }
      if (!whitelist.short_description) {
        delete product_info.short_description;
      }

      if (whitelist.price) {
        product_info.recommend_price = parseFloat(product_info.recommend_price);
        product_info.recommend_price_netto = parseFloat(product_info.recommend_price_netto);
        product_info.cost_price = parseFloat(product_info.cost_price);
        product_info.price = parseFloat(product_info.price);
        product_info.vwheritage_price_pound = parseFloat(product_info.vwheritage_price_pound);
      } else {
        delete product_info.recommend_price;
        delete product_info.recommend_price_netto;
        delete product_info.cost_price;
        delete product_info.price;
        delete product_info.vwheritage_price_pound;
      }

      if (whitelist.stock) {
        product_info.stock_strichweg_qty = parseFloat(product_info.stock_strichweg_qty);
        product_info.stock_vwheritage_qty = parseFloat(product_info.stock_vwheritage_qty);
      } else {
        delete product_info.stock_strichweg_qty;
        delete product_info.stock_vwheritage_qty;
        delete product_info.stock_strichweg_range;
        delete product_info.stock_strichweg_row;
      }

      if (whitelist.price && whitelist.tier_price) {
        for (var i in product_info.tier_price) {
          product_info.tier_price[i] = {
            qty: parseFloat(product_info.tier_price[i].price_qty),
            price: parseFloat(product_info.tier_price[i].price),
            website: product_info.tier_price[i].website_id,
            customer_group_id: parseFloat(product_info.tier_price[i].cust_group),
            price_percent: PriceService.get_percent (parseFloat(product_info.tier_price[i].price), product_info.price)
          }
        }
      } else {
        delete product_info.tier_price;
      }

      if (whitelist.price && whitelist.group_price) {
        for (var i in product_info.group_price) {
          product_info.group_price[i] = {
            price: parseFloat(product_info.group_price[i].price),
            website_id: parseInt(product_info.group_price[i].website_id,10),
            cust_group: parseFloat(product_info.group_price[i].cust_group),
            price_percent: PriceService.get_percent (parseFloat(product_info.group_price[i].price), product_info.price)
          }
        }
      } else {
        delete product_info.group_price;
      }

      return product_info;
    }
  }
}]);

app.factory("MagentoService", function(ExecService, AsyncService) {
  var config = require ('../config.json').magento;
  var magento = require('magento')(config);

  magento.xmlrpc.helper = {
    get_all_products_from_storeview: function (storeView, cb) {
      var filter = magento.xmlrpc.auto.set_filter.like_sku ("151");
      magento.xmlrpc.auto.catalog.product.list(filter, storeView, cb);
    }
  }
  return magento;
});

function HomeController($scope) {

}

function ProductController($scope, MagentoService, ProductService, PriceService, AlertService, NotifyService) {

  $scope.whitelist = ProductService.whitelist;

  $scope.product_info = {};

  if (ProductService.whitelist.json) {
    // applays the change on product_info to product_info_json
    $scope.$watch('product_info', function (newVal) {
      $scope.product_info_json = JSON.stringify(newVal, null, "  ");
    }, true);

    // applays the change on product_info_json (codemirror) to product_info 
    $scope.$watch('product_info_json', function (newVal) {
      $scope.product_info = JSON.parse(newVal);
    }, true);
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
      $scope.remove_alert = function (index) {
        AlertService.remove(index);
      }
    }
  }
}]);