/**
 * 프로젝트 데이터를 테이블 형태로 표시합니다
 * @param {Object} project_data - 프로젝트 데이터 객체
 */
export function update_project_data_table(project_data) {
	var $container = $('#project_data_table_container');
	$container.empty();
	
	if (!project_data) {
		return;
	}
	
	var $table = $('<table></table>');
	$table.css({
		'border-collapse': 'collapse',
		'border': '1px solid #ddd',
		'width': '100%',
		'max-width': '800px'
	});
	
	// 테이블 헤더
	var $thead = $('<thead></thead>');
	var $headerRow = $('<tr></tr>');
	['Project ID', 'Order ID', 'Status', 'Title'].forEach(function(header) {
		var $th = $('<th></th>').text(header);
		$th.css({
			'border': '1px solid #ddd',
			'padding': '8px',
			'background-color': '#f2f2f2',
			'text-align': 'left'
		});
		$headerRow.append($th);
	});
	$thead.append($headerRow);
	$table.append($thead);
	
	// 테이블 바디
	var $tbody = $('<tbody></tbody>');
	var $dataRow = $('<tr></tr>');
	
	// 데이터 행 추가
	[
		project_data.project_id || '-',
		project_data.order_id || '-',
		project_data.status || '-',
		project_data.title || '-'
	].forEach(function(value) {
		var $td = $('<td></td>').text(value);
		$td.css({
			'border': '1px solid #ddd',
			'padding': '8px'
		});
		$dataRow.append($td);
	});
	
	$tbody.append($dataRow);
	$table.append($tbody);
	$container.append($table);
}

