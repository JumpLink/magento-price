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