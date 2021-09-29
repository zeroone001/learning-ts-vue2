# 全局API篇2

## Vue.use

安装VUE的插件

如果插件是一个对象，那么对象上就需要定义一个install方法；如果插件是一个函数，他会被作为install方法。

install方法调用的时候，会把Vue作为参数传入进去，

这个use方法，需要在new Vue 之前调用

* 当 `install` 方法被同一个插件多次调用，插件将只会被安装一次。

### 源码分析

定义位于源码的`src/core/global-api/use.js`中

```js
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // _installedPlugins 用来存储已经安装过的插件
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    /* 之前安装过，就不再安装 */
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    /* 
      把参数转化为数组，
      同时，把Vue放到数组的第一个位置 
    */
    const args = toArray(arguments, 1)
    args.unshift(this)

    // 传入的是对象，有install属性
    if (typeof plugin.install === 'function') {

      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 直接传入了一个函数
      plugin.apply(null, args)
    }
    /* 把插件放到插件列表中，完成 */
    installedPlugins.push(plugin)
    return this
  }
}
```





## Vue.mixin

```javascript
Vue.mixin( mixin )
```

全局注册一个混入，然后，影响注册之后的所有的Vue实例，**不推荐在应用代码中使用**

该API是用来向全局注册一个混入，即可以修改`Vue.options`属性，并且会影响之后的所有`Vue`实例，

这个API虽然在日常的业务开发中几乎用不到，但是在编写`Vue`插件时用处非常大

### 源码分析

```js
export function initMixin (Vue: GlobalAPI) {
  /* 
    这个API真的简单 
    直接修改了Vue的options，
    影响了后面所有的Vue实例
  */
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```



## Vue.compile

这个开发中是用不到的

```javascript
Vue.compile( template )
```

在 render 函数中编译模板字符串。**只在独立构建时有效**

```javascript
var res = Vue.compile('<div><span>{{ msg }}</span></div>')

new Vue({
  data: {
    msg: 'hello'
  },
  render: res.render,
  staticRenderFns: res.staticRenderFns
})
```

从用法回顾中可以知道，该API是用来编译模板字符串的，我们在日常业务开发中几乎用不到，它内部是调用了`compileToFunctions`方法

```javascript
Vue.compile = compileToFunctions;
```



## Vue.observable

```javascript
Vue.observable( object )
```

让一个对象可响应。Vue 内部会用它来处理 `data` 函数返回的对象。

```javascript
const state = Vue.observable({ count: 0 })

const Demo = {
  render(h) {
    return h('button', {
      on: { click: () => { state.count++ }}
    }, `count is: ${state.count}`)
  }
}
```

从用法回顾中可以知道，该API是用来将一个普通对象转化成响应式对象。在日常业务开发中也几乎用不到，它内部是调用了`observe`方法



## Vue.version

```javascript
Vue.version
```

主要用于做插件的时候的版本判断

```javascript
var version = Number(Vue.version.split('.')[0])

if (version === 2) {
  // Vue v2.x.x
} else if (version === 1) {
  // Vue v1.x.x
} else {
  // Unsupported versions of Vue
}
```

该API是在构建时读取了`package.json`中的`version`字段，然后将其赋值给`Vue.version`

```js
Vue.version = '__VERSION__'
```

