/**
 * TnView 열기 및 콜백 처리 모듈
 */

import * as server from './server.js';
import { handle_vdp_catalog, getVariableInfo } from './vdp-catalog.js';


/**
 * TnView 프로젝트 열기
 * @param {Object} client_env - 클라이언트 환경
 * @param {string} ps_code - 제품 코드
 * @param {string} project_id - 프로젝트 ID
 * @param {Function} callback - 콜백 함수
 */
export function openTnViewProject(client_env, context, ps_code) {
	const callback = createTnViewCallback(client_env, context);
    open_tnview(client_env, context, ps_code, callback);
    context.isProjectOpen = true;
    context.updateEditorContainerVisibility(client_env.parent_element);
}


/**
 * TnView를 엽니다.
 * @param {Object} client_env - 클라이언트 환경 객체 (editor, user_token 등 포함)
 * @param {string} ps_code - 제품 사양 코드 (Product Spec Code)
 * @param {string} project_id - 프로젝트 식별자
 * @param {Function} callbackForTnView - TnView 이벤트 처리를 위한 콜백 함수
 */
function open_tnview(client_env, context, ps_code, callbackForTnView) {
    let { editor } = client_env;

	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (context.isProjectOpen) {
		console.log('기존 편집기를 닫고 새로운 프로젝트를 엽니다...')
		editor.close({
			parent_element: client_env.parent_element
		})
		context.isProjectOpen = false;
		context.updateEditorContainerVisibility(client_env.parent_element);
		context.removeAllFormFields();
	}

	let params = {
		parent_element: client_env.parent_element,
		token: client_env.user_token,
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

	editor.open_tnview(params, callbackForTnView)
}


/**
 * TnView 콜백 생성 함수
 * @param {Object} client_env - 클라이언트 환경
 * @param {Object} context - Context 객체 (varItems, tnViewCatalog, setupPageSizes, build_form_fields 등 포함)
 * @param {string} projectId - 프로젝트 ID
 */
export function createTnViewCallback(client_env, context) {
    return async function callbackForTnView(err, data) {
        if (data.action == 'ready-to-listen') {
            console.log('ready-to-listen')
        }
        else if (data.action == 'doc-changed') {			
            let vdp_catalog = data.info.vdp_catalog;
            if (vdp_catalog) {
                const varItems = getVariableInfo(vdp_catalog)
                console.log('varItems: ', varItems)
                context.varItems = varItems;

                let tnViewCatalog = handle_vdp_catalog(vdp_catalog);				
                console.log('tnViewCatalog: ', tnViewCatalog)
                context.tnViewCatalog = tnViewCatalog;
                context.build_form_fields(tnViewCatalog);
            }

            context.setupPageSizes(data, client_env.parent_element);
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
            server.get_custom_token(client_env.uid).then(data => {
                client_env.user_token = data.token;
                $('#action-log').text('user token received.')

                let info = {
                    token: data.token
                }
                client_env.editor.post_to_editor("send-user-token", info)
            }).catch(err => {
                console.error('Failed to get custom token:', err);
            })
        }    

        console.log("=====>", data.action, data.info)
    }
}
