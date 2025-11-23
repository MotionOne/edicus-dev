/*
	parentBox: 내접할 부모 박스
    - type: {width:number, height:number}

	ratio: 내접할 자식 박스의 가로 세로 비율을 나타내는 정수 쌍(tuple)
    - type: [number, number]
*/

export function getInnerBoxWithRatio(parentBox, ratio) {
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
