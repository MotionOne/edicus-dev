import * as server from './server.js';
import { update_project_data_table } from './table-ui.js';
import { edicusTemplates } from './edicus-templates.js';
import * as projectModule from './project.js';
import { openTnViewProject } from './open-tnview.js';
import * as orderModule from './order.js';
import { createTnViewProject } from './create-tnview.js';
import { Context } from './context.js';

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
}

let context = new Context(client_env);

// 프로젝트 리스트 배열
let project_arr = [];

onMount();

async function onMount() {
	client_env.editor = window.edicusSDK.init({});
    
    bind_button_events();
    await doUserLogin();

	// 템플릿 목록을 드롭다운에 채우기
	populate_template_dropdown();    
}

function bind_button_events() {
	$('#select-project-id').change(on_select_project_id);
	$('#btn_open_tnview').click(on_open_tnview);
	$('#btn_delete_project').click(on_delete_project);
	$('#btn_create_tnview').click(on_create_tnview);
    $('#btn_save_vdp').click(on_save_vdp);
    $('#btn_close').click(on_close);

    // for order
	$('#btn_tentative_order_vdp').click(on_tentative_order_with_vdp);
	$('#btn_definitive_order_project').click(on_definitive_order_project);
	$('#btn_cancel_order_project').click(on_cancel_order_project);    
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// TnView 프로젝트 생성
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function on_create_tnview(event) {
	const selectedIndex = $('#select-template').val();
	createTnViewProject(context, edicusTemplates[selectedIndex]); // TnView 프로젝트 생성
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// TnView 프로젝트 열기
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function on_open_tnview() {
	let projectId = get_project_id();
	context.orderId = get_order_id(projectId);
	openTnViewProject(projectId, context); // TnView 프로젝트 열기
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// TnView 프로젝트 삭제
///////////////////////////////////////////////////////////////////////////////////////////////////////////
async function on_delete_project() {
	if (context.isProjectOpen) {
		context.closeEditor();
        context.removeAllFormFields();
	}

	let projectId = get_project_id()
	// 프로젝트 삭제
	await projectModule.on_delete_project(client_env, projectId); 
	// 프로젝트 목록 갱신
	await on_get_project_list(null);
	on_select_project_id();
}

function on_save_vdp() {
	context.saveVdpData();
}

function on_close() {
	context.closeEditor();
    context.removeAllFormFields();
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// 프로젝트 리스트 조회 및 선택
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function get_project_id() {
	return $('#select-project-id option:selected').val()
}

function get_order_id(projectId) {
	let project = project_arr.find(p => p.project_id === projectId);
	return project ? project.order_id : null;
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
	let projectId = get_project_id()
    await refresh_project_data_table(projectId);
}

async function refresh_project_data_table(projectId) {
	try {
		const projectData = await server.get_project_data(client_env.uid, projectId);
		console.log('project data: ', projectData)
        context.orderId = projectData.order_id;
		context.setOrderStatus(projectData.status);
		update_project_data_table(projectData);
	} catch (err) {
		console.error('Failed to get project data:', err);
	}

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// 주문 처리
///////////////////////////////////////////////////////////////////////////////////////////////////////////

async function on_tentative_order_with_vdp() {
	await orderModule.on_tentative_order_with_vdp(context)
    await refresh_project_data_table(context.projectId);
}

async function on_definitive_order_project() {
    if (context.orderId === null) {
        alert('주문번호가 없습니다.');
        return;
    }

	await orderModule.on_definitive_order_project(context)
    await refresh_project_data_table(context.projectId);
}

async function on_cancel_order_project() {
    if (context.orderId === null) {
        alert('주문번호가 없습니다.');
        return;
    }
	await orderModule.on_cancel_order_project(context, context.orderId)
    await refresh_project_data_table(context.projectId);
}	


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
