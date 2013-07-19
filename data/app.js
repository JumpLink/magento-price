var ValaObject = require("../vala_magento_node_bind.js");

//ValaObject.say_hello_to('Node.js');

var inst = new ValaObject.ValaClass();
console.log(inst.append_to_name('called from Node.js'));

function AppCtrl($scope) {
  'use strict';
  $scope.name = "world";
}