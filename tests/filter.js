const { measureMapPerformance } = require("./helpers/performance.js");

/** 
 * webKit의 Array.prototype.filter 형태를 유사하게 구현한 customMap 함수
 * - 참고: https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/builtins/ArrayPrototype.js#L134
 * */ 
function customFilter(array, callback, thisArg) {
  if (array == null) {
    throw new TypeError(
      "Cannot read properties of null or undefined (array is null/undefined)"
    );
  }

  if (typeof callback !== "function") {
    throw new TypeError("callback must be a function");
  }

  const length = array.length >>> 0;

  const result = [];

  let nextIndex = 0;

  for (let i = 0; i < length; i++) {
    if (!(i in array)) {
      continue;
    }

    const current = array[i];

    /** callback 함수의 this를 thisArg로 지정하고, 인수로 배열의 요소, 인덱스, 배열을 넘김 
     * 매 반복 마다 this 바인딩을 위해 call 메서드를 사용
     * 그래서 일반 반복문보다 느릴 수 있음
    */
    if (callback.call(thisArg, current, i, array)) {
      result[nextIndex] = current;
      nextIndex++;
    }
  }
  return result;
}

function filterUsingForLoop(arr, callback) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    if (callback(arr[i], i, arr)) {
      result.push(arr[i]);
    }
  }
  return result;
}

function builtInFilterWrapper(array, callback, thisArg) {
  return array.filter(callback, thisArg);
}

exports.customFilter = customFilter;
exports.filterUsingForLoop = filterUsingForLoop;
exports.builtInFilterWrapper = builtInFilterWrapper;