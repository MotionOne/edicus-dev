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
	$table.addClass('w-full max-w-[800px] border-collapse border border-gray-300 text-sm shadow-sm');
	
	// 테이블 헤더
	var $thead = $('<thead></thead>');
	var $headerRow = $('<tr></tr>');
	['Project ID', 'Order ID', 'Status', 'Title', 'Created Time'].forEach(function(header) {
		var $th = $('<th></th>').text(header);
		$th.addClass('border border-gray-300 p-2 bg-gray-100 text-left font-semibold text-gray-700');
		$headerRow.append($th);
	});
	$thead.append($headerRow);
	$table.append($thead);
	
	// 테이블 바디
	var $tbody = $('<tbody></tbody>');
	var $dataRow = $('<tr></tr>');
	
	// ctime을 로컬 시간으로 변환
	var ctimeStr = '-';
	if (project_data.ctime) {
		var date = new Date(project_data.ctime); // Unix timestamp를 밀리초로 변환
		ctimeStr = date.toLocaleString(); // 로컬 시간으로 포맷
	}
	
	// 데이터 행 추가
	[
		project_data.project_id || '-',
		project_data.order_id || '-',
		project_data.status || '-',
		project_data.title || '-',
		ctimeStr
	].forEach(function(value) {
		var $td = $('<td></td>').text(value);
		$td.addClass('border border-gray-300 p-2 text-gray-600 bg-white');
		$dataRow.append($td);
	});
	
	$tbody.append($dataRow);
	$table.append($tbody);
	$container.append($table);
}
