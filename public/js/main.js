$(function ($) {

	/*
	 * General functions
	 */
	// Return RGB values of random color
	var getRandomColor = function () {
		return (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256));
	};

	numeral.language('de');

	// Show input range value in corresponding output tag
	$('input[type=range]').on('input', function (event) {
		$('output[name=' + this.id + '-indicator]').text(this.valueAsNumber);
	});
	// Initialize all indicators
	$('input[type=range]').trigger('input');

	var data = []; // Used for calculation later

	// Parse and render locations
	Papa.parse('data/locations.csv', {
		download: true,
		header: true,
		complete: function (results) {
			var options = '';

			results.data.forEach(function(location) {
				options += '<option value="' + location.factor + '">' + location.name + '</option>';
			});

			$('#location').append(options);
		}
	});

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
		$('#cost-types tbody tr:not(:last)').each(function (i, element) {
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
			inflation = $('#priceincrease-general').val() / 100,
			vat = $('input[name=vat]:checked').val(),
			locationFactor = $('#location').val(),
			labels = [0],
			datasets = [],
			overall = 0,
			sumRow = $('#calculation tbody tr:last');

		$('#calculation').show();

		// Reset table
		$('#calculation thead tr th:gt(1):not(:last)').remove();
		$('#calculation tbody tr:not(:last)').remove();
		sumRow.children('td:not(:first)').remove();

		// Initialize header
		for (var year = 1; year <= years; year++) {
			var newColumn = t0.clone();

			newColumn.find('sub').text(year);

			sumColumn.before(newColumn);

			labels.push(year);
		}

		// Calculate cost types
		$('#cost-types tbody tr:not(:last)').each(function (i, element) {
			var id = $(element).find('select').val(),
				manufacturingCosts = parseInt($(element).find('input').val()),
				costType = data[id],
				row = $('<tr>'),
				sum = 0,
				values = [];

			sumRow.before(row);
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

				// VAT
				cost = cost * (1 + vat / 100);

				// Location
				cost = cost * (1 + locationFactor / 100);

				row.append('<td>' + numeral(cost).format('0,0.000') + '&nbsp;€</td>');

				values.push(Math.round(cost * 1000) / 1000);
				sum += cost;
			}

			row.append('<td>' + numeral(sum).format('0,0.000') + '&nbsp;€</td>');
			overall += sum;

			var color = getRandomColor();
			datasets.push({
				label: costType['title'],
				data: values,
				fillColor: 'rgba(' + color + ',0.2)',
				strokeColor: 'rgb(' + color + ')',
				pointColor: 'rgb(' + color + ')',
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: 'rgb(' + color + ')',
			});
		});

		// Add sum row
		var values = [];
		for (var year = 0; year <= years; year++) {
			var sum = 0;

			datasets.forEach(function(dataset) {
				sum += dataset.data[year];
			});

			sumRow.append('<td>' + numeral(sum).format('0,0.000') + '&nbsp;€</td>');
			values.push(sum);
		}

		sumRow.append('<td>' + numeral(overall).format('0,0.000') + '&nbsp;€</td>');

		var color = getRandomColor();
		datasets.push({
			label: sumRow.children('td:first').text(),
			data: values,
			fillColor: 'rgba(' + color + ',0.2)',
			strokeColor: 'rgb(' + color + ')',
			pointColor: 'rgb(' + color + ')',
			pointStrokeColor: "#fff",
			pointHighlightFill: "#fff",
			pointHighlightStroke: 'rgb(' + color + ')',
		});

		// Chart
		var ctx = $("#chart")[0].getContext("2d");
		var chart = new Chart(ctx).Line({
			labels: labels,
			datasets: datasets
		});
		$('#legend').html(chart.generateLegend());
	});

})
