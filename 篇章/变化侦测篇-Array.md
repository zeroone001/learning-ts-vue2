# 变化侦测篇-Array

## 在哪里收集

```javascript
data(){
  return {
    arr:[1,2,3]
  }
}
```

要用到`arr`这个数据，是不是得先从`object`数据对象中获取一下`arr`数据，而从`object`数据对象中获取`arr`数据自然就会触发`arr`的`getter`，所以我们就可以在`getter`中收集依赖

**Array型数据还是在getter中收集依赖。**

## 观测Array发生变化

改写数组原型链上的方法

```js
const arrayProto = Array.prototype

/* 继承自Array原型的对象 */
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
/* def 作用是定义一个property */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  /* 将7个方法逐个封装 */
  def(arrayMethods, method, function mutator (...args) {
    /* 执行了原生方法 */
    const result = original.apply(this, args)
    const ob = this.__ob__
    /* 
      可以向数组内新增元素的方法有3个，分别是：push、unshift、splice。
      我们只需对这3中方法分别处理，拿到新增的元素，再将其转化即可
      为什么要写下面这个代码，因为我们新增的元素可能是对象，
      我们要深度侦测这个对象
     */
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    /* 
      这里很关键， 通知watcher更新
     */
    ob.dep.notify()
    return result
  })
})

```



Observer

```js
/* 
      开始判断数据的类型
      只有object类型的数据才会调用walk将每一个属性转换成getter/setter的形式来侦测变化
      注意这里，因为Object.defineProperty 是针对对象的，数组是无法使用这个方法的
      所以，走的是另外的变化机制
    */
    if (Array.isArray(value)) {
      // 判断对象上是否有原型，也就是说，判断浏览器支持原型链不
      if (hasProto) {
        // 把方法放在这个数组的原型链上
        // 其实是改写了这个数组上的方法，这样的话使用push就会变化
        /* 
          把重写的一些方法，挂载到数组的原型链上
        */
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      //  对数组深度侦测
      this.observeArray(value)
    } else {
      // data 是个对象
      // 给每个属性加上响应式
      this.walk(value)
    }
  }
  
  /**
   * 对数组深度侦测，如果数组的元素是对象，也能侦测到
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      /* 给那些元素是对象的item，加上Observer */
      observe(items[i])
    }
  }
```

