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

/**
 * Edicus API 호출을 위한 공통 함수
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method (GET, POST, DELETE 등)
 * @param {object} additionalHeaders - 추가 헤더 (edicus-uid, edicus-email 등)
 * @param {object} data - 요청 데이터
 * @param {function} callback - 콜백 함수
 */
function callEdicusAPI(url, method, additionalHeaders = {}, data = {}, callback) {
	const headers = {
		'edicus-api-key': server_env.apiKey,
		'Content-Type': 'application/json',
		...additionalHeaders
	};

	$.ajax({
		url: url,
		headers: headers,
		method: method,
		dataType: 'json',
		data: method === 'GET' ? undefined : (Object.keys(data).length > 0 ? JSON.stringify(data) : {}),
		success: function (data) {
			console.log(data);
			callback(null, data);
		},
		error: function(xhr, status, error) {
			console.error('API Error:', error);
			callback(error, null);
		}
	});
}

export function get_custom_token(user_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.lu754uc9u7g
	const url = server_env.apiHost + '/api/auth/token';
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'POST', additionalHeaders, {}, callback);
}


export function get_custom_token_of_staff(staff_info, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.5p6krexjtpgi
	const url = server_env.apiHost + '/api/auth/staff/token';
	const additionalHeaders = {
		'edicus-email': staff_info.email,
		'edicus-pwd': staff_info.pwd
	};
	callEdicusAPI(url, 'POST', additionalHeaders, {}, callback);
}

export function get_project_list(user_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.gqp5xb7uwjxa    
	const url = server_env.apiHost + '/api/projects';
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'GET', additionalHeaders, {}, callback);
}

export function clone_project(user_id, project_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1OhWdgv9Sz8By4N48eY0uO_84M3keLVQvdpdpK9u_3bA/edit#heading=h.12nm233v8th7
	const url = server_env.apiHost + '/api/projects/' + project_id + '/clone';
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'POST', additionalHeaders, {}, (err, data) => {
		callback(data);
	});
}

export function delete_project(user_id, project_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.3uglpt2407ob
	const url = server_env.apiHost + '/api/projects/' + project_id;
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'DELETE', additionalHeaders, {}, (err, data) => {
		callback(data.err);
	});
}

export function tentative_order_project(user_id, project_id, order, callback) {
	console.log(user_id, project_id, order);
	const url = server_env.apiHost + '/api/projects/' + project_id + '/order/tentative';
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'POST', additionalHeaders, order, (err, data) => {
		callback(data.err);
	});
}    

export function definitive_order_project(user_id, project_id, callback) {
	console.log(user_id, project_id);
	const url = server_env.apiHost + '/api/projects/' + project_id + '/order/definitive';
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'POST', additionalHeaders, {}, (err, data) => {
		callback(data.err);
	});
}    

export function cancel_order_project(user_id, order_id, callback) {
	console.log(user_id, order_id);
	const url = server_env.apiHost + '/api/orders/' + order_id + '/cancel';
	const additionalHeaders = { 'edicus-uid': user_id };
	callEdicusAPI(url, 'POST', additionalHeaders, {}, (err, data) => {
		callback(data.err);
	});
}    


export function get_preview_urls(project_id, callback) {
	// Edicus Server API 구글독스 문서 (문서접근에 권한이 필요하니, 바로 열리지 않으면 연락바랍니다.)
	// https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.1pl8dok8mgjo
	const url = server_env.apiHost + '/api/projects/' + project_id + '/preview_urls';
	callEdicusAPI(url, 'GET', {}, {}, callback);
}
