$(function ($) {

	numeral.language('de');

	// Show input range value in corresponding output tag
	$('input[type=range]').on('input', function (event) {
		$('output[name=' + this.id + '-indicator]').text(this.valueAsNumber);
	});
	// Initialize all indicators
	$('input[type=range]').trigger('input');

	// Parse and render cost types
	Papa.parse('data/cost-types.csv', {
		download: true,
		header: true,
		complete: function (results) {
			var options = '';

			results.data.forEach(function(costType) {
				options += '<option value="' + costType.id + '">' + costType.title + '</option>';
			});

			$('#cost-types select').append(options);
		}
	});

	// Add cost type
	$('#cost-types select').change(function (element) {
		var row = $(element.target).closest('tr'),
			numberColumn = row.children('td:first');

		if (!numberColumn.text()) {
			// Add new template row at the end
			$('#cost-types tbody').append(row.clone(true));

			// Activate current row
			numberColumn.text($('#cost-types tbody tr').length - 1);
			row.find('input').focus();
			row.find('button').show();
		}
	});

	// Remove cost type
	$('#cost-types button').click(function (element) {
		$(element.target).closest('tr').remove();

		// Recalculate row numbers
		$('#cost-types tbody tr:not(:last-child)').each(function (i, element) {
			$(element).children('td:first').text(i + 1);
		});
	});

})
