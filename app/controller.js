jumplink.magento.controller('HomeController', ['$scope', function($scope) {

}]);

jumplink.magento.controller('NavbarController', ['$rootScope', '$scope', '$element', '$attrs', '$location', 'AlertService', 'DatabaseService', 'DebugService', 'ConnectionTestService', function($rootScope, $scope, $element, $attrs, $location, AlertService, DatabaseService, DebugService, ConnectionTestService) {
  $rootScope.online = false;
  var testConnection = function () {
    ConnectionTestService(function (online) {
      $rootScope.online = online;
      $rootScope.$apply();
    });
    var ConnectionTimer = setInterval(function(){
      ConnectionTestService(function (online) {
        $rootScope.online = online;
        $rootScope.$apply();
      });
    }, 10000);
  }

  $scope.fullscreen = require('nw.gui').Window.get().isFullscreen;

  $scope.toggle_fullscreen = function () {
    require('nw.gui').Window.get().toggleFullscreen();
    $scope.fullscreen = !$scope.fullscreen;
  }

  var navbar_default = function () {
    $scope.nav_collapse = false;
    console.log($location.path());
    $scope.show_dev_tools = function () {
      require('nw.gui').Window.get().showDevTools();
    }

    $scope.reload = function () {
      require('nw.gui').Window.get().reload();
    }

    $scope.remove_alert = function (index) {
      AlertService.remove(index);
    }
    testConnection();

    $scope.template_url = __dirname+'/templates/navbar_default.html';
  }

  var navbar_product_show = function () {
    $scope.template_url = __dirname+'/templates/navbar_product_show.html';
  }


  switch($location.path()) {
    case '/productshow':
      navbar_product_show ();
    break;
    default:
      navbar_default ();
    break;
  }

}]);

jumplink.magento.controller('CreditmemoController', ['$scope', 'DatabaseService', 'NotifyService', function($scope, DatabaseService, NotifyService) {
  DatabaseService.magento.init(function(err) {
    DatabaseService.magento.sales_order_creditmemo.list(function (error, result) {
      
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
    DatabaseService.magento.init(function(err) {
      DatabaseService.magento.sales_order_creditmemo.cancel(creditmemoIncrementId, function (error, result) {
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
    DatabaseService.magento.init(function(err) {
      DatabaseService.magento.jumplink_order_creditmemo.delete(creditmemoIncrementId, function (error, result) {
        if (error || !result) {
          NotifyService.notify("Error: Could not delete Cedit Memo: "+error, { title: 'Magento' });
        } else {
          NotifyService.notify("Success: Cedit Memo deleted", { title: 'Magento' });
        }
      });
    });
  }
}]);

jumplink.magento.controller('ProductController', ['$scope', 'DatabaseService', 'PriceService', 'NotifyService', 'PlaylistService', function($scope, DatabaseService, PriceService, NotifyService, PlaylistService) {
  $scope.magento = DatabaseService.products.magento;

  $scope.whitelist = DatabaseService.products.whitelist;

  /**
   * Class with getters and setters to have two properties with the same content,
   * one as object, and the other as json-string.
   * This class is required for codemirror.
   *  
   */
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
}]);

jumplink.magento.controller('PlaylistController', ['$rootScope', '$timeout', 'DatabaseService', 'CarouselService', 'DebugService', 'PlaylistService', function($rootScope, $timeout, DatabaseService, CarouselService, DebugService, PlaylistService) {


}]);

jumplink.magento.controller('ProductShowController', ['$scope', '$rootScope', '$timeout', 'CONFIG', 'DIRNAME', 'CarouselService', 'DebugService', function($scope, $rootScope, $timeout, config, __dirname, CarouselService, DebugService) {
  // Makes this controller available on all windows 
  global.ProductShowController = window;
  window.$scope = $scope;
  $scope.config = config;
  $scope.__dirname = __dirname;

  $scope.playlist = {
    index: 0,
    list: [],
    current: {}
  };

  $scope.$watch('playlist.current', function() {
    $scope.product_url = "http://"+$scope.config.magento.host+"/"+$scope.playlist.current.url_path;
  });

  // TODO auslagern
  var cancel_timer = function (timer, name) {
    if (typeof(timer) != "undefined") {
      if(typeof(timer) == "number") // timer comes from?
        clearInterval(timer); // default javaScript timer
      else
        $timeout.cancel(timer); // angularjs timer
    }
  }
  $scope.open_file = function (file) {
    require('nw.gui').Shell.openItem(file);
  }

  $scope.has_image = function () {
    if(typeof($scope.image) != 'undefined' && $scope.image.file.length > 0)
      return true;
    else
      return false;
  }

  $scope.set_image = function (image, cb) {
    console.log("set_image: "+image.file);
    $scope.image = image;
    $scope.$apply();
    cb ("done");
  }

  $scope.unset_image = function () {
    if (typeof($scope.image) != "undefined") {
      delete $scope.image;
      $scope.$apply();
    }
  }

  $scope.stop = function () {
    cancel_timer ($scope.ImageTimer, "image");
    //cancel_timer ($scope.TrackTimer, "product"); // you need to run on main window
  }

  $scope.set_tracks = function (tracks, cb) {
    console.log("set_track");
    $scope.playlist.list = tracks;
    cb ("done");
  }

  $scope.play_images = function () {
    if (typeof($scope.playlist.current.images) != "undefined" && $scope.playlist.current.images.length >= 1) {
      CarouselService($scope.set_image, $scope.playlist.current.images, 3333, function (newImageTimer) {
        cancel_timer ($scope.ImageTimer, "image");
        $scope.ImageTimer = newImageTimer;
      });
    } else
      $scope.unset_image ();
  }

  $scope.set_track = function (index, cb) {
    console.log("set_track");
    $scope.playlist.index = index
    $scope.playlist.current = $scope.playlist.list[$scope.playlist.index];
    $scope.play_images ();
    $scope.$apply(); // not needed because the main window run applies the scope
    cb ("done");
  }

  $scope.set_next_track = function (cb) {
    $scope.playlist.index++
    if ($scope.playlist.index >= $scope.playlist.list.length)
      $scope.playlist.index = 0;
    $scope.playlist.current = $scope.playlist.list[$scope.playlist.index];
    $scope.play_images ();
    $scope.$apply();
    cb ("done");
  }

  $scope.set_prev_track = function (cb) {
    $scope.playlist.index--
    if ($scope.playlist.index < 0)
      $scope.playlist.index = $scope.playlist.list.length - 1;
    $scope.playlist.current = $scope.playlist.list[$scope.playlist.index];
    $scope.play_images ();
    $scope.$apply();
    cb ("done");
  }

  $scope.set_specific_track = function (track, cb) {
    $scope.playlist.current = track;
    $scope.play_images ();
    $scope.$apply();
  }

}]);

jumplink.magento.controller('ConfigController', ['$scope', 'DatabaseService', 'DebugService', function($scope, DatabaseService, DebugService) {
  $scope.load_all_products = function () {
    DatabaseService.products.local.insertUpdate ("", function (error, results) {
      if (error)
        console.log ("done with error :-( "+DebugService(error));
      else
        console.log ("done with no error :-)");
    });
  }

  $scope.reload_all_products = function () {
    DatabaseService.products.local.update ("", function (error, results) {
      if (error)
        console.log ("done with error :-( "+DebugService(error));
      else
        console.log ("done with no error :-)");
    });
  }
}]);