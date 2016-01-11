QUnit.test( "Calculation years", function( assert ) {
  var config = {
      years: 50,
      discounting: 0,
      inflation: 0,
      inflationEnergy: 0,
      inflationWater: 0,
      inflationCleaning: 0,
      vat: 0,
      locationFactor: 1,
      priceYear: null,
      startYear: null,
      electricity: 0,
      heating: 0,
      water: 0,
      electricityCost: 0,
      heatingCost: 0,
      waterCost: 0,
      cleaningCost: 0,
      factors: {
          component: 1,
          execution: 1,
          construction: 1,
          generality: 1,
          modularity: 1,
          separability: 1,
          scalability: 1,
          adaptability: 1
      }
  };

  var result = calculate([{
      data: {
          id: '327',
          title: 'Drainage',
          maintenance: 0.006,
          service: 0.001,
          operation: 0.007,
          lifetime: 25,
          rebuilding: 1
      },
      manufacturingCost: 100
  }], config);

  assert.equal( result['operation'].length, 51, "Correct number of years" );
});

QUnit.test( "Calculate with complete config", function( assert ) {
  var config = {
      years: 30,
      discounting: 0.02,
      inflation: 0.01,
      inflationEnergy: 0,
      inflationWater: 0,
      inflationCleaning: 0,
      vat: 0.19,
      locationFactor: 1,
      priceYear: 2015,
      startYear: 2020,
      electricity: 0,
      heating: 0,
      water: 0,
      electricityCost: 0,
      heatingCost: 0,
      waterCost: 0,
      cleaningCost: 0,
      factors: {
          component: 1,
          execution: 1,
          construction: 1,
          generality: 1,
          modularity: 1,
          separability: 1,
          scalability: 1,
          adaptability: 1
      }
  };

  var result = calculate([{
      data: {
          id: '327',
          title: 'Drainage',
          maintenance: 0.006,
          service: 0.001,
          operation: 0.007,
          lifetime: 25,
          rebuilding: 1
      },
      manufacturingCost: 100
  }], config);

  assert.ok( round2Places(result['300'][0]) == 107.78, "Construction cost correct" );
  assert.ok( round2Places(result['operation'][1]) == 0.75, "Operation cost correct" );
  assert.ok( round2Places(result['operation'][2]) == 0.74, "Discounting & inflation applied" );
  assert.ok( round2Places(result['300'][25]) == 84.25, "Reconstruction happened" );
});

QUnit.test( "Calculate with multiple cost types", function( assert ) {
  var config = {
      years: 40,
      discounting: 0,
      inflation: 0,
      inflationEnergy: 0,
      inflationWater: 0,
      inflationCleaning: 0,
      vat: 0,
      locationFactor: 1,
      priceYear: null,
      startYear: null,
      electricity: 0,
      heating: 0,
      water: 0,
      electricityCost: 0,
      heatingCost: 0,
      waterCost: 0,
      cleaningCost: 0,
      factors: {
          component: 1,
          execution: 1,
          construction: 1,
          generality: 1,
          modularity: 1,
          separability: 1,
          scalability: 1,
          adaptability: 1
      }
  };

  var result = calculate([{
      data: {
          id: '327',
          title: 'Drainage',
          maintenance: 0.006,
          service: 0.001,
          operation: 0.007,
          lifetime: 25,
          rebuilding: 1
      },
      manufacturingCost: 100
  }, {
      data: {
          id: '445',
          title: 'Beleuchtungsanlage',
          maintenance: 0.007,
          service: 0.013,
          operation: 0.02,
          lifetime: 30,
          rebuilding: 1
      },
      manufacturingCost: 100
  }], config);

  assert.ok( round2Places(result['300'][0]) == 100, "Construction cost correct for cost group 300" );
  assert.ok( round2Places(result['400'][0]) == 100, "Construction cost correct for cost group 400" );
  assert.ok( round2Places(result['operation'][1]) == 2.7, "Operation cost correct for both groups" );
});
