
var PcDesignController = function() {
    this._current_page = window.location.pathname;
    this.initialize();
    this._product_id = null;
    this._product_detail;
    this._interval_id1;
    this._callback;
};

PcDesignController.prototype = {
    initialize:function() {

    },
    observeJQuery:function(callback) {
         this._callback = callback;
         var ref = this;
         this._interval_id1 = setInterval(function() { ref._checkLoadedJQuery(); } , 300);
    },
    _checkLoadedJQuery:function() {
        if (typeof $ != 'undefined') {
            clearInterval(this._interval_id1);
            var ref = this;
            $(document).ready(function() { ref._callback(); });
            return;
        }
    }
};
var ua = navigator.userAgent.toUpperCase();
if(ua.indexOf('IPHONE') != -1 || (ua.indexOf('ANDROID') != -1 && ua.indexOf('MOBILE') != -1) || window.location.pathname.match(/smp/))
{
    var SmpDesignController = extends_class(PcDesignController , function() {
        this.__super__.constructor();
        this._is_detail_convert_to_mobile = 'SMP_PC';
    });

    SmpDesignController.prototype.detail = function()
    {
        this._current_page.match(/.+\/([0-9]+)$/);
        this._product_id = RegExp.$1;
        this._getProductDetail(this._product_id);
    };

    SmpDesignController.prototype._getProductDetail = function(product_id)
    {
        var params = {product_id:product_id};
        var ref = this;
        $.ajax({
            url:'/api/?jb=api-products',
            data:params,
            dataType:'json',
            cache:false,
            type:'POST',
            success:function(res) {
                ref._afterGetProductDetailProcess(res);
            },
            error:function(res) {
                alert(res.responseText);
            }
        });
    };

    SmpDesignController.prototype._convertToMobile = function()
    {
        if (!this._product_id || this._is_detail_convert_to_mobile != 'SMP_MB') return;

        //モバイルのデザイン設定取得（背景色）
        var style_tag = document.createElement('style');
        style_tag.innerHTML = this._buildDetailCss(this._product_detail);
        style_tag.type = 'text/css';
        document.body.appendChild(style_tag);
    };

    SmpDesignController.prototype._afterGetProductDetailProcess = function(res)
    {
        this._product_detail = res.result[0];
        //スマフォコメントが空の場合
        if (!this._product_detail.smartphone_comment) this._convertToMobile();
    };

    SmpDesignController.prototype._buildDetailCss = function(product_detail)
    {
        var css = '#container {' + "\r\n";
        var css2= '#container a:link {' + "\r\n";
        var css3= '#container a:visited { ' + "\r\n";
        var css4= '#container a:active {' + "\r\n";
        if (product_detail.body_is_use == 'YES')
        {
            css+= 'background-color:#' + product_detail.body_bgcolor + ' !important;' + "\r\n";
            css+= 'color:#' + product_detail.body_font_color + ' !important;' + "\r\n";
            css2+= 'color:#' + product_detail.body_link_color + ' !important;' + "\r\n";
            css3+= 'color:#' + product_detail.body_vlink_color + ' !important;' + "\r\n";
            css4+= 'color:#' + product_detail.body_alink_color + ' !important;' + "\r\n";
        }
        else {
            //
            css+= 'background-color:#ffffff !important;' + "\r\n";
            css+= 'color:#333333 !important;' + "\r\n";
            css2+= 'color:#ff9900 !important;' + "\r\n";
            css3+= 'color:#a35720 !important;' + "\r\n";
            css4+= 'color:#ff6600 !important;' + "\r\n";
        }

        css += '}' + "\r\n";
        css2+= '}' + "\r\n";
        css3+= '}' + "\r\n";
        css4+= '}' + "\r\n";

        return css + css2 + css3 + css4;
    };


    var objSmpDesignController = new SmpDesignController();
    if (window.location.pathname.match(/product\/detail/)) {
        objSmpDesignController.observeJQuery(objSmpDesignController.detail);
    }
}
