# set



1. 响应式数据中，对于对象新增和删除属性，以及数组的下标修改是观测不到的
2. 通过Vue.set 去处理这些问题，还有数组的API去解决这些问题，因为在array.js 里面把下面这些方法给重写了

```js
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
```

3. 本质上，是内部手动去做了依赖更新的派发