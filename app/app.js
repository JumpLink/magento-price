'use strict';

var __dirname = process.cwd()+'/app';
var util = require('util');

// Dirty workaround
var app = angular.module("app", ['ui.codemirror']);

app.config(function($routeProvider) {

  $routeProvider.when('/home', {
    templateUrl: __dirname+'/templates/home.html',
    controller: 'HomeController'
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