/**
 * 편집기 열기 모듈
 */

import * as server from './server.js';

/**
 * 프로젝트 열기
 * @param {Object} context - Context 객체
 */
export function openEditor(context) {
    let { editor } = context.client_env;
	
	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (context.isProjectOpen) {
		console.log('기존 편집기를 닫고 새로운 프로젝트를 엽니다...')
		context.closeEditor();
	}

	var params = {
		partner: context.client_env.partner,
		mobile: context.mobile,
		parent_element: context.client_env.parent_element,
		token: context.client_env.user_token,
		prjid: context.projectId,
		// run_mode: '',
		// edit_mode: ''
	}

    const callback = createCallback(context);
	editor.open_project(params, callback);
    context.showEditor();
}

/**
 * 콜백 생성 함수
 * @param {Object} context 
 */
function createCallback(context) {
    return function(err, data) {
        console.log('callback data: ', data)

        const action = data.action;

        if (action == 'close' || action == 'goto-cart') {
            handleClose(context);
        }
        else if (action == 'save-doc-report' && data.info.status === 'end') {
            handleSaveDocReport(data);
        }
        else if (action == 'request-help-message') {
            handleRequestHelpMessage(data);
        }
        else if (action == 'request-user-token') {
            handleRequestUserToken(context);
        }
    }
}

// =============================================================================
// Action Handler Functions
// =============================================================================

function handleClose(context) {
    context.closeEditor();
}

function handleSaveDocReport(data) {
    // 저장직후 여러 결과물을 확인 가능. 
    /*
        참고
            저장직전 : https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.t5ibodidcrng
            저장직후 : https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.etcff8vztldb
    */

    console.log('[save-doc-report] data.info.docInfo:', data.info.docInfo)
}

function handleRequestHelpMessage(data) {
    // mobile모드에서 사진탭의 도움말 버튼을 클릭한 경우 이벤트 발생 (자체 도움 메시지 출력용)
    /* 참고
        https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#bookmark=id.k1dp1go7tw63
    */
    if (data.info.case == 'photo-import')
        alert("received 'request-help-message(photo-import)' action")
}

function handleRequestUserToken(context) {
    // Edicus로 부터 user token요청을 받으면 "send-token" action으로 대응한다.
    /* 참고
        https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.ctloxkjukfm
    */
    const { editor, uid } = context.client_env;

    server.get_custom_token(uid).then(data => {
        context.client_env.user_token = data.token;
        $('#action-log').text('user token received.')

        let info = {
            token: data.token
        }
        editor.post_to_editor("send-user-token", info)
    }).catch(err => {
        console.error('Failed to get custom token:', err);
    })
}
