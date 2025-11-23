import * as server from './server.js';
import { update_project_data_table } from './table-ui.js';
import { edicusTemplates } from './edicus-templates.js';
import * as projectModule from './project.js';
import { handle_vdp_catalog, getDataRowForUpdatingTnView, getVariableInfo } from './vdp-catalog.js';
import { getInnerBoxWithRatio } from './util.js';
import { createTnViewCallback, openTnViewProject } from './open-tnview.js';
import { createProduct, createCreateTnViewCallback } from './create-tnview.js';

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


let project_arr = [];
let project_data = null;
// let projectInfo = {
//     "vdpdata": "{\"has_vdp_photo\":false,\"text_item_cols\":[[{\"segment\":true,\"var_id\":\"f_name\",\"var_title\":\"이름\",\"text\":\"홍길동\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_jobtitle1\",\"var_title\":\"직위1\",\"text\":\"대표이사\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_jobtitle2\",\"var_title\":\"직위2\",\"text\":\"CEO\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_company\",\"var_title\":\"회사명\",\"text\":\"주식회사 모션원\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_addr\",\"var_title\":\"주소\",\"text\":\"08380 서울시 구로구 디지털로 33길 27, 707호\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_tel\",\"var_title\":\"전화번호\",\"text\":\"(02) 9999-1004\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_fax\",\"var_title\":\"팩스\",\"text\":\"(02) 9999-1005\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_mobile\",\"var_title\":\"모바일\",\"text\":\"010-9999-1006\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"f_email\",\"var_title\":\"이메일\",\"text\":\"gdhong@motion1.co.kr\",\"letter_space\":0}],[{\"segment\":true,\"var_id\":\"b_name\",\"var_title\":\"이름\",\"text\":\"Gil-Dong Hong\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_jobtitle1\",\"var_title\":\"직위1\",\"text\":\"President\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_jobtitle2\",\"var_title\":\"직위2\",\"text\":\"CEO\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_company\",\"var_title\":\"회사명\",\"text\":\"MotionOne Inc.\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_addr\",\"var_title\":\"주소\",\"text\":\"#08380, Suite 707, Digital-ro 33-gil 27, Guro-gu, Seoul, Korea\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_tel\",\"var_title\":\"전화번호\",\"text\":\"(02) 9999-1004\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_fax\",\"var_title\":\"팩스\",\"text\":\"(02) 9999-1005\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_mobile\",\"var_title\":\"모바일\",\"text\":\"010-9999-1006\",\"letter_space\":0},{\"segment\":true,\"var_id\":\"b_email\",\"var_title\":\"이메일\",\"text\":\"gdhong@motion1.co.kr\",\"letter_space\":0}]],\"photo_item_cols\":[]}",
//     "tnUrl": "https://storage.googleapis.com/edicusbase.appspot.com/partners/sandbox/users/sandbox-vdp-tester-uid-of-sandbox/projects/-OeZ4_EXPKT_eKcsXSpU/preivew/preview_0.jpg?ts=1763689521828"    
// }; 


/*
    type TextItem = {
        segment: boolean;
        var_id: string;
        var_title: string;
        text: string;
        letter_space: number;
    }
        
    type TnViewCatalog = {
        has_vdp_photo: boolean;
        text_item_cols: TextItem[][];
        photo_item_cols: PhotoItem[] | boolean;
    }
    
    type VarItem: {
        id: string;
        segment: boolean;
        text: string;
        title: string;
    }
    
    type PageItem = {
        size_mm : {width:number, height:number},
    }
*/

class Context {
	constructor() {
		this.projectId = null;
		this.isProjectOpen = false; // 프로젝트 열려있는지 여부
		this.tnViewCatalog = null;
		this.varItems = [];
		this.pageItems = [];
		this.referenceEditorBox = {width:400, height:400};
		this.editorBoxSize = {width:400, height:400};
	}

