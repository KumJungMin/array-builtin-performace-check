/** 
 * webKit의 Array.prototype.forEach 형태를 유사하게 구현한 customForEach 함수
 * - 참고: https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/builtins/ArrayPrototype.js#L115
 * */ 
function customForEach(array, callback, thisArg) {
  if (array == null) {
    throw new TypeError("Cannot read properties of null or undefined (array is null/undefined)");
  }

  if (typeof callback !== 'function') {
    throw new TypeError("callback must be a function");
  }

  const length = array.length >>> 0;

  for (let i = 0; i < length; i++) {
    if (i in array) {
      /** callback 함수의 this를 thisArg로 지정하고, 인수로 배열의 요소, 인덱스, 배열을 넘김 
         * 매 반복 마다 this 바인딩을 위해 call 메서드를 사용
         * 그래서 일반 반복문보다 느릴 수 있음
        */
      callback.call(thisArg, array[i], i, array);
    }
  }
}

function forEachUsingForLoop(arr, callback) {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i], i, arr);
  }
}

function builtInForEachWrapper(array, callback, thisArg) {
  return array.forEach(callback, thisArg);
}

exports.customForEach = customForEach;
exports.forEachUsingForLoop = forEachUsingForLoop;
exports.builtInForEachWrapper = builtInForEachWrapper;