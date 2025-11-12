/*  ## 주의 사항 ##

	아래 function들은 원래 고객사의 server에서 api형태로 구현되어 사용되어야 합니다.
	테스트의 편의상 client-side에서 구현되었습니다.
	아래 소스코드에서 edicus-api-key에 사용된 문자열은 외부에 노출되지 않도록 해야 합니다.
	
	실제 구현의 호출 흐름은 다음과 같아야 합니다.
		browser <-- partner사 server <-- edicus api server
*/

/*
    { apiHost, apiKey }를 .env.js 파일에서 가져옵니다.
*/
import { server_env } from '../.env.js';

export function get_custom_token__from_server(user_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.lu754uc9u7g
	var url = server_env.apiHost + '/api/auth/token';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type': 'application/json'
		},
		method: 'POST', 
		dataType: 'json',
		data: {},
		success: function (data) {
			console.log(data);
			callback(null, data);
		}
	})
}


export function get_custom_token_of_staff__from_server(staff_info, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.5p6krexjtpgi
	var url = server_env.apiHost + '/api/auth/staff/token';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-email': staff_info.email,
			'edicus-pwd': staff_info.pwd,
			'Content-Type': 'application/json'
		},
		method: 'POST',
		dataType: 'json',
		data: {},
		success: function (data) {
			console.log(data);
			callback(null, data);
		}
	})
}

export function get_project_list__from_server(user_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.gqp5xb7uwjxa    
	var url = server_env.apiHost + '/api/projects';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type':'application/json'
		},
		method: 'GET',
		dataType: 'json',
		success: function(data) {
			console.log(data);
			callback(null, data);
		}
	})
}

export function clone_project__from_server(user_id, project_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1OhWdgv9Sz8By4N48eY0uO_84M3keLVQvdpdpK9u_3bA/edit#heading=h.12nm233v8th7
	
	var url = server_env.apiHost + '/api/projects/' + project_id +'/clone';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type':'application/json'
		},
		method: 'POST',
		dataType: 'json',
		success: function(data) {
			console.log(data);
			callback(data);
		}
	})
}

export function delete_project__from_server(user_id, project_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.3uglpt2407ob
	
	var url = server_env.apiHost + '/api/projects/' + project_id;
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type':'application/json'
		},
		method: 'DELETE',
		dataType: 'json',
		success: function(data) {
			console.log(data);
			callback(data.err);
		}
	})
}

export function tentative_order_project__from_server(user_id, project_id, order, callback) {
	console.log(user_id, project_id, order);

	var url = server_env.apiHost + '/api/projects/' + project_id + '/order/tentative';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type':'application/json'
		},
		method: 'POST',
		dataType: 'json',
		data: JSON.stringify(order),
		success: function(data) {
			console.log(data);
			callback(data.err);
		}
	})    
}    

export function definitive_order_project__from_server(user_id, project_id, callback) {
	console.log(user_id, project_id);

	var url = server_env.apiHost + '/api/projects/' + project_id + '/order/definitive';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type':'application/json'
		},
		method: 'POST',
		dataType: 'json',
		success: function(data) {
			console.log(data);
			callback(data.err);
		}
	})    
}    

export function cancel_order_project__from_server(user_id, order_id, callback) {
	console.log(user_id, order_id);

	var url = server_env.apiHost + '/api/orders/' + order_id + '/cancel';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'edicus-uid': user_id,
			'Content-Type':'application/json'
		},
		method: 'POST',
		dataType: 'json',
		success: function(data) {
			console.log(data);
			callback(data.err);
		}
	})    
}    


export function get_preview_urls__from_server(project_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.1pl8dok8mgjo
	var url = server_env.apiHost + '/api/projects/' + project_id + '/preview_urls';
	$.ajax({
		url: url,
		headers: {
			'edicus-api-key': server_env.apiKey,
			'Content-Type':'application/json'
		},
		method: 'GET',
		dataType: 'json',
		success: function(data) {
			console.log(data);
			callback(null, data);
		}
	})
}