	setupPageSizes(data, parentElement) {
		// data.info.page_infos[index]에 있는 가로, 세로 사이즈 정보를 pageItems에 저장한다.

		data.info.page_infos.forEach((page, index) => {
			this.pageItems.push({
				size_mm: {
					width: page.size_mm.width,
					height: page.size_mm.height
				}
			})
		})

		let {width, height} = this.pageItems[0].size_mm;
		this.editorBoxSize = getInnerBoxWithRatio(this.referenceEditorBox, [width, height])

		parentElement.style.width = (2*this.editorBoxSize.width + 8) + 'px';
		parentElement.style.height = this.editorBoxSize.height + 'px';
	}

	build_form_fields() {
		let pages = this.tnViewCatalog.text_item_cols;
		let _this = this;
	
		pages.forEach((textItems, pageIndex) => {
			/*
				type TextItem = {
					segment: boolean;
					var_id: string;
					var_title: string;
					text: string;
					letter_space: number;
				} 
			*/       
	
			textItems.forEach((textItem, index) => {
				let $container = $('<div></div>');
				$container.text(textItem.var_title + ' : ');
	
				let $input = $('<input></input>');
				$input.attr('type', 'text');
				$input.attr('id', textItem.var_id);
				$input.attr('value', textItem.text);
				
				$input.on('keypress', function(e) {
					if (e.which == 13) {
						_this.onUpdateField($(this).val(), textItem);
					}
				});
	
				$container.append($input);
				if (pageIndex == 0) {
					$('#front-page').append($container);
				} else {
					$('#back-page').append($container);
				}
			})
		})
	}	

	onUpdateField(val, textItem) {
		console.log('Input updated:', val, textItem);
		textItem.text = val;
	
		let pageIndex = -1;
		this.tnViewCatalog.text_item_cols.forEach((items, idx) => {
			if (items.includes(textItem)) {
				pageIndex = idx;
			}
		});
	
		if (pageIndex >= 0) {
			let memberData = {};
			this.tnViewCatalog.text_item_cols[pageIndex].forEach(item => {
				memberData[item.var_id] = item.text;
			})
	
			let dataRow = getDataRowForUpdatingTnView(memberData, this.varItems);
			client_env.editor.post_to_tnview('set-data-row', dataRow);  
		}      
	}

	// isProjectOpen 상태에 따라 에디터 컨테이너 표시/숨김 업데이트
	updateEditorContainerVisibility(parentElement) {
		parentElement.style.display = this.isProjectOpen ? 'block' : 'none';
	}

}

let context = new Context();


/*
	type PageItem = {
		size_mm : {width:number, height:number},
	}
*/
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
	$('#btn_open_tnview').click(on_open_tnview);
	$('#btn_delete_project').click(on_delete_project);
	$('#btn_create_tnview').click(on_create_tnview);
    $('#btn_save_vdp').click(on_save_vdp);
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
	context.isProjectOpen = false;
	updateEditorContainerVisibility();
}

function on_create_tnview(event) {
	const selectedIndex = $('#select-template').val();
	if (selectedIndex === '') {
		alert('템플릿을 선택해주세요.');
		return;
	}
	
    const callback = createCreateTnViewCallback(client_env, context, updateEditorContainerVisibility);

	createProduct(client_env, edicusTemplates[selectedIndex], updateEditorContainerVisibility, callback);
}

function on_open_tnview() {
	context.projectId = get_project_id();
	// TnView 프로젝트 열기
	openTnViewProject(client_env, context, "90x50@NC");
}

async function on_delete_project() {
	if (context.isProjectOpen) {
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

function populate_template_dropdown() {
	const $select = $('#select-template');
	edicusTemplates.forEach((template, index) => {
		const $option = $('<option></option>');
		$option.text(template.title);
		$option.attr('value', index);
		$select.append($option);
	});
}

function on_save_vdp() {
	console.log('on_save_vdp')
    client_env.editor.post_to_tnview('save');
}


onMount();
