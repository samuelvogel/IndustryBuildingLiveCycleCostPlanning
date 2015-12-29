$(function ($) {

	numeral.language('de');

	// Show input range value in corresponding output tag
	$('input[type=range]').on('input', function (event) {
		$('output[name=' + this.id + '-indicator]').text(this.valueAsNumber);
	});
	// Initialize all indicators
	$('input[type=range]').trigger('input');

	// Used for calculation later
	var costTypeData = [],
		result;

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

				costTypeData[costType.id] = costType;
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
		event.preventDefault();

		result = calculate(getCostTypes(costTypeData), getConfig());

		draw(result, getConfig());
	});

	// Export data
	$('button[name=export]').click(function (event) {
		download(getConfig(), getCostTypes(costTypeData), result);
	});

});
