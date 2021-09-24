# 全局API

实例方法篇是，将方法放在Vue.prototype 也就是VUE原型上，

然而，全局API是指，直接在Vue上挂载方法

全局API一共有12个，分别是

```tex
`Vue.extend`、`Vue.nextTick`、`Vue.set`、`Vue.delete`、`Vue.directive`、`Vue.filter`、`Vue.component`、`Vue.use`、`Vue.mixin`、`Vue.observable`、`Vue.version
```

## Vue.extend

使用基础Vue构造一个子类。参数是一个包含组件选项的对象

```js
Vue.extend({
    data () {
        return {}
    },
    template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
})
```

### 代码分析

创建子类的过程，一个是给子类加上独有的属性，另一个就是将父类的公共属性复制到子类上

```js
export function initGlobalAPI (Vue: GlobalAPI) {
    // Vue.extend
  	initExtend(Vue)
}
```

该API的定义位于源码的`src/core/global-api/extend.js`中

```js
export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    // 用户传入的一个包含组件选项的对象参数
    extendOptions = extendOptions || {}
    // 指向父类，即基础 Vue类
    const Super = this
    // 父类的cid属性，无论是基础 Vue类还是从基础 Vue类继承而来的类，都有一个cid属性，作为该类的唯一标识
    const SuperId = Super.cid
    // 缓存池，用于缓存创建出来的类
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    // 获取name字段
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      // 校验name是否合法
      validateComponentName(name)
    }

    /* 
      创建一个Sub类，这个类就是继承基础Vue的子类
    */
    const Sub = function VueComponent (options) {
      // 调用Vue基础的init 函数
      this._init(options)
    }
    // 将父类的原型继承到子类上
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    // 添加唯一标识
    Sub.cid = cid++
    // 合并options
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    // 将父类保存到子类的super中，保证能够拿到父类
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    /* 如果存在props，那么初始化它 */
    if (Sub.options.props) {
      initProps(Sub)
    }
    /* 存在计算属性，那么也是初始化她 */
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    /* 将父类上的一些属性方法复制到了子类上 */
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    /* 给子类新增三个独有的属性 */
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    /* 最后使用父类的cid作为key，创建好的子类作为value，放到缓存池子中 */
    cachedCtors[SuperId] = Sub
    return Sub
  }
}
```



## Vue.nextTick

这个跟实例方法篇的vm.$nextTick 是一样的

## Vue.set

这个也是跟实例方法篇的vm.$set 一样的

## Vue.delete

这个也是跟实例方法篇的vm.$delete 一样的

删除对象的属性。如果对象是响应式的，确保删除能触发更新视图。这个方法主要用于避开 Vue 不能检测到属性被删除的限制，但是你应该很少会使用它



Vue.directive、Vue.filter 和 Vue.component 这三个是写在一起的，而且代码非常相似的

## Vue.directive

该API是用来注册或获取全局指令的，接收两个参数：指令`id`和指令的定义

```javascript
Vue.directive( id, [definition] )
```



作用： 注册或获取全局指令。

```javascript
// 注册
Vue.directive('my-directive', {
  bind: function () {},
  inserted: function () {},
  update: function () {},
  componentUpdated: function () {},
  unbind: function () {}
})

// 注册 (指令函数)
Vue.directive('my-directive', function () {
  // 这里将会被 `bind` 和 `update` 调用
})

// getter，返回已注册的指令
var myDirective = Vue.directive('my-directive')
```

### 源码分析

```js
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]

Vue.options = Object.create(null)
ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
})

/* 
  组件注册 
  Vue.component
  Vue.directive
  Vue.filter
  */
  initAssetRegisters(Vue)
```

```js
// initAssetRegisters

```

