import * as server from './server.js';
import { update_project_data_table } from './table-ui.js';
import { edicusTemplates } from './edicus-templates.js';
import * as projectModule from './project.js';
import { getVariableInfo, handle_vdp_catalog } from './vdp-catalog.js';
import { getInnerBoxWithRatio } from './util.js';

/*
	uid 설명
	- 고객사의 user unique id. 
	- 이 uid를 이용해 edicus server로 부터 token을 받으면 edicus 사용 준비가 완료됩니다.
	- 이 uid는 고객의 로그인 계정과 1:1 대응되는 unique id입니다.
	- uid는 고객의 개인 정보를 유추할 수 없도록 생성되어야 합니다. (email, 이름등으로 구성되지 않도록 해야 합니다)
	- 숫자, 알파벳, "-"으로 구성되며, 64자로 제한됩니다.
	- uid는 에디쿠스 서버에서 별도의 생성 절차가 없습니다. 해당 uid가 사용한 적이 없으면 내부적으로 계정을 생성하며, 있으면 기존 계정을 사용합니다.
*/
let client_env = {
	partner: "sandbox", // 에디쿠스 데모용으로만 사용하는 partner 코드
	uid: "vdp-tester-uid-of-sandbox",    
	user_token: null,
	parent_element: document.getElementById("edicus_container"),
	editor: null,
	isProjectOpen: false,
}
let project_arr = [];
let project_data = null;
let projectInfo; 

/*
	type PageItem = {
		size_mm : {width:number, height:number},
	}
*/

let readyToShowTnView = false;
let tnViewCatalog = null;
let pageItems = []; // PageItem[]
let referenceEditorBox = {width:400, height:400};
let editorBoxSize = {width:400, height:400}

// 이 소스파일 끝에서 onMount()을 호출함.
async function onMount() {
	client_env.editor = window.edicusSDK.init({});
    
    
    bind_button_events();
    await doUserLogin();

	// 템플릿 목록을 드롭다운에 채우기
	populate_template_dropdown();    
}

function bind_button_events() {
	$('#select-project-id').change(on_select_project_id);
	$('#btn_open_project').click(on_open_project);
	$('#btn_delete_project').click(on_delete_project);
	$('#btn_create_one').click(on_btn_create_one);

}

// isProjectOpen 상태에 따라 에디터 컨테이너 표시/숨김 업데이트
function updateEditorContainerVisibility() {
	client_env.parent_element.style.display = client_env.isProjectOpen ? 'block' : 'none';
}


async function doUserLogin() {
	$('#input_user_id').val(client_env.uid);

	try {
		const data = await server.get_custom_token(client_env.uid);
		client_env.user_token = data.token;

		// 로그인 직후 프로젝트 목록 조회
		await on_get_project_list(null);
        if (project_arr.length > 0) {
		    $('#select-project-id').val(project_arr[0].project_id); // 첫 번째 프로젝트 선택
		    await on_select_project_id();
        }
	} catch (err) {
		console.error('Login failed:', err);
		alert('로그인에 실패했습니다.');
	}
}

async function on_get_project_list(event) {
	try {
		const data = await server.get_project_list(client_env.uid);
		console.log('project list: ', data.projects)
		project_arr = data.projects;

		$('#select-project-id').empty();
		data.projects.reverse().forEach(function(project) {
			var $option = $('<option></option>');
			$option.text(project.title + '(' + project.project_id + ')');
			$option.attr('value', project.project_id)
			$('#select-project-id').append($option);
		})
	} catch (err) {
		console.error('Failed to get project list:', err);
		alert('프로젝트 목록을 가져오는데 실패했습니다.');
	}
}

async function on_select_project_id() {
	var project_id = get_project_id()

	try {
		const data = await server.get_project_data(client_env.uid, project_id);
		console.log('project data: ', data)
		project_data = data;
		update_project_data_table(project_data);
	} catch (err) {
		console.error('Failed to get project data:', err);
	}

	// on_get_preview_tn();
}

function get_project_id() {
	return $('#select-project-id option:selected').val()
}


function close_editor() {
	client_env.editor.destroy({
		parent_element: client_env.parent_element
	})
	client_env.isProjectOpen = false;
	updateEditorContainerVisibility();
}

function on_open_project() {
	var project_id = get_project_id()
	projectModule.on_open_tnview(client_env, "90x50@NC", project_id, callbackForTnView);
	updateEditorContainerVisibility();
}

