/*
	Context 객체는 프로젝트 생성 및 열기 과정에서 사용되는 데이터를 관리합니다.
*/

export class Context {
	constructor(client_env) {
		this.client_env = client_env;
		this.projectId = null;
		this.isProjectOpen = false;
        this.mobile = false;
	}

	// isProjectOpen 상태에 따라 에디터 컨테이너 표시/숨김 업데이트
	updateEditorContainerVisibility() {
		if (this.client_env.parent_element) {
			this.client_env.parent_element.style.display = this.isProjectOpen ? 'block' : 'none';
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
		if (this.client_env.editor) {
			this.client_env.editor.close({
				parent_element: this.client_env.parent_element
			})
		}
		this.hideEditor();
	}
}

