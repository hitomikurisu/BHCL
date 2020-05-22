// トークン取得済み数
var token_result_num = 0;
// トークン取得数
var get_token_num = 0;
// トークン生成鍵
var token_generation_key;
// 取得失敗数
var acquisition_failure_num;

var promise = Promise.resolve();
var dfd;

var form;

var submitf = true;

var lock = 0;

var cvc_exists; // セキュリティコードの有無

/**
 * Paygent トークン取得後POST
 * @param  string merchant_id
 * @param  string key トークン生成鍵
 * @param  int    token_num      トークン取得数
 */
function paygent_send(merchant_id, key, token_num, submit_flg, form_name_val) {
    if(lock > 0){
        throw new Error('時間を置いて実行してください');
    }
    form_name = form_name_val === undefined ? 'form1' : form_name_val;
    appendUsePaygentTokenTag(form_name);
    setMask('paygent_send');
    form = $('[name=' + form_name + ']');
    submitf = submit_flg;
    token_generation_key = key;

    // セキュリティコード有無
    cvc_exists = $('input[name=security_code]').length ? true : false;

    $('input[name="card_save_flg"]').attr('disabled' , false);
    // 登録カード使用時
    if ($("[name=use_card_type]:checked").val() == 2) {
        // セキュリティコードあり セキュリティコードのみトークン取得
        if (cvc_exists) {
            getPaygentOnlyCvcToken(merchant_id);
            return;
        // セキュリティコードなし トークン処理必要なし
        } else {
            deleteFormInput();
            doSubmit();
            return;
        }
    }

    get_token_num = token_num;

    // カードNO取得 分割されている場合は連結
    if ($('input[name=card_no]').length) {
        // card_number = $('[name=card_no]', form).val();
        card_number = $('input[name=card_no]').val();
    } else {
        card_number = $('input[name=card_no1]').val() + $('input[name=card_no2]').val() + $('input[name=card_no3]').val() + $('input[name=card_no4]').val();
    }

    // カード情報がない そのままsubmit
    if (!card_number.length) {
        doSubmit();
        return;
    }

    expire_year = $('select[name=card_expiration_year]').val();
    expire_month = $('select[name=card_expiration_month]').val();
    cvc = cvc_exists ? $('input[name=security_code]').val() : '';
    name = $('input[name=card_holder_name1]').val() + ' ' + $('input[name=card_holder_name2]').val();
    card_param = {
                // card_number : form.card_no1.value + form.card_no2.value + form.card_no3.value + form.card_no4.value, //クレジットカード番号
                card_number : card_number, //クレジットカード番号
                expire_year : expire_year, //有効期限-YY
                expire_month : expire_month, //有効期限-MM
                cvc : cvc, //セキュリティーコード
                name : name //カード名義
            };
    // バリデート
    error_messages = validCardParam(card_param);
    // エラー表示
    if (error_messages.length > 0) {
        dispErrorMessage(error_messages);
        removeMask('paygent_send');
        return;
    }

    for (var i = 0; i < get_token_num; i++) {
        getPaygentToken(merchant_id, token_generation_key, card_param);
    }
}

/**
 * 購入経路に従ってエラーメッセージ表示
 * @param  array error_messages 出力エラー文言配列
 */
function dispErrorMessage(error_messages)
{
    // PCフロント
    if ($('.btn_area_n2').length) {
        $('.attention', $('.btn_area_n2')).remove();
        for (var i in error_messages) {
            $('.btn_area_n2').prepend($('<div />').attr('class', "attention").html(error_messages[i]));
        }
    // PC MYページ
    } else if ($('.btn_area_l2').length) {
        $('.attention', $('.btn_area_l2')).remove();
        for (var i in error_messages) {
            $('.btn_area_l2').prepend($('<div />').attr('class', "attention").html(error_messages[i]));
        }
    // LP(PC/SMP)
    } else if ($('#alert_errors').length) {
        $('#alert_errors').empty();
        for (var i in error_messages) {
            $('#alert_errors').prepend($('<div />').html('※ ' + error_messages[i]));
        }
        $('#alert_errors').show();
    //SMPフロント
    } else if ($('.btn_area').length) {
        $('.attention', $('.btn_area')).remove();
        $('.btn_area').prepend($('<div />').attr('class', "attention").html(error_messages[i]));
    //SMP MYページ
    } else if ($('.mg_newbtn').length) {
        $('.attention', $('.mg_newbtn').parent()).remove();
        for (var i in error_messages) {
            $('.mg_newbtn').parent().prepend($('<li>').attr('class', "attention").html(error_messages[i]));
        }
    }
}

