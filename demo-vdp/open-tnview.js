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
 * @param {Function} updateVisibility - 컨테이너 표시 업데이트 함수
 */
export function openTnViewProject(client_env, ps_code, project_id, callback, updateVisibility) {
    open_tnview(client_env, ps_code, project_id, callback);
    client_env.isProjectOpen = true;
    updateVisibility();
}


/**
 * TnView를 엽니다.
 * @param {Object} client_env - 클라이언트 환경 객체 (editor, user_token 등 포함)
 * @param {string} ps_code - 제품 사양 코드 (Product Spec Code)
 * @param {string} project_id - 프로젝트 식별자
 * @param {Function} callbackForTnView - TnView 이벤트 처리를 위한 콜백 함수
 */
function open_tnview(client_env, ps_code, project_id, callbackForTnView) {
    let { editor } = client_env;

	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (client_env.isProjectOpen) {
		console.log('기존 편집기를 닫고 새로운 프로젝트를 엽니다...')
		editor.close({
			parent_element: client_env.parent_element
		})
		client_env.isProjectOpen = false;
	}

	let params = {
		parent_element: client_env.parent_element,
		token: client_env.user_token,
		ps_code: ps_code,
		prjid: project_id,
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
 * TnView 콜백 생성 팩토리 함수
 * @param {Object} dependencies - 콜백에서 사용할 의존성 객체
 * @param {Object} dependencies.client_env - 클라이언트 환경
 * @param {Object} dependencies.projectInfo - 프로젝트 정보
 * @param {Function} dependencies.setVarItems - varItems 설정 함수
 * @param {Function} dependencies.setTnViewCatalog - tnViewCatalog 설정 함수
 * @param {Function} dependencies.setupPageSizes - 페이지 사이즈 설정 함수
 */
export function createTnViewCallback(dependencies) {
    const { client_env, projectInfo, setVarItems, setTnViewCatalog, setupPageSizes } = dependencies;

    return async function callbackForTnView(err, data) {
        if (data.action == 'ready-to-listen') {
            console.log('ready-to-listen')
        }
        else if (data.action == 'doc-changed') {			
            let vdp_catalog = data.info.vdp_catalog;
            if (vdp_catalog) {
                const varItems = getVariableInfo(vdp_catalog)
                console.log('varItems: ', varItems)
                setVarItems(varItems);

                let tnViewCatalog;
                if (projectInfo && projectInfo.vdpdata) 
                    tnViewCatalog = JSON.parse(projectInfo.vdpdata)
                else					
                    tnViewCatalog = handle_vdp_catalog(vdp_catalog);				
                console.log('tnViewCatalog: ', tnViewCatalog)
                setTnViewCatalog(tnViewCatalog);
            }

            setupPageSizes(data);
        }
        else if (data.action === 'open-report' && data.info.status === 'end') { 
            // edicus의 로딩프로그레스가 끝나면 tnview를 보여준다. 대략 1초 기다림.
            // setTimeout(() => {
            // }, 1000)
        }
        else if (data.action === 'save-doc-report' && data.info.status === 'end') {
            // let projectUpdateInfo:CartUpdate = {
            // 	vdpdata: JSON.stringify(tnViewCatalog)
            // }
            // if (data.info.docInfo.tnUrlList && data.info.docInfo.tnUrlList.length > 0) {
            // 	projectUpdateInfo.tnUrl = data.info.docInfo.tnUrlList[0]				
            // }				

            // await cloudIf.supa.updateCartItem(
            // 	projectInfo.id,
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
