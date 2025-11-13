/**
 * 프로젝트 관리 모듈
 * 프로젝트 열기, 복제, 삭제 기능 제공
 */

import * as server from './server.js';

/**
 * 프로젝트 열기
 * @param {Object} client_env - 클라이언트 환경 객체
 * @param {string} project_id - 프로젝트 ID
 */
export function on_open_project(client_env, project_id) {
    let { editorCtx } = client_env;
	
	// 프로젝트가 이미 열려있으면 먼저 닫기
	if (client_env.isProjectOpen) {
		console.log('Closing existing project before opening new one...')
		editorCtx.destroy({
			parent_element: client_env.parent_element
		})
		client_env.isProjectOpen = false;
	}

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
			client_env.isProjectOpen = false;
			client_env.parent_element.style.display = 'none';
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
			// mobile모드에서 사진탭의 도움말 버튼을 클릭한 경우 이벤트 발생 (자체 도움 메시지 출력용)
			/* 참고
				https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#bookmark=id.k1dp1go7tw63
			*/
			if (data.info.case == 'photo-import')
				alert("received 'request-help-message(photo-import)' action")

		}
		else if (data.action == 'request-user-token') {
			// Edicus로 부터 user token요청을 받으면 "send-token" action으로 대응한다.
			/* 참고
				https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit#heading=h.ctloxkjukfm
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

    client_env.isProjectOpen = true;
    client_env.parent_element.style.display = 'block';
}

/**
 * 프로젝트 복제
 * @param {Object} client_env - 클라이언트 환경 객체
 * @param {string} project_id - 프로젝트 ID
 */
export function on_clone_project(client_env, project_id) {
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

/**
 * 프로젝트 삭제
 * @param {Object} client_env - 클라이언트 환경 객체
 * @param {string} project_id - 프로젝트 ID
 */
export function on_delete_project(client_env, project_id) {
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


/**
 * 썸네일 가져오기
 * @param {Object} project_id - 프로젝트 ID
 */
export function on_get_preview_tn(project_id) {
	server.get_preview_urls(project_id, function(err, ret) {
		if (err == null) {
			console.log(ret)
		$('#preview_tn_container').empty();
		if (ret.urls && ret.urls.length > 0) {
			ret.urls.forEach(function(url) {
				var $tn = $('<img src="' + url + '" style="max-width:300px; max-height:300px; padding-right:10px; border: 1px solid #ddd; ">')
				$('#preview_tn_container').append($tn);
			})
		} else {
			$('#preview_tn_container').append('<p style="color: #666;">썸네일이 없습니다.</p>');
		}
		}
		else {
			console.log('get preview thumbnail url list failed: ', err);
			alert("get preview thumbnail url list failed: " + err.message)
		}
		
	})    
}