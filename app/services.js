/*jumplink.magento.factory("ExecService", function() {
  return require('child_process').exec;
});
*/



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

jumplink.magento.factory("CarouselService", function($timeout) {
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

jumplink.magento.factory("ConnectionTestService", ['DatabaseService', function(DatabaseService) {
  return function (cb) { 
    if (!DatabaseService.magento.store) {
      DatabaseService.magento.init(function(err) {
        if (err)
          cb (false);
        else {
          DatabaseService.magento.core_magento.info(function(error, result) {
            if (error)
              cb (false);
            else 
              cb (true);
          });
        }
      });
    }
  };
}]);

jumplink.magento.factory('PlaylistService', ['$rootScope', '$timeout', 'DatabaseService', 'CarouselService', 'DebugService', function($rootScope, $timeout, DatabaseService, CarouselService, DebugService) {

  var generate_playlist  = function (cb) { // cb (error, result)
    DatabaseService.products.local.find ({}, cb);
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

  $rootScope.open_product_show = function () {
    if(!$rootScope.product_show_window) {
      var gui = require('nw.gui');
      $rootScope.product_show_window = gui.Window.open('productshow', {
        title: "Magento Desktop",
        icon: "app/images/magento-logo.png",
        fullscreen: false,
        toolbar: true,
        frame: true,
        show: true,
        position: 'center',
        width: 800,
        height: 600
      });

      $rootScope.product_show_window.on('loaded', function () {
        // this.setAlwaysOnTop(true);
        $rootScope.show_win = global.ProductShowController.$scope;

        $rootScope.set_track = function(index) {
          $rootScope.show_win.set_track(index, function (res) {
            //$rootScope.$apply(); // this apply applies the $scope of product show window: $scope.show_win also
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
          play_playlist ($rootScope.set_track, $rootScope.show_win.playlist.list.length, 700, function (newTrackTimer) {
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
          delete $rootScope.product_show_window;
          this.close(true);
        });
      });
    } else {
      $rootScope.product_show_window.focus()
    }
  }
}]);