var lp = {

    product_id : $('#product_id').val(),
    quantity : $('#quantity').val(),
    ajax_url : $('#ajax_url').val(),
    regular : $('#regular').prop('checked') ? 1 : 0,
    validate_flg : false,
    zeus_credit_flg : false,
    zeus_credit_card_list_template : null,
    zeus_useable_securitycode : false,
    zeus_card_list : null,
    gmopg_credit_flg : false,
    gmopg_credit_card_list_template : null,
    gmopg_useable_securitycode : false,
    prev_scroll_pos : 0,

    init : function(){
        var ref = this;

        // 最初から商品が選択されていた場合
        if(ref.product_id){
            var errors = [];
            $('.errors').each(function(){
                errors.push({key_e : $(this).attr('id'), val_e : $(this).val()});
            });
            ref.fetch_data(ref.product_id, ref.quantity, errors);
        }

        // 商品選択時
        $('#product_id').change(function(){
            $('#point_area, .zeus_credit, .gmopg_credit').hide();
            $(".classcategory_id_h").remove();
            product_id = $(this).val();
            ref.quantity = $('#quantity').val();
            $('#class_category_select').empty();
            if(product_id){
                ref.fetch_data(product_id, ref.quantity, null);
            }
            else{ // 「選択してください」を選んだとき。全部クリア
                $('#deliv_datetime_area, #class_category, #regular_product_area, #regular-deliv_area, #payment_area, #coupon_area').hide();
                $('#regular').prop('checked',false);
                ref.regular = 0;
            }
        });

        // 数量変更時
        $('#quantity').change(function(){
            ref.quantity = $(this).val();
            if(!ref.product_id) return true;

            var errors = [];
            $('.errors').each(function(){
                errors.push({key_e : $(this).attr('id'), val_e : $(this).val()});
            });
            $('#class_category_select').empty();
            ref.fetch_data(ref.product_id, ref.quantity, errors);
        });

        // 商品一覧がラジオの場合の処理
        $('.product_id').click(function(){
            $('.classcategory_id_h').remove();
            product_id = $(this).val();
            ref.quantity = $('#quantity').val();

            $('#class_category_select').empty();
            if(product_id){
                ref.fetch_data(product_id, ref.quantity, null);
            }
            else{ // 「選択してください」を選んだとき。全部クリア
                $('#class_category, #regular_product_area, #regular-deliv_area, #payment_area').hide();
                $('#regular').prop('checked',false);
                ref.regular = 0;
            }
        });

        // 規格1選択時
        // appendしたHTML内の要素は.changeや.click では無視されてしまう。
        // 故に$.onを使う必要あり。
        $(document).on('change', '#classcategory_id1', function(){
            // 支払方法欄/クーポン使用欄/ポイント使用欄を一度消す
            $('#point_area, #payment_area, #deliv_datetime_area, #coupon_area').hide();
            ref.changeClassCategory();
        });

        // 規格2選択時
        $(document).on('change', '#classcategory_id2', function() {
            // 支払方法欄/クーポン使用欄/ポイント使用欄を一度消す
            $('#point_area, #payment_area, #deliv_datetime_area, #coupon_area').hide();
            // 何かしらの値が選択されていたらエリア再表示
            if($(this).val()) {
                ref.getCouponArea();
                ref.getPaymentArea();
                ref.getPointFormData();
            }
        });

        // 定期購入希望のチェックボックス押下時
        $('#regular').click(function(){
            $('.payment_normal, .payment_reg').hide();
            if($(this).prop('checked')){ // チェック入れた場合
                $('.payment_reg, #regular-deliv_area').show();
                $('#for_normal_area').hide();
                ref.getRegularCycle(ref.product_id);
                $('#unknown_classno_regular').val(0);
                ref.regular = 1;
            }
            else{
                $('.payment_normal, #for_normal_area').show();
                $('#regular-deliv_area').hide();
                $('#unknown_classno_regular').val(1);
                ref.regular = 0;
            }
        });

        // アカウントをお持ちの方チェックボックス押下時
        $('#register').click(function(){
            if($(this).prop('checked')){
                $('#lp-not-login , #lp-deliv , .deliv_other , #deliv_check_area').hide();
                $('#deliv_check').prop('checked', false);
                $('#lp-login').show();
            }
            else{
                $('#lp-not-login , #deliv_check_area').show();
                $('#lp-login').hide();
            }
        });

        if($('#register').prop('checked')){
            $('#lp-not-login , #lp-deliv , .deliv_other , #deliv_check_area').hide();
            $('#deliv_check').prop('checked', false);
            $('#lp-login').show();
        }
        else{
            $('#lp-not-login , #deliv_check_area').show();
            $('#lp-login').hide();
        }

        // 配送先を指定チェックボックス押下時
        $('#deliv_check').click(function(){
            if($(this).prop('checked')){
                $('#lp-deliv , .deliv_other').show();
                $('.payment_deliv').hide().find('.radio_payment_id').prop('checked', false);
                if ($('option:selected.payment_deliv').length > 0) {
                    $('#deliv_datetime_area').hide();
                    ref.getPaymentArea();
                }
            }
            else{
                $('#lp-deliv , .deliv_other').hide();
                $('.payment_deliv').show();
            }
        });

        $('input[name="use_point"]').blur(function() {
            $('#payment_area').hide();
            ref.getPaymentArea();
        });

        $('input[name="point_check"]').change(function() {
            // ポイント使用 ⇒ 使用しないに変更になった場合、使用ポイント数を0にして支払方法再描画
            if ($(this).val() === '2') {
                $('input[name="use_point"]').val('0');
                $('#payment_area').hide();
                ref.getPaymentArea();
            }
        });
        // 配送先を別のところに変更したらNP後払いwizを除外
        $('#other_deliv_id').on('change', function(){
            var other_deliv_id = $(this).val();
            if(other_deliv_id){
                $('.payment_deliv').hide().find('.radio_payment_id').prop('checked', false);
                if ($('option:selected.payment_deliv').length > 0) {
                    $('#deliv_datetime_area').hide();
                    ref.getPaymentArea();
                }
            }
            else{
                if($('#deliv_check').prop('checked')){

                }
                else{
                    $('.payment_deliv').show();
                }
            }
        });

        // お支払い方法チェック時
        $(document).on('change', '#payment_id', function(){
            var pid = $(this).val();
            $('.payment_note_area').hide();
            $('#payment_id_' + pid).show();
            // 支払方法がプルダウンで表示されていた場合、支払方法を選択したタイミングで説明を表示
            if ($('.payment_affair').length) {
                $('.payment_affair').hide();
                $('#payment_affair_' + pid).show();
            }
            ref.getPaymentForm(pid, null);
        });

        $(document).on('click', '.radio_payment_id', function(){
            ref.getPaymentForm($(this).val(), null);
        });

        $(document).on('change', '#payment_class', function(){
            if($(this).val() == $('#split_payment_class_dmy').val())
                $('#split_count_th, #split_count_tr').show();
            else
                $('#split_count_th, #split_count_tr').hide();
        });

        // 定期の配送間隔
        $(document).on('change', '.regular_cycle_select', function(){
            ref.getRegularDelivDate();
        });
        $(document).on('click', '.cycle_type_radio, #quick_flg', function(){
            ref.getRegularDelivDate();
        });
        $(document).on('click', '#first_quick_flg', function(){
            ref.getRegularDelivDate();
            if($(this).prop('checked')){
                $('#cycle_interval_start_date_area').hide();
            }
            else{
                $('#cycle_interval_start_date_area').show();
            }
        });

        // GMO関連 JSでカード番号を分割しておく
        $(document).on('keyup', '#gmo_card_no', function(){
            var gmo_card_no = $(this).val();
            if(gmo_card_no.length == 14){
                $('#gmo_card_no01').val(gmo_card_no.substr(0,4));
                $('#gmo_card_no02').val(gmo_card_no.substr(4,4));
                $('#gmo_card_no03').val(gmo_card_no.substr(8,4));
                $('#gmo_card_no04').val(gmo_card_no.substr(12,2));
            }
            if(gmo_card_no.length == 15){
                $('#gmo_card_no01').val(gmo_card_no.substr(0,4));
                $('#gmo_card_no02').val(gmo_card_no.substr(4,4));
                $('#gmo_card_no03').val(gmo_card_no.substr(8,4));
                $('#gmo_card_no04').val(gmo_card_no.substr(12,3));
            }
            if(gmo_card_no.length == 16){
                $('#gmo_card_no01').val(gmo_card_no.substr(0,4));
                $('#gmo_card_no02').val(gmo_card_no.substr(4,4));
                $('#gmo_card_no03').val(gmo_card_no.substr(8,4));
                $('#gmo_card_no04').val(gmo_card_no.substr(12,4));
            }
        });

        // 確認用メアドとパスワードの自動入力
        $('#order_email').keyup(function(){
            $('#order_email_check').val($('#order_email').val());
        });

        $('#password').keyup(function(){
            $('#password02').val($('#password').val());
        });

        // 郵便番号から住所自動入力
        var order_zip_button_enable = $('#order_zip_button').attr('class');
        $('#order_zip').change(function(){
            if(!order_zip_button_enable){
                ref.auto_address('order');
            }
        });
        $('#deliv_zip').change(function(){
            if(!order_zip_button_enable){
                ref.auto_address('deliv');
            }
        });
        $('#order_zip_button').click(function(){ref.auto_address('order')});
        $('#deliv_zip_button').click(function(){ref.auto_address('deliv')});

        // フォームのフォーカス時に色付けする
        $('input,textarea').focus(function(){
            $(this).addClass("focus");
        })
        .blur(function(){
            $(this).removeClass("focus");
        });

        // コード式クーポン
        $('#check_coupon_code').click(function(){
            if(!$('#coupon_code').val()) return false;
            var btn = $(this);
            btn.hide().next().show();
            $('#coupon_code_error').empty();
            var params = {
                action : 'checkCoupon',
                code : $('#coupon_code').val(),
                product_id : ref.product_id,
                quantity : ref.quantity,
                classcategory_id1 : $('#classcategory_id1').val() || '',
                classcategory_id2 : $('#classcategory_id2').val() || '',
                regular : ref.regular
            };
            $.ajax({
                type : 'post',
                url : ref.ajax_url,
                dataType : 'json',
                data : params,
                success : function(r){
                    if(!r.success){
                        $('#coupon_code_error').html('<br />' + r.message);
                        btn.show().next().hide();
                        return false;
                    }

                    btn.show().next().hide();
                    $('#entry_coupon_td').hide();
                    $('#view_coupon_td, #coupon_discount_tr').show();
                    $('#code_coupon_code').text(r.use_coupon.code_coupon_code);
                    $('#discount').text(r.use_coupon.format_discount);

                    // 支払い方法表示
                    ref.viewPaymentMethod(r.payment, ref.regular);

                    btn = null;
                },
                error:function(a,b,c){error_h(a,b,c)}
            });
        });

        // クーポン解除
        $('#remove_coupon_code').click(function(){
            var btn = $(this);
            btn.hide().next().show();

            var params = {
                action : 'removeCouponCode',
                product_id : ref.product_id,
                quantity : ref.quantity,
                classcategory_id1 : $('#classcategory_id1').val() || '',
                classcategory_id2 : $('#classcategory_id2').val() || '',
                regular : ref.regular
            };

            $.ajax({
                type : 'post',
                url : ref.ajax_url,
                dataType : 'json',
                data : params,
                success : function(r){
                    if(!r.success){
                        btn.show().next().hide();
                        return false;
                    }

                    btn.show().next().hide();
                    $('#entry_coupon_td').show();
                    $('#view_coupon_td, #coupon_discount_tr').hide();
                    $('#discount').text(' ');

                    // 支払い方法表示
                    ref.viewPaymentMethod(r.payment, ref.regular);

                    btn = null;
                },
                error:function(a,b,c){error_h(a,b,c)}
            });
        });

        // エンター押してsubmitさせない
        $('input').keypress(function(e){
            if(e.keyCode == 13) return false;
        });

        // 入力不備があったらconfirmに遷移させない
        $('#confirm_submit').click(function(e){
            e.preventDefault();
            if (typeof appendUsePaygentTokenTag === "function") {
                appendUsePaygentTokenTag('form1');
            }
            var form = $('#form1').serializeArray();
            var param = {action : 'validateLp', amazon_pay_flg : 0};
            $(form).each(function(i, v) {
                param[v.name] = v.value;
            });
            ref.validateLp(param);
        });


        //
        $(document).on('click', '#use_card_type_1', function(){
            $('#entry_new_card, #confirmation_save_card').show();
            $('#registered_card_list').hide();
        });
        $(document).on('click', '#use_card_type_2', function(){
            $('#entry_new_card, #confirmation_save_card').hide();
            $('#registered_card_list').show();
        });
    },


    // 画面読込時、商品選択時に呼び出す関数
    fetch_data : function(product_id, quantity, errors){
        var ref = this;
        ref.product_id = product_id;
        $('#confirm_submit, #amazon_button_area').hide();

        // 支払方法/ポイント使用欄/クーポン使用欄は商品と規格が定まるまで非表示
        $('#payment_area, #coupon_area, #deliv_datetime_area').hide();

        var classcategory_ids = [];
        $('.classcategory_id_h').each(function(){
            classcategory_ids.push({key_c : $(this).attr('id'), val_c : $(this).val()});
            $(this).remove();
        });
        $('#class_category').hide();

        var payment_id = $('.payment_id_h').val();

        var quick_flg = $('.quick_flg_h').val();
        $('.quick_flg_h').remove();

        var first_quick_flg = $('.first_quick_flg_h').val();
        $('.first_quick_flg_h').remove();

        var cycles = [];
        $('.cycle_h').each( function() {
            cycles.push({key_c : $(this).attr('id'), val_c : $(this).val()});
            $(this).remove();
        });

        var params = {
            action : 'fetchData',
            product_id : product_id,
            quantity : quantity,
            classcategory_id : classcategory_ids,
            cycles : cycles,
            quick_flg : quick_flg,
            first_quick_flg : first_quick_flg,
            errors : errors
        }

        // #4229 POSTでcacheさせない
        $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
            if(originalOptions.type.toLowerCase() == 'post'){
                options.data = jQuery.param($.extend(originalOptions.data||{}, {
                    timeStamp: new Date().getTime()
                }));
            }
        });

        $.ajax({
            type : 'post',
            url  : ref.ajax_url,
            dataType: 'json',
            data : params,
            async : true, // 非同期通信させる
            //cache: false, // #4229 SMPで度々起こる問題対策←POSTでは意味ないことが判明
            headers: { // #4229
                'pragma': 'no-cache'
            },
            timeout : 10000,
            success : function(r){
                if(!r){
                   return false;
                }

                // 規格
                if(r.class_category){
                    $('#class_category').show();
                    $('#class_category_select').append(r.class_category);
                }

                // 定期判定
                if(r.regular){ // 定期商品
                    $('#regular_product_area, #regular-deliv_area').show();
                    $('#for_normal_area').hide();
                    $('#regular').prop('checked','checked');
                    $('#unknown_classno_regular').val(0);
                    $('#regular_cycle_area').html(r.regular_cycle);
                    //ref.getRegularCycle(product_id)
                    ref.getRegularDelivDate();
                    ref.regular = 1;
                }
                else{ // 都度専用
                    $('#regular_product_area, #regular-deliv_area').hide();
                    $('#regular').prop('checked',false);
                    $('#unknown_classno_regular').val(1);
                    $('#for_normal_area').show();
                    ref.regular = 0;
                }

                // $('#confirm_submit').show(); show()だとdisplay:inlineになって昔のテンプレートで問題あり
                $('#confirm_submit, #amazon_button_area').css('display', 'block');

                // アップセルなどで規格2が引き継がれない件修正
                if (r.classcategory_id2) {
                    ref.changeClassCategory();
                    $('#classcategory_id2').val(r.classcategory_id2);
                }
                // 規格なし商品を選んだときは支払方法欄/クーポン使用欄/ポイント使用欄を即座に表示
                // また、戻るボタンによる再描画の場合は規格1、規格2がselectedだったら即座に表示
                if (!r.class_category ||
                    ($('#classcategory_id1').val() && ($('#classcategory_id2').length == 0 || $('#classcategory_id2').val()))
                ) {
                    ref.getPointFormData();
                    ref.getCouponArea();
                    ref.getPaymentArea(errors);
                }
                else {
                    // #7461 確認画面から戻った際に支払いフォームが出てこないことがある件の対策
                    // 原因はgetPaymentAreaが非同期なので、getPaymentFormが先に処理されることがあるため。promise使いたいけどIEで動かなくなる・・・
                    // #4249 アップセルで戻ってきた際に支払い方法の引き継ぎを一旦解除
                    var get_params = getQueryString();
                    if(payment_id && !get_params.up) ref.getPaymentForm(payment_id, errors);
                }
            },
            error : function(XMLHttpRequest, textStatus, errorThrown){
                error_h(XMLHttpRequest, textStatus, errorThrown);
            }
        });
        // $('#confirm_submit').css('display', 'block'); ここだと通信エラー発生時もボタンが表示される
    },


    // 郵便番号から住所を自動入力する
    auto_address : function(type){
        var ref = this;
        var zip = $('#' + type + '_zip').val();
        if(zip.length == 7 || zip.length == 8){
            $.ajax({
                type : 'post',
                url : ref.ajax_url,
                dataType : 'json',
                data : {action : 'getAddress', zip : zip, kind : type},
                success : function(b){
                    $('#' + type + '_pref').val(b.order_pref);
                    $('#' + type + '_addr01').val(b.order_addr01);
                    if(b.order_pref){
                        $('#' + type + '_pref').css("background", "rgb(255,255,255)");
                        $('#' + type + '_addr01').css("background", "rgb(255,255,255)");
                        $('#' + type + '_addr02').focus();
                    }
                },
                error:function(a,b,c){error_h(a,b,c)}
            });
        }
    },

    // 支払い方法表示
    viewPaymentMethod : function(payment, regular){

        // #4148 支払い方法を再度取
        $('#payment_detail_area, #payment_methods').empty();
        $('#payment_area').show();
        $('#payment_methods').append(payment);

        // #4453 支払方法選択時特記事項が二つ表示される件修正
        $('.payment_normal, .payment_reg').hide();
        if (regular == 1) {
            $('.payment_reg').show();
        } else {
            $('.payment_normal').show();
        }
        // 「別のお届け先を指定」プルダウン or「上記と別の住所へお届けする」チェックがついていたら請求書同梱系の支払方法は表示しない
        if ($('#deliv_check').prop('checked')|| ($('#other_deliv_id').length > 0 && $('#other_deliv_id').val() != '')) {
            $('.payment_deliv').hide().find('.radio_payment_id').prop('checked', false);
        }
        $('.payment_note_area').hide();

        if ($('.payment_affair').length) {
            $('.payment_affair').hide();
            // 選択済の支払方法の説明を表示
            var pid = $('#payment_id option:selected').val();
            $('#payment_affair_' + pid).show();
        }
    },

    // 決済情報の入力フォーム
    getPaymentForm : function(payment_id, errors){
        var ref = this;
        var product_id = ref.product_id || $('#product_id').val();
        var p_info = [];
        var other_deliv_id = $('#other_deliv_id').val() || '';
        $('.payment_info_class').each( function() {
            p_info.push({key_p : $(this).attr('id'), val_p : $(this).val()});
        });
        $('.payment_info_class').remove();

        $('.zeus_credit, .gmopg_credit').hide(); // クレジット用入力フォーム一旦非表示
        ref.zeus_credit_flg = false;
        ref.gmopg_credit_flg = false;

        // お届け指定日時関連
        var deliv_date = $('.deliv_date_h').val();
        $('.deliv_date_h').remove();
        var deliv_time_id = $('.deliv_time_id_h').val();
        $('.deliv_time_id_h').remove();
        if($('#regular').attr('type') === 'hidden'){
            if($('#regular').val() == 1)
                ref.regular = 1;
            else
                ref.regular = 0;
        }
        else{
            if($('#regular').prop('checked'))
                ref.regular = 1;
            else
                ref.regular = 0;
        }

        var params = {
            action : 'getPaymentForm',
            payment_id : payment_id,
            product_id : product_id,
            p_info : p_info,
            regular : ref.regular,
            other_deliv_id : other_deliv_id,
            deliv_date : deliv_date,
            deliv_time_id : deliv_time_id,
            errors : errors
        };

        $.ajax({
            type : 'post',
            url  : ref.ajax_url,
            dataType: 'json',
            data : params,
            timeout : 10000,
            async : false,
            success : function(r){
                $('.payment_detail_area').empty();
                $('.payment_tr').hide();
                if(r.payment_form){
                    $('#payment_tr_' + payment_id).show();
                    $('#payment_detail_area_' + payment_id).append(r.payment_form);
                    if (ref.regular === 1) {
                        $('#card_save_flg_2').remove();
                    }
                }
                if(r.deliv_date_time){
                    $('#deliv_datetime_area').show();
                    $('#deliv_time_area').html(r.deliv_date_time);
                }

                // 7288 Zeus対応
                ref.getZeuscredit(r);

                // #9607 GMO-PG対応
                ref.getGmopg(r);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                error_h(XMLHttpRequest, textStatus, errorThrown);
            }
        });
    },


    // 定期配送間隔指定
    getRegularCycle : function(product_id){
        var ref = this;
        var quick_flg = $('.quick_flg_h').val();
        $('.quick_flg_h').remove();

        var first_quick_flg = $('.first_quick_flg_h').val();
        $('.first_quick_flg_h').remove();

        var cycles = [];
        $('.cycle_h').each( function() {
            cycles.push({key_c : $(this).attr('id'), val_c : $(this).val()});
            $(this).remove();
        });

        $.ajax({
            type : 'post',
            url  : ref.ajax_url,
            dataType: 'json',
            data : {action : 'getRegularCycle', product_id : product_id, cycles : cycles, quick_flg : quick_flg, first_quick_flg : first_quick_flg},
            async : false,
            timeout : 10000,
            success : function(r){
                $('#regular_cycle_area').html(r);
                ref.getRegularDelivDate();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                error_h(XMLHttpRequest, textStatus, errorThrown);
            }
        });
    },

    // 規格1 選択時の処理
    changeClassCategory : function(){
        var ref = this;
        var sele11 = document['form1']['classcategory_id1'];
        var sele12 = document['form1']['classcategory_id2'];
        console.log(sele11);
        console.log(sele12);
        if(sele11 && sele12) {
            index = sele11.selectedIndex;
            $('#classcategory_id2').empty();

            len = lists[index].length;
            for(i = 0; i < len; i++) {
                sele12.options[i] = new Option(lists[index][i], vals[index][i]);
            }
        } else if (sele11) {
            if (sele11.value) {
                // 規格2がない場合はここで規格が確定するので支払方法欄/クーポン欄/ポイント使用欄を表示
                ref.getCouponArea();
                ref.getPaymentArea();
                ref.getPointFormData();
            }
        }
    },

    // 定期お届け日表示
    getRegularDelivDate : function(){
        var ref = this;
        var cycle_type = $('.cycle_type_radio:checked').val();

        $('.cycle_form').hide();
        if(cycle_type){

            if(cycle_type == 1){
                $('#cycle_type1_form').show();
                var select_val = {cycle_date_monthly : $('#cycle_date_monthly').val(), cycle_date_day : $('#cycle_date_day').val()};
            }
            if(cycle_type == 2){
                $('#cycle_type2_form').show();
                var select_val = {cycle_week_monthly : $('#cycle_week_monthly').val(), cycle_week_ordinal : $('#cycle_week_ordinal').val(), cycle_week_week : $('#cycle_week_week').val()};
            }
            if(cycle_type == 3){
                $('#cycle_type3_form').show();
                var select_val = {cycle_interval_start_date : $('#cycle_interval_start_date').val(), cycle_interval_interval : $('#cycle_interval_interval').val()};
            }

            var params = {
                action : 'getRegularDelivDate',
                product_id : ref.product_id,
                cycle_type : cycle_type,
                select_val : select_val,
                quick_flg : $('#quick_flg:checked').val(),
                first_quick_flg : $('#first_quick_flg:checked').val()
            };

            $.ajax({
                type : 'post',
                url  : ref.ajax_url,
                dataType: 'json',
                data : params,
                async : false,
                timeout : 10000,
                success : function(r){
                    if(!r) return true;
                    $('.regular_deliv_day').empty();
                    $('#regular_deliv_day_first').append(r.first);
                    $('#regular_deliv_day_second').append(r.second);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown){
                    error_h(XMLHttpRequest, textStatus, errorThrown);
                }
            });
        }
    },

    // validate
    validateLp : function(param){
        //paygent トークン取得
        if (param.use_paygent_credit == 1 && param.use_paygent_token == 1) {
            param.card_no = '';
            param.card_no1 = '';
            param.card_no2 = '';
            param.card_no3 = '';
            param.card_no4 = '';
            param.card_expiration_year = '';
            param.card_expiration_month = '';
            param.card_holder_name1 = '';
            param.card_holder_name2 = '';
        }
        if (param.use_gmopg == 1 && param.use_gmo_token == 1) {
            param.card_no = '';
            param.card_no01 = '';
            param.card_no02 = '';
            param.card_no03 = '';
            param.card_no04 = '';
            param.card_month = '';
            param.card_year = '';
            param.card_name01 = '';
            param.card_name02 = '';
        }
        var ref = this;

        $.ajax({
            type : 'post',
            url : ref.ajax_url,
            dataType : 'json',
            data : param,
            async : false,
            success : function(r){
                if(!r){
                    // #7286 zeus対応
                    if (ref.zeus_credit_flg === true) {
                        if ($('#zeus_token_action_type_new').prop('checked')) {
                            if ( $('#zeus_token_card_number').val() === ''
                              || $('#zeus_token_card_expires_month').val() === ''
                              || $('#zeus_token_card_expires_year').val() === ''
                              || $('#zeus_token_card_name').val() === ''
                            ) {
                                alert('カード情報に不備があります');
                                return false;
                            }

                            if (ref.zeus_useable_securitycode && $('#zeus_token_card_cvv').val() === '') {
                                alert('セキュリティコードを入力してください');
                                return false;
                            }

                            // ハイフン消す
                            var card_number = $('#zeus_token_card_number').val();
                            $('#zeus_token_card_number').val(card_number.replace(/-/g, ''));
                        } else {
                            if (!$('.payment_wallet_id:checked').val()) {
                                alert('使用する登録カードを選択してください');
                                return false;
                            }

                            if (ref.zeus_useable_securitycode && $('#zeus_token_card_cvv_for_registerd_card').val() === '') {
                                alert('セキュリティコードを入力してください');
                                return false;
                            }
                        }
                        zeusCreditBeforeSubmit();
                        return true;
                    }

                    if (ref.gmopg_credit_flg === true) {
                        if ($('#gmopg_token_action_type_new').prop('checked')) {
                            if ( $('#gmopg_token_card_number').val() === ''
                              || $('#gmopg_token_card_expires_month').val() === ''
                              || $('#gmopg_token_card_expires_year').val() === ''
                              || $('#gmopg_token_card_name').val() === ''
                            ) {
                                alert('カード情報に不備があります');
                                return false;
                            }

                            // ハイフン消す
                            var card_number = $('#gmopg_token_card_number').val();
                            $('#gmopg_token_card_number').val(card_number.replace(/-/g, ''));
                        } else {
                            if (!$('.gmopg_payment_wallet_id:checked').val()) {
                                alert('使用する登録カードを選択してください');
                                return false;
                            }
                        }

                        if (ref.gmopg_useable_securitycode && $('#gmopg_token_card_cvv').val() === '') {
                            alert('セキュリティコードを入力してください');
                            return false;
                        }

                        fnCheckGmopgTokenSubmit(param.mode, 'scroll', '.smp-lp-confirm');
                        return true;
                    }

                    ref.validate_flg = true;
                    if (!param.amazon_pay_flg) {
                        if (param.use_gmopg == 1 && param.use_gmo_token == 1) {
                            var is_regular = (param.no_regular == 1) ? 0 : 1;
                            fnCheckGmoTokenSubmit(param.mode,'scroll', '.smp-lp-confirm', is_regular);
                        } else if (param.use_paygent_credit == 1 && param.use_paygent_token == 1) {
                            paygent_token_send('form1');
                        } else {
                            fnSetFormSubmit('form1', 'scroll', '.smp-lp-confirm');
                        }
                    }

                    return true;
                }
                $('#alert_errors').error('<br />');
                var html = '';
                for (var i in r.error){
                    $('*[name=' + i + ']').css("background", "rgb(255,160,160)");
                    html += r.error[i];
                }
                $('#alert_errors').html(html).show('slow');
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
            }
        });
    },

    // クーポン欄表示
    getCouponArea : function() {
        var ref = this;
        var param = {
            action       : 'getCouponArea',
            product_id   : ref.product_id,
            quantity     : ref.quantity,
            classcategory_id1 : $('#classcategory_id1').val() || '',
            classcategory_id2 : $('#classcategory_id2').val() || '',
            regular : ref.regular
        };
        $.ajax({
            type     : 'post',
            url      : ref.ajax_url,
            dataType : 'json',
            data     : param,
            async    : true,
            success  : function(r) {
                // クーポン欄表示
                if (r.isApplied) {
                    // クーポンコード確定時は適用しているコードと値引金額を表示
                    if(!r.success){
                        // $('#coupon_code_error').html('<br />' + r.message);
                        // btn.show().next().hide();

                        return false;
                    }
                    // TODO: 関数化したい(showCouponDiscount)
                    // btn.show().next().hide();
                    $('#entry_coupon_td').hide();
                    $('#view_coupon_td, #coupon_discount_tr').show();
                    $('#code_coupon_code').text(r.use_coupon.code_coupon_code);
                    $('#discount').text(r.use_coupon.format_discount);
                } else {
                    // クーポンコード未確定時はクーポンコード入力欄を表示
                    $('#entry_coupon_td').show();
                    $('#view_coupon_td').hide();
                }
                $('#coupon_area').show();
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                error_h(XMLHttpRequest, textStatus, errorThrown);
            }
        });
    },
    // 支払方法欄表示
    getPaymentArea : function(errors) {
        var ref = this;
        payment_id = $('.payment_id_h').val();
        $('.payment_id_h').remove();

        var param = {
            action: 'getPaymentArea',
            product_id: ref.product_id,
            quantity: ref.quantity,
            payment_id: payment_id,
            classcategory_id1: $('#classcategory_id1').val() || '',
            classcategory_id2: $('#classcategory_id2').val() || '',
            use_point: $('input[name="use_point"]').val(),
            point_check: $('input[name="point_check"]').val()
        };
        $.ajax({
            type: 'post',
            url : ref.ajax_url,
            dataType : 'json',
            data : param,
            async: true,
            success : function(r) {
                // 支払い方法表示
                ref.viewPaymentMethod(r.payment, ref.regular);

                // #7461  確認画面から戻った際に支払いフォームが出てこないことがある件の対策
                var get_params = getQueryString();
                if (payment_id && !get_params.up) ref.getPaymentForm(payment_id, errors);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                error_h(XMLHttpRequest, textStatus, errorThrown);
            }
        });
    },
    // ポイント使用欄表示
    getPointFormData : function(param) {
        var ref = this;

        // 選択されている商品が定期の場合は表示しない
        if ($('#point_area').length !== 0) {
            if (!ref.regular) {
                $('#point_area').show();
                fnCheckInputPoint();
                if ($('.point_check_h').length === 1) {
                    // ポイントを使用する
                    $('.point_check_h').remove();
                    // 使用ポイント数を表示する
                    $("[name='use_point']").val($('.use_point_h').val()||0);
                    $('.use_point_h').remove();
                }
            } else {
                $('#point_area').hide();
            }
        }
        var param = {
            action: 'getPointFormData',
            product_id: ref.product_id,
            quantity: ref.quantity,
            classcategory_id1: $('#classcategory_id1').val() || '',
            classcategory_id2: $('#classcategory_id2').val() || ''
        };
        $.ajax({
            type: 'post',
            url : ref.ajax_url,
            dataType : 'json',
            data : param,
            async: true,
            success : function(r) {
                $('#price').html(r.price + '円');
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                error_h(XMLHttpRequest, textStatus, errorThrown);
            }
        });
    },
    adjustScroll : function(id_target, relative_top, animate) {
        if (typeof animate === 'undefined') animate = true;
        var abs = function(n) {
            return n > 0 ? n : -n;
        }
        var calcTop = function(obj) {
            return obj.offsetParent !== null ? calcTop(obj.offsetParent) + obj.offsetTop : obj.offsetTop;
        }
        // 推奨ブラウザ + safari では、 PC/smp 両方で正しい値が返る。
        var zoomRatio = function() {
            var zoom = $('html').css('zoom');
            var calcZoom = window.innerWidth / document.body.clientWidth;

            if (zoom == null || zoom === "1") {
                return 1;
            }

            // Chrome smp対策
            if (abs(calcZoom - parseFloat(zoom)) < 0.1) {
                return parseFloat(zoom);
            }

            return 1;
        }
        var position = (calcTop($(id_target).get(0)) + relative_top) * zoomRatio();
        var pos_diff = abs(position - this.prev_scroll_pos);

        if ( animate ) {
          $('html, body').animate({scrollTop: position}, 400, 'swing');
        } else {
          $('html, body').scrollTop(position);
        }

        // 僅差になるまで繰り返す。
        if ( (pos_diff / position) > 0.005 ) {
          this.prev_scroll_pos = position;
          setTimeout(this.adjustScroll.bind(this), 500, id_target, relative_top, animate);
        }
    },

    getZeuscredit :  function (card_info) {
        if (!card_info.zeus_credit_flg) {
            return;
        }

        var ref = this;

        // カード情報保持
        ref.zeus_card_list = card_info.card_list;

        // カード情報入力フォーム表示
        $('#zeus_token_card_info').show();

        // カードリスト表示用テンプレートを保持しておく
        var first = false;
        if (ref.zeus_credit_card_list_template === null) {
            ref.zeus_credit_card_list_template = $('#zeus_card_list_body').html();
            first = true;
        }

        // 登録カード表示
        if (card_info.card_list !== undefined && Object.keys(card_info.card_list).length > 0) {
            $('#zeus_card_list_body').empty();
            for (var key in card_info.card_list) {
                var html = ref.zeus_credit_card_list_template;
                html = html.replace('{{card_number}}', card_info.card_list[key].card_number);
                html = html.replace('{{card_expire}}', card_info.card_list[key].card_expire);
                html = html.replace(/{{card_id}}/g, card_info.card_list[key].card_id);
                $('#zeus_card_list_body').append(html);
            }
            $('#zeus_token_action_type_quick').show();
            $('label[for=zeus_token_action_type_quick]').show();
            $('#zeus_token_action_type_quick').prop({checked : 'checked'});
            $('#zeus_card_list').show();
            $('#register_zeus_credit').prop({disabled : true});
            $('#zeus_token_card_number, #zeus_token_card_expires_month, #zeus_token_card_expires_year, #zeus_token_card_name, #zeus_token_card_cvv')
            .addClass('zeus_token_input_disable').removeClass('zeus_token_input_error').prop({disabled : true});
        } else {
            // 登録済みカードが存在しない場合は非表示に設定
            $('#zeus_token_action_type_new').prop({checked : 'checked'});
            $('#zeus_token_action_type_quick').hide();
            $('label[for=zeus_token_action_type_quick]').hide();
        }

        // 定期ならカード登録のcheckbox出さない
        if (ref.regular) {
            $('#zeus_save_card_normal_tr').hide();
            $('#zeus_save_card_regular_tr').show();
        } else {
            $('#zeus_save_card_normal_tr').show();
            $('#zeus_save_card_regular_tr').hide();
        }

        // セキュリティコードを使うならフォームを表示
        ref.zeus_useable_securitycode = card_info.is_useable_securitycode;
        if (card_info.is_useable_securitycode) {
            $('.zeus_securitycode_area').show();
        } else {
            $('.zeus_securitycode_area').hide();
        }

        // 登録カードを使用 && 確認画面から戻ってきた際の処理
        if ($('#zeus_payment_wallet_id').val()) {
            $('#zeus_token_action_type_quick').prop({checked : 'checked'});
            $('#zeus_card_list').show();
            $('#register_zeus_credit').prop({disabled : true, checked : false});
            $('#zeus_payment_wallet_id_' + $('#zeus_payment_wallet_id').val()).prop({checked : 'checked'});
        }

        ref.zeus_credit_flg = true;

        if (!first) {
            return;
        }

        // 「登録済みのカードを使う」をチェックしたら、カード一覧を表示し、カード登録チェックボックスは非活性
        $('#zeus_token_action_type_quick').click(function() {
            if (ref.zeus_card_list !== undefined && Object.keys(ref.zeus_card_list).length > 0) { // r.card_listがhashなのでr.card_list.lengthではダメ
                $('#zeus_card_list').show();
                $('#register_zeus_credit').prop({disabled : true, checked : false});
            } else {
                alert('登録済カードがありません。');
                $('#zeus_token_action_type_new').prop({checked : true});
                $('#zeus_token_card_number, #zeus_token_card_expires_month, #zeus_token_card_expires_year, #zeus_token_card_name, #zeus_token_card_cvv')
                .removeClass('zeus_token_input_disable').addClass('zeus_token_input_error').prop({disabled : false});
            }
        });

        $('#zeus_token_action_type_new').click(function() {
            $('#zeus_card_list').hide();
            $('#register_zeus_credit').prop({disabled : false});
        });
    },


    getGmopg : function (card_info) {
        if (!card_info.gmopg_credit_flg) {
            return;
        }

        var ref = this;

        // カード情報入力フォーム表示
        $('#gmopg_credit_block').show();

        // 登録カードリスト表示用テンプレートを保持しておく
        var first = false;
        if (ref.gmopg_credit_card_list_template === null) {
            ref.gmopg_credit_card_list_template = $('#gmopg_card_list_body').html();
            first = true;
        }

        // セキュリティコードを使うならフォームを表示
        ref.gmopg_useable_securitycode = card_info.is_useable_securitycode;
        if (card_info.is_useable_securitycode) {
            $('.gmopg_securitycode_area').show();
        } else {
            $('.gmopg_securitycode_area').hide();
        }

        // 登録カード表示
        if (card_info.card_list !== undefined && Object.keys(card_info.card_list).length > 0) {
            $('#gmopg_card_list_body').empty();
            for (var key in card_info.card_list) {
                var html = ref.gmopg_credit_card_list_template;
                html = html.replace('{{card_number}}', card_info.card_list[key].card_number);
                html = html.replace('{{card_expire}}', card_info.card_list[key].card_expire);
                html = html.replace('{{card_holder_name}}', card_info.card_list[key].card_holder_name);
                html = html.replace(/{{card_id}}/g, card_info.card_list[key].card_id);
                $('#gmopg_card_list_body').append(html);
            }
            $('#gmopg_token_action_type_quick').prop({checked : 'checked'});
            $('#register_gmopg_credit').prop({checked : false});
            $('.gmopg_form_input').prop({disabled : true});
            $('#gmopg_credit_list').show();
            $('.new_card_info_gmopg').hide();
        }

        // 定期ならカード登録のcheckbox出さない
        if (ref.regular) {
            $('#gmopg_save_card_normal_tr').hide();
            $('#gmopg_save_card_regular_tr').show();
        } else {
            $('#gmopg_save_card_normal_tr').show();
            $('#gmopg_save_card_regular_tr').hide();
        }

        // 登録カード枚数の上限に達していたら新規は非活性
        if (!card_info.card_add_space_available) {
            $('#gmopg_token_action_type_new').prop({disabled : true, checked : false});
            $('#notice_card_add').show();
        }

        // 登録カードを使用 && 確認画面から戻ってきた際の処理
        if ($('#gmopg_payment_wallet_id').val()) {
            $('#gmopg_token_action_type_quick').prop({checked : 'checked'});
            $('#gmopg_credit_list').show();
            $('#register_gmopg_credit').prop({disabled : true, checked : false});
            $('#gmopg_payment_wallet_id_' + $('#gmopg_payment_wallet_id').val()).prop({checked : 'checked'});
        }

        ref.gmopg_credit_flg = true;

        if (!first) {
            return;
        }

        // 「登録済みのカードを使う」をチェックしたら、カード一覧を表示し、カード登録チェックボックスは非活性
        $('#gmopg_token_action_type_quick').click(function() {
            if (card_info.card_list !== undefined && Object.keys(card_info.card_list).length > 0) {
                $('#gmopg_credit_list').show();
                $('#register_gmopg_credit').prop({checked : false});
                $('.gmopg_form_input').prop({disabled : true});
                $('.new_card_info_gmopg').hide();
            } else {
                alert('登録済カードがありません。');
                $('#gmopg_token_action_type_new').prop({checked : true});
            }
        });
        $('#gmopg_token_action_type_new').click(function() {
            $('#gmopg_credit_list').hide();
            $('.gmopg_form_input').prop({disabled : false});
            $('.new_card_info_gmopg').show();
            if (!card_info.is_useable_securitycode) {
                $('.gmopg_securitycode_area').hide();
            }
        });
    },

    /**
     * LPフォームチェック処理
     */
    checkLp : function (product_id) {
        var ref = this;
        //商品ID有効性チェック
        if (!ref.isValidProductId(product_id)) {
            // どこで指定された商品IDかで区別する
            // data-value-nameか？
            var invalid_data_value_name_flg = false;
            if ($('.auto_select_name')[0]) {
                $('.auto_select_name').each(function(){
                    if ($(this).attr('data-value-name') == undefined) {
                        return false;
                    }
                    if ($(this).attr('data-value-name') == product_id) {
                        invalid_data_value_name_flg = true;
                        return false;
                    }
                });
            }

            if(invalid_data_value_name_flg) {
                ref.inValidLp('invalid_data-value-name', product_id);
            } else {
                ref.inValidLp('invalid_product_id', product_id);
            }
        }
    },

    /**
     * プロダクトID有効性チェック
     *
     * 引数に渡されたプロダクトIDが商品選択リストもしくはname="product_id"にある(有効)か否かを返します。
     */
    isValidProductId : function (product_id) {
        var is_valid_product_id = false;

        if ($('select#product_id')[0]) {
            // 商品リストあり、optionに商品IDがあるかチェック
            $('select#product_id option').each(function(){
                if ($(this).val() == product_id) {
                    is_valid_product_id = true;
                }
            });
        } else if ($('#product_id')[0]) {
            // select以外の指定
            $('#product_id').each(function(){
                if ($(this).val() == product_id) {
                    is_valid_product_id = true;
                }
            });
        } else {
            // チェックできない、有効とする
            is_valid_product_id = true;
        }

        return is_valid_product_id;
    },

    /**
     * LPフォーム不正時の処理
     */
    inValidLp : function (status, product_id) {
        var ref = this;

        var lp_form_key = $('input#unknown_classp').val();

        // 呼び出し元画面によってはlocation.hrefではlp_form_keyがない場合があるので、個別に連結して生成する
        var lp_form_url = location.protocol + '//' + location.host + location.pathname + '?p=' + lp_form_key

        var params =  {
            action      : 'lpFormError',
            product_id  : product_id,
            lp_form_url : lp_form_url,
            lp_form_key : lp_form_key,
            status      : status
        };

        $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
            if(originalOptions.type.toLowerCase() == 'post'){
                options.data = jQuery.param($.extend(originalOptions.data||{}, {
                    timeStamp: new Date().getTime()
                }));
            }
        });

        $.ajax({
            type : 'post',
            url  : ref.ajax_url,
            dataType: 'json',
            data : params,
            async : true, // 非同期通信させる
            headers: {
                'pragma': 'no-cache'
            },
            timeout : 10000,
            success : function(r){
                if(!r){
                    return false;
                }
                if(r.valid == false){
                    return false;
                }
            },
        });
    }
};

