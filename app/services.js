jumplink.magento.factory("ExecService", function() {
  return require('child_process').exec;
});

jumplink.magento.factory("nwglobalService", function() {
  return require('nwglobal');
});

jumplink.magento.factory("AsyncService", function() {
  return require('async');
});

jumplink.magento.factory("AsyncService", function() {
  return require('async');
});

jumplink.magento.factory("DatastoreService", function() {
  return require('nedb');
});

jumplink.magento.factory("MagentoService", ['CONFIG', function(config) {
  return require('magento')(config.magento);
}]);

jumplink.magento.factory("httpService", [function() {
  return require('http');
}]);

jumplink.magento.factory("fsService", [function() {
  return require('fs');
}]);

jumplink.magento.factory("urlService", [function() {
  return require('url');
}]);

jumplink.magento.factory("mkdirpService", [function() {
  return require('mkdirp');
}]);

jumplink.magento.factory("pathService", [function() {
  return require('path');
}]);

jumplink.magento.factory("QRCodeService", [function() {
  return require('qrcode');
}]);

jumplink.magento.factory("CarouselService", function() {
 return function (setter, items, milliseconds, cb) {
    var index = 0;
    setter (items[index], function (result) { });
    if (items.length > 1) {
      var timer = setInterval(function(){
        index++;
        if (index >= items.length)
          index = 0;
        setter (items[index], function (result) { });
      }, milliseconds);
      cb (timer);
    } else {
      cb (null);
    }
  }
});

jumplink.magento.factory("ProductService", ['DebugService', 'DatabaseService', '$rootScope', function(DebugService, DatabaseService, $rootScope) {
  var resetProductList = function () {
    if (typeof($rootScope.online) != 'undefined' && $rootScope.online === true) {
      console.log("online "+$rootScope.online+": magento.find");
      DatabaseService.products.magento.find ("", function (error, results) {
        if (error) console.log(DebugService(error));
        $rootScope.products = results;
        $rootScope.$apply();
      });
    } else {
      console.log("online "+$rootScope.online+": local.find");
      DatabaseService.products.local.find ({}, function (error, results) {
        if (error) console.log(DebugService(error));
        $rootScope.products = results;
        $rootScope.$apply();
      });
    }
  };
  var setProductList = function () {
    if (typeof ($rootScope.products) == "undefined" || $rootScope.products.length<=0 ) {
      resetProductList();
    }
  }
  return {
    setProductList:setProductList,
    resetProductList:resetProductList
  }
}]);

jumplink.magento.factory("DebugService", function() {
  return function (object) { var showHidden,depth,colorize; return require('util').inspect(object, showHidden=false, depth=2, colorize=true);};
});

/**
 * Notify some stuff with bootstrap alert under the navbar
 */
jumplink.magento.factory("AlertService", function($rootScope) {
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
jumplink.magento.factory("NotifyService", function() {
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

jumplink.magento.factory("PriceService", function() {
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

jumplink.magento.factory("ConfigService", function() {
   return require ('../config.json');
});

jumplink.magento.factory("ConnectionTestService", ['DatabaseService', 'ConfigService', function(DatabaseService, config) {
  

  function checkDomainAvailable(name, callback) {
    var dns = require("dns");
    dns.resolve(name, function (err, addresses) {
      if (err || typeof(addresses) == "undefined")
        callback (false);
      else
         callback (true);
    });
  }
  return function (cb) { 
    checkDomainAvailable(config.magento.host, function (online) {
      if (online)
        if (typeof (DatabaseService.magento.core_magento) == "undefined")
          DatabaseService.magento.init(function(err) {
            if (err) cb (false);
            else DatabaseService.magento.core_magento.info(function(error, result) { if (error) cb (false); else cb (true); });
          });
        else DatabaseService.magento.core_magento.info(function(error, result) { if (error) cb (false); else cb (true); });
      else
        cb (false);
    });
  };
}]);

jumplink.magento.factory('PlaylistService', ['$rootScope', '$timeout', 'DatabaseService', 'CarouselService', 'DebugService', function($rootScope, $timeout, DatabaseService, CarouselService, DebugService) {

  // TODO use ProductController
  var generate_playlist  = function (cb) { // cb (error, result)
    DatabaseService.products.local.find ({
      status:'1',
      images: { $exists: true }
    }, cb);
  }

  var play_playlist = function (setter, length, milliseconds, cb) {
    var index = 0;
    setter (index, function (result) { });

    var Timer = setInterval(function(){
      index++;
      if (index >= length)
        index = 0;
      setter (index, function (result) { });
    }, milliseconds);

    cb (Timer);
  }

  var cancel_timer = function (timer, name) {
    if (typeof(timer) != "undefined") {
      console.log("cancel "+name+" timer ");
      console.log(DebugService(timer));
      console.log(DebugService(typeof(timer)));
      if(typeof(timer) == "number") // timer comes from?
        clearInterval(timer); // default javaScript timer
      else
        $timeout.cancel(timer); // angularjs timer
    }
  }

  var close_product_show = function () {
      $rootScope.product_show_window.close(true);
  }

  $rootScope.close_product_show = function () {
    close_product_show ();
  }

  $rootScope.open_product_show = function () {
    if(!$rootScope.product_show_window) {
      var gui = require('nw.gui');
      $rootScope.product_show_window = gui.Window.open('productshow', {
        title: "Magento Desktop",
        icon: "app/images/magento-logo.png",
        fullscreen: false,
        toolbar: false,
        frame: true,
        show: true,
        position: 'center',
        width: 800,
        height: 600
      });

      $rootScope.product_show_window.on('loaded', function () {
        this.setAlwaysOnTop(true);
        $rootScope.show_win = global.ProductShowController.$scope;

        $rootScope.set_track = function(index) {
          $rootScope.show_win.set_track(index, function (res) {
            $rootScope.$apply();
          });
        }

        $rootScope.set_tracks = function () {
          generate_playlist  (function (error, results) {
            if (error) console.log(DebugService(error));
            $rootScope.show_win.set_tracks(results, function (res) {
              //$rootScope.$apply();
            });
          });
        }
        $rootScope.set_tracks ();

        $rootScope.play = function () {
          play_playlist ($rootScope.set_track, $rootScope.show_win.playlist.list.length, 10000, function (newTrackTimer) {
            cancel_timer ($rootScope.show_win.TrackTimer, "product");
            $rootScope.show_win.TrackTimer = newTrackTimer;
          })
        }

        $rootScope.stop = function () {
          //cancel_timer ($rootScope.show_win.ImageTimer, "image"); // you need to run on show window
          cancel_timer ($rootScope.show_win.TrackTimer, "product");
          $rootScope.show_win.stop ();
        }

        $rootScope.next = function () {
          $rootScope.stop ();
          $rootScope.show_win.set_next_track(function (res) {
            //$rootScope.$apply();
          });
        }

        $rootScope.prev = function () {
          $rootScope.stop ();
          $rootScope.show_win.set_prev_track(function (res) {
            //$rootScope.$apply();
          });
        }

        $rootScope.set_specific = function (track) {
          $rootScope.stop ();
          $rootScope.show_win.set_specific_track (track, function (res) {
            $rootScope.$apply();
          });
        }

        this.on('close', function() {
          this.hide();
          $rootScope.stop();
          //delete $rootScope.product_show_window;
          this.close(true);
        });
      });
    } else {
      $rootScope.product_show_window.focus()
    }
  }
}]);