# 实例方法篇 - stateMixin

## 

## $watch

在  `./computed和watch的区别.md` 里面

## $set

`vm.$set` 是全局 `Vue.set` 的**别名**，其用法相同

用法： 

向响应式对象中添加一个属性，并确保这个新属性同样是响应式的，且触发视图更新。

它必须用于向响应式对象上添加新属性，因为 `Vue` 无法探测普通的新增属性 (比如 `this.myObject.newProperty = 'hi'`)

**注意**：对象不能是 `Vue` 实例，或者 `Vue` 实例的根数据对象



### 源码

对于`object`型数据，当我们向`object`数据里添加一对新的`key/value`或删除一对已有的`key/value`时，`Vue`是无法观测到的；

而对于`Array`型数据，当我们通过数组下标修改数组中的数据时，`Vue`也是是无法观测到的



定义

函数 stateMixin 里面 Vue.prototype.$set

函数实际定义在 src/core/observer/index.js 里面

```js
/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  /* 判断是不是一个数组，并且判断key 是否正确 */
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    /* 先修改了数组的长度 */
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  /* 先判断在不在这个对象里，并且不能在原型上，直接 */
  if (key in target && !(key in Object.prototype)) {

    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  /* 这里判断，这个target 是不是响应式的，不是的话，直接设置值 */
  if (!ob) {
    target[key] = val
    return val
  }
  /* 下面两行是关键 */
  defineReactive(ob.value, key, val)
  ob.dep.notify()

  return val
}
```



## vm.$delete

函数 stateMixin 里面 Vue.prototype.$delete

函数实际定义在 src/core/observer/index.js 里面

```javascript
vm.$delete(target, propertyName / index);
```

源码

跟$set 还是很像的

```js
/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}
```



## 







