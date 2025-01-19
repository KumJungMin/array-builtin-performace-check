# array-builtin-performance-check
- Webkit의 `wpewebkit-2.47.2` 버전을 기준으로 array 빌드인 함수의 구현 방식과 성능을 비교해보았다.
- 현재 array에서는 `forEach`, `map`, `filter` 등 유용한 빌드인 함수를 제공하고 있다.
- 하지만, 대용량 데이터를 처리할 때 일반 for loop로 구현한 것과 비교해 성능이 좋지 않다고 하는데...


<br/>

## 1. Webkit에서 forEach, map, filter는 어떻게 구현했을까?
- `wpewebkit-2.47.2`에서 `forEach()`의 구현 코드를 보자. ([코드 보기](https://github.com/WebKit/WebKit/blob/wpewebkit-2.47.2/Source/JavaScriptCore/builtins/ArrayPrototype.js#L160))
```js
function forEach(callback /*, thisArg */)
{
    "use strict";

    var array = @toObject(this, "Array.prototype.forEach requires that |this| not be null or undefined");
    var length = @toLength(array.length);

     /* callback이 함수인지 체크 */
    if (!@isCallable(callback))
        @throwTypeError("Array.prototype.forEach callback must be a function");
    
    var thisArg = @argument(1);
    
    for (var i = 0; i < length; i++) {
        if (i in array)
            callback.@call(thisArg, array[i], i, array);  /* (a) */
    }
}
```
- 위 코드를 보면, `forEach()`는 일반적인 for loop 방식을 사용하고 있지만 **(a) 반복문을 순회할 때마다 콜백 함수를 호출하면서 this를 별도로 바인딩**하고 있다.
- 그래서, 반복문을 순회할 때마다 콜백 호출 컨텍스트(this 설정, 매개변수 등)를 매번 새로 세팅하는 추가 비용이 발생한다.
- 이 과정이 반복될수록 누적되어 일반 for 루프에 비해 오버헤드가 커질 수 있다.


<br/>

- `forEach()`외에도 `map()`, `filter()`의 구현 형태도 유사하다. ([map 구현 코드 보기](https://github.com/WebKit/WebKit/blob/wpewebkit-2.47.2/Source/JavaScriptCore/builtins/ArrayPrototype.js#L160)) ([filter 구현 코드 보기](https://github.com/WebKit/WebKit/blob/wpewebkit-2.47.2/Source/JavaScriptCore/builtins/ArrayPrototype.js#L134))

```js
function map(callback /*, thisArg */)
{
    "use strict";

    var array = @toObject(this, "Array.prototype.map requires that |this| not be null or undefined");
    var length = @toLength(array.length);

    if (!@isCallable(callback))
        @throwTypeError("Array.prototype.map callback must be a function");
    
    var thisArg = @argument(1);
    var result = @newArrayWithSpecies(length, array);

    for (var i = 0; i < length; i++) {
        if (!(i in array))
            continue;
        var mappedValue = callback.@call(thisArg, array[i], i, array); /* this 바인딩함 */
        @putByValDirect(result, i, mappedValue);
    }
    return result;
}
```
```js
function filter(callback /*, thisArg */)
{
    "use strict";

    var array = @toObject(this, "Array.prototype.filter requires that |this| not be null or undefined");
    var length = @toLength(array.length);

    if (!@isCallable(callback))
        @throwTypeError("Array.prototype.filter callback must be a function");
    
    var thisArg = @argument(1);
    var result = @newArrayWithSpecies(0, array);

    var nextIndex = 0;
    for (var i = 0; i < length; i++) {
        if (!(i in array))
            continue;
        var current = array[i]
        if (callback.@call(thisArg, current, i, array)) {   /* this 바인딩함 */
            @putByValDirect(result, nextIndex, current);
            ++nextIndex;
        }
    }
    return result;
}
```


<br/>
<br/>

## 2. 성능을 비교해보자.
> 내장 빌트인 함수와, this 바인딩으로 구현한 커스텀 함수, 그리고 순수 for 루프만을 사용해 구현한 함수를 비교해 보았다.

### (1) 테스트 배열의 크기가 100일 때, 평균 실행 시간
<img src="https://github.com/KumJungMin/array-builtin-performace-check/blob/main/assets/size-100-test.png" width="80%" />

#### Filter
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.filter`      | 0.003 ms          | 가장 빠름, 최적화된 엔진 내부 구현           |
| 커스텀 `filter`          | 0.010 ms          | `call`로 인한 오버헤드로 표준보다 느림       |
| `for` 루프 기반 `filter` | 0.006 ms          | 커스텀 구현보다 빠르지만, 표준 메서드보다는 느림 |

#### Map
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.map`         | 0.002 ms          | 가장 빠름, 최적화된 엔진 내부 구현           |
| 커스텀 `map`             | 0.007 ms          | `call`로 인한 오버헤드로 표준보다 느림       |
| `for` 루프 기반 `map`    | 0.007 ms          | 커스텀 구현과 비슷한 성능                    |

#### ForEach
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.forEach`     | 0.001 ms          | 가장 빠름, 최적화된 엔진 내부 구현           |
| 커스텀 `forEach`         | 0.007 ms          | `call`로 인한 오버헤드로 표준보다 느림       |
| `for` 루프 기반 `forEach`| 0.004 ms          | 커스텀 구현보다 빠르지만, 표준 메서드보다는 느림 |

<br/>

#### (+) 정리
1. **표준 메서드(`filter`, `map`, `forEach`)**: 가장 빠르고, 엔진의 최적화를 통해 효율적인 성능 제공한다.
2. **`for` 루프 기반 구현**: 커스텀 구현보다 효율적이지만, 표준 메서드에는 약간 뒤처진다.
3. **커스텀 구현**: 매 이터레이션마다 `call`로 `this`를 바인딩하는 **오버헤드**로 인해 가장 느린 결과를 보인다.

<br/><br/>


### (2) 테스트 배열의 크기가 500일 때, 평균 실행 시간

<img src="https://github.com/KumJungMin/array-builtin-performace-check/blob/main/assets/size-500-test.png" width="80%" />


#### Filter
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.filter`      | 0.011 ms          | 가장 빠름, 최적화된 엔진 내부 구현           |
| 커스텀 `filter`          | 0.026 ms          | `call`로 인한 오버헤드로 표준보다 느림       |
| `for` 루프 기반 `filter` | 0.019 ms          | 커스텀 구현보다 빠르지만, 표준 메서드보다는 느림 |

#### Map
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.map`         | 0.012 ms          | 가장 빠름, 최적화된 엔진 내부 구현           |
| 커스텀 `map`             | 0.019 ms          | `call`로 인한 오버헤드로 표준보다 느림       |
| `for` 루프 기반 `map`    | 0.019 ms          | 커스텀 구현과 유사한 성능                    |

#### ForEach
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.forEach`     | 0.004 ms          | 가장 빠름, 최적화된 엔진 내부 구현           |
| 커스텀 `forEach`         | 0.015 ms          | `call`로 인한 오버헤드로 표준보다 느림       |
| `for` 루프 기반 `forEach`| 0.011 ms          | 커스텀 구현보다 빠르지만, 표준 메서드보다는 느림 |

<br/>

#### (+) 정리
1. **표준 메서드(`filter`, `map`, `forEach`)**: 최적화된 엔진 구현 덕분에 가장 효율적이다.
2. **`for` 루프 기반 구현**: 커스텀 구현보다 빠르고, 표준 메서드보다는 약간 뒤처진다.
3. **커스텀 구현**: 매 이터레이션마다 `call`로 `this`를 바인딩하는 **오버헤드**로 인해 가장 느린 결과를 보인다.


<br/>
<br/>

### (3) 테스트 배열의 크기가 100000일 때, 평균 실행 시간

<img src="https://github.com/KumJungMin/array-builtin-performace-check/blob/main/assets/size-100000-test.png" width="80%" />


#### Filter
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.filter`      | 8.446 ms          | 상대적으로 빠르지만, `for` 루프 기반보다 느림|
| 커스텀 `filter`          | 7.670 ms          | `call`로 인한 오버헤드로 인해 성능 저하      |
| `for` 루프 기반 `filter` | 3.261 ms          | 가장 빠름, 단순한 구현으로 인해 효율적       |

#### Map
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.map`         | 7.308 ms          | 표준 메서드로 최적화된 성능                  |
| 커스텀 `map`             | 6.755 ms          | 표준보다 약간 빠르지만, 내부 최적화 부족     |
| `for` 루프 기반 `map`    | 7.345 ms          | 표준과 유사한 성능                           |

#### ForEach
| **메서드**               | **평균 실행 시간** | **비고**                                     |
|--------------------------|--------------------|---------------------------------------------|
| 표준 `Array.forEach`     | 5.280 ms          | 안정적이고 빠름                              |
| 커스텀 `forEach`         | 4.734 ms          | 표준보다 약간 빠름, 최적화 효과 제한적       |
| `for` 루프 기반 `forEach`| 0.300 ms          | 압도적으로 빠름, 단순 반복문으로 최적화됨    |


<br/>

#### (+) 정리
1. **Filter**
   - `for` 루프 기반 `filter`가 가장 빠르고, 단순 반복 구조로 인해 효율적이다.
   - 표준 `Array.filter`는 최적화된 성능이지만 `for` 루프보다는 느리다.
   - 커스텀 `filter`는 `call` 오버헤드로 인해 성능이 떨어진다.

2. **Map**
   - 표준 `Array.map`은 안정적이고 빠르며, 커스텀 및 `for` 루프 기반과 유사한 성능을 보인다.
   - 커스텀 `map`과 `for` 루프 기반 `map`은 표준과 비슷하거나 약간 더 빠르다.

3. **ForEach**
   - `for` 루프 기반 `forEach`가 압도적으로 빠르며, 단순 구현으로 인해 성능에서 우위에 있다.
   - 표준 `Array.forEach`는 안정적이지만 상대적으로 느리다.
   - 커스텀 `forEach`는 `call` 오버헤드로 인해 약간 느린 결과를 보인다.
