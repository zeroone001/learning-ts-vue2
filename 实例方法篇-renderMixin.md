# 实例方法篇-renderMixin

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
2. 















