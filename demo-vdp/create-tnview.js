import * as server from './server.js';

/**
 * 제품 생성 함수
 * @param {Object} context - Context 객체 (vdpUtil, setupPageSizes, build_form_fields 등 포함)
 * @param {Object} obj - 템플릿 객체 (ps_code, template_uri, title 포함)
 */
export function createTnViewProject(context, obj) {
	context.vdpUtil.reset();
    context.orderId = null;

    // 프로젝트가 이미 열려있으면 먼저 닫기
	if (context.isProjectOpen) {
		context.client_env.editor.close({
			parent_element: context.client_env.parent_element
		})
		context.hideEditor();
	}

	var params = {
		parent_element: context.client_env.parent_element,
		partner: context.client_env.partner,
		mobile: false,		
		ps_code: obj.ps_code,
		template_uri: obj.template_uri,
		title: obj.title,
		token: context.client_env.user_token,
		npage: 2,
        flow: 'horizontal',
        zoom: {
            method: 'panzoom',
            maxScale: 5
        },
        options: {
            more_setting: {
                gap: 8,
                padding: 0,
                page_fx: 'none',
                show_loading_init: true,
                show_loading_set: false,
                background_color: '#f0f0f0'
            }
        }
	}
	const callback = createCallback(context);
	context.client_env.editor.create_tnview(params, callback)
	
	// 프로젝트 열림 상태로 설정
	context.showEditor();
}

/**
 * create_tnview 콜백 생성 함수
 * @param {Object} context - Context 객체 (vdpUtil, setupPageSizes 등 포함)
 */
export function createCallback(context) {
    return function callbackForCreateTnView(err, data) {
        if (err) {
            console.error("Error in create_tnview callback:", err);
            return;
        }

        // 이벤트 핸들러 매핑
        if (data.action === 'create-report' && data.info.status === 'start') {
            handleCreateReportStart(data);
        }
        else if (data.action == 'doc-changed') {			
            handleDocChanged(context, data);
        }  
        else if (data.action == 'project-id-created') {
            handleProjectIdCreated(context, data);
        }
        else if (data.action === 'create-report' && data.info.status === 'end') {
            handleCreateReportEnd(data);
        }
        else if (data.action === 'save-doc-report' && data.info.status === 'end') {
            handleSaveDocReport(context, data);
        }
        else if (data.action == 'close' || data.action == 'goto-cart') {
            handleCloseOrGotoCart(context);
        }
        else if (data.action == 'request-user-token') {
            handleRequestUserToken(context);
        }
    }
}

// --- Event Handlers ---

function handleCreateReportStart(data) {
    // 편집기 생성 초기 단계
}

function handleDocChanged(context, data) {
    // 편집기로 부터 vdp관련 변수정보를 전달받는다.
    context.setupPageSizes(data, context.client_env.parent_element);

    let vdp_catalog = data.info.vdp_catalog;
    // console.log("vdp_catalog", vdp_catalog)
    if (vdp_catalog) {
        context.vdpUtil.setVdpCatalog(vdp_catalog);
        context.build_form_fields();
    }
}

function handleProjectIdCreated(context, data) {
    console.log('project-id-created: ', data.info.project_id)
    context.projectId = data.info.project_id;
    context.orderId = null;
    // 고객사 DB에 필요한 정보 저장
}

function handleCreateReportEnd(data) {
    // 처리 로직 없음
}

function handleSaveDocReport(context, data) {
    // 저장되는 프로젝트의 여러 정보(썸네일등)를 data로 전달받는다.
    console.log('handleSaveDocReport', data);

    if (data.info.docInfo.tnUrlList && data.info.docInfo.tnUrlList.length > 0) {
        console.log("대표 썸네일 Url:", data.info.docInfo.tnUrlList[0]);
    }
}

function handleCloseOrGotoCart(context) {
    context.client_env.editor.destroy({
        parent_element: context.client_env.parent_element,        
    })
    context.hideEditor();
}

function handleRequestUserToken(context) {
    // Edicus로 부터 user token요청을 받으면 "send-user-token" action으로 대응한다.
    server.get_custom_token(context.client_env.uid).then(data => {
        context.client_env.user_token = data.token;

        let info = {
            token: data.token
        }
        context.client_env.editor.post_to_editor("send-user-token", info)
    }).catch(err => {
        console.error('Failed to get custom token:', err);
    })
}
