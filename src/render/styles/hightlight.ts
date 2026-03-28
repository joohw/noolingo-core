// @/lib/render/styles/hightlight.ts


export const hightlightCss = `

.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in,
.hljs-name,
.hljs-tag {
  color: var(--code-keyword);
}

.hljs-string,
.hljs-title,
.hljs-section,
.hljs-attribute,
.hljs-literal,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-addition {
  color: var(--code-string);
}

.hljs-number,
.hljs-deletion {
  color: var(--code-number);
}

.hljs-comment,
.hljs-quote,
.hljs-meta {
  color: var(--code-comment);
}

.hljs-class,
.hljs-function {
  color: var(--code-function);
}

.hljs-variable,
.hljs-regexp,
.hljs-symbol {
  color: var(--code-variable);
}

.hljs-operator,
.hljs-bullet {
  color: var(--code-operator);
}

.hljs-punctuation {
  color: var(--code-operator);
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

.hljs-link {
  text-decoration: underline;
  color: var(--code-function);
}

.hljs-doctag {
  color: var(--code-comment);
}

.hljs-attr {
  color: var(--code-variable);
}

.hljs-attribute {
  color: var(--code-string);
}


`
