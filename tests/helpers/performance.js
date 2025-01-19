function measureMapPerformance(fn, array, callback, thisArg, testLabel, repeatCount = 50) {
  let totalTime = 0;

  for (let r = 0; r < repeatCount; r++) {
    const start = performance.now();

    const result = fn(array, callback, thisArg);
    const end = performance.now();
    totalTime += (end - start);

    if (result?.[0] !== 0) { /* no-op */ }
  }

  const avgTime = totalTime / repeatCount;
  console.log(`${testLabel} 평균 실행 시간: ${avgTime.toFixed(3)} ms (총 반복 ${repeatCount}회)`);
}

module.exports = {
    measureMapPerformance
};