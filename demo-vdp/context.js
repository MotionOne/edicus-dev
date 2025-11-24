/*
	Context 객체는 프로젝트 생성 및 열기 과정에서 사용되는 데이터를 관리합니다.
*/

import { VdpUtil } from './vdp-util.js';
import { VdpStorage } from './vdp-storage.js';

export class Context {
	constructor(client_env) {
		this.client_env = client_env;
		this.projectId = null;
		this.isProjectOpen = false;
		this.vdpUtil = new VdpUtil();
		this.editorBoxSize = {};
		this.vdpStorage = new VdpStorage();
	}


	loadVdpData(projectId) {
		this.vdpUtil.reset();
		this.projectId = projectId;
		let dataRows = this.vdpStorage.load(this.projectId);
		this.vdpUtil.loadDataRows(dataRows);
	}
	/*
		프로젝트의 페이지 사이즈의 비율에 맞추어 표시 영역의 크기를 설정한다.
	*/
	setupPageSizes(data) {
		// 첫 번째 페이지의 가로, 세로 사이즈를 가져온다.
		let pageWidth = data.info.page_infos[0].size_mm.width;
		let pageHeight = data.info.page_infos[0].size_mm.height;
		let containerSize = {width:400, height:400};
		this.editorBoxSize = this.getInnerBoxWithRatio(containerSize, [pageWidth, pageHeight])

		this.client_env.parent_element.style.width = (2*this.editorBoxSize.width + 8) + 'px'; // 2개 페이지를 나란히 표시할 때의 너비
		this.client_env.parent_element.style.height = this.editorBoxSize.height + 'px';
	}

	/*
		프로젝트가 제공하는 필드 정보를 이용해 텍스트 필드를 생성한다.
	*/
	build_form_fields() {
		let pages = this.vdpUtil.tnViewCatalog.text_item_cols;
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
	
			$('#front-page').css('width', this.editorBoxSize.width + 'px');
			$('#back-page').css('width', this.editorBoxSize.width + 'px');
			textItems.forEach((textItem) => {
				let $container = $(`<div><div style="display:inline-block; width: 80px;">${textItem.var_title} </div></div>`);
	
				let $input = $('<input></input>');
				$input.attr('type', 'text');
				$input.attr('id', textItem.var_id);
				$input.attr('value', textItem.text);
				$input.css('width', (this.editorBoxSize.width - 90) + 'px');
				$input.css('height', '24px');
				$input.css('margin', '4px 0px');
				$input.css('border', '1px solid #ddd');
				
				$input.on('keypress', function(e) {
					if (e.which == 13) { // Enter key
						_this.onUpdateField($(this).val(), textItem); // 입력된 값을 업데이트한다.
					}
				});
				$input.on('blur', function(e) {
					_this.onUpdateField($(this).val(), textItem); // 입력된 값을 업데이트한다.
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
		// 입력된 값을 텍스트 필드에 업데이트한다.
		textItem.text = val;
	
		let dataRows = this.vdpUtil.getDataRows();
		this.client_env.editor.post_to_tnview('set-data-row', dataRows);  // edicus tnview에 데이터를 업데이트한다.
	}
		
	removeAllFormFields() {
		$('#front-page').empty();
		$('#back-page').empty();
	}

	// isProjectOpen 상태에 따라 에디터 컨테이너 표시/숨김 업데이트
	updateEditorContainerVisibility() {
		const el = this.client_env.parent_element;
		el.style.display = this.isProjectOpen ? 'block' : 'none';

		const btnSave = document.getElementById('btn_save_vdp');
		if (btnSave) {
			btnSave.style.display = this.isProjectOpen ? 'inline-block' : 'none';
		}
	}

	showEditor() {
		this.isProjectOpen = true;
		this.updateEditorContainerVisibility();
	}
	hideEditor() {
		this.isProjectOpen = false;
		this.updateEditorContainerVisibility();
	}

	closeEditor() {
		this.client_env.editor.close({
			parent_element: this.client_env.parent_element
		})
		this.hideEditor();
	}

	saveVdpData() {
		let vdpData = this.vdpUtil.getDataRows();
		this.vdpStorage.save(this.projectId, vdpData); // VDP 데이터는 db에 따로 저장한다.
		this.client_env.editor.post_to_tnview('save');
	}

	/*
		parentBox: 내접할 부모 박스
		- type: {width:number, height:number}

		ratio: 내접할 자식 박스의 가로 세로 비율을 나타내는 정수 쌍(tuple)
		- type: [number, number]
	*/
	getInnerBoxWithRatio(parentBox, ratio) {
		let {width, height} = parentBox;

		if (width / height > ratio[0] / ratio[1]) {
			width = height * (ratio[0] / ratio[1]);
		} else {
			height = width * (ratio[1] / ratio[0]);
		}
		return { 
			width: Math.floor(width), 
			height: Math.floor(height)
		};
	}

}
