$(function ($) {

	numeral.language('de');

	// Show input range value in corresponding output tag
	$('input[type=range]').on('input', function (event) {
		$('output[name=' + this.id + '-indicator]').text(this.valueAsNumber);
	});
	// Initialize all indicators
	$('input[type=range]').trigger('input');

	var data = []; // Used for calculation later

	// Parse and render cost types
	Papa.parse('data/cost-types.csv', {
		download: true,
		header: true,
		complete: function (results) {
			var options = '';

			results.data.forEach(function(costType) {
				options += '<option value="' + costType.id + '">' + costType.title + '</option>';

				data[costType.id] = costType;
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

	// Calculate lifetime table
	$('#calculate').click(function () {
		var years = $('#review-period').val(),
			header = $('#calculation thead tr'),
			t0 = header.find('th:eq(1)'),
			sumColumn = header.find('th:last'),
			discounting = $('#discounting').val() / 100,
			inflation = $('#priceincrease-general').val() / 100;

		// Reset table
		$('#calculation thead tr th:gt(1):not(:last)').remove();
		$('#calculation tbody').empty();

		// Initialize header
		for (var year = 1; year <= years; year++) {
			var newColumn = t0.clone();

			newColumn.find('sub').text(year);

			sumColumn.before(newColumn);
		}

		$('#cost-types tbody tr:not(:last-child)').each(function (i, element) {
			var id = $(element).find('select').val(),
				manufacturingCosts = parseInt($(element).find('input').val()),
				costType = data[id],
				row = $('<tr>'),
				sum = 0;

			$('#calculation tbody').append(row);
			row.append('<td>' + costType['title'] + '</td>');

			for (var year = 0; year <= years; year++) {
				// Operating costs
				var cost = manufacturingCosts * costType['operation'];

				// Reconstruction
				if (year == 0 || year == costType['lifetime']) {
					cost = manufacturingCosts;
				}

				// Discounting
				cost = cost / Math.pow(1 + discounting, year);

				// Inflation
				cost = cost * Math.pow(1 + inflation, year);

				row.append('<td>' + numeral(cost).format('0,0.000') + '&nbsp;€</td>');

				sum += cost;
			}

			row.append('<td>' + numeral(sum).format('0,0.000') + '&nbsp;€</td>');
		});
	});

})
