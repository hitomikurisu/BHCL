
var first_loaded_best_products_flg = false;
var loadBestProducts = new Object();

loadBestProducts._noimage = '/misc/blank.gif';
loadBestProducts._image_width = 156;
loadBestProducts._image_height = 156;
loadBestProducts._tile_group_id = 'tile_group';
loadBestProducts._source_child_id = 'source_child';
loadBestProducts._tile_scroller_options = new Object();
loadBestProducts._name_class = 'tile_product_name';
loadBestProducts._price_class = 'tile_product_price';
loadBestProducts._success_callback = function() {};
loadBestProducts._loaded_flg = false;
loadBestProducts.initialize = function() {};
loadBestProducts.setImageWidth = function(width) {
    this._image_width = width;
};

loadBestProducts.setImageHeight = function(height) {
    this._image_height = height;
};

loadBestProducts.setTileGroupId = function(tile_group_id) {
    this._tile_group_id = tile_group_id;
};

loadBestProducts.setSourceChild = function(dom_id) {
    this._source_child_id = dom_id;
};

loadBestProducts.setTileScrollerOptions = function(options) {
    this._tile_scroller_options = options;
};

loadBestProducts.setProductNameClassName = function(class_name) {
    this._name_class = class_name;
};

loadBestProducts.setProductPriceClassName = function(class_name) {
    this._price_class = class_name;
};

loadBestProducts.setSuccessCallback = function(func) {
    this._success_callback = func;
};

loadBestProducts.load = function(group_id) {
      var api_url = '/api/?jb=api-best_products';
      var params = {group_id:group_id};
      this._request(api_url , params , this);
};

loadBestProducts._request = function(api_url , params , ref) {
     if (ref._loaded_flg == true) return;
     $.ajax({
          url:api_url,
          data:params,
          type:'POST',
          dataType:'json',
          cache:false,
          complete:function(res) { ref._success(res); },
          error:function (res) { ref._error(res); }
      });

}

loadBestProducts._success = function(res) {
      //var res = JSON.parse(res.responseText);
      eval('res = ' + res.responseText);

      this._loaded_flg = true;
      var best_products = res.result;
      for (idx in best_products) {
         var best_product = best_products[idx];
         if (!best_product.main_list_image || typeof best_product.main_list_image == 'undefined') {
             best_product.main_list_image = this._noimage;
         }
         //copy dom
         var c_tile = $('#' + this._source_child_id).clone();
         c_tile.children('a').attr('href' , 'http://bhcl.jp/product/detail/' + best_product.product_id);
         c_tile.children('a').children('img').attr('src' , 'http://bhcl.jp/resize_image.php?image=' + best_product.main_list_image + '&width=' + this._image_width + '&height=' + this._image_height);
         c_tile.children('.' + this._name_class).text(best_product.name);
         //c_tile.children('.' + this._price_class).text(this._numberFormat(best_product.price02_tax_min));

         // added 2014/07/23.
         if (location.hostname == "firstme.jp"){
         	// price02 not include tax value
           c_tile.children('.' + this._price_class).text(this._numberFormat(best_product.price02_min));
         }else{
           c_tile.children('.' + this._price_class).text(this._numberFormat(best_product.price02_tax_min));
         }
         $('#' + this._tile_group_id).append(c_tile.attr('id' , this._tile_group_id + '_' + idx));
         //console.log(c_tile);
      }
      //remove copy source
      $('#' + this._source_child_id).remove();

     if (this._success_callback) {
         this._success_callback();
     }
};

loadBestProducts._error = function(res) {
    alert('おすすめ商品の読み込みに失敗しました。');
    return;
};

loadBestProducts._numberFormat = function(price) {
    var k = 1;
    var formated_price = '';
    var price = price.toString();

    for (var i = price.length; i > 0; i--) {
        formated_price = price.charAt(i - 1) + formated_price;
        if (price.length > 3 && (k / 3) == 1) {
            formated_price = ',' + formated_price;
        }
        k++;
    }

    return '\\' + formated_price;
};
