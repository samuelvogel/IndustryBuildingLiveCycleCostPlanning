var charts = [], // For cleanup after rerendering
    legend = {
        '300': {
            title: 'Baukosten (KG 300)',
            color: '132,249,242'
        },
        '400': {
            title: 'Technische Anlagen (KG 400)',
            color: '36,193,46'
        },
        'operation': {
            title: 'Betrieb',
            color: '255,91,0'
        },
        'electricity': {
            title: 'Strom',
            color: '255,199,0'
        },
        'heating': {
            title: 'Wärme',
            color: '240,62,38'
        },
        'water': {
            title: 'Wasser',
            color: '75,131,204'
        },
        'cleaning': {
            title: 'Reinigung',
            color: '179,75,204'
        },
    };

// Round to 3 decimal places
function round2Places(value) {
    return Math.round(value * 100) / 100;
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
    var result = {
            '300': new Array(config.years + 1).fill(0),
            '400': new Array(config.years + 1).fill(0),
            'operation': new Array(config.years + 1).fill(0)
        };

    // Calculate cost types
    costTypes.forEach(function (costType) {
        var manufacturingCosts = costType.manufacturingCost,
            cost,
            resultKey;

        if (config.startYear && config.priceYear) {
            // Discount for years before start year
            var yearsBetween = config.startYear - config.priceYear;
            manufacturingCosts = manufacturingCosts / Math.pow(1 + config.discounting, yearsBetween);
        }

        // Calculate years
        for (var year = 0; year <= config.years; year++) {
            if (year == 0 || year == costType.data['lifetime']) {
                // Construction
                cost = manufacturingCosts;
                resultKey = costType.data.id.charAt(0) + '00'; // Group 300 and 400 cost types

                if (year != 0) {
                    // Reconstruction
                    cost = cost * costType.data['rebuilding'];
                }
            } else {
                // Operating costs
                cost = manufacturingCosts * costType.data['operation'];
                resultKey = 'operation';
            }

            // Discounting
            cost = cost / Math.pow(1 + config.discounting, year);

            // Inflation
            cost = cost * Math.pow(1 + config.inflation, year);

            // VAT
            cost = cost * (1 + config.vat);

            // Location
            cost = cost * config.locationFactor;

            result[resultKey][year] += cost;
        }

        // Electricity, heating, water & cleaning (if applicable)
        if (config.electricity && config.electricityCost) {
            result['electricity'] = [];
        }
        if (config.heating && config.heatingCost) {
            result['heating'] = [];
        }
        if (config.water && config.waterCost) {
            result['water'] = [];
        }
        if (config.cleaningCost) {
            result['cleaning'] = [];
        }

        for (var year = 0; year <= config.years; year++) {
            if (result['electricity']) {
                result['electricity'][year] = config.electricity * config.electricityCost * Math.pow(1 + config.inflationEnergy, year);
            }

            if (result['heating']) {
                result['heating'][year] = config.heating * config.heatingCost * Math.pow(1 + config.inflationEnergy, year);
            }

            if (result['water']) {
                result['water'][year] = config.water * config.waterCost * Math.pow(1 + config.inflationWater, year);
            }

            if (result['cleaning']) {
                result['cleaning'][year] = config.cleaningCost * Math.pow(1 + config.inflationCleaning, year);
            }
        }
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
        body = $('#calculation tbody');

    $('#calculation').show();

    // Reset table
    $('#calculation thead tr th:gt(1):not(:last)').remove();
    body.empty();

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

    for (var key in data) {
        var row = $('<tr>');

        // Insert new row
        body.append(row);

        // Start with title
        row.append('<td>' + legend[key].title + '</td>');

        // Yearly costs
        data[key].forEach(function (year) {
            row.append('<td>' + numeral(year).format('0,0.00') + '&nbsp;€</td>');
        });

        // End with sum
        row.append('<td>' + numeral(sumArray(data[key])).format('0,0.00') + '&nbsp;€</td>');

        datasets.push({
            label: legend[key].title,
            data: data[key].map(round2Places),
            fillColor: 'rgba(' + legend[key].color + ',0.2)',
            strokeColor: 'rgb(' + legend[key].color + ')',
            pointColor: 'rgb(' + legend[key].color + ')',
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: 'rgb(' + legend[key].color + ')',
        });
    }

    // Clean up old charts to prevent jumping
    charts.forEach(function (chart) {
        chart.destroy();
    });

    // Line chart cost per year
    var lineChartCtx = $("#line-chart canvas")[0].getContext("2d"),
        lineChart = new Chart(lineChartCtx).Line({
            labels: labels,
            datasets: datasets
        });
    charts.push(lineChart);
    $('#line-chart .legend').html(lineChart.generateLegend());

    // Pie chart
    var pieChartData = Object.keys(data).map(function (key) {
        return {
            label: legend[key].title,
            value: round2Places(sumArray(data[key])),
            color: 'rgba(' + legend[key].color + ',0.8)',
            highlight: 'rgb(' + legend[key].color + ')'
        };
    });
    var pieChartCtx = $("#pie-chart canvas")[0].getContext("2d"),
        pieChart = new Chart(pieChartCtx).Doughnut(pieChartData);
    charts.push(pieChart);
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

    Object.keys(data).forEach(function (key, r) {
        // Add title as string
        sheet[XLSX.utils.encode_cell({c: 0, r: r})] = {t: 's', v: legend[key].title};

        data[key].forEach(function (year, c) {
            // Add value as number
            sheet[XLSX.utils.encode_cell({c: c+1, r: r})] = {t: 'n', v: year};
        });
    });

    // Set range (area/size of worksheet)
    sheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: data[Object.keys(data)[0]].length, r: Object.keys(data).length}});

    // Add worksheet to workbook
    workbook.Sheets[sheetName] = sheet;

    // Write output and offer as download
    var output = XLSX.write(workbook, {type: 'binary'});
    saveAs(new Blob([s2ab(output)], {type: 'application/octet-stream'}), sheetName + '.xlsx');
}

// Sum up all values in an array
function sumArray(array) {
    return array.reduce(function (sum, value) {
        return sum + value;
    }, 0);
}

// Source: https://github.com/SheetJS/js-xlsx/blob/v0.8.0/README.md#writing-workbooks
function s2ab(s) {
	var buf = new ArrayBuffer(s.length);
	var view = new Uint8Array(buf);
	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	return buf;
}
