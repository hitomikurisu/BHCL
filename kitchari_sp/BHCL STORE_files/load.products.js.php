var productListHandler = function() {
    this._next_page = null;
    this._max_count = null;
    this._base_url  = null;
    this._order     = null;
    this._loading_btn = null;
    this._tax_rule = 3;
    this._tax      = 8;
    this._objTimesaleses = new Array();
    this._timesales_idx = 0;
    this._default_timesales_layout = '<span style="font-size:10px">タイムセール終了まで</span><br /><span style="font-bold:bold"><b>{dn}{dl}と{hnn}時間{mnn}分{snn}秒</b> {desc}</span>';
    this._default_msg_before_start = '{start_date}からタイムセール';
    this._default_msg_after_stoped = 'タイムセールは終了しました。';
    this._default_max_count = 10;
    this._class1 = 'listphoto';
    this._class2 = 'listrightblock';
    this._name = null;
    if (window.location.host.match(/.*(tyi|ss).*/)) this._tyijp_flg = true;

};

productListHandler.prototype = {
    initialize:function() {
        this._setBtnText();
        var objTemplateLoader = new templateLoader(1);
	    var ref = this;
	    objTemplateLoader.setCallback(function(res) { ref._setTimesalesTemplate('layout' , res); });
	    objTemplateLoader.load('timesales/countdown_layout');
	    objTemplateLoader.setCallback(function(res) { ref._setTimesalesTemplate('before' , res); });
	    objTemplateLoader.load('timesales/msg_before_start')
	    objTemplateLoader.setCallback(function(res) { ref._setTimesalesTemplate('after' , res); });
	    objTemplateLoader.load('timesales/msg_after_stoped');
	    objTemplateLoader.setCallback(function(res) { ref._setPriceFormat(res); });
	    objTemplateLoader.load('price_format');

	    this._checkLineMax();
    },
    setName:function(name){
    	this._name = name;
    },
    setPage:function(page) {
        this._next_page = page + 1;
    },
    setMaxCountPerPage:function(max) {
        this._max_count = max ? max : this._default_max_count;
    },
    setBaseUrl:function(base_url) {
        this._base_url = base_url;
    },
    setOrder:function(order) {
        this._order = order;
    },
    setMode:function(mode) {
        this._mode = mode;
    },
    setPhotoAreaClass:function(className) {
        this._class1 = className ? className : this._class1;
    },
    setListRightBlockClass:function(className) {
        this._class2 = className ? className : this._class2;
    },
    setLoadingBtn:function(btn) {
        this._loading_btn = btn;
        var ref = this;
        this._loading_btn.unbind('click');

        if ($('.product_list_div').size() < this._max_count) {
           this._loading_btn.remove();
        }
        else {
            this._loading_btn.bind('click' , function(e) {
                ref.load();
            });
        }
    },
    load:function() {
        this._insertLoading();

        var params = {
            mode:this._mode,
            pageno:this._next_page,
            name:this._name,
            orderby:this._order,
            disp_number:this._max_count,
            ajax:1
        };

        var ref = this;
        $.ajax({
            url:this._base_url,
            data:params,
            dataType:'json',
            type:'POST',
            cache:false,
            success:function(res) { ref._callback(res); },
            error:function(res) {
                alert(res.responseText);
            }
        });
    },
    _insertLoading:function() {
         this._loading_btn.html($('<img style="position:relative;left:45%" id="loading_product_img" src="/img/ajax/loading2.gif"/>'));
    },
    _callback:function(res) {
        var productList = res.result;
        var linemax     = res.linemax;
        this._response_count = productList.length;
        var i = 0;
        var div_type = 0;
        var last_elm_class = '';
        for (idx in productList) {
            var product = productList[idx];
            var div = $('.product_list_div:last').clone();

            if (this._tyijp_flg == true)
            {
                div_type = (idx + 1) % 3;
                div.removeClass('listarea01').removeClass('listarea02');
                if (div_type == 0) {
                    div.addClass('listarea02');
                }
                else {
                    div.addClass('listarea01');
                }

                div.children('ul').children('li').children('.' + this._class1).children('a').attr('href' , '/smp/product/detail/' + product['product_id']);
                div.children('ul').children('li').children('.' + this._class1).children('a').children('img').attr('src' , '/upload/save_image//' + product['main_list_image']);
                div.children('ul').children('li').children('.' + this._class2).children('a').attr('href' , '/smp/product/detail/' + product['product_id']);

                if ((product['name'].length * 2) > 41) {
                    product['name'] = product['name'].substring(0 , 20) + '...';
                }

                div.children('ul').children('li').children('.' + this._class2).children('a').children('h3').text(product['name']);
                if (div.children('ul').children('li').children('.' + this._class2).children('a').children('.count_down_box').is('.count_down_box')) {
                    div.children('ul').children('li').children('.' + this._class2).children('a').children('.count_down_box').attr('id' , 'count_down_' + product['product_id']);
                }
                else {
                    div.children('ul').children('li').children('.' + this._class2).children('a').children('h3').after($('<div id="count_down_' + product['product_id'] + '">'));
                }
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.timesales_before_start').remove();
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.timesales_ended').remove();
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.listcomment').text(product['smartphone_list_comment']);
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.pricebox').children('.or_price').html(this._getPriceText(product));
                if (product['timesales_flg'] == 1) {
                    this._setTimesales(product);
                }

                div.children('ul').children('li').children('.' + this._class2).children('a').children('.pricebox').children('.soldout').remove();
                if (product['stock_max'] <= 0 && product['stock_unlimited_max'] !=1) {
                    div.children('ul').children('li').children('.' + this._class2).children('a').children('.pricebox').children('.or_price').before($('<span class="soldout">').text('[' + '品切れ中' + ']'));
                }
            }
            else {
                div.children('ul').children('li').children('.' + this._class1).children('a').attr('href' , '/smp/product/detail/' + product['product_id']);
                div.children('ul').children('li').children('.' + this._class1).children('a').children('img').attr('src' , '/upload/save_image//' + product['main_list_image']);
                div.children('ul').children('li').children('.' + this._class2).children('a').attr('href' , '/smp/product/detail/' + product['product_id']);
                div.children('ul').children('li').children('.' + this._class2).children('a').children('h3').text(product['name']);
                if (div.children('ul').children('li').children('.' + this._class2).children('a').children('.count_down_box').is('.count_down_box')) {
                    div.children('ul').children('li').children('.' + this._class2).children('a').children('.count_down_box').attr('id' , 'count_down_' + product['product_id']);
                }
                else {
                    div.children('ul').children('li').children('.' + this._class2).children('a').children('h3').after($('<div id="count_down_' + product['product_id'] + '">'));
                }
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.timesales_before_start').remove();
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.timesales_ended').remove();
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.listcomment').text(product['smartphone_list_comment']);
                div.children('ul').children('li').children('.' + this._class2).children('a').children('.pricebox').children('.price1').html(this._getPriceText(product));
                if (product['timesales_flg'] == 1) {
                    this._setTimesales(product);
                }

                if (product['stock_max'] > 0 || product['stock_unlimited_max'] ==1) {
                    div.children('ul').children('li').children('.' + this._class2).children('a').children('.soldout').remove();
                }
            }
            $('.product_list_div:last').after(div);
            i++;
        }
        this._loading_btn.children('img').remove();
        var remain_count = (linemax - (this._next_page * this._max_count));
        var next_count   = remain_count < this._max_count ? remain_count : this._max_count;

        if (remain_count <= 0) {
            this._loading_btn.remove();
        }
        else {
            //this._loading_btn.text('さらに' + next_count + '件読み込む');
            this._setBtnText(next_count);
        }
        this.setPage(this._next_page);
    },
    _setTimesales:function(product) {
        var expire = new Date(product['timesales_end_date'].replace(/-/g , '/'));
        if (typeof this._objTimeSaleses == 'undefined') {
            this._objTimeSaleses = new Array();
        }
        try
        {
            var objTimeSaleses = new TimeSales(product['product_id'] , product['timesales_start_date'], product['timesales_end_date']);
            objTimeSaleses.setLayout(this._timesales_layout);
            objTimeSaleses.setMsgBeforeStart('<div class="timesales_before_start">' + this._timesales_before_msg + '</div>');
            objTimeSaleses.setMsgAfterStoped('<div class="timesales_ended" >' + this._timesales_after_msg + '</div>');
            objTimeSaleses.countdown();
            objTimeSaleses.addOnExpiry(function() {
            });
            this._objTimeSaleses.push(objTimeSaleses);
            this._timesales_idx++;
        }
        catch (e) {}
    },
    _setTimesalesTemplate:function(type , res) {
        switch (type) {
            case 'layout':
                this._timesales_layout = !res ? this._default_timesales_layout : res;
                break;
            case 'before':
                this._timesales_before_msg = !res ? this._default_msg_before_start : res;
                break;
            case 'after':
                this._timesales_after_msg = !res ? this._default_msg_after_stoped : res;
                break;
        }
    },
    _getPriceText:function(product) {
        var price_max = product['price02_max'];
        var price_min = product['price02_min'];
        if (price_max == price_min) {
             return this._numberFormat(this._preTax(price_min , this._tax , this._tax_rule));
        }
        else {
             var str = this._numberFormat(this._preTax(price_min , this._tax , this._tax_rule));
             str += "～";
             str += this._numberFormat(this._preTax(price_max , this._tax , this._tax_rule));
             return str;
        }
    },
    _preTax:function(price ,tax , tax_rule) {
        var real_tax = tax / 100;
        ret = price * (1 + real_tax);
        switch(tax_rule) {
        // 四捨五入
        case 1:
            ret = Math.round(ret);
            break;
        // 切り捨て
        case 2:
            ret = Math.floor(ret);
            break;
        // 切り上げ
        case 3:
            ret = Math.ceil(ret);
            break;
        // デフォルト:切り上げ
        default:
            ret = Math.ceil(ret);
            break;
        }
        return ret;
    },
    _numberFormat:function(price) {
        var k = 1;
        var formated_price = '';
        price = price.toString();

        for (var i = price.length; i > 0; i--) {
            formated_price = price.charAt(i - 1) + formated_price;
            if (price.length > 3 && (k / 3) == 1) {
                formated_price = ',' + formated_price;
            }
            k++;
        }

        return this._price_format.replace('{price}' , formated_price);
    },
    _setBtnText:function(next_count) {
         var count = next_count ? next_count : this._max_count;
         this._loading_btn.html($('<div style="position:relative;top:30%;font-weight:bold;text-align:center">').text('さらに' + count + '件読む'));
    },
    _checkLineMax:function() {
        var params = {
            mode:this._mode,
            pageno:1,
            orderby:'',
            disp_number:this._max_count,
            ajax:1
        };
        ref = this;
        $.ajax({
            url:this._base_url,
            data:params,
            dataType:'json',
            type:'POST',
            cache:false,
            success:function(res) {
                if (res.linemax <= ref._max_count) {
                    ref._loading_btn.remove();
                }
                else if (parseInt(res.linemax / ref._max_count) == 1) {
                    ref._setBtnText(res.linemax - ref._max_count);
                }
            },
            error:function(res) {
                //alert(res.responseText);
            }
        });
    },
    _setPriceFormat:function(res) {
         this._price_format = res;
    }
}
var objProductListHandler = new productListHandler();
$(document).ready(function() {
    if ($('.loading_product_btn').size() > 0) {
        objProductListHandler.setPage(1);
        objProductListHandler.setPhotoAreaClass('');
        objProductListHandler.setListRightBlockClass('');
        objProductListHandler.setLoadingBtn($('.loading_product_btn'));
        objProductListHandler.setMaxCountPerPage(10);
        objProductListHandler.setOrder($('input[name="orderby"]').val());
        objProductListHandler.setMode($('input[name="mode"]').val());
        objProductListHandler.setBaseUrl(window.location.pathname);
        objProductListHandler.setName($('input[name="name"]').val());// added  2014/07/25.
        objProductListHandler.initialize();
        objProductListHandler.setLoadingBtn($('.loading_product_btn'));
     }
});
