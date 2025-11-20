export interface VDPItemSegment {
	id: string,
	title: string,
	text: string,
	letter_space: number,
	range: { index: number, length: number },
	cover_range: { index: number, length: number } 
}

export interface VDPItem {
	item_type: string,
	path: {
		page_index: number
	},
	variable: {
		type: string,
		id: string,
		title: string
		segments: Array<VDPItemSegment>
	},
	data: {
		text: string
	},
}

export type TextItem = {
	segment?:boolean;
	var_id: string;
	var_title: string;
	text: string;
	letter_space?: number;
}
export type PhotoItem = {
	var_id: string;
	var_title: string;
	value: {
		text:string
	};
}
export type VarItem = {
	id: string,
	title: string,
	text: string,
	segment: boolean,
}

export function getVariableInfo(vdp_catalog:Array<VDPItem>):VarItem[] {
	let variables:VarItem[] = [];

	console.log("vdp_catalog", vdp_catalog)
	vdp_catalog.forEach(item=> {
		if (item.item_type == 'textbox') {
			if (item.variable.segments && item.variable.segments.length > 0) {
				item.variable.segments.forEach(segment=> {
					if (!variables.find(v=> v.id == segment.id)) {
						variables.push({
							id: segment.id,
							title: segment.title,
							text: segment.text || "",
							segment: true
						})
					}
				})
			}
			else {
				if (!variables.find(v=> v.id == item.variable.id)) {
					variables.push({
						id: item.variable.id,
						title: item.variable.title, //todo 경로 확인필요
						text: item.data.text || "",
						segment: false
					})
				}
			}
		}
	})
	return variables;
}

export function handle_vdp_catalog(vdp_catalog:Array<VDPItem>) {
	// console.log('VDP', vdp_catalog)

	let has_vdp_photo = false;
	let text_item_cols:Array<TextItem[]> = [];
	let photo_item_cols:Array<PhotoItem[]> = [];

	vdp_catalog.forEach(item=> {
		if (item.item_type == 'textbox') {
			while(text_item_cols.length <= item.path.page_index) {
				text_item_cols.push([]);
			}
			
			if (item.variable.segments && item.variable.segments.length > 0) {
				item.variable.segments.forEach(segment=> {
					text_item_cols[item.path.page_index].push({
						segment: true,
						var_id: segment.id,
						var_title: segment.title || item.variable.title,
						text: segment.text || "",
						letter_space: segment.letter_space || 0
					})
				})
			}
			else {
				if (!text_item_cols[item.path.page_index].find((col:any) => col.var_id == item.variable.id)) {
					text_item_cols[item.path.page_index].push({
						var_id: item.variable.id,
						var_title: item.variable.title,
						text: item.data.text || "",
					})
				}
			}
		}
		else if (item.item_type == 'sticker') {
			while(text_item_cols.length <= item.path.page_index) {
				text_item_cols.push([]);
			}
			if (!text_item_cols[item.path.page_index].find((col:any) => col.var_id == item.variable.id)) {
				text_item_cols[item.path.page_index].push({
					var_id: item.variable.id,
					var_title: item.variable.title,
					text: item.data.text || "",
				})
			}
		}
		else if (item.item_type == 'cell') {
			has_vdp_photo = true;
			while(photo_item_cols.length <= item.path.page_index) {
				photo_item_cols.push([]);
			}

			if (!photo_item_cols[item.path.page_index].find(col=> col.var_id == item.variable.id)) {
				photo_item_cols[item.path.page_index].push({
					var_id: item.variable.id,
					var_title: item.variable.title,
					value: item.data
				})
			}
		}
	})

	return {
		has_vdp_photo,
		text_item_cols,
		photo_item_cols
	}
}

/*
	아래에서 segment값은 제대로 넣어야 함.
*/
export function getDataRowForUpdatingTnView(memberData:any, varItems:VarItem[]) {
	type DataRow = {
		cols: any[]
	}

	let dataRow:DataRow = {
		cols: []
	}

	let keys = Object.keys(memberData)
	keys.forEach(key=> {
		let varItem = varItems.find(v=> v.id == key);
		dataRow.cols.push({
			id: key,
			value: {
				text:memberData[key],
				letter_space: 0
			}, 
			segment: varItem?.segment,	//todo 실제값 넣어야 함.
			shrink:true,
			// pindex: --> 값 넣지 말것.
		})
	})

	// text_item_cols.forEach((col, pindex)=> {
	// 	col.forEach((item, iindex)=> {
	// 		dataRow.cols.push({
	// 			pindex: pindex,
	// 			id: item.var_id,
	// 			segment: item.segment,
	// 			shrink: true,
	// 			value: {
	// 				text: item.text,
	// 				letter_space: item.letter_space
	// 			}
	// 		})
	// 	})
	// })

	// photo_item_cols.forEach((col, pindex)=> {
	// 	col.forEach((item, iindex)=> {
	// 		if (item.value) {
	// 			dataRow.cols.push({
	// 				pindex: pindex,
	// 				id: item.var_id,
	// 				value: item.value,
	// 			})	
	// 		}
	// 	})
	// })

	return dataRow;
}