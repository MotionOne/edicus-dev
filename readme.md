# Edicus Cloud Editor / Site Integration Test

## http로 서비스 하기
- 4300 port로 test.html을 웹서버로 서비스 해야 합니다.
    
## http-server로 띄우기 (참고용)
- 설치 : npm install --global http-server (github: https://github.com/indexzero/http-server)
- 실행 : http-server -c-1 -p 4300    (local file cache가 되는 것을 막기 위해 argument순서 지킬 것.)

## 테스트 사이트 접속
- http://localhost:4300/test.html

## Edicus 문서
- Edicus Javascript SDK : https://docs.google.com/document/d/1buvh-TjQtAqddAD4-QFxBHKFDESRxInsxFcViuEwNZc/edit?tab=t.0
- Edicus Server API : https://docs.google.com/document/d/1OhWdgv9Sz8By4N48eY0uO_84M3keLVQvdpdpK9u_3bA/edit?tab=t.0#