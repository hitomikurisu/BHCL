
var templateLoader = function(device) {
    this._device = device;
    this._base_url = 'http://bhcl.jp/';
    this._template_idx = 0;
    this._callback = new Array();
};

templateLoader.prototype = {
    initialize:function() {

    },
    setCallback:function(callback) {
        this._callback[this._template_idx] = callback;
    },
    load:function(path) {
        var ref = this;
        var template_idx = this._template_idx;
        this._template_idx++;
        params = {device:this._device,path:path};
        $.ajax({
            url:'/api/?jb=api-template',
            data:params,
            dataType:'text',
            type:'POST',
            cache:false,
            success:function(res) {
                ref._callback[template_idx](res);
            },
            error:function(res) {
                if (res.responseText == 'NG') {
                alert('errror');
                    return;
                }
            }
        });
    }
};
