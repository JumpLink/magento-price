onload = function() {
  'use strict';
  var db = require('./database/db.js')("shop_de");
  var gui = require('nw.gui');
  var splash = gui.Window.get();
  var index;
  splash.show(); // show splash after page is ready
  var config = require ('../config.json');
  var async = require('async');
  var fs = require('fs');
  var JADE_PATHS = config.paths.jade;
  var LESS_PATHS = config.paths.less;
  var INDEX_PATH = config.paths.index;
  var WATCHED = [];
  var print = function (object) { var showHidden,depth,colorize; return require('util').inspect(object, showHidden=false, depth=2, colorize=true);}
  
  /**
   * cb (err);
   */
  var check_and_render_jade_file_and_save = function (path, filename, cb) {
    var options = {
      pretty: false,
      self: false,
      debug: false,
      compileDebug: true
    }
    var jade = require('jade');
    var splited = filename.split(".");
    var extension = splited[splited.length - 1];
    if ( extension === "jade") {
      var file = path+"/"+filename;
      watchFile (path, filename, "jade", function (err, file) {
        if (!err) console.log ("Watch "+file.type+" file: "+file.path+"/"+file.filename);
      });
      jade.renderFile(file, options, function (err, html) {
        if (err) cb (err);
        else
          fs.writeFile(path+"/"+splited[0]+".html", html, cb); 
      });
    } else cb (null); // ignore if not an jade file
  }

  /**
   * cb (err);
   */
  var render_all_jade_files_and_save = function (cb) {
    async.each(JADE_PATHS, function (path, cb) {
      async.each(fs.readdirSync(path), function (file, cb) {
        check_and_render_jade_file_and_save (path, file, cb );
      }, cb);
    }, cb);

  }

  /**
   * cb (err);
   */
  var render_less_file_and_save = function (filename, cb) {
    var less = require('less'); // https://github.com/less/less.js/pull/1253 TODO create patch and apply in makefile of this project
    var parser = new(less.Parser)({
        paths: LESS_PATHS, // Specify search paths for @import directives
        filename: filename // Specify a filename, for better error messages
    });
    var file = LESS_PATHS[0]+"/"+filename;
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) throw err;
      parser.parse(data, function (err, tree) {
        var css = tree.toCSS({ compress: true }); // Minify CSS output
        if (err) cb (err);
        fs.writeFile(LESS_PATHS[0]+"/style.css", css, cb); 
      });
    });
  }

  var jade_listener = function (path, filename) {
    console.log('Jade file changed: '+print (filename));
    check_and_render_jade_file_and_save (path, filename, function (err) {
      if(!err) {
        if(index && index.reload) {
          index.reload();
          console.log("Jade file rerendered.");
        } else {
          console.log("index not ready!");
        }
        
      }
    });
  };

  var less_listener = function (path, filename) {
    console.log('Less file changed: '+print (filename));
  };


  var watchFile = function (path, filename, type, cb) {
    var error = "Error: File is already watched";
    for (var i in WATCHED) {
      if(WATCHED[i].filename === filename && WATCHED[i].path === path) {
        cb (error);
        return error;
      }
    }
    var listener;
    switch (type) {
      case 'less':
        listener = less_listener;
      break;
      case 'jade':
        listener = jade_listener;
      break;
    }
    var file = path+"/"+filename;
    fs.watchFile(file, function (curr, prev) {
      if (curr.mtime.getTime() != prev.mtime.getTime()) {
        listener (path, filename);
      }
    });
    WATCHED.push ({filename: filename, path: path, type: type});
    cb (null, {filename: filename, path: path, type: type});
  }

  var open_index = function () {
    async.parallel([
        function(callback){
          render_all_jade_files_and_save (function (err) {
            if (err) callback (err);
            else {
              console.log("Jade files rendered!");
              callback (null);
            }
          });
        },
        function(callback){
          render_less_file_and_save ("main.less", function (err) {
            if (err) callback (err);
            else {
              console.log("Less file rendered!");
              callback (null);
            }
          });
        },
        function(callback){
          check_and_render_jade_file_and_save(INDEX_PATH, 'index.jade', callback);
        }
    ], function (err) { // all files rendered
      if (err) throw err;
      index = gui.Window.open('index.html', {
        title: "Magento Desktop",
        icon: "app/images/magento-logo.png",
        fullscreen: false,
        toolbar: false,
        frame: true,
        show: false,
        position: 'center',
        width: 800,
        height: 600
      });

      // show index and close splash after index is ready
      index.on('loaded', function() {
        index.show();
        splash.hide();
      });
      index.on('close', function() {
        index.hide(); // Pretend to be closed already
        console.log("We're closing...");
        if (index != null)
          index.close(true);
        if (splash != null)
          splash.close(true);
      });
    });
  }
  open_index ();

/*    var db = require('./database/db.js')("shop_de");
  db.products.local.update ("151-9", function (error, results) {
    for (var i in results[1])
      console.log('update: '+print (error)+" "+print (results[1][i].images));
  });*/
}