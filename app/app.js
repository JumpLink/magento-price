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

  $routeProvider.when('/sale/creditmemo', {
    template: app.render('/templates/sale/creditmemo.jade'),
    controller: 'CreditmemoController'
  });

  $routeProvider.otherwise({ redirectTo: '/products' });
});