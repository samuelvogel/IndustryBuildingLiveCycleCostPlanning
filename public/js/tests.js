QUnit.test( "Calculation years", function( assert ) {
  var config = {
      years: 50,
      discounting: 0,
      inflation: 0,
      vat: 0,
      locationFactor: 1,
      priceYear: null,
      startYear: null
  };

  var result = calculate([{
      data: {
          id: 327,
          title: 'Drainage',
          maintenance: 0.006,
          service: 0.001,
          operation: 0.007,
          lifetime: 25
      },
      manufacturingCost: 100
  }], config);

  assert.equal( result[0].years.length, 51, "Correct number of years" );
});

QUnit.test( "Calculate with complete config", function( assert ) {
  var config = {
      years: 30,
      discounting: 0.02,
      inflation: 0.01,
      vat: 0.19,
      locationFactor: 1,
      priceYear: 2015,
      startYear: 2020
  };

  var result = calculate([{
      data: {
          id: 327,
          title: 'Drainage',
          maintenance: 0.006,
          service: 0.001,
          operation: 0.007,
          lifetime: 25
      },
      manufacturingCost: 100
  }], config);

  assert.ok( round3Places(result[0].years[0]) == 107.782, "Construction cost correct" );
  assert.ok( round3Places(result[0].years[1]) == 0.747, "Operation cost correct" );
  assert.ok( round3Places(result[0].years[2]) == 0.740, "Discounting & inflation applied" );
  assert.ok( round3Places(result[0].years[25]) == 84.251, "Reconstruction happened" );
});

QUnit.test( "Calculate with multiple cost types", function( assert ) {
  var config = {
      years: 40,
      discounting: 0,
      inflation: 0,
      vat: 0,
      locationFactor: 1,
      priceYear: null,
      startYear: null
  };

  var result = calculate([{
      data: {
          id: 327,
          title: 'Drainage',
          maintenance: 0.006,
          service: 0.001,
          operation: 0.007,
          lifetime: 25
      },
      manufacturingCost: 100
  }, {
      data: {
          id: 445,
          title: 'Beleuchtungsanlage',
          maintenance: 0.007,
          service: 0.013,
          operation: 0.02,
          lifetime: 30
      },
      manufacturingCost: 100
  }], config);

  assert.ok( round3Places(result[0].years[0]) == 100, "Construction cost correct for cost type 1" );
  assert.ok( round3Places(result[0].years[1]) == 0.7, "Operation cost correct for cost type 1" );
  assert.ok( round3Places(result[0].years[25]) == 100, "Reconstruction happened for cost type 1" );
  assert.ok( round3Places(result[1].years[0]) == 100, "Construction cost correct for cost type 2" );
  assert.ok( round3Places(result[1].years[1]) == 2, "Operation cost correct for cost type 2" );
  assert.ok( round3Places(result[1].years[30]) == 100, "Reconstruction happened for cost type 2" );
});
