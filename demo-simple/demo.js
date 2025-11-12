/**
 * Edicus Cloud Editor 테스트 모듈
 * 
 * @license
 * Copyright (c) 2017 MoitionOne Corporation Inc.
 * 
*/

/*  테스트 방법

	http로 서비스 하기
	- 4300 port로 test.html을 웹서버로 띄우고 테스트 할 것.
	  
	http-server로 띄우기 (참고용)
	- 설치 : npm install --global http-server (github: https://github.com/indexzero/http-server)
	- 실행 : http-server -c-1 -p 4300    (local file cache문제가 있으니 위의 argument순서 지킬 것.)

	테스트 사이트 접속
	- http://localhost:4300/test.html
*/


// import { get_custom_token, get_custom_token_of_staff, get_project_list, clone_project, delete_project, get_preview_urls, tentative_order_project, definitive_order_project, cancel_order_project } from './server.js';
import * as server from './server.js';
import { client_env_vars } from '../.client-env.js';

/*
*/
var client_env = {
	partner: client_env_vars.partner,
	uid: "tester-123456",    // 고객사의 user unique id.
	user_token: null,
	parent_element: document.getElementById("edicus_container"),
}

var editorCtx = null;

var project_arr = [];


// 이 소스파일 끝에서 init()을 호출함.
function init() {
	editorCtx = window.edicusSDK.init({});

	// input 필드에 기본 uid 설정
	$('#input_user_id').val(client_env.uid);

	bind_button_events();
	on_user_login(); // 초기에 무조건 로그인 하도록 함.
}

function bind_button_events() {
	$('#btn_user_login').click(on_user_login);
	$('#btn_user_logout').click(on_user_logout);
	
	$('#btn_get_project_list').click(on_get_project_list);
	$('#btn_open_project').click(on_open_project);
	$('#btn_clone_project').click(on_clone_project);
	$('#btn_delete_project').click(on_delete_project);
	$('#btn_show_preview_tn').click(btn_show_preview_tn);
	
	$('#btn_tentative_order_project').click(on_tentative_order_project);
	$('#btn_tentative_order_vdp').click(on_tentative_order_with_vdp);
	$('#btn_definitive_order_project').click(on_definitive_order_project);
	$('#btn_cancel_order_project').click(on_cancel_order_project);
	
	$('#btn_create_one').click(on_btn_create_one);

	$('#btn_open_edit_template').click(on_open_edit_template);	
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

function on_user_login(event) {
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

	server.get_custom_token(client_env.uid, function(err, data) {
		client_env.user_token = data.token;
		$('#action-log').text('user token received.')
		update_login_ui(true);

		// 로그인 직후 프로젝트 목록 조회
		on_get_project_list();
	})
}

function on_user_logout(event) {
	client_env.uid = null;
	client_env.user_token = null;
	$('#input_user_id').val('');
	$('#action-log').text('logged out.');
	update_login_ui(false);
}

function on_get_project_list(event) {
	server.get_project_list(client_env.uid, function(err, data) {
		console.log('project list: ', data.projects)
		project_arr = data.projects;
		$('#action-log').text('received project list. (브라우저 console창에서 확인하세요)')

		$('#select-project-id').empty();
		data.projects.reverse().forEach(function(project) {
			var $option = $('<option></option>');
			$option.text(project.title + '(' + project.project_id + ')');
			$option.attr('value', project.project_id)
			$('#select-project-id').append($option);
		})
	})
}

function on_open_project() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	var mobile = document.querySelector('#checkbox_mobile').checked;

	var params = {
		partner: client_env.partner,
		mobile: mobile,
		parent_element: client_env.parent_element,
		token: client_env.user_token,
		prjid: project_id,
		// run_mode: '',
		// edit_mode: ''
	}
	editorCtx.open_project(params, function(err, data) {
		console.log('callback data: ', data)

		if (data.action == 'close' || data.action == 'goto-cart') {
			editorCtx.destroy({
				parent_element: client_env.parent_element
			})
		}
		else if (data.action == 'save-doc-report') {
			// 저장직후 여러 결과물을 확인 가능. 
			/*
				참고
					저장직전 : https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.t5ibodidcrng
					저장직후 : https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.etcff8vztldb
			*/
		}
		else if (data.action == 'request-help-message') {
			// mobile모드에서 사진탭의 도움말 버튼을 클릭한 경우 이벤트 발생
			/* 참고
				https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#bookmark=id.k1dp1go7tw63
			*/
			if (data.info.case == 'photo-import')
				alert("received 'request-help-message(photo-import)' action")

		}
		else if (data.action == 'request-user-token') {
			// Edicus로 부터 user token요청을 받으면 "send-token" action으로 대응한다.
			/* 참고
				https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#bookmark=id.ctloxkjukfm
			*/
			server.get_custom_token(client_env.uid, function(err, data) {
				client_env.user_token = data.token;
				$('#action-log').text('user token received.')

				let info = {
					token: data.token
				}
				editorCtx.post_to_editor("send-user-token", info)
	
			})
		}
	})		
}

