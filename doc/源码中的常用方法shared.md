# 常用方法shared



### isDef()

判断是否是 undefined, 是否是null

```js
export function isDef (v: any): boolean %checks {
  return v !== undefined && v !== null
}
```



### isPlainObject



```js
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}
```

