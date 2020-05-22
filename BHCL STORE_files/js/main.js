/*@cc_on
try
{ 
	//ie9でエラーが出るのでtry-catchで無理やりスルー
	var doc = document;eval('var document = doc');
	var url = location.href;
}
catch (e) {}
@*/


function PrShowHide(targetID) {
	if( document.getElementById(targetID)) {
		if( document.getElementById(targetID).style.display == "none") {
			document.getElementById(targetID).style.display = "block";
		} else {
			document.getElementById(targetID).style.display = "none";
		}
	}
}

var JSLoader = function() {
	this._queue = new Array();
	this._state = new Array();
	this._current_idx = 0;
	this._callbacks = new Array();
	this.initialize();
	this._interval = 300;
	this._intervalID = null;
	this._timeoutID  = null;
    this._all_loaded = false;
    this._delay = 700;
}

JSLoader.prototype = {
    initialize:function() {
        var ref = this;
        //スマートフォンでタグのonloadが使用不可であることへの対応
        //delay秒後に読み込まれているかどうか監視を行う
        this._timeoutID = setTimeout(function() { ref.startObserve();} , this._delay);
    },
    add:function(type , lib_path , callback) {
        var idx = this._queue.length;
        var elm = null;        
        switch (type) {
            case 'css':
                elm = document.createElement('link');
                elm.type = 'text/css';
                elm.href = lib_path;
                elm.rel  = 'stylesheet';
                elm.media = 'all';
                break;
            case 'js':
                elm = document.createElement('script');
                elm.type = 'text/javascript';
                elm.src  = lib_path;
                break;
            default:
                return;
                break;
        }
        this._queue[idx] = elm;
        this._state[idx] = false;
        this._callbacks[idx] = callback;
    },
    load:function(current_idx) {
        this._current_idx = current_idx != null ? current_idx : this._current_idx;
        //check finished to all loaded
        if (this._current_idx == this._queue.length) this._chkLoaded();
        
        if (this._next = this._queue[this._current_idx]) {
            if (typeof this._next != 'undefined')
            {
                var ref = this;
                try {
                this._next.onload = function() { 
                    ref._onloadCallback();
                };
                this._appendHead(this._next);
                }
                catch (e) { alert(e);}
            }
            else {
                this._onloadCallback();
            }
        }
    },
    _onloadCallback:function() {
    	this._state[this._current_idx] = true;
        if (this._callbacks[this._current_idx] != null) this._callbacks[this._current_idx]();
        this._current_idx++;
        this.load(); 
    },
    _appendHead:function(elm) {
        document.getElementsByTagName('head')[0].appendChild(elm);
    },
    startObserve:function () {
        var ref = this;
        this._intervalID = setInterval(function() {ref._observe();} , this._interval);
    },
    _observe:function() {
        for (var i = 0; i < this._state.length; i++) {
            if (this._state[i] == false) {
                this._onloadCallback();
                //this.load(i);
                return;
            }
        }
        this._chkLoaded();
    },
    _chkLoaded:function() {
        for (var i = 0; i < this._state.length; i++) {
            this._all_loaded = this._state[i];
        }
        if (this._all_loaded == true) {
             clearInterval(this._intervalID);
             clearTimeout(this._timeoutID);
        }
    }
};
/*write_ajax_log('test messaging');*/
function write_ajax_log(msg) {
    $.ajax({
        url:'/smp/ajax_log.php',
        data:{'msg':msg},
        dataType:'text',
        type:'POST',
        cache:false,
        success:function(res) {}
    });
}

var objJSLoader = new JSLoader();
/** load library for jquery count down**/
function require_jquery_countdown(web_root , callback , custom_css)
{
	var js_root     = web_root + 'js/';
	var common_path = web_root + 'js/jquery.countdown/';
	var css_name = custom_css ? custom_css : common_path + 'jquery.countdown.css';
	
    var lib_list = [
    	{path:js_root + 'timesales.js' , type:'js' , callback:null},
        {path:css_name , type:'css'  , callback:null},
        {path:common_path + 'jquery.countdown.js'  , type:'js'   , callback:null},
        {path:common_path + 'jquery.countdown-ja.js' , type:'js'  , callback:callback}
    ];
    
    //var objJSLoader = new JSLoader();
    for (var i = 0; i < lib_list.length; i++) {
        objJSLoader.add(lib_list[i].type , lib_list[i].path , lib_list[i].callback);
    }
    
    objJSLoader.load();
}


