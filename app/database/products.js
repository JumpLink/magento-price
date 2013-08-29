jumplink.magento.factory("DatabaseProductService",
  ['STORE_VIEW', 'CONFIG', 'DatastoreService', 'MagentoService', 'AsyncService', 'DebugService', 'nwglobalService', 'httpService', 'fsService', 'urlService', 'mkdirpService', 'pathService',
  function(storeView, config, Datastore, magento_api, async, DebugService, nwglobal, http, fs, url, mkdirp, path) {
  
  var whitelist = config.product_view;
  var IMAGE_PATH_LOCAL = config.paths.index.toString() + config.paths.product_image.toString();
  
  var db = {
    products : new Datastore({ filename: 'products.db', nodeWebkitAppName: 'magento-desktop', autoload: true })
  }

  fs.exists("./app/images/products/1/7/170244_01_large.jpg", function(exists) {
    if (exists)
      console.log("File already exists, do not save file again! ");
    else
      console.log("File already exists, do not save file again! ");
  });


  var save_file = function (item, cb) {
    var url_object = url.parse(item.url);
    var target_object = url.parse(item.file);
    var complete_target_filename = IMAGE_PATH_LOCAL+target_object.href;

    fs.exists(complete_target_filename, function(exists) {
      if (exists) {
        console.log("File already exists, do not save file again! "+complete_target_filename);
        cb (null);
      } else {
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
                fs.writeFile(complete_target_filename, imagedata, 'binary', function(err){
                    console.log("File saved! "+complete_target_filename);
                    cb(err);
                });
            })
          });
        });
      }
    });
  }

  db.products.ensureIndex({ fieldName: 'product_id', unique: true }, function (err) {
    if (err) {
      console.log (DebugService (err));
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
   * cb (error, docs)
   * Note: This function returns all relevant informations like skus, names, and descriptions.
   */
  local.find = function (query, cb) {
    db.products.find(query, cb);
  };

  /**
   * cb (error, results)
   * Note: This function returns just basic informations like skus and names, but not detailed stuff like descriptions
   */
  magento.find = function (like_sku, cb) {
    filter = magento_api.xmlrpc.auto.set_filter.like_sku (like_sku);
    magento_api.xmlrpc.auto.catalog.product.list(filter, storeView, cb); // callback (error, results)
  };

  /**
   * cb (error, docs)
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
   * 
   */
  local.updateOne = function (product_id, storeView, cb) {
    async.waterfall ( nwglobal.Array(
        function (callback) {
          magento_api.xmlrpc.auto.catalog.product.info (product_id, storeView, function (error, product_data) {
            var new_product_data = normalise(product_data);
            callback (error, new_product_data)
          });
        },
        function (new_product_data, callback) { // get Images
          magento_api.xmlrpc.manual.catalog_product_attribute_media.list (new_product_data.product_id, storeView, function (error, images) {
            new_product_data.images = images;
            callback (error, new_product_data)
          });
        },
        function (new_product_data, callback) { // save Images locally
          async.each(new_product_data.images, save_file, function (err) {
            callback(err, new_product_data);
          });
        },
        function (new_product_data, callback) {
          db.products.update({product_id: product_id}, new_product_data, {}, function (error, numReplaced) {
            if (numReplaced == 1)
              callback (error, new_product_data);
            else
              callback ({error1: error, error2: "numReplaced not equals 1, it is: "+numReplaced}, new_product_data);
          });
        }
    ), cb);
  };

  /**
   * Update one product locally.
   * Get product from Magento with product_id and save it on local databse.
   * cb (error, new_product_data)
   */
  local.insertOne = function (product_id, storeView, cb) {
    async.waterfall ( nwglobal.Array(
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
    ), cb);
  };

  /**
   * If product_id exists in local database, product will updated, otherwise it will be inserted.
   * cb (error, new_product_data)
   */
  local.insertUpdateOne = function (product_id, storeView, cb) {
    local.findOne ({ product_id: product_id}, function (err, doc) {
      if (err || doc == null)
        local.insertOne (product_id, storeView, cb);
      else 
        local.updateOne (product_id, storeView, cb);
    });
  };


  /**
   * like_sku: e.g. "151" for all products including 151 in his sku or "" for all products
   * cb (error, results): error or product list with new _id for db-index
   */
  local.insert = function (like_sku, storeView, cb_fin) {
    async.waterfall ( nwglobal.Array(
      function (callback) {
        filter = magento_api.xmlrpc.auto.set_filter.like_sku (like_sku);
        magento_api.xmlrpc.auto.catalog.product.list(filter, storeView, callback); // callback (error, results)
      },
      function (result, callback) {
        async.map (result, function (item, cb) {
          local.insertOne (item.product_id, storeView, cb);
        }, callback);
      }
    ), cb_fin);
  };

  /**
   * REMOVES all products and reinsert all products in the local database on your Desktop.
   * If you do not want to remove all existing local products, you should use local.insertUpdate
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
   * Like local.insertUpdateOne but for all products existing in Magento
   * cb (error, result)
   */
  local.insertUpdate = function (like_sku, cb_fin) {
    async.waterfall ( nwglobal.Array(
      function (callback) {
        filter = magento_api.xmlrpc.auto.set_filter.like_sku (like_sku);
        magento_api.xmlrpc.auto.catalog.product.list(filter, storeView, callback); // callback (error, results)
      },
      function (result, callback) {
        async.map (result, function (item, cb) {
          local.insertUpdateOne (item.product_id, storeView, cb);
        }, callback);
      }
    ), cb_fin);
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
}]);