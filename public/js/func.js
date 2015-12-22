// Return RGB values of random color
function getRandomColor() {
    return (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256));
}

// Round to 3 decimal places
function round3Places(value) {
    return Math.round(value * 1000) / 1000;
}

// Add one more cost type
function addCostType(element) {
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
}

// Remove selected cost type
function removeCostType(element) {
    $(element.target).closest('tr').remove();

    // Recalculate row numbers
    $('#cost-types tbody tr:not(:last)').each(function (i, element) {
        $(element).children('td:first').text(i + 1);
    });
}

// Calculate result
function calculate(costTypes, config) {
    var result = [];

    // Calculate cost types
    costTypes.forEach(function (costType) {
        var manufacturingCosts = costType.manufacturingCost,
            cost,
            years = [];

        if (config.startYear && config.priceYear) {
            // Discount for years before start year
            var yearsBetween = config.startYear - config.priceYear;
            manufacturingCosts = manufacturingCosts / Math.pow(1 + config.discounting, yearsBetween);
        }

        // Calculate years
        for (var year = 0; year <= config.years; year++) {
            if (year == 0 || year == costType.data['lifetime']) {
                // (Re)construction
                cost = manufacturingCosts;
            } else {
                // Operating costs
                cost = manufacturingCosts * costType.data['operation'];
            }

            // Discounting
            cost = cost / Math.pow(1 + config.discounting, year);

            // Inflation
            cost = cost * Math.pow(1 + config.inflation, year);

            // VAT
            cost = cost * (1 + config.vat);

            // Location
            cost = cost * config.locationFactor;

            years.push(cost);
        }

        result.push({
            title: costType.data['title'],
            id: costType.data['id'],
            years: years
        });
    });

    return result;
}

// Draw result
function draw(data, config) {
    var header = $('#calculation thead tr'),
        t0 = header.find('th:eq(1)'),
        sumColumn = header.find('th:last'),
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
    for (var year = 1; year <= config.years; year++) {
        var newColumn = t0.clone();

        newColumn.find('sub').text(year);
        if (config.startYear) {
            // Tooltip
            newColumn.find('sub').parent('th').attr('title', config.startYear + year);
        }

        sumColumn.before(newColumn);

        labels.push(year);
    }

    data.forEach(function (costType){
        var row = $('<tr>')
            sum = 0;

        // Insert new row
        sumRow.before(row);

        // Start with title
        row.append('<td>' + costType.title + '</td>');

        // Yearly costs
        costType.years.forEach(function (year) {
            row.append('<td>' + numeral(year).format('0,0.000') + '&nbsp;€</td>');
            sum += year;
        });

        // End with sum
        row.append('<td>' + numeral(sum).format('0,0.000') + '&nbsp;€</td>');
        overall += sum;

        // Group 300 and 400 cost types
        costGroups[costType.id.charAt(0) + '00'] += sum;

        var color = getRandomColor();
        datasets.push({
            label: costType['title'],
            data: costType.years.map(round3Places),
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
    for (var year = 0; year <= config.years; year++) {
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
        data: values.map(round3Places),
        fillColor: 'rgba(' + color + ',0.2)',
        strokeColor: 'rgb(' + color + ')',
        pointColor: 'rgb(' + color + ')',
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: 'rgb(' + color + ')',
    });

    // Clean up old line chart to prevent jumping
    if (typeof lineChart != 'undefined')
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
}

// Export data as XLSX
function download(data) {
    var sheetName = "Kostenarten",
        sheet = {},
        workbook = {
            SheetNames: [sheetName], // Initialize worksheet
            Sheets: {}
        };

    data.forEach(function (costType, r) {
        // Add title as string
        sheet[XLSX.utils.encode_cell({c: 0, r: r})] = {t: 's', v: costType.title};

        costType.years.forEach(function (year, c) {
            // Add value as number
            sheet[XLSX.utils.encode_cell({c: c+1, r: r})] = {t: 'n', v: year};
        });
    });

    // Set range (area/size of worksheet)
    sheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: data[0].years.length, r: data.length}});

    // Add worksheet to workbook
    workbook.Sheets[sheetName] = sheet;

    // Write output and offer as download
    var output = XLSX.write(workbook, {type: 'binary'});
    saveAs(new Blob([s2ab(output)], {type: 'application/octet-stream'}), sheetName + '.xlsx');
}

// Source: https://github.com/SheetJS/js-xlsx/blob/v0.8.0/README.md#writing-workbooks
function s2ab(s) {
	var buf = new ArrayBuffer(s.length);
	var view = new Uint8Array(buf);
	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	return buf;
}
