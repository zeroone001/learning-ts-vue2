# 模板编译篇-HTML解析器

## html-parser

一边解析不同的内容一边调用对应的钩子函数生成对应的`AST`节点，最终完成将整个模板字符串转化成`AST`,这就是`HTML`解析器所要做的工作

```js
/* 
    template:待转换的模板字符串；
    options:转换时所需的选项；
   */
  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    /* 
      下面这四个钩子函数，就是把提取出来的内容生成AST
    */
    // 当解析到开始标签时调用start函数生成元素类型的AST节点
    /* 
      tag: 标签名
      attrs: 标签属性
      unary: 标签是否自闭合
    */
    start (tag, attrs, unary, start, end) {
      // check namespace.
      // inherit parent ns if there is one
      const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }
      // 调用createASTElement函数来创建元素类型的AST节点
      let element: ASTElement = createASTElement(tag, attrs, currentParent)
      if (ns) {
        element.ns = ns
      }

      if (process.env.NODE_ENV !== 'production') {
        if (options.outputSourceRange) {
          element.start = start
          element.end = end
          element.rawAttrsMap = element.attrsList.reduce((cumulated, attr) => {
            cumulated[attr.name] = attr
            return cumulated
          }, {})
        }
        attrs.forEach(attr => {
          if (invalidAttributeRE.test(attr.name)) {
            warn(
              `Invalid dynamic argument expression: attribute names cannot contain ` +
              `spaces, quotes, <, >, / or =.`,
              {
                start: attr.start + attr.name.indexOf(`[`),
                end: attr.start + attr.name.length
              }
            )
          }
        })
      }

      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true
        process.env.NODE_ENV !== 'production' && warn(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          `<${tag}>` + ', as they will not be parsed.',
          { start: element.start }
        )
      }

      // apply pre-transforms
      for (let i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element
      }

      if (!inVPre) {
        processPre(element)
        if (element.pre) {
          inVPre = true
        }
      }
      if (platformIsPreTag(element.tag)) {
        inPre = true
      }
      if (inVPre) {
        processRawAttrs(element)
      } else if (!element.processed) {
        // structural directives
        processFor(element)
        processIf(element)
        processOnce(element)
      }

      if (!root) {
        root = element
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(root)
        }
      }

      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        closeElement(element)
      }
    },
    /* 
      当解析到结束标签时调用end函数
    */
    end (tag, start, end) {
      const element = stack[stack.length - 1]
      // pop stack
      stack.length -= 1
      currentParent = stack[stack.length - 1]
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.end = end
      }
      closeElement(element)
    },
    /* 
      解析到文本时候，调用chars函数，生成文本类型的AST节点
    */
    chars (text: string, start: number, end: number) {
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.',
              { start }
            )
          } else if ((text = text.trim())) {
            warnOnce(
              `text "${text}" outside root element will be ignored.`,
              { start }
            )
          }
        }
        return
      }
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      const children = currentParent.children
      if (inPre || text.trim()) {
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
      } else if (!children.length) {
        // remove the whitespace-only node right after an opening tag
        text = ''
      } else if (whitespaceOption) {
        if (whitespaceOption === 'condense') {
          // in condense mode, remove the whitespace node if it contains
          // line break, otherwise condense to a single space
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        text = preserveWhitespace ? ' ' : ''
      }
      if (text) {
        if (!inPre && whitespaceOption === 'condense') {
          // condense consecutive whitespaces into single space
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        let child: ?ASTNode
        // 如果遇到文本信息，就会调用文本解析器parseText函数进行文本解析
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
          }
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text
          }
        }
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start
            child.end = end
          }
          children.push(child)
        }
      }
    },
    /* 解析到注释的时候，调用comment 函数，生成注释类型的AST节点 */
    comment (text: string, start, end) {
      // adding anything as a sibling to the root node is forbidden
      // comments should still be allowed, but ignored
      if (currentParent) {
        const child: ASTText = {
          type: 3,
          text,
          isComment: true
        }
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          child.start = start
          child.end = end
        }
        currentParent.children.push(child)
      }
    }
  })
```



## 解析不同的内容

* 文本，例如“难凉热血”
* HTML注释，例如<!-- 我是注释 -->
* 条件注释，例如<!-- [if !IE]> -->我是注释<!--< ![endif] -->
* DOCTYPE，例如<!DOCTYPE html>
* 开始标签，例如<div>
* 结束标签，例如</div>

### HTML注释

```javascript
const comment = /^<!\--/
if (comment.test(html)) {
  // 若为注释，则继续查找是否存在'-->'
  const commentEnd = html.indexOf('-->')

  if (commentEnd >= 0) {
    // 若存在 '-->',继续判断options中是否保留注释
    if (options.shouldKeepComment) {
      // 若保留注释，则把注释截取出来传给options.comment，创建注释类型的AST节点
      options.comment(html.substring(4, commentEnd))
    }
    // 若不保留注释，则将游标移动到'-->'之后，继续向后解析
    advance(commentEnd + 3)
    continue
  }
}
```

### 条件注释

```javascript
// 解析是否是条件注释
const conditionalComment = /^<!\[/
if (conditionalComment.test(html)) {
  // 若为条件注释，则继续查找是否存在']>'
  const conditionalEnd = html.indexOf(']>')

  if (conditionalEnd >= 0) {
    // 若存在 ']>',则从原本的html字符串中把条件注释截掉，
    // 把剩下的内容重新赋给html，继续向后匹配
    advance(conditionalEnd + 2)
    continue
  }
}
```



### 解析DOCTYPE

```javascript
const doctype = /^<!DOCTYPE [^>]+>/i
// 解析是否是DOCTYPE
const doctypeMatch = html.match(doctype)
if (doctypeMatch) {
  advance(doctypeMatch[0].length)
  continue
}
```



### 解析开始标签

```js
function parseStartTag () {
    const start = html.match(startTagOpen)
    /* 如果存在开始标签 */
    /*   // '<div></div>'.match(startTagOpen)  => ['<div','div',index:0,input:'<div></div>'] */
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      /* 移动游标到标签属性的位置 */
      advance(start[0].length)
      let end, attr
      /* 提取所有的属性包含 v-bind等等 */
      /**
       * <div a=1 b=2 c=3></div>
       * 从<div之后到开始标签的结束符号'>'之前，一直匹配属性attrs
       * 所有属性匹配完之后，html字符串还剩下
       * 自闭合标签剩下：'/>'
       * 非自闭合标签剩下：'></div>'
       */
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        attr.start = index
        // 继续移动游标
        advance(attr[0].length)
        attr.end = index
        match.attrs.push(attr)
      }
      // startTagClose处理闭合标签的
      /* 根据匹配结果的end[1]是否是""我们即可判断出当前标签是否为自闭合标签 */
      /**
       * 这里判断了该标签是否为自闭合标签
       * 自闭合标签如:<input type='text' />
       * 非自闭合标签如:<div></div>
       * '></div>'.match(startTagClose) => [">", "", index: 0, input: "></div>", groups: undefined]
       * '/><div></div>'.match(startTagClose) => ["/>", "/", index: 0, input: "/><div></div>", groups: undefined]
       * 因此，我们可以通过end[1]是否是"/"来判断该标签是否是自闭合标签
       */
      if (end) {
        // 下面是对自闭合标签的处理
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }
```



```js
/* 再处理一下提取出来的标签属性数组 */
  function handleStartTag (match) {
    const tagName = match.tagName /* 开始标签的标签名 */
    const unarySlash = match.unarySlash /* 是否为自闭合标签的标志，自闭合为"",非自闭合为"/" */

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    const unary = isUnaryTag(tagName) || !!unarySlash /* 布尔值，标志是否为自闭合标签 */

    const l = match.attrs.length /* match.attrs 数组的长度 */
    const attrs = new Array(l)  /* 一个与match.attrs数组长度相等的数组 */
    /* 循环处理提取出来的标签属性数组match.attrs */
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      const value = args[3] || args[4] || args[5] || ''
      /* 接着定义了shouldDecodeNewlines，这个常量主要是做一些兼容性处理， 
      如果 shouldDecodeNewlines 为 true，意味着 Vue 在编译模板的时候，
      要对属性值中的换行符或制表符做兼容处理。
      而shouldDecodeNewlinesForHref为true 意味着Vue在编译模板的时候，
      要对a标签的 href属性值中的换行符或制表符做兼容处理。 */
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      
      // 将处理好的结果存入之前定义好的与match.attrs数组长度相等的attrs数组中
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length
        attrs[i].end = args.end
      }
    }
    // 如果该标签是非自闭合标签，则将标签推入栈中
    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      lastTag = tagName
    }
    // 如果该标签是自闭合标签，现在就可以调用start钩子函数并传入处理好的参数来创建AST节点了
    if (options.start) {
      // 开始调用start函数，生成AST
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }
```



### 解析结束标签

结束标签的解析要比解析开始标签容易多了，因为它不需要解析什么属性，只需要判断剩下的模板字符串是否符合结束标签的特征，如果是，就将结束标签名提取出来，再调用4个钩子函数中的`end`函数就好了。

```js
/* 解析结束标签 */
        const endTagMatch = html.match(endTag)
        /* 如果endTagMatch不是null */
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          /* 主要是调用end()函数 */
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }
```

### 解析文本

```js
let text, rest, next
      /* 从开头到第一个<出现的位置就都是文本内容了 */
      if (textEnd >= 0) {
        rest = html.slice(textEnd)
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          /**
           * 用'<'以后的内容rest去匹配endTag、startTagOpen、comment、conditionalComment
           * 如果都匹配不上，表示'<'是属于文本本身的内容
           */
          // 在'<'之后查找是否还有'<'
          // 后面这个1代表要找第二个 ‘<’
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        } // 
        // 开始到< 之间是纯文本
        text = html.substring(0, textEnd)
      }
      // 整个模板字符串里没有找到`<`,说明整个模板字符串都是文本
      if (textEnd < 0) {
        text = html
      }

      if (text) {
        advance(text.length)
      }
      // 把截取出来的text转化成textAST
      if (options.chars && text) {
        options.chars(text, index - text.length, index)
      }
```

### 如何保证AST节点层级关系