function on_clone_project() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	if (window.confirm('프로젝트를 복제하시겠습니까?') != true)
		return;

	server.clone_project(client_env.uid, project_id, function(result) {
		if (result) {
			alert("cloned project: " + result.project_id)
		}
		else {
			console.log('fail to clone: ', err);
			alert("project " + project_id + " cloning failed. " + err.message)
		}
		
	}) 		
}

function on_delete_project() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	if (window.confirm('프로젝트를 삭제하시겠습니까?') != true)
		return;

	server.delete_project(client_env.uid, project_id, function(err) {
		if (err == null) {
			alert('project ' + project_id + ' is deleted.')
		}
		else {
			console.log('delete failed: ', err);
			alert("project " + project_id + " delete failed. " + err.message)
		}
		
	})    
}

function btn_show_preview_tn() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	server.get_preview_urls(project_id, function(err, ret) {
		if (err == null) {
			console.log(ret)
			$('#preview_tn_container').empty();
			ret.urls.forEach(function(url) {
				var $tn = $('<img src="' + url + '" style="padding-right:10px">')
				$('#preview_tn_container').append($tn);
			})
		}
		else {
			console.log('get preview thumbnail url list failed: ', err);
			alert("get preview thumbnail url list failed: " + err.message)
		}
		
	})    
}


function on_tentative_order_project() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	var order = {
		order_for_test: false,
		order_count: 1,
		total_price: 23500,
		partner_order_id: 'test',
		order_name: 'test'
	}
	server.tentative_order_project(client_env.uid, project_id, order, function(err) {
		if (err == null)
			alert("project " + project_id + " is ordered (tentative order).")
		else {
			console.log('order failed: ', err);
			alert("project " + project_id + " order failed. " + err.message)
		}
	})
}

function on_tentative_order_with_vdp() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	// dataset of "variable data printing" mode
	var vdp_dataset = {
		rows: [{
			cols: [{id:'name', value:'전  지  현'}, {id:'title-role', value:'최강미모'}]
		}, {
			cols: [{id:'name', value:'송  혜  교'}, {id:'title-role', value:'절대지존'}]
		}, {
			cols: [{id:'name', value:'김  희  선'}, {id:'title-role', value:'세계최강'}]
		}]		
	}
	var order = {
		order_for_test: false,		// default:false
		order_count: 1,
		total_price: 23500,
		partner_order_id: 'test',
		order_name: 'test',
		vdp_dataset: vdp_dataset
	}
	server.tentative_order_project(client_env.uid, project_id, order, function(err) {
		if (err == null)
			alert("project " + project_id + " is ordered (tentative order).")
		else {
			console.log('order failed: ', err);
			alert("project " + project_id + " order failed. " + err.message)
		}
	})    
}



function on_definitive_order_project() {
	var project_id = $('#select-project-id option:selected').val()
	console.log(project_id)

	server.definitive_order_project(client_env.uid, project_id, function(err) {
		if (err == null)
			alert("project " + project_id + " is ordered. (definitive order)")
		else {
			console.log('order failed: ', err);
			alert("project " + project_id + " order failed. " + err.message)
		}
		
	})    
}	

function on_cancel_order_project() {
	// _on_cancel_order_all_projects();
	// return;

	var project_id = $('#select-project-id option:selected').val()
	// console.log(project_id)

	var project = project_arr.find(function(project) { return project.project_id == project_id })

	server.cancel_order_project(client_env.uid, project.order_id, function(err) {
		if (err == null)
			alert("order canceled.")
		else {
			console.log('cancel failed: ', err);
			alert("fail to cancel order. " + err.message)
		}
	})    
}	

function on_open_edit_template(event) {
	var params = {
		parent_element: client_env.parent_element,
		ps_code: '50x90@NC',
		template_uri: 'gcs://template/partners/motion1/res/template/269090.json',
		token: client_env.user_token
	}
	editorCtx.edit_template(params, function (err, data) {
		if (data.action == 'close' || data.action == 'goto-cart') {
			editorCtx.destroy({
				parent_element: client_env.parent_element,        
			})                        
		}
	})
}

function create_product(obj) {
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
	editorCtx.create_project(params, function (err, data) {
		if (data.action == 'project-id-created') {
			console.log('project-id-created: ', data.project_id)
		}
		else if (data.action == 'close' || data.action == 'goto-cart') {
			editorCtx.destroy({
				parent_element: client_env.parent_element,        
			})                        
		}
		else if (data.action == 'request-user-token') {
			// Edicus로 부터 user token요청을 받으면 "send-token" action으로 대응한다.
			get_custom_token(client_env.uid, function(err, data) {
				client_env.user_token = data.token;
				$('#action-log').text('user token received.')

				let info = {
					token: data.token
				}
				editorCtx.post_to_editor("send-user-token", info)
	
			})
		}
	})	
}

function on_btn_create_one(event) {
	var obj = {
		ps_code: '90x50@NC',
		template_uri: 'gcs://template/partners/dongapr7/res/template/2940313.json',
		title: '명함 샘플',
	}
	create_product(obj);
}


init();    
