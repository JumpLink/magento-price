'use strict';

var __dirname = process.cwd()+'/app';

if (!jumplink)
  var jumplink = {};

jumplink.magento = angular.module("jumplink.magento", ['ui.codemirror']);

jumplink.magento.constant('STORE_VIEW','shop_de');
jumplink.magento.constant('CONFIG', require ('../config.json'));
jumplink.magento.constant('DIRNAME', process.cwd()+'/app');

jumplink.magento.config(function($routeProvider) {

  $routeProvider.when('/home', {
    templateUrl: __dirname+'/templates/home.html',
    controller: 'HomeController'
  });

  $routeProvider.when('/productshowconfig', {
    templateUrl: __dirname+'/templates/productshowconfig.html',
    controller: 'PlaylistController'
  });

  $routeProvider.when('/productshow', {
    templateUrl: __dirname+'/templates/productshow.html',
    controller: 'ProductShowController'
  });

  $routeProvider.when('/products', {
    templateUrl: __dirname+'/templates/products.html',
    controller: 'ProductController'
  });

  $routeProvider.when('/about', {
    templateUrl: __dirname+'/templates/about.html'
  });

  $routeProvider.when('/sale/creditmemo', {
    templateUrl: __dirname+'/templates/sale/creditmemo.html',
    controller: 'CreditmemoController'
  });

  $routeProvider.otherwise({ redirectTo: '/products' });
});