# vue dist里面的文件都是干啥的

https://blog.csdn.net/webjhh/article/details/113373148



官方介绍runtime版本是运行时版本，不包含vue的模板编译器，因为现在大部分vue开发都使用vue 全家桶，而解析模板的任务就交给 vue-loader 在项目build的时候就解析成了render函数的形式，所以不需要编译器。vue pageage.json 中默认导出的就是vue.runtime.common.js 版本


```js
|-dist
    |-- vue.js
    |-- vue.common.js
    |-- vue.esm.js
    |-- vue.runtime.js
    |-- vue.runtime.common.js
    |-- vue.runtime.esm.js
    |-- vue.min.js
    |-- vue.runtime.min.js

```



## common

代表commonjs 

 Vue.common.js

* `commonJS` 是nodejs 采用的最早的模块标准，通过`module.exports`导出，`require("moduleName")`导入，

## esm

vue.esm.js 带编译器的完整版

* `EM Module ES6`推出的模块化标准,通过 `export`语法导出 `import xxx from 'module'` 导入

## UMD 

vue.js

* `umd`是用过模块规范是我们最熟悉的方式，通过script标签引入插件，插件一般通过全局变量的形式引入，挂载到window上。



## 总结

我们正常webpack开发，使用vue-loader, 所以用的是 vue.runtime.esm.js 这个文件