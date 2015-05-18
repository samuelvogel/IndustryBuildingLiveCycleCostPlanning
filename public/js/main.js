$(function ($) {

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
				options += '<option>' + costType.identifier + '</option>';
			});

			$('#cost-types select').append(options);
		}
	});

})
