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
	constructor() {
		this.projectId = null;
		this.isProjectOpen = false;
		this.tnViewCatalog = null; // TnViewCatalog
		this.varItems = []; // VarItem[]
	}

	setupPageSizes(data, parentElement) {
		// 첫 번째 페이지의 가로, 세로 사이즈를 가져온다.
		let pageWidth = data.info.page_infos[0].size_mm.width;
		let pageHeight = data.info.page_infos[0].size_mm.height;
		let containerSize = {width:400, height:400};
		let editorBoxSize = getInnerBoxWithRatio(containerSize, [pageWidth, pageHeight])

		parentElement.style.width = (2*editorBoxSize.width + 8) + 'px'; // 2개 페이지를 나란히 표시할 때의 너비
		parentElement.style.height = editorBoxSize.height + 'px';
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
	
	removeAllFormFields() {
		$('#front-page').empty();
		$('#back-page').empty();
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

	closeEditor(client_env) {
		client_env.editor.close({
			parent_element: client_env.parent_element
		})
		this.isProjectOpen = false;
		this.updateEditorContainerVisibility(client_env.parent_element);
	}

}