lp.init();


function lp_init(product_id, quantity, errors){
    lp.checkLp(product_id);

    lp.product_id = product_id;
    lp.quantity = quantity;
    lp.fetch_data(product_id, quantity, errors);
}

function setUserInfo(){
	lp.validate_flg = false; // バリデートは毎回行うため初期化
    var form = $('#form1').serializeArray();
    var param = {action : 'validateAmazonPay', amazon_pay_flg : 1};
    $(form).each(function(i, v) {
        if (v.value) {
            param[v.name] = v.value;
        }
    });
    lp.validateLp(param);
    return lp.validate_flg;
}


// GET値を取得する
function getQueryString()
{
    var result = {};
    if( 1 < window.location.search.length )
    {
        var query = window.location.search.substring( 1 );

        var parameters = query.split( '&' );

        for( var i = 0; i < parameters.length; i++ )
        {
            var element = parameters[ i ].split( '=' );

            var paramName = decodeURIComponent( element[ 0 ] );
            var paramValue = decodeURIComponent( element[ 1 ] );

            result[ paramName ] = paramValue;
        }
    }
    return result;
}

// JSでエラー起こったとき用
function error_h(a,b,c){
    /*console.log(a);
    console.log(b);
    console.log(c);*/
    alert('エラーが発生しました。お手数ですが画面をリロード(再読込み)してください。');
    $('#confirm_submit').hide(); // この処理は必要ないかもしれないなあ
}

// site.jsの同名関数に問題があるので再定義
function fnModeSubmit(mode, keyname, keyid) {
    document.form1['mode'].value = mode;
    if(keyname != "" && keyid != "") {
        document.form1[keyname].value = keyid;
    }
    document.form1.submit();
}
