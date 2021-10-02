# 模板编译篇-生成render函数

```html
<div id="NLRX"><p>Hello {{name}}</p></div>
```

```javascript
ast = {
    'type': 1,
    'tag': 'div',
    'attrsList': [
        {
            'name':'id',
            'value':'NLRX',
        }
    ],
    'attrsMap': {
      'id': 'NLRX',
    },
    'static':false,
    'parent': undefined,
    'plain': false,
    'children': [{
      'type': 1,
      'tag': 'p',
      'plain': false,
      'static':false,
      'children': [
        {
            'type': 2,
            'expression': '"Hello "+_s(name)',
            'text': 'Hello {{name}}',
            'static':false,
        }
      ]
    }]
  }
```

## generate函数

这就是那个render函数 `render: `with(this){return ${code}}`,`

```js
/* 
codegen, 也就是code，generate 
  generate 生成一个render函数
*/
export function generate (
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {

  const state = new CodegenState(options)
  // fix #11483, Root level <script> tags should not be rendered.
  // 判断ast是否存在
  /* 
    主要是调用genElement函数
  */
  const code = ast ? (ast.tag === 'script' ? 'null' : genElement(ast, state)) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
} /* end generate */
```

