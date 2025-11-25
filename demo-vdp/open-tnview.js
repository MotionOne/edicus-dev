/**
 * TnView 열기 및 콜백 처리 모듈
 */

import * as server from './server.js';


/**
 * TnView 프로젝트 열기
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 */
export function openTnViewProject(projectId, context) {
    context.loadVdpData(projectId);

	const callback = createCallback(context);
    open_tnview(context, callback);
    context.showEditor();
}

/**
 * TnView를 엽니다.
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 * @param {Function} callback - TnView 이벤트 처리를 위한 콜백 함수
 */
function open_tnview(context, callback) {

    let { editor } = context.client_env;

	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (context.isProjectOpen) {
		console.log('기존 편집기를 닫고 새로운 프로젝트를 엽니다...')
		editor.close({
			parent_element: context.client_env.parent_element
		})
		context.hideEditor();
		context.removeAllFormFields();
	}

	let params = {
		parent_element: context.client_env.parent_element,
		token: context.client_env.user_token,
		prjid: context.projectId,
		npage: 2,
		flow: 'horizontal',
		// data_row: initial_row, // VdpUil.getDataRows()로 얻은 값과 동일 포맷을 사용함.
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

    // 초기 데이터가 있으면 전달한다.
    if (context.vdpUtil.initialDataRows) {
        params.data_row = context.vdpUtil.initialDataRows;
    }

	editor.open_tnview(params, callback)
}


/**
 * TnView 콜백 생성 함수
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 * @param {string} projectId - 프로젝트 ID
 */
function createCallback(context) {
    return async function callbackForTnView(err, data) {
        const action = data.action;

        if (action == 'ready-to-listen') {
            handleReadyToListen();
        }
        else if (action == 'doc-changed') {			
            handleDocChanged(data, context);
        }
        else if (action === 'open-report' && data.info.status === 'end') { 
            handleOpenReport(data);
        }
        else if (action === 'save-doc-report' && data.info.status === 'end') {
            await handleSaveDocReport(data, context);
        }
        else if (action == 'request-user-token') {
            handleRequestUserToken(context);
        }    

        console.log("=====>", data.action, data.info)
    }
}

// =============================================================================
// Action Handler Functions
// =============================================================================

function handleReadyToListen() {
    console.log('ready-to-listen');
}

function handleDocChanged(data, context) {
    context.setupPageSizes(data);

    let vdp_catalog = data.info.vdp_catalog;
    if (vdp_catalog) {
        context.vdpUtil.setVdpCatalog(vdp_catalog);
        context.build_form_fields();
    }
}

function handleOpenReport(data) {
    // 편집기가 열리면 호촐됨
}

async function handleSaveDocReport(data, context) {
    // save하거나 편집기를 닫으면 호출됨 


    // let projectUpdateInfo:CartUpdate = {
    // 	vdpdata: JSON.stringify(context.tnViewCatalog)
    // }
    // if (data.info.docInfo.tnUrlList && data.info.docInfo.tnUrlList.length > 0) {
    // 	projectUpdateInfo.tnUrl = data.info.docInfo.tnUrlList[0]				
    // }				

    // await cloudIf.supa.updateCartItem(
    // 	context.projectId,
    // 	projectUpdateInfo)
}

function handleRequestUserToken(context) {
    // Edicus로 부터 user token요청을 받으면 "send-token" action으로 대응한다.
    /* 참고
        https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.ctloxkjukfm
    */
    server.get_custom_token(context.client_env.uid).then(data => {
        context.client_env.user_token = data.token;
        $('#action-log').text('user token received.')

        let info = {
            token: data.token
        }
        context.client_env.editor.post_to_editor("send-user-token", info)
    }).catch(err => {
        console.error('Failed to get custom token:', err);
    })
}
