# Edicus Cloud Editor / Site Integration Test
에디쿠스 편집기 데모 페이지입니다. 

## 개요
- edicus편집기 운용방식과 ediusSDK를 사용하는 방법을 파악하기 위한 용도입니다.
- 이해를 돕기위해 jQuery 이외의 라이브러리는 사용하지 않고 제작되었습니다.
- 4300 port로 test.html을 웹서버로 서비스 해야 합니다.
- 실제 데모를 운용해 보기 위해서는 모션원으로부터 apiKey를 발급받아야 합니다.

## 테스트용 Edicus Api 발급
- 테스트용 Edicus Server API key를 모션원에 요청하여 발급 받아야 합니다.
- 테스트용 계정 id는 "sandbox" 입니다.


## 사전 작업
- 프로젝트의 root 폴더에 .env.js 파일을 생성해야 합니다.
```javascript
export let server_env = {
    apiHost: 'https://api-dot-edicusbase.appspot.com',
	apiKey: '발급받은 edicus api key를 입력하세요' // 모션원에서 발급받은 api를 입력해야 합니다.
}
```
- 이 파일은 .gitignore에서 버전관리 되지 않도록 제외되어 있습니다. 
- apiKey가 노출되지 않도록 각별히 주의해야 합니다.

## http-server로 띄우기
- 설치 : npm install --global http-server (github: https://github.com/indexzero/http-server)
- 실행 : http-server -c-1 -p 4300    (local file cache가 되는 것을 막기 위해 argument순서 지킬 것.)
- 참고: 이 프로젝트의 루트 폴더를 웹으로 서비스할 수 있는 방법이면 어떤 방법이든 상관없습니다.


## 테스트 사이트 접속
- `http://localhost:4300/test.html`

## Edicus 문서
- [Edicus Javascript SDK](https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit?tab=t.0)  
- [Edicus Server API](https://docs.google.com/document/d/1OhWdgv9Sz8By4N48eY0uO_84M3keLVQvdpdpK9u_3bA/edit?tab=t.0#)