async function callbackForTnView(err, data) {
	if (data.action == 'ready-to-listen') {
		console.log('ready-to-listen')
	}
	else if (data.action == 'doc-changed') {			
		let vdp_catalog = data.info.vdp_catalog;
		if (vdp_catalog) {
			if (projectInfo &&projectInfo.vdpdata)
				tnViewCatalog = JSON.parse(projectInfo.vdpdata)
			else					
				tnViewCatalog = handle_vdp_catalog(vdp_catalog);				
			// dispatch('tnview-catalog', tnViewCatalog)

            console.log('tnViewCatalog: ', tnViewCatalog)
		}

		setupPageSizes(data);
	}
	else if (data.action === 'open-report' && data.info.status === 'end') {
		// edicus의 로딩프로그레스가 끝나면 tnview를 보여준다. 대략 1초 기다림.
		setTimeout(() => {
			readyToShowTnView = true;
		}, 1000)
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
            editor.post_to_editor("send-user-token", info)
        }).catch(err => {
            console.error('Failed to get custom token:', err);
        })
    }    

	console.log("=====>", data.action, data.info)
}

async function on_delete_project() {
	if (client_env.isProjectOpen) {
		close_editor();
	}

	var project_id = get_project_id()
	// 프로젝트 삭제
	await projectModule.on_delete_project(client_env, project_id); 
	// 프로젝트 목록 갱신
	await on_get_project_list(null);
	// 첫 번째 프로젝트 선택
	project_id = project_arr[0].project_id;
	on_select_project_id();
}


function on_btn_create_one(event) {
	const selectedIndex = $('#select-template').val();
	if (selectedIndex === '') {
		alert('템플릿을 선택해주세요.');
		return;
	}
	create_product(edicusTemplates[selectedIndex]);
}

function create_product(obj) {
	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (client_env.isProjectOpen) {
		client_env.editor.close({
			parent_element: client_env.parent_element
		})
		client_env.isProjectOpen = false;
		updateEditorContainerVisibility();
	}

	var params = {
		parent_element: client_env.parent_element,
		partner: client_env.partner,
		mobile: false,		
		ps_code: obj.ps_code,
		template_uri: obj.template_uri,
		title: obj.title,
		token: client_env.user_token,
		npage: 1,
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
                experiment: true,
                show_loading_init: true,
                show_loading_set: false,
                background_color: 'transparent'
            }
        }
	}
	client_env.editor.create_tnview(params, callbackForCreateTnView)
	
	// 프로젝트 열림 상태로 설정
	client_env.isProjectOpen = true;
	updateEditorContainerVisibility();
}

function callbackForCreateTnView(err, data) {
    // 이벤트가 오는 순서대로임
    if (data.action === 'create-report' && data.info.status === 'start') {
    }
    else if (data.action == 'doc-changed') {			
        let vdp_catalog = data.info.vdp_catalog;
        console.log("vdp_catalog", vdp_catalog)
        if (vdp_catalog) {
            tnViewCatalog = handle_vdp_catalog(vdp_catalog);				
            // dispatch('tnview-catalog', tnViewCatalog)
        }

        setupPageSizes(data);
    }  
    else if (data.action == 'project-id-created') {
        console.log('project-id-created: ', data.info.project_id)
        // 고객사 DB에 필요한 정보 저장
    }
    else if (data.action === 'create-report' && data.info.status === 'end') {
        readyToShowTnView = true;
    }
    else if (data.action === 'save-doc-report' && data.info.status === 'end') {
        // vdp data를 저장해야 함.
        console.log('tnViewCatalog: ', tnViewCatalog)
        
        /*
        let projectUpdateInfo:CartUpdate = {
            vdp: JSON.stringify(tnViewCatalog)
        }			
        if (data.info.docInfo.tnUrlList && data.info.docInfo.tnUrlList.length > 0) {
            projectUpdateInfo.tnUrl = data.info.docInfo.tnUrlList[0]				
        }			

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
        client_env.isProjectOpen = false; 
        updateEditorContainerVisibility();
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
        client_env.isProjectOpen = false; 
        updateEditorContainerVisibility();
    }
}

function setupPageSizes(data) {
    // data.info.page_infos[index]에 있는 가로, 세로 사이즈 정보를 pageItems에 저장한다.

    data.info.page_infos.forEach((page, index) => {
        pageItems.push({
            size_mm: {
                width: page.size_mm.width,
                height: page.size_mm.height
            }
        })
    })

    let {width, height} = pageItems[0].size_mm;
    editorBoxSize = getInnerBoxWithRatio(referenceEditorBox, [width, height])

    client_env.parent_element.style.width = editorBoxSize.width + 'px';
    client_env.parent_element.style.height = editorBoxSize.height + 'px';
}	


function populate_template_dropdown() {
	const $select = $('#select-template');
	edicusTemplates.forEach((template, index) => {
		const $option = $('<option></option>');
		$option.text(template.title);
		$option.attr('value', index);
		$select.append($option);
	});
}

onMount();
