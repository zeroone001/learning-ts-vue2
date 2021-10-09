# 虚拟DOM篇-VNode

## 什么是虚拟DOM

其实就是用一个JS对象来描述一个DOM节点

## 为什么要有虚拟DOM

用JS 的计算性能来换取DOM操作性能的消耗

我们可以用 `JS` 模拟出一个 `DOM` 节点，称之为虚拟 `DOM` 节点。当数据发生变化时，我们对比变化前后的虚拟`DOM`节点，通过`DOM-Diff`算法计算出需要更新的地方，然后去更新需要更新的视图。

这就是虚拟 `DOM` 产生的原因以及最大的用途

## Vue中的虚拟DOM

### VNode类

通过这个类，可以虚拟化出不同类型的DOM节点

```js
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    // 标签名
    this.tag = tag 
    // 当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，
    this.data = data
    /* 当前节点的子节点，是一个数组 */
    this.children = children
    /* 当前节点的文本 */
    this.text = text
    /* 当前节点对应的真实DOM节点 */
    this.elm = elm
    /* 当前节点的名字空间 */
    this.ns = undefined
    /* 当前组件节点对应的Vue实例 */
    this.context = context
    /* 函数式组件对应的Vue实例 */
    this.fnContext = undefined
    /*  */
    this.fnOptions = undefined
    this.fnScopeId = undefined
    /* 节点的key属性 */
    this.key = data && data.key
    /* 组件的options选项 */
    this.componentOptions = componentOptions
    /* 当前节点对应的组件的实例 */
    this.componentInstance = undefined
    /* 当前节点的父节点 */
    this.parent = undefined
    /* 简而言之就是是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false */
    this.raw = false
    /* 静态节点标志 */
    this.isStatic = false
    /* 是否作为根节点插入 */
    this.isRootInsert = true
    /* 是否为注释节点 */
    this.isComment = false
    /* 是否为克隆节点 */
    this.isCloned = false
    /* 是否有v-once 指令 */
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}
```

### VNode 类型

```js
/* 
  这是一个注释节点
  只需要两个属性
  text表示具体的注释信息
  isComment 是一个标识
 */
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

/* 文本节点，只需要text属性，比较简单 */
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}
```

### VNode作用

我们在视图渲染之前，把写好的`template`模板先编译成`VNode`并缓存下来，等到数据发生变化页面需要重新渲染的时候，我们把数据发生变化后生成的`VNode`与前一次缓存下来的`VNode`进行对比，找出差异，然后有差异的`VNode`对应的真实`DOM`节点就是需要重新渲染的节点，最后根据有差异的`VNode`创建出真实的`DOM`节点再插入到视图中，最终完成一次视图更新