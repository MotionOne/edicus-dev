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
    
    type PageItem = {
        size_mm : {width:number, height:number},
    }	
*/

export class Context {
	constructor() {
		this.projectId = null;
		this.isProjectOpen = false;
		this.tnViewCatalog = null; // TnViewCatalog
		this.varItems = []; // VarItem[]
		this.pageItems = []; // PageItem[]
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
