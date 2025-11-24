
export class VdpStorage {
    constructor() {
        // localStorage를 사용하여 데이터베이스를 모사합니다.
        this.storage = window.localStorage;
    }

    /**
     * 데이터를 저장하거나 업데이트합니다 (Create, Update).
     * @param {string} projectId - 프로젝트 ID (Key)
     * @param {object} vdpData - 저장할 VDP 데이터
     */
    save(projectId, vdpData) {
        if (!projectId) {
            console.error('[VdpStorage] save failed: projectId is missing');
            return;
        }
        try {
            const jsonData = JSON.stringify(vdpData);
            this.storage.setItem(projectId, jsonData);
            console.log(`[VdpStorage] Saved data for project: ${projectId}`);
        } catch (e) {
            console.error('[VdpStorage] Error saving data:', e);
        }
    }

    /**
     * 데이터를 조회합니다 (Read).
     * @param {string} projectId - 프로젝트 ID (Key)
     * @returns {object|null} - 저장된 VDP 데이터 또는 null
     */
    load(projectId) {
        if (!projectId) {
            console.error('[VdpStorage] load failed: projectId is missing');
            return null;
        }
        const jsonData = this.storage.getItem(projectId);
        if (jsonData) {
            try {
                return JSON.parse(jsonData);
            } catch (e) {
                console.error('[VdpStorage] Error parsing data:', e);
                return null;
            }
        }
        return null;
    }

    /**
     * 데이터를 삭제합니다 (Delete).
     * @param {string} projectId - 프로젝트 ID (Key)
     */
    delete(projectId) {
        if (!projectId) {
            console.error('[VdpStorage] delete failed: projectId is missing');
            return;
        }
        this.storage.removeItem(projectId);
        console.log(`[VdpStorage] Deleted data for project: ${projectId}`);
    }

    /**
     * (유틸리티) 모든 저장된 데이터를 콘솔에 출력합니다.
     */
    debugPrintAll() {
        console.log('--- [VdpStorage] All Data ---');
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            console.log(`${key}:`, this.storage.getItem(key));
        }
        console.log('-----------------------------');
    }
}

