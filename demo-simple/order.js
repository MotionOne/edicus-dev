/**
 * 주문 관련 함수 모듈
 */

import * as server from './server.js';

/**
 * 잠정 주문 처리
 */
export async function on_tentative_order_project(client_env, project_id) {
	console.log(project_id)

	var order = {
		order_for_test: false,
		order_count: 1,
		total_price: 23500,
		partner_order_id: 'test',
		order_name: 'test'
	}
	try {
		const err = await server.tentative_order_project(client_env.uid, project_id, order);
		if (err == null)
			alert(`잠정 주문이 완료되었습니다. (project_id: ${project_id})`)
		else {
			console.log('order failed: ', err);
			alert(`잠정 주문이 실패했습니다. (project_id: ${project_id}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to order project:', error);
		alert(`잠정 주문이 실패했습니다. (project_id: ${project_id}) ${error.message}`)
	}
}

/**
 * VDP 데이터셋을 포함한 잠정 주문 처리
 */
export async function on_tentative_order_with_vdp(client_env, project_id) {
	console.log(project_id)

	// dataset of "variable data printing" mode
	var vdp_dataset = {
		rows: [{
			cols: [{id:'name', value:'정 진 수'}, {id:'title-role', value:'영업 이사'}]
		}, {
			cols: [{id:'name', value:'이 정 민'}, {id:'title-role', value:'마케팅 부장'}]
		}, {
			cols: [{id:'name', value:'김 준 호'}, {id:'title-role', value:'개발 부장'}]
		}]		
	}
	var order = {
		order_for_test: false,		// default:false
		order_count: 1,
		total_price: 23500,
		partner_order_id: 'test',
		order_name: 'test',
		vdp_dataset: vdp_dataset
	}
    /*
        주문상태(order.status)가 "editing" 인 경우에만 잠정 주문 가능.
        주문이 성공하면 주문상태가 "ordering" 으로 변경됨.
    */
	try {
		const err = await server.tentative_order_project(client_env.uid, project_id, order);
		if (err == null)
			alert(`잠정 주문이 완료되었습니다. (project_id: ${project_id})`)
		else {
			console.log('order failed: ', err);
			alert(`잠정 주문이 실패했습니다. (project_id: ${project_id}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to order project:', error);
		alert(`잠정 주문이 실패했습니다. (project_id: ${project_id}) ${error.message}`)
	}
}

/**
 * 확정 주문 처리
 */
export async function on_definitive_order_project(client_env, project_id) {
    /*
        주문상태(order.status)가 "ordering" 인 경우에만 확정 주문 가능.
        주문이 성공하면 주문상태가 "ordered" 으로 변경됨.
    */
	try {
		const err = await server.definitive_order_project(client_env.uid, project_id);
		if (err == null)
			alert(`확정 주문이 완료되었습니다. (project_id: ${project_id})`)
		else {
			console.log('order failed: ', err);
			alert(`확정 주문에 실패했습니다. (project_id: ${project_id}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to order project:', error);
		alert(`확정 주문에 실패했습니다. (project_id: ${project_id}) ${error.message}`)
	}
}

/**
 * 주문 취소 처리
 */
export async function on_cancel_order_project(client_env, project_arr, project_id) {
	// console.log(project_id)

	var project = project_arr.find(function(project) { return project.project_id == project_id })

    /*
        주문상태(order.status)가 "ordering", 즉 잠정 주문 상태인 경우에만 주문 취소 가능.
        주문이 성공하면 주문상태가 "editing" 으로 변경됨.
        참고: 확정 주문은 취소가 불가능합니다.
    */
	try {
		const err = await server.cancel_order_project(client_env.uid, project.order_id);
		if (err == null)
			alert(`주문이 취소되었습니다. (project_id: ${project_id})`)
		else {
			console.log('cancel failed: ', err);
			alert(`주문 취소에 실패했습니다. (project_id: ${project_id}) ${err.message}`)
		}
	} catch (error) {
		console.error('Failed to cancel order:', error);
		alert(`주문 취소에 실패했습니다. (project_id: ${project_id}) ${error.message}`)
	}
}

