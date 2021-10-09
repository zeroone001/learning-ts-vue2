# 变化侦测篇



## 依赖收集

我们给每个数据都建立一个依赖数组，谁依赖了这个数据，那么就都放在这个数组里，当这个数据发生变化的时候，

就去依赖数组中，把每个依赖都通知一遍，这个过程就是依赖收集

## 何时收集依赖？何时通知依赖更新？

**在getter中收集依赖，在setter中通知依赖更新**



## 依赖到底是谁，依赖是什么

其实在`Vue`中还实现了一个叫做`Watcher`的类，而`Watcher`类的实例就是我们上面所说的那个"谁"。换句话说就是：谁用到了数据，谁就是依赖，我们就为谁创建一个`Watcher`实例。在之后数据变化时，我们不直接去通知依赖更新，而是通知依赖对应的`Watch`实例，由`Watcher`实例去通知真正的视图。

```js
/* 
  附加到每个观察对象的观察者类
  收集依赖，并发送更新
  听过递归的方式，把一个对象的所有属性转化为可观测的对象
  只要我们将一个object传到observer中，那么这个object就会变成可观测的、响应式的object
*/
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data
  constructor (value: any) {
    this.value = value
    /* 

    */
    this.dep = new Dep()
    this.vmCount = 0
    /* 
      def 就是用defineProperty 封装一下
      给value添加一个属性，值就是这个实例
      __ob__ 这个属性就是不可以枚举的
      到时候在下面遍历的时候，就不会有影响了
      相当于给value打上标记，表示已经被转化成响应式了，避免重复操作
    */
    def(value, '__ob__', this)
    /* 
      开始判断数据的类型
      只有object类型的数据才会调用walk将每一个属性转换成getter/setter的形式来侦测变化
    */
    if (Array.isArray(value)) {
      // 判断对象上是否有原型，也就是说，判断浏览器支持原型链不
      if (hasProto) {
        // 把方法放在这个数组的原型链上
        // 其实是改写了这个数组上的方法，这样的话使用push就会变化
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // data 是个对象
      // 给每个属性加上响应式
      this.walk(value)
    }
  }

  /**
    遍历所有的key，然后执行defineReactive
    当值还是object的时候，再使用new Observer进行递归
    这样我们就可以把obj中的所有属性（包括子属性）都转换成getter/seter的形式来侦测变化
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```

defineReeactive 函数

```js
/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {

  /* 
    实例化一个依赖管理器，生成一个依赖管理的数组dep
  */
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  /* 如果值是对象的话，对val进行递归调用 */
  let childOb = !shallow && observe(val)
  /* 
    defineProperty
  */
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    /* 
      这里就是传说中的getter 和 setter了
      在get中收集依赖
    */
    get: function reactiveGetter () {
      /* get 部分 */
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        /* 
        依赖收集
        调用watcher的addDep方法
        使用depend收集依赖
        */
        dep.depend()
        /* 下面这个比较关键 */
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value

    },
    set: function reactiveSetter (newVal) {
      /* 在set里面通知依赖更新 */
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      /* 
        新旧值进行对比
      */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      /* 
        会对新设置的值变成一个响应式对象
      */
      childOb = !shallow && observe(newVal)
      /* 
        派发更新
        这是关键
        通知所有依赖更新
      */
      dep.notify()
    }
  })
}
```



Dep 类

```js
/* 
  Dep 类
  目的是，建立数据和watcher之间的一个桥梁
  dep 相当于对watcher的一个管理
  我们给每个数据都建立一个依赖数组，
  谁依赖了这个数据，那么就都放在这个数组里，当这个数据发生变化的时候，
  就去依赖数组中，把每个依赖都通知一遍，这个过程就是依赖收集

  注意，Dep里面还有一个target

  下面就是一个依赖管理器
*/
export default class Dep {
  // 全局的唯一watcher
  /* 
    临时存放了Watcher
  */
  static target: ?Watcher;
  id: number;
  // 是一个数组，里面放了watcher
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    /* 定义了一个数组，用来存放依赖 */
    this.subs = []
  }
  /* 添加 */
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }
  /* 删除 */
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
  // 收集dep
  /* 
    调用watcher里面的 dep.addSub(this)
  */
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  /* 通知 */
  notify () {
    /* 
      浅拷贝
    */
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    /* 
      遍历依赖， 执行update方法，
      从而更新视图
    */
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
```

Watcher 类

```js
/* 
  整个文件就是定义了一个watcher的类

*/
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    // 下面是watcher的配置
    if (options) {
      /* deep 深度监听 */
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }

    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    // 用来做缓存的
    this.dirty = this.lazy // for lazy watchers
    /* 
      watcher实例记录自己依赖了哪些数据其实就是
      把这些数据的依赖管理器dep存放在watcher实例的this.deps = []属性中 
    */
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
      
    // parse expression for getter
    // 这里就是把函数传给 getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    /* 这里调用了get方法 */
    this.value = this.lazy
      ? undefined
      : this.get()
  } // constructor end

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    /* 这里把实例放到了Dep.target */
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      /* 
        获取被依赖的数据，目的是为了触发数据的getter
        调用index.js 里面的getter之后，
        会触发dep.depend()
        然后再执行watcher里面的 addDep 方法，就在下面
       */
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      /* 
        “触摸”每个属性，以便将它们全部作为深度监视的依赖项进行跟踪
      */
      if (this.deep) {
        traverse(value)
      }
      /* 这里再释放 */
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   * 
   * dep 实例
   */
  addDep (dep: Dep) {

    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        /* 执行Dep里面的addSub 方法，把这个实例放到依赖数组里 */
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  /* 
    派发更新
    当计算属性中用到的数据发生变化时，计算属性的watcher实例就会执行watcher.update()方法，
    在update方法中会判断当前的watcher是不是计算属性的watcher，
    如果是则调用getAndInvoke去对比计算属性的返回值是否发生了变化，如果真的发生变化，
    则执行回调，通知那些读取计算属性的watcher重新执行渲染逻辑。
  */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      /* 同步过程 */
      this.run()
    } else {
      /* 主要是这个， 队列 */
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  // 会将读取计算属性的那个watcher添加到计算属性的watcher实例的依赖列表中，当计算属性中用到的数据发生变化时
  // ，计算属性的watcher实例就会执行watcher.update()方法
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  /* 
    teardown 拆卸
    取消监听
  */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
```

## 总结

`Data`通过`observer`转换成了`getter/setter`的形式来追踪变化

当外界通过`Watcher`读取数据时，会触发`getter`从而将`Watcher`添加到依赖中Dep

当数据发生了变化时，会触发`setter`，从而向`Dep`中的依赖（即Watcher）发送通知

`Watcher`接收到通知后，会向外界发送通知，变化通知到外界后可能会触发视图更新，也有可能触发用户的某个回调函数等。