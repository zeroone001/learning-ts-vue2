# 实例方法篇 - eventsMixin

```javascript
export function eventsMixin (Vue) {
    Vue.prototype.$on = function (event, fn) {}
    Vue.prototype.$once = function (event, fn) {}
    Vue.prototype.$off = function (event, fn) {}
    Vue.prototype.$emit = function (event) {}
}
```



### $on

```javascript
vm.$on( event, callback )
```

作用：

监听当前实例上的自定义事件。事件可以由`vm.$emit`触发。回调函数会接收所有传入事件触发函数的额外参数。

```javascript
vm.$on('test', function (msg) {
  console.log(msg)
})
vm.$emit('test', 'hi')
// => "hi"
```

典型的发布订阅模式

首先定义一个事件中心，通过`$on`订阅事件，将事件存储在事件中心里面，然后通过`$emit`触发事件中心里面存储的订阅事件。

```js
Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
        
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }
```



## $emit

```javascript
vm.$emit( eventName, […args] )
```

作用： 触发当前实例上的事件

源码

```js
Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
          // invokeWithErrorHandling
        /* 
          这个函数就是封装了 apply 和 call， 加上error的判断
          触发函数调用
        */
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
```



## $off

```javascript
vm.$off( [event, callback] )
```



移除自定义事件监听器。

* 如果没有提供参数，则移除所有的事件监听器；
* 如果只提供了事件，则移除该事件所有的监听器；
* 如果同时提供了事件与回调，则只移除这个回调的监听器。

```js
Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // all
    // 当前实例上的所有事件都存储在事件中心_events属性中，
    // 要想移除所有的事件，那么只需把_events属性重新置为空对象即可
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // specific handler
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }
```



## vm.$once

先订阅事件，但是这个事件只能触发一次，就要被移除

源码

```js
Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }
```