/**
 * カード情報バリデート
 * @param  array card_param カード情報
 * @return array            エラー文言配列
 */
function validCardParam(card_param)
{
    var error_message = [];
    card_number_rule  = new RegExp(/^[0-9]{13,16}$/); // カード番号
    expire_year_rule  = new RegExp(/^[0-9]{2}$/); // 有効期限(年)
    expire_month_rule = new RegExp(/^(0[1-9]|1[0-2])$/); // 有効期限(月)
    name_rule         = new RegExp(/^[a-zA-Z0-9ｦ-ﾟ\x20]{2,64}$/); // カード名義
    cvc_rule          = new RegExp(/^[0-9]{1,4}$/); // セキュリティコード

    // カード番号
    if (!card_number_rule.test(card_param['card_number'])) {
        error_message.push('カード番号が不正です。カード番号は半角数字13桁以上で入力してください。');
    }
    // 有効期限(年)
    if (!expire_year_rule.test(card_param['expire_year'])) {
        error_message.push('有効期限(年)が不正です。');
    }
    // 有効期限(月)
    if (!expire_month_rule.test(card_param['expire_month'])) {
        error_message.push('有効期限(月)が不正です。');
    }
    // カード名義
    if (!name_rule.test(card_param['name'])) {
        error_message.push('カード名義が不正です。半角英数カナ・スペースで入力してください。');
    }
    // セキュリティコード有り設定時、セキュリティコードもチェック
    if (cvc_exists && !cvc_rule.test(card_param['cvc'])) {
        error_message.push('セキュリティコードが不正です。半角数字4桁以内で入力してください。');
    }
    return error_message;
}

function setMask(mask_id)
{
    //画面マスク生成
    lock = 1;
    var divTag = $('<div />').attr('id', mask_id);
    var loadingTag = $('<div />').html('<i class="fa fa-fw fa-spinner fa-spin fa-2x blue"></i>');
    loadingTag.css("position", "fixed")
              .css('top', '50%')
              .css('left', '50%')
              .css('margin', '-50px 0 0 -50px')
              .css('width' , '50px')
              .css('height' , '50px');
    divTag.css("z-index", "999")
              .css("position", "absolute")
              .css('width' , $(document).width())
              .css('height' , $(document).height())
              .css("top", "0px")
              .css("left", "0px")
              .css("right", "0px")
              .css("bottom", "0px")
              .css("background-color", "gray")
              .css("opacity", "0.5")
              .append(loadingTag);
    $('body').append(divTag);
}

function removeMask(mask_id)
{
    $('#' + mask_id).remove();
    lock = 0;
}

function doSubmit()
{
    form.submit();
}

function getPaygentToken(merchant_id, token_generation_key, card_param)
{
    var paygentToken = new PaygentToken(); //PaygentTokenオブジェクトの生成
    paygentToken.createToken(
        merchant_id, //第１引数：マーチャントID
        token_generation_key, //第２引数：トークン生成鍵
        card_param, //第３引数：クレジットカード情報
        execPurchase = function execPurchase(response){ //第４引数：コールバック関数(トークン取得後に実⾏)
            if (response.result == '0000') { //トークン処理結果が正常の場合
                form.append($('<input/>', {type: 'hidden', name: 'token[' + token_result_num + ']', value: response.tokenizedCardObject.token}));
                form.append($('<input/>', {type: 'hidden', name: 'masked_card_number[' + token_result_num + ']', value: response.tokenizedCardObject.masked_card_number}));
                token_result_num++;

                if (token_result_num >= get_token_num) {
                    deleteFormInput();
                    doSubmit();
                }
            } else { //トークン処理結果が異常の場合
                removeMask('paygent_send');
                throw new Error(response.result);
            }
        }
    );
}

