
// 발급받은 partner 코드 (.server-env.js 파일의 apiKey는 이 partner 코드로 발급받은 키를 사용해야 합니다.)
export let partner = "sandbox"; 


/*
    Edicus 템플릿 목록

    edicus manager 사이트에서 ps_code와 template_uri를 확인하고 입력해야 합니다.
    사이트 : https://edicus-man.firebaseapp.com/#/manager/resource/
    1. 사이트에 로그인 합니다.
    2. 좌측 메뉴에서 "Resource"을 클릭합니다.
    3. "Resoruce"페이지 상단의 "Search" 버튼을 클릭하여 등록된 템플릿을 불러옵니다.
    4. 템플릿 상세 페이지(화면 오른쪽)에서 "ps-codes"와 "resUri"을 확인합니다.
    5. ps-codes와 resUri를 복사해서 아래 edicusTemplates에 추가합니다.
*/

export let edicusBasicTemplates = [
	{
		ps_code: '90x50@NC',
		template_uri: 'gcs://template/partners/sandbox/res/template/2704164.json',
		title: '명함 샘플 1',
	},
	{
		ps_code: '90x50@NC',
		template_uri: 'gcs://template/partners/sandbox/res/template/2704145.json',
		title: '명함 샘플 2',
	},
	{
		ps_code: '148x210@NAME-STICKER',
		template_uri: 'gcs://template/partners/sandbox/res/template/3112918.json',
		title: '네임스티커 샘플',
	}
]

export let edicusVdpTemplates = [
	{
		ps_code: '90x50@NC',
		template_uri: 'gcs://template/partners/sandbox/res/template/3113133.json',
		title: 'VDP 명함 샘플 1',
	},
]