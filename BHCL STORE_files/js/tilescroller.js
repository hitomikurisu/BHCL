/**
 * tilescroller.js
 * 特定領域をすくろーるさせよーずのためのjs
 * スクロールに一切jqueryを使わないから若干早いかもかも
 * 基本的にbase62エンコードで圧縮＆難読化したtilescroller.min.jsを使う
 * 更新して再圧縮&難読化する場合には
 * http://dean.edwards.name/packer/
 * (※現在非圧縮ソースを使用中。圧縮するとシンタックスエラーとなってしまうため)
 * で行う。
 * @date 2013/01/21
 * @author o.yabuta
 * @version 0.0.1
 *
 */
 
var f = function(){};

tileScroller = new f();
tileScroller._show_area_width = null;
tileScroller._show_area_height = null;
tileScroller._tile_width = null;
tileScroller._tile_height = null;
tileScroller._scroll_count = null;
tileScroller._map_dom = null;
tileScroller._map_dom_id = null;
tileScroller._tile_group_dom = null;
tileScroller._tile_group_dom_id = null;
tileScroller._tiles = null;
tileScroller._left_scroll_event_target  = null;
tileScroller._right_scroll_event_target = null;
tileScroller._intervalID = null; 
tileScroller._start_time = null; 
tileScroller._date = null;
tileScroller._duration = null;
tileScroller._begin = null;
tileScroller._change = null;
tileScroller._interval = null;
tileScroller._tick_count = null;
tileScroller._cur = null; 
tileScroller._time = null;
tileScroller._now = 0;
tileScroller._scroll_min = 0;
tileScroller._scroll_max = 0; 
tileScroller._easingFunc = null;
tileScroller._processing = null;
tileScroller._tile_class = null;
tileScroller._left_trigger_dom = null;
tileScroller._right_trigger_dom = null;
tileScroller.setOptions = function(options) {
    with(this) {
        _show_area_width = options.show_area_width,
        _show_area_height = options.show_area_height,
        _tile_width = options.tile_width,
        _tile_height = options.tile_height,
        _scroll_count = options.scroll_count,
        _map_dom = $('#' + options.map_dom),
        _map_dom_id = options.map_dom,
        _tile_group_dom = $('#' + options.tile_group_dom),
        _tile_group_dom_id = options.tile_group_dom, 
        _tiles = new Array(),
        _left_scroll_event_target  = (typeof options.left_scroll_event_target  != 'undefined') ? $('#' + options.left_scroll_event_target)  : null,
        _right_scroll_event_target = (typeof options.right_scroll_event_target != 'undefined') ? $('#' + options.right_scroll_event_target) : null,
        _intervalID = null, 
        _start_time = 0, 
        _date = new Date(), 
        _duration = 400, 
        _begin = 0,
        _change = 0, 
        _interval = 13, 
        _tick_count = 0, 
        _cur = 0, 
        _time = null,
        _now = 0, 
        _scroll_min = 0, 
        _scroll_max = 0, 
        _easingFunc = typeof options.easingFunc == 'undefined' ? this._ease : this[options.easingFunc], 
        _processing = false,
        _tile_class = options.tile_dom,
        _left_trigger_dom = options.left_trigger_dom ,
        _right_trigger_dom = options.right_trigger_dom;
        initialize();
    }
    
    return this;
};

tileScroller.initialize = function() {
        with(this) {
            //_map_dom.css('overflow' , 'hidden').css('height' , _tile_height);
            document.getElementById(_map_dom_id).style.overflow = 'hidden';
            document.getElementById(_map_dom_id).style.height = _tile_height + 'px';          
            //_tile_group_dom.css('position' , 'relative').css('top' , '0px').css('left' , '0px');
            document.getElementById(_tile_group_dom_id).style.position = 'relative';
            document.getElementById(_tile_group_dom_id).style.top = '0px';
            document.getElementById(_tile_group_dom_id).style.left = '0px';
            document.getElementById(_tile_group_dom_id).style.zIndex = 9999;
            
            var divs = document.getElementsByTagName('div');
            for (var i = 0; i < divs.length; i++) {
                if (divs[i].className == _tile_class) {
                    //_tiles.push($(divs[i]).css('float' , 'left').css('position' , 'relative').children('img').attr('width' , _tile_width));
                    divs[i].style.float = 'left';
                    divs[i].style.position = 'relative';
                    divs[i].style.width = _tile_width + 'px';
                    _tiles.push(divs[i]);
                }
            }
            
            var total_concat_width = (_tile_width * _tiles.length);
            // _tile_group_dom.css('width' , total_concat_width);
            document.getElementById(_tile_group_dom_id).style.width = (total_concat_width + 100) + 'px';
            _scroll_max = (-1 * ( Math.ceil(total_concat_width / _show_area_width) - 1) ) * _show_area_width;
        }
};


