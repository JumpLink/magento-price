/*app.factory("ExecService", function() {
  return require('child_process').exec;
});

app.factory("AsyncService", function() {
  return require('async');
});*/

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

app.factory("ConfigService", function() {
   return require ('../config.json');
});

app.factory("DatabaseService", function() {
   return require('./database/db.js')("shop_de");
});

app.factory("MagentoService", function() {
/*  var config = require ('../config.json').magento;
  return require('magento')(config);*/
});