import * as server from './server.js';
import { handle_vdp_catalog } from './vdp-catalog.js';

/**
 * 제품 생성 함수
 * @param {Object} client_env - 클라이언트 환경 객체
 * @param {Object} obj - 템플릿 객체 (ps_code, template_uri, title 포함)
 * @param {Function} updateEditorContainerVisibility - 에디터 컨테이너 표시 업데이트 함수
 * @param {Function} callbackForCreateTnView - create_tnview 콜백 함수
 */
export function createTnViewProject(client_env, context, obj) {
	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (context.isProjectOpen) {
		client_env.editor.close({
			parent_element: client_env.parent_element
		})
		context.isProjectOpen = false;
		context.updateEditorContainerVisibility(client_env.parent_element);
	}

	var params = {
		parent_element: client_env.parent_element,
		partner: client_env.partner,
		mobile: false,		
		ps_code: obj.ps_code,
		template_uri: obj.template_uri,
		title: obj.title,
		token: client_env.user_token,
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
	const callback = createCreateTnViewCallback(client_env, context);
	client_env.editor.create_tnview(params, callback)
	
	// 프로젝트 열림 상태로 설정
	context.isProjectOpen = true;
	context.updateEditorContainerVisibility(client_env.parent_element);
}

/**
 * create_tnview 콜백 생성 함수
 * @param {Object} client_env - 클라이언트 환경 객체
 * @param {Object} context - Context 객체 (tnViewCatalog, setupPageSizes 등 포함)
 * @param {Function} updateEditorContainerVisibility - 에디터 컨테이너 표시 업데이트 함수
 */
export function createCreateTnViewCallback(client_env, context) {
    return function callbackForCreateTnView(err, data) {
        // 이벤트가 오는 순서대로임
        if (data.action === 'create-report' && data.info.status === 'start') {
        }
        else if (data.action == 'doc-changed') {			
            let vdp_catalog = data.info.vdp_catalog;
            console.log("vdp_catalog", vdp_catalog)
            if (vdp_catalog) {
                let newCatalog = handle_vdp_catalog(vdp_catalog);
                context.tnViewCatalog = newCatalog;
                context.build_form_fields(newCatalog);
                // dispatch('tnview-catalog', tnViewCatalog)
            }
    
            context.setupPageSizes(data, client_env.parent_element);
        }  
        else if (data.action == 'project-id-created') {
            console.log('project-id-created: ', data.info.project_id)
            context.projectId = data.info.project_id;
            // 고객사 DB에 필요한 정보 저장
        }
        else if (data.action === 'create-report' && data.info.status === 'end') {
        }
        else if (data.action === 'save-doc-report' && data.info.status === 'end') {
            // vdp data를 저장해야 함.
            console.log('tnViewCatalog: ', context.tnViewCatalog)
            
            let projectUpdateInfo = {
                vdp: JSON.stringify(context.tnViewCatalog)
            }			
            if (data.info.docInfo.tnUrlList && data.info.docInfo.tnUrlList.length > 0) {
                projectUpdateInfo.tnUrl = data.info.docInfo.tnUrlList[0]				
            }			
    
            console.log('projectUpdateInfo: ', projectUpdateInfo)
            /*
            await cloudIf.supa.updateCartItem(
                cartItem.id,
                projectUpdateInfo)
            dispatch('saved');
            */
        }
        else if (data.action == 'close' || data.action == 'goto-cart') {
            client_env.editor.destroy({
                parent_element: client_env.parent_element,        
            })
            context.isProjectOpen = false; 
            context.updateEditorContainerVisibility(client_env.parent_element);
        }
        else if (data.action == 'request-user-token') {
            // Edicus로 부터 user token요청을 받으면 "send-user-token" action으로 대응한다.
            server.get_custom_token(client_env.uid).then(data => {
                client_env.user_token = data.token;
    
                let info = {
                    token: data.token
                }
                client_env.editor.post_to_editor("send-user-token", info)
            }).catch(err => {
                console.error('Failed to get custom token:', err);
            })
        }
        else if (data.action == 'close' || data.action == 'goto-cart') {
            client_env.editor.destroy({
                parent_element: client_env.parent_element,        
            })
            context.isProjectOpen = false; 
            context.updateEditorContainerVisibility(client_env.parent_element);
        }
    }
}