//class for timer bloc 
var BlocTimer = function(bloc_id , start_date , end_date)
{
	this._id = 'timerbloc' + bloc_id;
	this._is_started = ((new Date(start_date.replace(/-/g , '/'))).getTime() - (new Date()).getTime() < 0) ? true : false;
	this._start_time = (new Date(start_date.replace(/-/g , '/'))).getTime();
	this._is_term    = ((new Date(end_date.replace(/-/g , '/'))).getTime() - (new Date()).getTime() < 0) ? false : true;
	this._expire  = ((new Date(end_date.replace(/-/g , '/'))).getTime() - (new Date()).getTime());
	
	/*this._expire = 2147483647;*/
	if (this._expire > 2147483647) {
	    this._expire = 2147483647;
	}
	
	this._intervalID = null;
	this._interval_time = 500;
	this.initialize();
};

BlocTimer.prototype = {
	initialize:function() {
		if (this._is_started == false) {
			this._hideBloc();
		}
		else if (this._is_term == false) {
			this._hideBloc();
		}
		
		this._startObserve();
	},
	start:function() {
		var ref = this;
		this._timerID = setTimeout(function() { ref._hideBloc(); } , this._expire);
	},
	_hideBloc:function() {
		$('#' + this._id).hide();
		this._is_term = false;
		clearTimeout(this._timerID);
	},
	_showBloc:function() {
		$('#' + this._id).show();
		this._is_term = true;
		if (this._intervalID) clearInterval(this._intervalID);
	},
	_startObserve:function() {
		var ref = this;
		if (this._is_started == false && this._is_term == true) this._intervalID = setInterval(function() { ref._observe(); } , this._interval_time);
	},
	_observe:function() {
		var now = (new Date()).getTime();
		if (now >= this._start_time) {
			//active bloc
			this._is_started = true;
			this._showBloc();
		}
	}
};


/** global alert **/
function global_alert(msg)
{
    if (msg == null || msg == '' || typeof msg == 'undefined') return;
    
	if (typeof $('#global_alert').attr('id') == "undefined"){
        $(document.body).append(
            generate_alert(msg)
        ); 
        setTimeout(function() { 
            $('#global_alert').slideDown('slow' , function() { 
                 setTimeout( function() { 
                     $('#global_alert').slideUp('slow');
                 } , 4000);
            }); 
        } , 500);
    }
}

/** generate alert msg contents **/
function generate_alert(msg)
{
    return $('<div></div>').css('position' , 'absolute')
            .attr('id' , 'global_alert')
            .css('z-index' , 8888)
            .css('top' , 0)
            .css('left' , parseInt($(window).width() / 2) - parseInt(parseInt($(window).width() / 3) / 2))
            .css('background-color' , '#ff6347')
            .css('opacity' , 1)
            .css('width' , parseInt($(window).width() / 3))
            .css('height' , 50)
            .css('color' , '#ffffff')
            .css('font-weight' , 'bold')
            .css('text-align' , 'center')
            .css('padding-top' , '20px')
            .css('padding-bottom' , '0px')
            .html(msg)
            .hide();
}

/** load library for control design of smart phone **/
(function() {
    //var objJSLoader = new JSLoader();
    var script_tags = document.getElementsByTagName('script');
    var host        = window.location.hostname;
    var reg = RegExp('https?://' + host);
    var root_path = '';
    for (var i = 0; i < script_tags.length; i++) {
        root_path = script_tags[i].src.replace(reg , '').replace(/(.+\/)[a-z_0-9A-Z]+\.js/ , '$1');
    }
    
    var include_lib_pathes = [
        {type:'js' , path:root_path + 'design_controller.js.php' , callback:null}
    ];
    
    for (idx in include_lib_pathes) {
        objJSLoader.add(include_lib_pathes[idx].type , include_lib_pathes[idx].path , include_lib_pathes[idx].callback);
    }
    objJSLoader.load();
})();

function extends_class(super_class , target_class)
{
    function __extends_class__(){};
    __extends_class__.prototype = super_class.prototype;
    target_class.prototype = new __extends_class__();
    target_class.prototype.__super__ = super_class.prototype;    
    target_class.prototype.__super__.constructor = super_class;  
    target_class.prototype.constructor = target_class;
    return target_class;
}
