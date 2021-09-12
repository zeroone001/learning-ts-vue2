# $mount 做了哪些事情



* 处理template
* 添加render
* `$mount` 方法实际上会去调用 `mountComponent` 方法，这个方法定义在 `src/core/instance/lifecycle.js` 文件中
* 执行 mountComponent
* 执行 updateComponent
*  render
* update

```js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  /* 调用query方法，也就是说，如果el是个字符串，那就document.querySelector, 
    否则就直接返回
  */
  el = el && query(el)

  /* istanbul ignore if */
  /* 不能直接挂载到body或者HTML上上 */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function


  /* 
    如果没有写render
  */
  if (!options.render) {
    let template = options.template
    if (template) {
      /* 如果写了template 那么走下面的 */
      /* 如果手写了，就用下面这个值， 如果没有手写，那么就用el 去获取 */
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 正常走这个
      template = getOuterHTML(el)
    }
    if (template) {

      /* istanbul ignore if */

      /* 下面就是关键的编译了 */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)

      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}
```



```js
/*
	vm._render() 生成虚拟DOM
      vm._update() 来更新DOM
*/
updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
```



## 总结

`mountComponent` 方法的逻辑也是非常清晰的，它会完成整个渲染工作，接下来我们要重点分析其中的细节，也就是最核心的 2 个方法：`vm._render` 和 `vm._update`。