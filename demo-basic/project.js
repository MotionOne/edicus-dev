/**
 * 프로젝트 관리 모듈
 * 프로젝트 열기, 복제, 삭제 기능 제공
 */

import * as server from './server.js';

/**
 * 프로젝트 열기
 * @param {Object} context - Context 객체
 */
// export function on_open_project(context) { ... } // Moved to open-editor.js


/**
 * 프로젝트 복제
 * @param {Object} context - Context 객체
 */
export async function on_clone_project(context) {
	if (window.confirm('프로젝트를 복제하시겠습니까?') != true)
		return;

	try {
		const result = await server.clone_project(context.client_env.uid, context.projectId);
		if (result) {
			alert("cloned project: " + result.project_id)
		}
		else {
			console.log('fail to clone');
			alert("project " + context.projectId + " cloning failed.")
		}
	} catch (err) {
		console.log('fail to clone: ', err);
		alert("project " + context.projectId + " cloning failed. " + err.message)
	}
}

/**
 * 프로젝트 삭제
 * @param {Object} context - Context 객체
 */
export async function on_delete_project(context) {
	if (window.confirm('프로젝트를 삭제하시겠습니까?') != true)
		return;

    if (context.isProjectOpen) {
		context.closeEditor();
	}

	try {
		const err = await server.delete_project(context.client_env.uid, context.projectId);
		if (err == null) {
			alert('project ' + context.projectId + ' is deleted.')
		}
		else {
			console.log('delete failed: ', err);
			alert("project " + context.projectId + " delete failed. " + err.message)
		}
	} catch (error) {
		console.error('Failed to delete project:', error);
		alert("project " + context.projectId + " delete failed. " + error.message)
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
