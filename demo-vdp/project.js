/**
 * 프로젝트 관리 모듈
 * 프로젝트 열기, 복제, 삭제 기능 제공
 */

import * as server from './server.js';


/**
 * 프로젝트 삭제
 * @param {Object} client_env - 클라이언트 환경 객체
 * @param {string} project_id - 프로젝트 ID
 */
export async function on_delete_project(client_env, project_id) {
	console.log(project_id)

	if (window.confirm('프로젝트를 삭제하시겠습니까?') != true)
		return;

	try {
		const err = await server.delete_project(client_env.uid, project_id);
		if (err == null) {
			alert('project ' + project_id + ' is deleted.')
		}
		else {
			console.log('delete failed: ', err);
			alert("project " + project_id + " delete failed. " + err.message)
		}
	} catch (error) {
		console.error('Failed to delete project:', error);
		alert("project " + project_id + " delete failed. " + error.message)
	}
}


/**
 * 썸네일 가져오기
 * @param {Object} project_id - 프로젝트 ID
 */
export async function on_get_preview_tn(project_id) {
	try {
		const ret = await server.get_preview_urls(project_id);
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
	} catch (err) {
		console.log('get preview thumbnail url list failed: ', err);
		alert("get preview thumbnail url list failed: " + err.message)
	}
}