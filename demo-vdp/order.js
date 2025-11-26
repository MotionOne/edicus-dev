/**
 * 주문 관련 함수 모듈
 */

import * as server from './server.js';


/**
 * VDP 데이터셋을 포함한 잠정 주문 처리
 */
export async function on_tentative_order_with_vdp(context) {
	const {projectId, client_env} = context;

	let vdp_dataset = {
		rows: context.vdpUtil.getDataRows()
	}

	var order = {
		order_for_test: false,		// default:false
		order_count: 1,
		total_price: 23500,
		partner_order_id: 'abcd1234', // 에디쿠스 주문번호에 대응하는 고객사의 주문번호. 추후 고객사의 주문 추적에 활용됩니다.
		order_name: '홍길동',	// 실제 주문자명
		vdp_dataset: vdp_dataset
	}
    /*
        주문상태(order.status)가 "editing" 인 경우에만 잠정 주문 가능.
        주문이 성공하면 주문상태가 "ordering" 으로 변경됨.
    */
	try {
		const err = await server.tentative_order_project_with_vdp(client_env.uid, projectId, order);
		if (err == null)
			alert(`잠정 주문이 완료되었습니다. (projectId: ${projectId})`)
		else {
			console.log('order failed: ', err);
			alert(`잠정 주문이 실패했습니다. (projectId: ${projectId}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to order project:', error);
		alert(`잠정 주문이 실패했습니다. (projectId: ${projectId}) ${error.message}`)
	}
}

/**
 * 확정 주문 처리
 * - 확정주문 상태가 되면 취소 불가능한 주문상태가 됩니다. 
 * - 생산파일(pdf나 jpg등) 렌더링을 하게 되며 렌더링이 완료되믄 생산파일을 다운로드 할 수 있습니다.
 * - 확정주문 상태가 되면 주문상태가 "ordered" 으로 변경됨.
 */
export async function on_definitive_order_project(context) {
	const {projectId, client_env} = context;
    /*
        주문상태(order.status)가 "ordering" 인 경우에만 확정 주문 가능.
        주문이 성공하면 주문상태가 "ordered" 으로 변경됨.
    */
	try {
		const err = await server.definitive_order_project(client_env.uid, projectId);
		if (err == null)
			alert(`확정 주문이 완료되었습니다. (projectId: ${projectId})`)
		else {
			console.log('order failed: ', err);
			alert(`확정 주문에 실패했습니다. (projectId: ${projectId}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to order project:', error);
		alert(`확정 주문에 실패했습니다. (projectId: ${projectId}) ${error.message}`)
	}
}

/**
 * 주문 취소 처리
 */
export async function on_cancel_order_project(context, projectOrderId) {
	const {projectId, client_env} = context;

    /*
        주문상태(order.status)가 "ordering", 즉 잠정 주문 상태인 경우에만 주문 취소 가능.
        주문이 성공하면 주문상태가 "editing" 으로 변경됨.
        참고: 확정 주문은 취소가 불가능합니다.
    */
	try {
		const err = await server.cancel_order_project(client_env.uid, projectOrderId);
		if (err == null)
			alert(`주문을 취소하였습니다. (projectId: ${projectId})`)
		else {
			console.log('cancel failed: ', err);
			alert(`주문 취소를 실패하였습니다(주문 완료된 프로젝트는 취소할 수 없습니다) (projectId: ${projectId}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to cancel order:', error);
		alert(`주문 취소를 실패하였습니다. (projectId: ${projectId}) ${error.message}`)
	}
}

