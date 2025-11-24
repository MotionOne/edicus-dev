/*
    type TnViewCatalog = {
        has_vdp_photo: boolean;
        text_item_cols: TextItem[][];
        photo_item_cols: PhotoItem[] | boolean;
    }

    type TextItem = {
        segment: boolean;
        var_id: string;
        var_title: string;
        text: string;
        letter_space: number;
    }
    
    type PhotoItem = {
        var_id: string;
        var_title: string;
        value: any;
    }

    type VarItem: {
        id: string;
        segment: boolean;
        text: string;
        title: string;
    }

    type VDPItem {
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
        }
    }    
*/

export class VdpUtil {
    constructor() {
        this.tnViewCatalog = null;  // TnViewCatalog
        this.varItems = [];         // VarItem[]
    }

    setVdpCatalog(vdp_catalog) {
        this.varItems = this.getVariableInfo(vdp_catalog);
        this.tnViewCatalog = this.handle_vdp_catalog(vdp_catalog);				
    }

    /*
        Parameter:
            vdp_catalog: VDPItem[]
        Return:
            VarItem[]
    */
    getVariableInfo(vdp_catalog) {
        let variables = [];
        console.log("vdp_catalog", vdp_catalog);
        vdp_catalog.forEach(item => {
            if (item.item_type == 'textbox') {
                if (item.variable.segments && item.variable.segments.length > 0) {
                    item.variable.segments.forEach(segment => {
                        if (!variables.find(v => v.id == segment.id)) {
                            variables.push({
                                id: segment.id,
                                title: segment.title,
                                text: segment.text || "",
                                segment: true
                            });
                        }
                    });
                }
                else {
                    if (!variables.find(v => v.id == item.variable.id)) {
                        variables.push({
                            id: item.variable.id,
                            title: item.variable.title, //todo 경로 확인필요
                            text: item.data.text || "",
                            segment: false
                        });
                    }
                }
            }
        });
        return variables;
    }
    
    /*
        Parameter:
            vdp_catalog: VDPItem[]
        Return:
            TnViewCatalog
    */
    handle_vdp_catalog(vdp_catalog) {
        let has_vdp_photo = false;
        let text_item_cols = [];
        let photo_item_cols = [];
        vdp_catalog.forEach(item => {
            if (item.item_type == 'textbox') {
                while (text_item_cols.length <= item.path.page_index) {
                    text_item_cols.push([]);
                }
                if (item.variable.segments && item.variable.segments.length > 0) {
                    item.variable.segments.forEach(segment => {
                        text_item_cols[item.path.page_index].push({
                            segment: true,
                            var_id: segment.id,
                            var_title: segment.title || item.variable.title,
                            text: segment.text || "",
                            letter_space: segment.letter_space || 0
                        });
                    });
                }
                else {
                    if (!text_item_cols[item.path.page_index].find((col) => col.var_id == item.variable.id)) {
                        text_item_cols[item.path.page_index].push({
                            var_id: item.variable.id,
                            var_title: item.variable.title,
                            text: item.data.text || "",
                        });
                    }
                }
            }
            else if (item.item_type == 'sticker') {
                while (text_item_cols.length <= item.path.page_index) {
                    text_item_cols.push([]);
                }
                if (!text_item_cols[item.path.page_index].find((col) => col.var_id == item.variable.id)) {
                    text_item_cols[item.path.page_index].push({
                        var_id: item.variable.id,
                        var_title: item.variable.title,
                        text: item.data.text || "",
                    });
                }
            }
            else if (item.item_type == 'cell') {
                has_vdp_photo = true;
                while (photo_item_cols.length <= item.path.page_index) {
                    photo_item_cols.push([]);
                }
                if (!photo_item_cols[item.path.page_index].find(col => col.var_id == item.variable.id)) {
                    photo_item_cols[item.path.page_index].push({
                        var_id: item.variable.id,
                        var_title: item.variable.title,
                        value: item.data
                    });
                }
            }
        });

        return {
            has_vdp_photo,
            text_item_cols,
            photo_item_cols
        };
    }

    getDataRowForUpdatingTnView() {
		// edicus vdp 편집기에서는 일부 텍스트 필드만 업데이트하는 것이 아니라, 모든 텍스트 필드의 값을 업데이트한다.
		let memberData = {};
		this.tnViewCatalog.text_item_cols.flat().forEach(item => memberData[item.var_id] = item.text);

        let dataRow = {
            cols: []
        };
        let keys = Object.keys(memberData);
        keys.forEach(key => {
            let varItem = this.varItems.find(v => v.id == key);
            dataRow.cols.push({
                id: key,
                value: {
                    text: memberData[key],
                    letter_space: 0
                },
                segment: varItem === null || varItem === void 0 ? void 0 : varItem.segment,
                shrink: true,
                // pindex: --> 값 넣지 말것.
            });
        });
        return dataRow;
    }
}