tileScroller.bind = function(){
   this.bindLeftScrollEvent();
   this.bindRightScrollEvent();
   this.bindMouseWheelEvent();
};

tileScroller.bindLeftScrollEvent = function() {
    if (!this._left_scroll_event_target) this._left_scroll_event_target = $('#' + this._left_trigger_dom);
    ref = this;
    this._left_scroll_event_target.bind('click' , {ref:ref}, function(e) { 
        e.data.ref._prepareScrollTileEvent('l');
    });
};

tileScroller.bindRightScrollEvent = function() {
    if (!this._right_scroll_event_target) this._right_scroll_event_target = $('#' + this._right_trigger_dom);
    ref =  this;
    this._right_scroll_event_target.bind('click' , {ref:ref} , function(e) { 
        e.data.ref._prepareScrollTileEvent('r');
    });
};

tileScroller.bindMouseWheelEvent = function() {
    $('.' + this._tile_class).bind('mouseover' , {ref:this} , function(e) {
         e.data.ref._bindMouseWheelEvent(e.data.ref);
    }).bind('mouseout' , {ref : this} , function(e) {
         $(document).unbind('mousewheel');
    });
    
    $('.' + this._tile_class).children('img span div').bind('mouseover' , {ref:this} , function(e) {
         e.data.ref._bindMouseWheelEvent(e.data.ref);
    }).bind('mouseout' , {ref:this} , function(e) {
         $(document).unbind('mousewheel');
    });
};

tileScroller._bindMouseWheelEvent = function(ref) {
    $(document).bind('mousewheel' , {ref:ref} , function(e, delta, deltaX, deltaY) {
        e.preventDefault();
        var t_duration = e.data.ref._duration;
        e.data.ref._duration = 100;
        if (delta < 0) {
            e.data.ref._prepareScrollTileEvent('l' , 'w');
        }
        else {
            e.data.ref._prepareScrollTileEvent('r' , 'w');
        }
        e.data.ref._duration = t_duration;
   });
}
    
tileScroller._prepareScrollTileEvent = function(v , t) {
    with(this) {
        //stop scrolling forced
        if (v == 'r') {
            if (_scroll_min <= parseInt(document.getElementById(_tile_group_dom_id).style.left)) return false;
        }
        else if (v == 'l') {
            if (_scroll_max >= parseInt(document.getElementById(_tile_group_dom_id).style.left)) return false;
        }
        
        //if scrolling is processing , pass scrolling logic.
        if (_processing == false)
        {
            _processing = true, _start_time = (new Date()).getTime(),_begin = parseInt(document.getElementById(_tile_group_dom_id).style.left),
            _change = this._getChange(v , t),
            _finish = _begin + _change,
            _intervalID = setInterval(function() { _scrollTile(); } , _interval);
        }
    }
};

tileScroller._getChange = function(v , t) {
    with(this) {
        return ((v == 'l') ? -1 : 1) * ((t == 'w') ? _tile_width * 5 : _show_area_width);
    }
};

tileScroller._scrollTile = function() {
    with(this) {
        _now = (new Date()).getTime(), _time = _now - _start_time, _cur = Math.floor(_easingFunc(_time , _begin , _change , _duration)),
        _updatePosition();
    }
};

tileScroller._updatePosition = function() {
    with(this)
    {
        var remaining = Math.max(0 , _start_time + _duration - _now), temp = remaining / _duration || 0,
        percent = 1 - temp;
        if (percent >= 1 || this._isMinOver() == true || this._isMaxOver() == true) {
             _finish = this._isMinOver() == true ? _scroll_min : (this._isMaxOver() == true ? _scroll_max : _finish);
             document.getElementById(_tile_group_dom_id).style.left = _finish + 'px', _processing = false,
             clearInterval(_intervalID);
             return;
        }
        document.getElementById(_tile_group_dom_id).style.left = _cur + 'px';
    }
};

tileScroller._isMinOver = function() {
    if (parseInt(document.getElementById(this._tile_group_dom_id).style.left) > this._scroll_min) {
        return true;
    }
    return false;
};

tileScroller._isMaxOver = function() {
    if (parseInt(document.getElementById(this._tile_group_dom_id).style.left) < this._scroll_max) {
        return true;
    }
    return false;
};

tileScroller._ease =  function (t, b, c, d) {
    return c*(t/=d)*t + b;
};
	
tileScroller._ease2 = function(t , b ,c ,d){
	if ((t/=d) < (1/2.75)) {
		return c*(7.5625*t*t) + b;
	} else if (t < (2/2.75)) {
		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
	} else if (t < (2.5/2.75)) {
		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
	} else {
		return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
	}
};