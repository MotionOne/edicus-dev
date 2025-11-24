/**
 * TnView 열기 및 콜백 처리 모듈
 */

import * as server from './server.js';


/**
 * TnView 프로젝트 열기
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 * @param {string} ps_code - 제품 코드
 */
export function openTnViewProject(context, ps_code) {
	const callback = createCallback(context);
    open_tnview(context, ps_code, callback);
    context.showEditor();
}


/**
 * TnView를 엽니다.
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 * @param {string} ps_code - 제품 사양 코드 (Product Spec Code)
 * @param {Function} callback - TnView 이벤트 처리를 위한 콜백 함수
 */
function open_tnview(context, ps_code, callback) {
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
		ps_code: ps_code,
		prjid: context.projectId,
		npage: 2,
		flow: 'horizontal',
		//data_row: initial_row,
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

	editor.open_tnview(params, callback)
}


/**
 * TnView 콜백 생성 함수
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 * @param {string} projectId - 프로젝트 ID
 */
function createCallback(context) {
    return async function callbackForTnView(err, data) {
        if (data.action == 'ready-to-listen') {
            console.log('ready-to-listen')
        }
        else if (data.action == 'doc-changed') {			
            context.setupPageSizes(data);

            let vdp_catalog = data.info.vdp_catalog;
            if (vdp_catalog) {
                context.vdpUtil.setVdpCatalog(vdp_catalog);
                context.build_form_fields();
            }

        }
        else if (data.action === 'open-report' && data.info.status === 'end') { 
            // edicus의 로딩프로그레스가 끝나면 tnview를 보여준다. 대략 1초 기다림.
            // setTimeout(() => {
            // }, 1000)
        }
        else if (data.action === 'save-doc-report' && data.info.status === 'end') {
            // let projectUpdateInfo:CartUpdate = {
            // 	vdpdata: JSON.stringify(context.tnViewCatalog)
            // }
            // if (data.info.docInfo.tnUrlList && data.info.docInfo.tnUrlList.length > 0) {
            // 	projectUpdateInfo.tnUrl = data.info.docInfo.tnUrlList[0]				
            // }				

            // await cloudIf.supa.updateCartItem(
            // 	context.projectId,
            // 	projectUpdateInfo)

            // dispatch('saved');
        }
        else if (data.action == 'request-user-token') {
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

        console.log("=====>", data.action, data.info)
    }
}
