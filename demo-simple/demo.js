/**
 * Edicus Cloud Editor 테스트 모듈
 * 
 * @license
 * Copyright (c) 2025 MoitionOne Corporation Inc.
 * 
*/

/*  테스트 방법

	http로 서비스 하기
	- 4300 port로 test.html을 웹서버로 띄우고 테스트 해야 합니다
	  
	http-server로 띄우기 (참고용)
	- 설치 : npm install --global http-server (github: https://github.com/indexzero/http-server)
	- 실행 : http-server -c-1 -p 4300 (참고: -c-1 옵션은 cache 비활성화 옵션)

	테스트 사이트 접속
	- http://localhost:4300/test.html
*/


import * as server from './server.js';
import { client_env_vars } from '../client-env.js';
import * as orderModule from './order.js';
import * as projectModule from './project.js';
import { update_project_data_table } from './table-ui.js';
import { edicusTemplates } from './edicus-templates.js';

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
	partner: client_env_vars.partner,
	uid: "test-uid-of-sandbox",    
	user_token: null,
	parent_element: document.getElementById("edicus_container"),
	editor: null,
	isProjectOpen: false,
}
let project_arr = [];
let project_data = null;



// isProjectOpen 상태에 따라 에디터 컨테이너 표시/숨김 업데이트
function updateEditorContainerVisibility() {
	client_env.parent_element.style.display = client_env.isProjectOpen ? 'block' : 'none';
}


// 이 소스파일 끝에서 init()을 호출함.
function init() {
	client_env.editor = window.edicusSDK.init({});

	// input 필드에 기본 uid 설정
	$('#input_user_id').val(client_env.uid);

	// 템플릿 목록을 드롭다운에 채우기
	populate_template_dropdown();

	bind_button_events();
	on_user_login(); // 초기에 무조건 로그인 하도록 함.
}

function bind_button_events() {
	$('#btn_user_login').click(on_user_login);
	$('#btn_user_logout').click(on_user_logout);
	
	$('#btn_get_project_list').click(on_get_project_list);
	$('#select-project-id').change(on_select_project_id);
	$('#btn_open_project').click(on_open_project);
	$('#btn_clone_project').click(on_clone_project);
	$('#btn_delete_project').click(on_delete_project);
	
	$('#btn_tentative_order_project').click(on_tentative_order_project);
	$('#btn_tentative_order_vdp').click(on_tentative_order_with_vdp);
	$('#btn_definitive_order_project').click(on_definitive_order_project);
	$('#btn_cancel_order_project').click(on_cancel_order_project);
	
	$('#btn_create_one').click(on_btn_create_one);
}


function update_login_ui(is_logged_in) {
	if (is_logged_in) {
		$('#logged_user_id').text(client_env.uid);
		$('#login_status').show();
		$('#login_form').hide();
	} else {
		$('#login_status').hide();
		$('#login_form').show();
	}
}

async function on_user_login(event) {
	/*  
		고객사 자체 login이 성공하면 uid를 확보하도록 하고, 
		이 uid를 이용해 edicus server로 부터 token을 받으면 edicus 사용 준비가 완료됩니다.

		uid 설명
		- 고객사 server에서 생성하여 edicus에 전달하는 unique id입니다.
		- edicus 계정과 1:1 대응
		- 이미 이와 유사한 id가 있으면 아래 제한사항만 만족하면 그대로 써도 됩니다.
		- 숫자, 알파벳, "-"으로 구성되며, 64자로 제한됩니다.
	*/

	// input 필드에서 uid 읽어오기
	var uid = $('#input_user_id').val();
	if (!uid) {
		alert('User ID를 입력해주세요.');
		return;
	}
	client_env.uid = uid;

	try {
		const data = await server.get_custom_token(client_env.uid);
		client_env.user_token = data.token;
		update_login_ui(true);

		// 로그인 직후 프로젝트 목록 조회
		await on_get_project_list(null);
		$('#select-project-id').val(project_arr[0].project_id); // 첫 번째 프로젝트 선택
		await on_select_project_id();
	} catch (err) {
		console.error('Login failed:', err);
		alert('로그인에 실패했습니다.');
	}
}

function on_user_logout(event) {
	// client_env.uid = null;
	client_env.user_token = null;
	$('#input_user_id').val(client_env.uid);
	update_login_ui(false);
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

	on_get_preview_tn();
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
	projectModule.on_open_project(client_env, project_id);
	updateEditorContainerVisibility();
}

async function on_clone_project() {
	var project_id = get_project_id()
	await projectModule.on_clone_project(client_env, project_id);
	await on_get_project_list(null);
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

async function on_get_preview_tn() {
	var project_id = get_project_id()
	await projectModule.on_get_preview_tn(project_id);
}

async function on_tentative_order_project() {
	var project_id = get_project_id()
	await orderModule.on_tentative_order_project(client_env, project_id)
}

async function on_tentative_order_with_vdp() {
	var project_id = get_project_id()
	await orderModule.on_tentative_order_with_vdp(client_env, project_id)
}

async function on_definitive_order_project() {
	var project_id = get_project_id()
	await orderModule.on_definitive_order_project(client_env, project_id)
}

async function on_cancel_order_project() {
	var project_id = get_project_id()
	await orderModule.on_cancel_order_project(client_env, project_arr, project_id)
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

	var mobile = document.querySelector('#checkbox_mobile').checked;

	var params = {
		parent_element: client_env.parent_element,
		partner: client_env.partner,
		mobile: mobile,		
		ps_code: obj.ps_code,
		template_uri: obj.template_uri,
		title: obj.title,
		token: client_env.user_token
		//edit_mode: 'design' // for design mode 
	}
	client_env.editor.create_project(params, function (err, data) {
		if (data.action == 'project-id-created') {
			console.log('project-id-created: ', data.project_id)
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
	})
	
	// 프로젝트 열림 상태로 설정
	client_env.isProjectOpen = true;
	updateEditorContainerVisibility();
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

function on_btn_create_one(event) {
	const selectedIndex = $('#select-template').val();
	if (selectedIndex === '') {
		alert('템플릿을 선택해주세요.');
		return;
	}
	create_product(edicusTemplates[selectedIndex]);
}


init();    
