// Take Screenshot

var save_image = function (img) {
  var base64Data = img.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  require("fs").writeFile("out.png", base64Data, 'base64', function(err) {
    console.log(err);
  });
}

var gui = require('nw.gui');
var win = gui.Window.get();

win.capturePage(function(img) {
  save_image(img);
}, 'png');

// Test Comunication between splashscreen and index

/* on splashscreen */
var EventEmitter = require('events').EventEmitter;
index.custom_events = new EventEmitter();
index.custom_events.on('test', function() {
  console.log("\n\nworks on splash\n\n");
});

/* on index */
var gui = require('nw.gui');
var win = gui.Window.get();
win.custom_events.on('test', function() {
  console.log("\n\nworks on index\n\n");
});
win.custom_events.emit("test");

// Database examples

var print = function (object) {
  console.log( require('util').inspect(object, showHidden=false, depth=2, colorize=true) );
}

db.products.update.local ("14298", function (error, results) {
  print ("done");
  print (error);
  print (results);
});
db.products.find.local ("14298", function (error, results) {
  print ("done");
  print (error);
  print (results);
});
db.reinsert.local ("151-9", function (error, results) {
  print ("done");
  print (error);
  print (results);
});
