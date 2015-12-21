$(function ($) {

	var lineChart,
		// Return RGB values of random color
		getRandomColor = function () {
			return (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256));
		},
		// Round to 3 decimal places
		round3Places = function (value) {
			return Math.round(value * 1000) / 1000;
		},
		// Add one more cost type
		addCostType = function (element) {
			var row = $(element.target).closest('tr'),
				numberColumn = row.children('td:first');

			if (!numberColumn.text()) {
				// Add new template row at the end
				var newRow = row.clone(true);
				newRow.find('input').val(''); // Clear input of new row
				$('#cost-types tbody').append(newRow);

				// Activate current row
				numberColumn.text($('#cost-types tbody tr').length - 1);
				row.find('input').focus();
				row.find('button').show();
				row.find('input').attr('required', ''); // Activate validation
			}
		},
		// Remove selected cost type
		removeCostType = function (element) {
			$(element.target).closest('tr').remove();

			// Recalculate row numbers
			$('#cost-types tbody tr:not(:last)').each(function (i, element) {
				$(element).children('td:first').text(i + 1);
			});
		},
		// Calculate and show result
		calculate = function (costTypes) {
			var years = $('#review-period').val(),
				header = $('#calculation thead tr'),
				t0 = header.find('th:eq(1)'),
				sumColumn = header.find('th:last'),
				discounting = $('#discounting').val() / 100,
				inflation = $('#priceincrease-general').val() / 100,
				vat = $('input[name=vat]:checked').val() / 100,
				locationFactor = $('#location').val() / 100,
				priceYear = parseInt($('#priceyear').val(), 10),
				startYear = parseInt($('#startyear').val(), 10),
				labels = [0],
				datasets = [],
				overall = 0,
				costGroups = {
					'300': 0,
					'400': 0
				},
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
				if (startYear) {
					// Tooltip
					newColumn.find('sub').parent('th').attr('title', startYear + year);
				}

				sumColumn.before(newColumn);

				labels.push(year);
			}

			// Calculate cost types
			costTypes.forEach(function (costTypeInput) {
				var manufacturingCosts = costTypeInput.manufacturingCost,
					costType = data[costTypeInput.id],
					cost,
					row = $('<tr>'),
					sum = 0,
					values = [];

				sumRow.before(row);
				row.append('<td>' + costType['title'] + '</td>');

				if (startYear && priceYear) {
					// Discount for years before start year
					var yearsBetween = startYear - priceYear;
					manufacturingCosts = manufacturingCosts / Math.pow(1 + discounting, yearsBetween);
				}

				for (var year = 0; year <= years; year++) {
					if (year == 0 || year == costType['lifetime']) {
						// (Re)construction
						cost = manufacturingCosts;
					} else {
						// Operating costs
						cost = manufacturingCosts * costType['operation'];
					}

					// Discounting
					cost = cost / Math.pow(1 + discounting, year);

					// Inflation
					cost = cost * Math.pow(1 + inflation, year);

					// VAT
					cost = cost * (1 + vat);

					// Location
					cost = cost * locationFactor;

					row.append('<td>' + numeral(cost).format('0,0.000') + '&nbsp;€</td>');

					values.push(round3Places(cost));
					sum += cost;
				}

				row.append('<td>' + numeral(sum).format('0,0.000') + '&nbsp;€</td>');
				overall += sum;

				// Group 300 and 400 cost types
				costGroups[costTypeInput.id.charAt(0) + '00'] += sum;

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
				var yearSum = 0;

				datasets.forEach(function(dataset) {
					yearSum += dataset.data[year];
				});

				sumRow.append('<td>' + numeral(yearSum).format('0,0.000') + '&nbsp;€</td>');
				values.push(yearSum);
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

			// Clean up old line chart to prevent jumping
			if (lineChart)
				lineChart.destroy();

			// Line chart cost per year
			var lineChartCtx = $("#line-chart canvas")[0].getContext("2d");
			lineChart = new Chart(lineChartCtx).Line({
				labels: labels,
				datasets: datasets
			});
			$('#line-chart .legend').html(lineChart.generateLegend());

			// pie chart 300 vs. 400 cost types
			var pieChartData = [
			    {
			        value: round3Places(costGroups['300']),
			        color:"#F7464A",
			        highlight: "#FF5A5E",
			        label: "300er Kosten"
			    },
			    {
			        value: round3Places(costGroups['400']),
			        color: "#46BFBD",
			        highlight: "#5AD3D1",
			        label: "400er Kosten"
			    }
			];
			var pieChartCtx = $("#pie-chart canvas")[0].getContext("2d");
			var pieChart = new Chart(pieChartCtx).Doughnut(pieChartData);
			$('#pie-chart .legend').html(pieChart.generateLegend());
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
		skipEmptyLines: true,
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
		skipEmptyLines: true,
		complete: function (results) {
			var options = '';

			results.data.forEach(function(costType) {
				options += '<option value="' + costType.id + '">' + costType.id + ': ' + costType.title + '</option>';

				data[costType.id] = costType;
			});

			$('#cost-types select').append(options);
		}
	});

	// Add cost type
	$('#cost-types select').change(addCostType);

	// Remove cost type
	$('#cost-types button').click(removeCostType);

	// Calculate results
	$('button[type=submit]').click(function (event) {
		var costTypes = [];

		event.preventDefault();

		// Get cost type input
		$('#cost-types tbody tr:not(:last)').each(function (i, element) {
			costTypes.push({
				id: $(element).find('select').val(),
				manufacturingCost: parseInt($(element).find('input').val())
			});
		});

		calculate(costTypes);
	});

});
