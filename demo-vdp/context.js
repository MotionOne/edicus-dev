/*
	Context 객체는 프로젝트 생성 및 열기 과정에서 사용되는 데이터를 관리합니다.
*/

import { getDataRowForUpdatingTnView } from './vdp-catalog.js';
import { getInnerBoxWithRatio } from './util.js';

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
*/

export class Context {
	constructor(client_env) {
		this.client_env = client_env;
		this.projectId = null;
		this.isProjectOpen = false;
		this.tnViewCatalog = null; // TnViewCatalog
		this.varItems = []; // VarItem[]
		this.editorBoxSize = {};
	}

	/*
		프로젝트의 페이지 사이즈의 비율에 맞추어 표시 영역의 크기를 설정한다.
	*/
	setupPageSizes(data) {
		// 첫 번째 페이지의 가로, 세로 사이즈를 가져온다.
		let pageWidth = data.info.page_infos[0].size_mm.width;
		let pageHeight = data.info.page_infos[0].size_mm.height;
		let containerSize = {width:400, height:400};
		this.editorBoxSize = getInnerBoxWithRatio(containerSize, [pageWidth, pageHeight])

		this.client_env.parent_element.style.width = (2*this.editorBoxSize.width + 8) + 'px'; // 2개 페이지를 나란히 표시할 때의 너비
		this.client_env.parent_element.style.height = this.editorBoxSize.height + 'px';
	}

	/*
		프로젝트가 제공하는 필드 정보를 이용해 텍스트 필드를 생성한다.
	*/
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
	
		let itemInddex = -1;
		let pageIndex = this.tnViewCatalog.text_item_cols.findIndex(items => {
			itemInddex = items.findIndex(item => item.var_id == textItem.var_id);
			return itemInddex >= 0;
		});
	
		if (pageIndex >= 0) {
			let memberData = {};
			// pageIndex 번째 페이지의 모든 텍스트 필드를 순회하며 memberData에 추가한다.
			this.tnViewCatalog.text_item_cols[pageIndex][itemInddex].text = val;
			memberData[textItem.var_id] = val;
	
			let dataRow = getDataRowForUpdatingTnView(memberData, this.varItems);
			this.client_env.editor.post_to_tnview('set-data-row', dataRow);  
		}      
	}
		
	removeAllFormFields() {
		$('#front-page').empty();
		$('#back-page').empty();
	}

	// isProjectOpen 상태에 따라 에디터 컨테이너 표시/숨김 업데이트
	updateEditorContainerVisibility(parentElement) {
		parentElement.style.display = this.isProjectOpen ? 'block' : 'none';
	}
	showEditor() {
		this.isProjectOpen = true;
		this.client_env.parent_element.style.display = 'block';
	}
	hideEditor() {
		this.isProjectOpen = false;
		this.client_env.parent_element.style.display = 'none';
	}

	closeEditor(client_env) {
		client_env.editor.close({
			parent_element: client_env.parent_element
		})
		this.isProjectOpen = false;
		this.updateEditorContainerVisibility(client_env.parent_element);
	}

}
