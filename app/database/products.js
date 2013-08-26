module.exports = function(storeView, Datastore, config, magento_api, whitelist, async) {
  
  var db = {
    products : new Datastore({ filename: 'products.db', nodeWebkitAppName: 'magento-desktop', autoload: true })
  }

  var http = require('http')
    , fs = require('fs')
    , url = require("url")
    , mkdirp = require('mkdirp')
    , path = require('path')
    , IMAGE_PATH_LOCAL = config.paths.index.toString() + config.paths.product_image.toString();

  console.log ("IMAGE_PATH_LOCAL "+IMAGE_PATH_LOCAL);

  var print = function (object) { var showHidden,depth,colorize; return require('util').inspect(object, showHidden=false, depth=2, colorize=true);}

  var save_file = function (item, cb) {
    var url_object = url.parse(item.url);
    var target_object = url.parse(item.file);

    var request = http.get (url_object, function (res) {
      var imagedata = '';
      res.setEncoding('binary');
      res.on('data', function(chunk){
        imagedata += chunk;
      });
      res.on('end', function(){
        mkdirp(path.dirname(IMAGE_PATH_LOCAL+target_object.path), function (err) {
          if(err) cb(err);
          else
            fs.writeFile(IMAGE_PATH_LOCAL+target_object.href, imagedata, 'binary', function(err){
                cb(err);
            });
        })
      });
    });
  }

  db.products.ensureIndex({ fieldName: 'product_id', unique: true }, function (err) {
    if (err) {
      console.log (print (err));
    }
  });

  var round = function (num,decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
  }

  var get_percent = function (current_price, base_price) {
    return round ((( current_price / base_price ) * 100), 2);
  }

  var normalise = function (product_info, cb) {
    product_info.product_id = parseInt(product_info.product_id);
    if (whitelist.weight) {
      product_info.weight = parseFloat(product_info.weight);
    } else {
      delete product_info.weight;
    }

    if (!whitelist.status) {
      delete product_info.status;
    }
    if (!whitelist.name) {
      delete product_info.name;
    }
    if (!whitelist.sku) {
      delete product_info.sku;
    }
    if (!whitelist.description) {
      delete product_info.description;
    }
    if (!whitelist.short_description) {
      delete product_info.short_description;
    }

    if (whitelist.price) {
      product_info.recommend_price = parseFloat(product_info.recommend_price);
      product_info.recommend_price_netto = parseFloat(product_info.recommend_price_netto);
      product_info.cost_price = parseFloat(product_info.cost_price);
      product_info.price = parseFloat(product_info.price);
      product_info.vwheritage_price_pound = parseFloat(product_info.vwheritage_price_pound);
    } else {
      delete product_info.recommend_price;
      delete product_info.recommend_price_netto;
      delete product_info.cost_price;
      delete product_info.price;
      delete product_info.vwheritage_price_pound;
    }

    if (whitelist.stock) {
      product_info.stock_strichweg_qty = parseFloat(product_info.stock_strichweg_qty);
      product_info.stock_vwheritage_qty = parseFloat(product_info.stock_vwheritage_qty);
    } else {
      delete product_info.stock_strichweg_qty;
      delete product_info.stock_vwheritage_qty;
      delete product_info.stock_strichweg_range;
      delete product_info.stock_strichweg_row;
    }

  // TODO find bug
    if (whitelist.price && whitelist.tier_price && product_info.tier_price) {
      for (var a in product_info.tier_price) {
        product_info.tier_price[a] = {
          qty: parseFloat(product_info.tier_price[a].price_qty),
          price: parseFloat(product_info.tier_price[a].price),
          website: product_info.tier_price[a].website_id,
          customer_group_id: parseFloat(product_info.tier_price[a].cust_group),
          price_percent: get_percent (parseFloat(product_info.tier_price[a].price), product_info.price)
        }
      }
    } else {
      delete product_info.tier_price;
    }

    if (whitelist.price && whitelist.group_price) {
      for (var i in product_info.group_price) {
        product_info.group_price[i] = {
          price: parseFloat(product_info.group_price[i].price),
          website_id: parseInt(product_info.group_price[i].website_id,10),
          cust_group: parseFloat(product_info.group_price[i].cust_group),
          price_percent: get_percent (parseFloat(product_info.group_price[i].price), product_info.price)
        }
      }
    } else {
      delete product_info.group_price;
    }

    if (cb)
      cb (null, product_info);
    else
      return product_info;
  };

  var local = {};
  var magento = {};

  /**
   *  cb (error, docs)
   */
  local.find = function (query, cb) {
    db.products.find(query, cb);
  };

  /**
   *  cb (error, docs)
   */
  local.findOne = function (query, cb) {
    db.products.findOne(query, cb);
  };

  /**
   * cb (error, numRemoved)
   */
  local.remove = function (query, cb) {
    db.products.remove(query, { multi: true }, cb);
  };

  /**
   * Update one product locally.
   * Get product from Magento with product_id and save it on local databse.
   * cb (error, new_product_data)
   */
  local.updateOne = function (product_id, cb) {
    async.waterfall([
        function(callback){
          local.findOne ({ product_id: product_id}, callback)
        },
        function(old_product_data, callback){
          magento_api.xmlrpc.auto.catalog.product.info (old_product_data.product_id, storeView, function (error, product_data) {
            var new_product_data = normalise(product_data);
            callback (error, new_product_data)
          });
        },
        function(new_product_data, callback){ // get Images
          magento_api.xmlrpc.manual.catalog_product_attribute_media.list (new_product_data.product_id, storeView, function (error, images) {
            new_product_data.images = images;
            callback (error, new_product_data)
          });
        },
        function(new_product_data, callback){
          db.products.update({product_id: product_id}, new_product_data, {}, function (error, numReplaced) {
            if (numReplaced == 1)
              callback (error, new_product_data);
            else
              callback ({error1: error, error2: "numReplaced not equals 1, it is: "+numReplaced}, new_product_data);
          });
        }
    ], cb);
  };

  /**
   * Update one product locally.
   * Get product from Magento with product_id and save it on local databse.
   * cb (error, new_product_data)
   */
  local.insertOne = function (product_id, storeView, cb) {
    async.waterfall([
      function(callback){ // get info
        magento_api.xmlrpc.auto.catalog.product.info (product_id, storeView, function (error, product_data) {
          var new_product_data = normalise(product_data);
          callback (error, new_product_data)
        });
      },
      function(new_product_data, callback){ // get images
        magento_api.xmlrpc.manual.catalog_product_attribute_media.list (new_product_data.product_id, storeView, function (error, images) {
          new_product_data.images = images;
          callback (error, new_product_data)
        });
      },
      function(new_product_data, callback){ // save Images locally
        async.each(new_product_data.images, save_file, function (err) {
          callback(err, new_product_data);
        });
      },
      function(new_product_data, callback){ // save product locally
        db.products.insert(new_product_data, callback);
      }
    ], cb);
  };


  /**
   * like_sku: e.g. "151" for all products inculing 151 in his sku or "" for all products
   * cb (error, results): error or product list with new _id for db-index
   */
  local.insert = function (like_sku, storeView, cb_fin) {
    async.waterfall ([
      function (callback) {
        filter = magento_api.xmlrpc.auto.set_filter.like_sku (like_sku);
        magento_api.xmlrpc.auto.catalog.product.list(filter, storeView, callback); // callback (error, results)
      },
      function (result, callback) {
        async.map (result, function (item, cb) {
          // magento_api.xmlrpc.auto.catalog.product.info (item.product_id, storeView, cb);
          local.insertOne (item.product_id, storeView, cb);
        }, callback);
      }
    ], cb_fin);
  };

  /**
   * Update all products in the local database on your Desktop
   * cb (error, results): results[0] result of remove, results[1] result of insert_all
   */
  local.update = function (like_sku, cb) {
    async.series([
        function(callback){
          local.remove({},callback)
        },
        function(callback){
          local.insert(like_sku, storeView, callback);
        }
    ], cb);
  };

  /**
   * Update one product on Magento
   * TODO use async
   */
  magento.updateOne = function (product_info, cb) {
    var total_qty = product_info.stock_strichweg_qty + product_info.stock_vwheritage_qty;
    var is_in_stock = (total_qty > 0) ? 1 : 0;

    product_info.stock_data = {
      qty: total_qty,
      use_config_manage_stock: 1,
      is_in_stock: is_in_stock
    };

    if (whitelist.group_price) {
      magento_api.xmlrpc.manual.jumplink_product_attribute_groupprice.update(product_info.product_id, product_info.group_price, function (error, result) {
        
        if (error || result !== true) {
          // AlertService.push("Error: ", "Could not save Group Price: "+error, 'danger');
          // NotifyService.notify("Error: Could not save Group Price: "+error, { title: 'Magento' });
        } else {
          // AlertService.push("Success: ", "Group Price saved: "+result, 'success');
          // NotifyService.notify("Success: Group Price saved", { title: 'Magento' });
        }
        
      });
    }
    if (whitelist.tier_price) {
      magento_api.xmlrpc.auto.catalog.product.attribute.tier_price.update (product_info.product_id, {tier_price:product_info.tier_price}, function (error, result, sku) {
        if (error || result !== true) {
          // AlertService.push("Error: ", "Could not save Tier Price: "+error, 'danger');
          // NotifyService.notify("Error: Could not save Tier Price: "+error, { title: 'Magento' });
        } else {
          // AlertService.push("Success: ", "Tier Price saved: "+result, 'success');
          // NotifyService.notify("Success: Tier Price saved", { title: 'Magento' });
        }
        var tier_price = product_info.tier_price;
        delete product_info.tier_price;
        magento_api.xmlrpc.auto.catalog.product.update (product_info.product_id, product_info, storeView, function (error, result, sku) {
          if (error || result !== true) {
            // AlertService.push("Error: ", "Error: Could not save Product: "+error, 'danger');
            // NotifyService.notify("Error: Could not save Product: "+error, { title: 'Magento' });
          } else {
            // AlertService.push("Success: ", "Product saved: "+result, 'success');
            // NotifyService.notify("Success: Product saved", { title: 'Magento' });
          }
          product_info.tier_price = tier_price;
        });
      });
    } else {
      magento_api.xmlrpc.auto.catalog.product.update (product_info.product_id, product_info, storeView, function (error, result, sku) {
        if (error || result !== true) {
          // AlertService.push("Error: ", "Error: Could not save Product: "+error, 'danger');
          // NotifyService.notify("Error: Could not save Product: "+error, { title: 'Magento' });
        } else {
          // AlertService.push("Success: ", "Product saved: "+result, 'success');
          // NotifyService.notify("Success: Product saved", { title: 'Magento' });
        }
      });
    }
  };

  return {
    local: local,
    magento: magento,
    whitelist: whitelist
  }
}