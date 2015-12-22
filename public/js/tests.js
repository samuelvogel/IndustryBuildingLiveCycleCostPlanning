QUnit.test( "Regular calculation", function( assert ) {
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

  assert.ok( round3Places(result[0].years[0]) == 107.782, "Baukosten korrekt" );
  assert.ok( round3Places(result[0].years[1]) == 0.747, "Betriebskosten korrekt" );
  assert.ok( round3Places(result[0].years[2]) == 0.740, "Diskontierung & Inflation korrekt" );
  assert.ok( round3Places(result[0].years[25]) == 84.251, "Renovierung korrekt" );
});
