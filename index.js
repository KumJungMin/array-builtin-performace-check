const { measureMapPerformance } = require('./tests/helpers/performance');

const { customFilter, filterUsingForLoop, builtInFilterWrapper } = require('./tests/filter');
const { customForEach, forEachUsingForLoop, builtInForEachWrapper } = require('./tests/forEach');
const { customMap, mapUsingForLoop, builtInMapWrapper } = require('./tests/map');

const SIZE = 500;
const testArray = Array.from({ length: SIZE }, (_, i) => i);

function filterCallback(value) {
  return value % 2 === 0;
}

function callback(value) {
  return value * 2;
}


console.log(`----size: ${SIZE} 일 때----------------------------------------------`);
measureMapPerformance(builtInFilterWrapper, testArray, filterCallback, null, "표준 Array.filter");
measureMapPerformance(customFilter, testArray, filterCallback, null, "customFilter");
measureMapPerformance(filterUsingForLoop, testArray, filterCallback, null, "filterUsingForLoop");
console.log("--------------------------------------------------");
measureMapPerformance(builtInMapWrapper, testArray, callback, null, "표준 Array.map");
measureMapPerformance(customMap, testArray, callback, null, "customMap");
measureMapPerformance(mapUsingForLoop, testArray, callback, null, "mapUsingForLoop");
console.log("--------------------------------------------------");
measureMapPerformance(builtInForEachWrapper, testArray, callback, null, "표준 Array.forEach");
measureMapPerformance(customForEach, testArray, callback, null, "customForEach");
measureMapPerformance(forEachUsingForLoop, testArray, callback, null, "forEachUsingForLoop");