function execPurchase(response) {
    if (response.result == '0000') { //トークン処理結果が正常の場合
        form.append($('<input/>', {type: 'hidden', name: 'token[' + token_result_num + ']', value: response.tokenizedCardObject.token}));
        form.append($('<input/>', {type: 'hidden', name: 'masked_card_number[' + token_result_num + ']', value: response.tokenizedCardObject.masked_card_number}));
        token_result_num++;

        if (token_result_num >= get_token_num) {
            deleteFormInput();
            doSubmit();
        }
    } else { //トークン処理結果が異常の場合
        removeMask('paygent_send');
        throw new Error(response.result);
    }
}

function deleteFormInput()
{
    $('[name=card_no]', form).removeAttr('name');
    $('[name=card_no1]', form).removeAttr('name');
    $('[name=card_no2]', form).removeAttr('name');
    $('[name=card_no3]', form).removeAttr('name');
    $('[name=card_no4]', form).removeAttr('name');
    $('[name=card_expiration_year]', form).removeAttr('name');
    $('[name=card_expiration_month]', form).removeAttr('name');
    $('[name=card_holder_name1]', form).removeAttr('name');
    $('[name=card_holder_name2]', form).removeAttr('name');
}

function onError(error_result) {
    $('hidden[name^=token]').removeAttr('name');
    $('hidden[name^=masked_card_number]').removeAttr('name');
    alert('通信に失敗しました。もう一度「完了」ボタンを押してください' + "\n" + 'error:' + error_result);
}

/**
 * セキュリティコードのみトークン取得
 * 一つで良いはずなので複数には非対応
 * @param {string} merchant_id マーチャントID
 */
function getPaygentOnlyCvcToken(merchant_id)
{
    cvc = $('input[name=security_code]').val();
    card_param = {
        cvc : cvc, //セキュリティーコード
    };

    // バリデート
    error_messages = validCardOnlyCvcParam(card_param);

    // エラー表示
    if (error_messages.length > 0) {
        dispErrorMessage(error_messages);
        removeMask('paygent_send');
        return;
    }

    createCvcToken(merchant_id, token_generation_key, card_param);
}

/**
 * CVC用バリデート処理
 * @param  array card_param カード情報
 * @return array            errer内容
 */
function validCardOnlyCvcParam(card_param)
{
    var error_message = [];
    cvc_rule          = new RegExp(/^[0-9]{1,4}$/); // セキュリティコード

    // セキュリティコード有り設定時、セキュリティコードもチェック
    if (cvc_exists && !cvc_rule.test(card_param['cvc'])) {
        error_message.push('セキュリティコードが不正です。半角数字4桁以内で入力してください。');
    }
    return error_message;
}

/**
 * PaygetnよりCVSのみのトークンを取得
 * @param string merchant_id          マーチャントID
 * @param string token_generation_key トークン生成鍵
 * @param array  card_param           カード情報
 */
function createCvcToken(merchant_id, token_generation_key, card_param)
{
    var paygentToken = new PaygentToken(); //PaygentTokenオブジェクトの生成
    paygentToken.createCvcToken(
        merchant_id,          //第１引数：マーチャントID
        token_generation_key, //第２引数：トークン生成鍵
        card_param,           //第３引数：クレジットカード(CVCのみ)情報
        execPurchase = function execPurchase(response){
            if (response.result == '0000') { //トークン処理結果が正常の場合
                form.append($('<input/>', {type: 'hidden', name: 'cvc_token[0]', value: response.tokenizedCardObject.token}));
                deleteFormInput();
                doSubmit();
            } else { //トークン処理結果が異常の場合
                removeMask('paygent_send');
                throw new Error(response.result);
            }
        }
    );
}

