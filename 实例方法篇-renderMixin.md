# 实例方法篇-renderMixin

instance/render.js

```javascript
export function renderMixin (Vue) {
    Vue.prototype.$nextTick = function (fn) {}
}
```

## vm.$nextTick

`vm.$nextTick` 是全局 `Vue.nextTick` 的**别名**，其用法相同。

 将回调延迟到下次 DOM 更新循环之后执行。在修改数据之后立即使用它，然后等待 DOM 更新。它跟全局方法 `Vue.nextTick` 一样，不同的是回调的 `this` 自动绑定到调用它的实例上。

示例：

```vue
<template>
	<div id="example">{{message}}</div>
</template>
<script>
    var vm = new Vue({
      el: '##example',
      data: {
        message: '123'
      }
    })
    vm.message = 'new message' // 更改数据
    console.log(vm.$el.innerHTML) // '123'
    Vue.nextTick(function () {
      console.log(vm.$el.innerHTML) // 'new message'
    })
</script>
```

VUE在更新DOM的时候是异步执行的。

只要侦听到数据变化，`Vue` 将开启一个事件队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个 `watcher` 被多次触发，只会被推入到事件队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 `DOM` 操作是非常重要的。然后，在下一个的事件循环“tick”中，`Vue` 刷新事件队列并执行实际 (已去重的) 工作。

#### JS的运行机制

JS执行是单线程的，是基于事件循环的

事件循环分为以下步骤：

1. 所有同步任务都在主线程上执行，形成一个执行栈；（stack）
2. 主线程之外还有一个任务队列（task queue），只要异步任务有了运行结果，就在任务队列中放置一个事件
3. 一旦执行栈中所有的同步任务完成，系统就会读取任务队列，看看里面有哪些事件，于是结束等待，开始执行
4. 主线程不断的重复上面三个步骤

任务队列中存放的是一个个的task，task分为两类，分别是宏任务，和微任务

每执行完一个个宏任务之后，都要去清空该宏任务对应的微任务队列中的【所有】的微任务

```javascript
for (macroTask of macroTaskQueue) {
    // 1. 处理当前的宏任务
    handleMacroTask();

    // 2. 处理对应的所有微任务
    for (microTask of microTaskQueue) {
        handleMicroTask(microTask);
    }
}
```

* 宏任务(`macro task`) 有 `setTimeout`、`MessageChannel`、`postMessage`、`setImmediate`；
* 微任务(`micro task`）有`MutationObsever` 和 `Promise.then`。



##  内部源码

nextTick 位于 源码的`src/core/util/next-tick.js`中



#### 能力检测

`Vue` 在内部对异步队列尝试使用原生的 `Promise.then`、`MutationObserver` 和 `setImmediate`，如果执行环境不支持，则会采用 `setTimeout(fn, 0)` 代替

宏任务耗费的时间是大于微任务的，所以在浏览器支持的情况下，优先使用微任务。

```js
export let isUsingMicroTask = false

const callbacks = []
let pending = false

function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

let timerFunc
/* 
  Vue 在内部对异步队列尝试使用原生的 Promise.then、MutationObserver 和 setImmediate，
  如果执行环境不支持，则会采用 setTimeout(fn, 0) 代替
  宏任务耗费的时间是大于微任务的，所以在浏览器支持的情况下，优先使用微任务。如果浏览器不支持微任务，使用宏任务；
  但是，各种宏任务之间也有效率的不同，需要根据浏览器的支持情况，使用不同的宏任务
*/
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  /* 微任务 */
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  /* 微任务 */
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  /* 宏任务 */
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  /* 宏任务 */
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```



#### 执行回调队列

```js
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```



这是当 `nextTick` 不传 `cb` 参数的时候，提供一个 Promise 化的调用，比如：

```js
this.$nextTick().then(() => {
    consloe.log(1);
});
```

1. 如何保证只在接收第一个回调函数时执行异步方法？

   `nextTick`源码中使用了一个异步锁的概念，即接收第一个回调函数时，先关上锁，执行异步方法。此时，浏览器处于等待执行完同步代码就执行异步代码的情况。

2. 执行 `flushCallbacks` 函数时为什么需要备份回调函数队列？执行的也是备份的回调函数队列？

因为，会出现这么一种情况：`nextTick` 的回调函数中还使用 `nextTick`。如果 `flushCallbacks` 不做特殊处理，直接循环执行回调函数，会导致里面`nextTick` 中的回调函数会进入回调队列。