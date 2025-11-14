/*
	DEVELOPER NOTICE
	- valila javascript 구문만 사용할 것. (ES6구문 사용 금지)
	- IE11등 하위 호환성을 위해.
	- 금지 대상 : let, =>, 등

	polyfill.js를 통해 Array의 forEAch(), find()추가 하였음.
*/

window.edicusSDK = { ver: '2.0.3' }

window.edicusSDK._create_context = function(config) {
    return {
        base_url: config.base_url || "https://edicusbase.firebaseapp.com",
        landing_path: "/ed#/editor_landing",
        tnview_path: "/ed#/tnview/landing",
        preview_path: "/ed#/preview/landing",
        lite_path: "/ed#/lite/landing",
        test_path: "/ed#/test/testpage",
        target_callback: null,
        iframe_el: null,
        messageListener: null,
        ddp_block: null,
        private_css: null,
        option_string: null,
        i18n: null,
        prod_info: null,
        options: null,
        data_row: null,
        data_feed: null,
        data_content: null,
        zoom: null,
        template_list: null
    }
}

window.edicusSDK.init = function(config) {
    var ctx = window.edicusSDK._create_context(config);

	// addEventListener는 IE11부터 사용가능. 이전은 attachEvent임
	ctx.messageListener = function(event) {		
		// console.log('received from iframe : ', event);
		/*	iframe내의 editor가 window.parent.postMessage()을 통해 message를 리턴하면,
			target_callback()을 호출한다.
		*/
		if (event.data && typeof event.data === 'string' && event.data.match(/^{.*}$/g)) {
			var data = JSON.parse(event.data);
			if (data && data.type && data.type.startsWith('from-edicus')) {
                if (data.type == 'from-edicus-private') {
                    if (data.action == "waiting-for-extra-param") {
                        var params = [];
                        for(var i=0; i<data.info.param_names.length; i++) {
                            if (data.info.param_names[i] == 'ddp_block')
                                params.push({ name: 'ddp_block', ddp_block: ctx.ddp_block });
                            else if (data.info.param_names[i] == 'private_css')
                                params.push({ name: 'private_css', private_css: ctx.private_css });
                            else if (data.info.param_names[i] == 'i18n')
                                params.push({ name: 'i18n', i18n: ctx.i18n });
                            else if (data.info.param_names[i] == 'prod_info')
                                params.push({ name: 'prod_info', prod_info: ctx.prod_info });
                            else if (data.info.param_names[i] == 'options')
                                params.push({ name: 'options', options: ctx.options });
                            else if (data.info.param_names[i] == 'option_string')
								params.push({ name: 'option_string', option_string: ctx.option_string });
                            else if (data.info.param_names[i] == 'data_row')
                                params.push({ name: 'data_row', data_row: ctx.data_row });
                            else if (data.info.param_names[i] == 'data_feed')
                                params.push({ name: 'data_feed', data_feed: ctx.data_feed });
                            else if (data.info.param_names[i] == 'data_content')
                                params.push({ name: 'data_content', data_content: ctx.data_content });
                            else if (data.info.param_names[i] == 'zoom')
                                params.push({ name: 'zoom', zoom: ctx.zoom });
                            else if (data.info.param_names[i] == 'template_list')
                                params.push({ name: 'template_list', zoom: ctx.template_list });								
                        }
                        var message = {
                            type: 'to-edicus-root',
                            action: 'send-extra-param',
                            info: { params: params }
                        }
                        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
                    }
                    else if (data.action == "waiting-for-ddp-data") {
                        var message = {
                            type: 'to-edicus-root',
                            action: 'send-ddp-data',
                            info: { ddp_block: ctx.ddp_block }
                        }
                        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
                    }
                } 
                else {
                    ctx.target_callback && ctx.target_callback(null, data);
                }
			}
		}
	}

    // 편집기만 종료할 경우 사용
    ctx.close = function(params) {
        if (ctx.iframe_el) {
            params.parent_element.removeChild(ctx.iframe_el);
            ctx.iframe_el = null;
        }
    }

    // ctx.init()에 대응하는 함수. 에디쿠스 초기화 자체를 종료함.
    ctx.destroy = function(params) {
        console.log('edicus destroy');
    
        if (ctx.messageListener) {
            window.removeEventListener('message', ctx.messageListener);
            ctx.messageListener = null;	
        }
    
        if (ctx.iframe_el) {
            params.parent_element.removeChild(ctx.iframe_el);
            ctx.iframe_el = null;
        }
    }
    
    /* debugging용으로 사용함. */
    ctx.open_portal = function(params, callback) {
        var target_url = ctx.base_url + 
            '/ed#/editor_portal?' +
            'cmd=open_portal' +
            '&token=' + params.token;
    
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;	
    }
    
    /* 	callback은 prject-id가 생성되면 1회 호출되고,
        종료될 때 callback이 또 호출 될 수 있음.
    */
    
    ctx._add_common_url_param = function(url, params) {
        url += 
            // environment
            (params.partner ? '&partner=' + params.partner : '') +									
            (params.mobile ? '&mobile=' + params.mobile : '') +									
            (params.div ? '&div=' + params.div : '') +									
            (params.lang ? '&lang=' + params.lang : '') +								// ko / en / ja : template 언어 설정
            (params.ui_locale ? '&ui_locale=' + params.ui_locale : '') +				// ko / en / ja : UI 언어 설정
            (params.editor_type ? '&editor_type=' + params.editor_type : '') +			// template / print : loading 최적화용
            (params.ui_style ? '&ui_style=' + params.ui_style : '') +					// tab-less / tab-top-less
            (params.parent_type ? '&parent_type=' + params.parent_type : '') +			// .. / web_in_app : 모바일 환경 설정
            (params.env_mode ? '&env_mode=' + params.env_mode : '') +					// .. / dev / demo: 개발 모드 설정
            (params.run_mode ? '&run_mode=' + params.run_mode : '') +					// .. / passive : passive 모드 설정
            (params.master_mode ? '&master_mode=' + params.master_mode : '') +			// .. / view / edit : 마스터 모드 권한
    
            (params.edit_mode ? '&edit_mode=' + params.edit_mode : '') +				// FIXME 호환성 때문에 남겨둠. 삭제해야 함
    
            // order / page control
            (params.num_page ? '&num_page=' + params.num_page : '') +
            (params.max_page ? '&max_page=' + params.max_page : '') +
            (params.min_page ? '&min_page=' + params.min_page : '') +
            (params.unit_page ? '&unit_page=' + params.unit_page : '') +				// deprecated
            (params.max_order ? '&max_order=' + params.max_order : '') +
            (params.min_order ? '&min_order=' + params.min_order : '') +
    
            // editing control
            (params.force_plugin ? '&force_plugin=' + params.force_plugin : '') +
            (params.plugin_param ? '&plugin_param=' + params.plugin_param : '') +
            (params.resapi_param ? '&resapi_param=' + params.resapi_param : '') +
            (params.unlayers ? '&unlayers=' + params.unlayers : '') +
            (params.edit_lock ? '&edit_lock=' + params.edit_lock : '') +				// edit-group / set-strict-color / no-font-preview
            (params.no_update ? '&no_update=' + params.no_update : '') +
            (params.clear_src ? '&clear_src=' + params.clear_src : '') +
            (params.cal_date ? '&cal_date=' + params.cal_date : '') +					 
            (params.video_frames ? '&video_frames=' + params.video_frames : '') +
    
            // deffered param
            (params.ddp_block ? '&wait_ddp=true': '') +
            (params.private_css ? '&wait_private_css=true': '') +
            (params.prod_info ? '&wait_prod_info=true': '') +
            (params.options ? '&wait_options=true': '') +
            (params.option_string ? '&wait_option_string=true': '') +
    
            // for development 
            (params.dev_apiHost ? '&dev_apiHost=' + params.dev_apiHost : '') +
            (params.dev_assetHost ? '&dev_assetHost=' + params.dev_assetHost : '') +
            (params.dev_uploadHost ? '&dev_uploadHost=' + params.dev_uploadHost : '') +
            (params.dev_resHost ? '&dev_resHost=' + params.dev_resHost : '');
            
        return url;
    }
    
    ctx.create_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path + 
            '?cmd=create' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            '&title=' + encodeURIComponent(params.title) +
            (params.ps_code_param ? '&ps_code_param=' + params.ps_code_param : '') +
            (params.template_uri ? '&template_uri=' + params.template_uri : '') +
            (params.content_uri ? '&content_uri=' + params.content_uri : '');
    
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.open_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path +
            '?cmd=open' +
            '&token=' + params.token +
            (params.ps_code ? '&ps_code=' + params.ps_code : '') +
            '&prjid=' + params.prjid;
            
        ctx.target_callback = callback  ;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.edit_template = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path +
            '?cmd=edit-template' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            (params.prjid ? '&prjid=' + params.prjid : '') +
            (params.template_uri ? '&template_uri=' + params.template_uri : '') +
            (params.content_uri ? '&content_uri=' + params.content_uri : '');
        
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.create_design_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path + 
            '?cmd=create-design-project' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            '&title=' + encodeURIComponent(params.title) +
            (params.template_uri ? '&template_uri=' + params.template_uri : '');
    
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.open_design_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path +
            '?cmd=open-design-project' +
            '&token=' + params.token +
            (params.ps_code ? '&ps_code=' + params.ps_code : '') +
            '&prjid=' + params.prjid;
            
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.recycle_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path + 
            '?cmd=recycle' +
            '&token=' + params.token +
            '&prjid=' + params.prjid +
            '&title=' + encodeURIComponent(params.title);
    
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.reform_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path + 
            '?cmd=reform' +
            '&token=' + params.token +
            '&prjid=' + params.prjid +
            '&ps_code=' + params.ps_code;
    
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }
    
    ctx.fit_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.landing_path + 
            '?cmd=fit' +
            '&token=' + params.token +
            '&prjid=' + params.prjid +
            '&ps_code=' + params.ps_code +
            '&base_template_uri=' + params.base_template_uri +
            (params.content_overwrite ? '&content_overwrite=' + params.content_overwrite : '');
    
        ctx.target_callback = callback;
        target_url = ctx._add_common_url_param(target_url, params);
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
    }

    ctx.change_project = function(projectID) {
        var message = {
            type: 'to-edicus-root',
            action: 'change-project',
            info: {
                project_id: projectID,
            }
        }
        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
    }

    ctx.change_template_v2 = function(option) {
        var message = {
            type: 'to-edicus-root',
            action: 'change-template',
            info: {
                ps_code: option.psCode,
                template_uri: option.template_uri,
                content_uri: option.content_uri,
                command: option.command
            }
        }
        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
    }

    ctx.change_template = function(psCode, template_uri) {
        var message = {
            type: 'to-edicus-root',
            action: 'change-template',
            info: {
                ps_code: psCode,
                template_uri: template_uri
            }
        }
        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
    }

    ctx.execute_ddp_block = function(ddp_block, history_label) {
        var info = { 
            ddp_block: ddp_block,
            history_label: history_label
        };
        ctx.post_to_editor('execute-ddp-block', info);
    }
    
    ctx.open_preview = function(params, callback) {
        var target_url = ctx.base_url + ctx.preview_path +
            '?cmd=open' +
            '&token=' + params.token +
            (params.ps_code ? '&ps_code=' + params.ps_code : '') +
            '&partner=' + params.partner +
            '&uid=' + params.uid +
            '&prjid=' + params.prjid +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&npage=' + (params.npage || 1) +
            '&flow=' + (params.flow || 'horizontal') +
            '&mode=' + (params.mode || 'default') +
            (params.options ? '&wait_options=true': '') +
            (params.data_row ? '&wait_data_row=true': '') +
            (params.zoom ? '&wait_zoom=true': '');
            
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.show_tnview = function(params, callback) {
        var target_url = ctx.base_url + ctx.tnview_path +
            '?cmd=show' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            '&template_uri=' + params.template_uri +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&npage=' + (params.npage || 1) +
            '&flow=' + (params.flow || 'horizontal') +
            (params.options ? '&wait_options=true': '') +
            (params.data_row ? '&wait_data_row=true': '') +
            (params.zoom ? '&wait_zoom=true': '') +
            (params.rotate !== undefined && !params.rotate ? '&rotate=false': '') +
            (params.show3d !== undefined && params.show3d ? '&show3d=true': '');
    
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.create_tnview = function(params, callback) {
        var target_url = ctx.base_url + ctx.tnview_path +
            '?cmd=create' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            '&template_uri=' + params.template_uri +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&npage=' + (params.npage || 1) +
            '&flow=' + (params.flow || 'horizontal') +
            (params.options ? '&wait_options=true': '') +
            (params.data_row ? '&wait_data_row=true': '') +
            (params.zoom ? '&wait_zoom=true': '') +
            (params.rotate !== undefined && !params.rotate ? '&rotate=false': '') +
            (params.show3d !== undefined && params.show3d ? '&show3d=true': '');

        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.open_tnview = function(params, callback) {
        var target_url = ctx.base_url + ctx.tnview_path +
            '?cmd=open' +
            '&token=' + params.token +
            (params.ps_code ? '&ps_code=' + params.ps_code : '') +
            '&prjid=' + params.prjid +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&npage=' + (params.npage || 1) +
            '&flow=' + (params.flow || 'horizontal') +
            (params.options ? '&wait_options=true': '') +
            (params.data_row ? '&wait_data_row=true': '') +
            (params.zoom ? '&wait_zoom=true': '') +
            (params.rotate !== undefined && !params.rotate ? '&rotate=false': '') +
            (params.show3d !== undefined && params.show3d ? '&show3d=true': '');

        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.show_gallery = function(params, callback) {
        var target_url = ctx.base_url + ctx.tnview_path +
            '?cmd=gallery' +
            '&partner=' + params.partner +
            '&token=' + params.token +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&show_guide=' + (params.show_guide || false) + 
            (params.options ? '&wait_options=true': '') +
            (params.data_feed ? '&wait_data_feed=true': '') +
            (params.data_content ? '&wait_data_content=true': '') +
            (params.data_row ? '&wait_data_row=true': '');
    
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.create_lite_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.lite_path +
            '?cmd=create' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            '&template_uri=' + params.template_uri +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&uilocale=' + (params.uilocale || 'ko') + 
            (params.mobile ? '&mobile=' + params.mobile : '') +									
            (params.core_size_mm ? '&core_size_mm=' + params.core_size_mm : '') +
            (params.size_type ? '&size_type=' + params.size_type : '') +
            (params.round_mm ? '&round_mm=' + params.round_mm : '') +
            (params.num_page ? '&num_page=' + params.num_page : '') +
            (params.plugin_param ? '&plugin_param=' + params.plugin_param : '') +
            (params.edit_lock ? '&edit_lock=' + params.edit_lock : '') +				// edit-group 
            (params.private_css ? '&wait_private_css=true': '') +
            (params.i18n ? '&wait_i18n=true': '') +
            (params.prod_info ? '&wait_prod_info=true': '') +
            (params.options ? '&wait_options=true': '');
    
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.open_lite_project = function(params, callback) {
        var target_url = ctx.base_url + ctx.lite_path +
            '?cmd=open' +
            '&token=' + params.token +
            (params.ps_code ? '&ps_code=' + params.ps_code : '') +
            '&prjid=' + params.prjid +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&uilocale=' + (params.uilocale || 'ko') + 
            (params.mobile ? '&mobile=' + params.mobile : '') +									
            (params.plugin_param ? '&plugin_param=' + params.plugin_param : '') +
            (params.edit_lock ? '&edit_lock=' + params.edit_lock : '') +				// edit-group 
            (params.private_css ? '&wait_private_css=true': '') +
            (params.i18n ? '&wait_i18n=true': '') +
            (params.prod_info ? '&wait_prod_info=true': '') +
            (params.options ? '&wait_options=true': '');
    
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.show_lite_editor = function(params, callback) {
        var target_url = ctx.base_url + ctx.lite_path +
            '?cmd=show' +
            '&token=' + params.token +
            '&ps_code=' + params.ps_code +
            '&template_uri=' + params.template_uri +
            '&div=' + (params.div || 'host') +
            '&lang=' + (params.lang || 'ko') + 
            '&uilocale=' + (params.uilocale || 'ko') + 
            (params.mobile ? '&mobile=' + params.mobile : '') +		
            (params.core_size_mm ? '&core_size_mm=' + params.core_size_mm : '') +
            (params.size_type ? '&size_type=' + params.size_type : '') +
            (params.round_mm ? '&round_mm=' + params.round_mm : '') +							
            (params.num_page ? '&num_page=' + params.num_page : '') +
            (params.edit_lock ? '&edit_lock=' + params.edit_lock : '') +				// edit-group 
            (params.private_css ? '&wait_private_css=true': '') +
            (params.i18n ? '&wait_i18n=true': '') +
            (params.prod_info ? '&wait_prod_info=true': '') +
            (params.options ? '&wait_options=true': '');
    
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }
    
    ctx.show_test = function(params, callback) {
        var target_url = ctx.base_url + ctx.test_path +
            '?cmd=open' +
            '&token=' + params.token;
            
        ctx._set_deferred_params(params);
        ctx._build_iframe(target_url, params.parent_element);
        ctx.target_callback = callback;
    }

    ctx.post_to_editor = function(action, info) {
        var message = {
            type: 'to-edicus',
            action: action,
            info: info
        }
        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
    }
    
    ctx.post_to_tnview = function(action, info) {
        var message = {
            type: 'to-edicus-tnview',
            action: action,
            info: info
        }
        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
    }
    
    ctx.post_to_preview = function(action, info) {
        var message = {
            type: 'to-edicus-preview',
            action: action,
            info: info
        }
        ctx.iframe_el.contentWindow.postMessage(JSON.stringify(message), '*');
    }
    
    // for private use only
    ctx._build_iframe = function (target_url, parent_element) {
        ctx.iframe_el = document.createElement('iframe');
        ctx.iframe_el.setAttribute('src', target_url)
        ctx.iframe_el.setAttribute('frameborder', 0)
        ctx.iframe_el.style.width = "100%";
        ctx.iframe_el.style.height = "100%";
        parent_element.appendChild(ctx.iframe_el);
    } 
    
    ctx._set_deferred_params = function(params) {
        if (params.ddp_block) {
            console.log('detect_ddp', params.ddp_block)
            ctx.ddp_block = params.ddp_block;
        }
        else {
            ctx.ddp_block = null;
        }
    
        if (params.private_css) {
            console.log('detect_private_css', params.private_css)
            ctx.private_css = params.private_css;
        }
        else {
            ctx.private_css = null;
        }

        if (params.i18n) {
            console.log('detect_i18n', params.i18n)
            ctx.i18n = params.i18n;
        }
        else {
            ctx.i18n = null;
        }

        if (params.prod_info) {
            console.log('detect_prod_info', params.prod_info)
            ctx.prod_info = params.prod_info;
        }
        else {
            ctx.prod_info = null;
        }
    
        if (params.options) {
            console.log('detect_options', params.options)
            ctx.options = params.options;
        }
        else {
            ctx.options = null;
        }

        if (params.option_string) {
            console.log('detect_option_string', params.option_string)
            ctx.option_string = params.option_string;
        }
        else {
            ctx.option_string = null;
        }
    
        if (params.data_feed) {
            console.log('detect_date_feed', params.data_feed)
            ctx.data_feed = params.data_feed;
        }
        else {
            ctx.data_feed = null;
        }
    
        if (params.data_content) {
            console.log('detect_data_content', params.data_content)
            ctx.data_content = params.data_content;
        }
        else {
            ctx.data_content = null;
        }	

        if (params.data_row) {
            console.log('detect_initial_data_row', params.data_row)
            ctx.data_row = params.data_row;
        }
        else {
            ctx.data_row = null;
        }	
    
        if (params.zoom) {
            console.log('detect_zoom', params.zoom)
            ctx.zoom = params.zoom;
        }
        else {
            ctx.zoom = null;
        }
        
        if (params.template_list) {
            console.log('detect_template_list', params.template_list)
            ctx.template_list = params.template_list;
        }
        else {
            ctx.template_list = null;
        }
    }
    
	window.addEventListener('message', ctx.messageListener, false);
    return ctx;
}
