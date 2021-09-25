# computed 和 watch

 

## watch 源码

```js
/* 
  初始化所有的watch
  下面两个函数是watch相关的函数

*/
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]

    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

/* 
  对每一个watcher 进行create
  expOrFn 就是key
  handler
*/
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {

  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    // 把methods给到handler
    handler = vm[handler]
  }

  return vm.$watch(expOrFn, handler, options)
}

```



## 实例方法 this.$watch

用法如下

```javascript
vm.$watch(expOrFn, callback, [options]);
```

观察 `Vue` 实例变化的一个表达式或计算属性函数。回调函数得到的参数为新值和旧值。表达式只接受监督的键路径。对于更复杂的表达式，用一个函数取代。



```javascript
// 键路径，这是用的最多的情况
vm.$watch("a.b.c", function(newVal, oldVal) {
  // 做点什么
});

// 函数形式
this.$watch(function(){
    // 表达式 `this.a + this.b` 每次得出一个不同的结果时
    // 处理函数都会被调用。
    // 这就像监听一个未被定义的计算属性
    return this.a + this.b;
}, function(newVal, oldVal){
    // 做点什么
})

// 返回一个取消watch的函数，用来停止触发回调
var unwatch = this.$watch('a', function(){});
// 取消
unwatch();

```

#### options

* deep 深度监听，注意，数组的变动不需要这么做
* immediate: 立即触发回调

### vm.$watch 源码

```js
 /* 
      作用： 定义$watch
      expOrFn 这个是watch的key
      cb 是watch的处理函数
      Watcher 定义在observe里面
  */
  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this

    /* 判断是否是对象 */
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }

    options = options || {}
    options.user = true
    /* 这是关键代码，创建一个watcher实例 */
    const watcher = new Watcher(vm, expOrFn, cb, options)

    /* 立即执行监听函数 */
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`
      pushTarget()
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info)
      popTarget()
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
```

