// @/styles/mask.ts
// 用于遮盖元素的特殊样式


export const maskCSS = `


span.content-mask-off,
strong.content-mask-off,
mark.content-mask-off {
    color: var(--primary);
    background-image: linear-gradient(90deg, var(--primary) 50%, transparent 50%);
    background-size: 6px 1px;  /* 控制虚线间距：6px宽度，1px高度 */
    background-repeat: repeat-x;
    background-position: 0 100%;
    padding-bottom: 2px;       /* 控制下划线距离 */
}


.content-mask {
    background-color: var(--mask) !important;
    color: transparent !important;
    min-width: 20px;
    cursor: pointer;
    user-select: none;
}

.content-mask pre {
    background-color: var(--mask) !important;
}

.content-mask .noolingo-speech {
    background-color: var(--mask) !important;
}

.content-mask pre code,
.content-mask code {
    color: transparent !important;
    background-color: transparent !important;
}

.content-mask pre * {
    color: transparent !important;
}

.content-mask .task-list-item-checkbox:checked {
    background-color: var(--mask) !important;
    border-color: transparent !important;
}

.content-mask .katex * {
    opacity: 0 !important;
}

.content-mask table th,
.content-mask table td {
    color: transparent !important;
}

.content-mask table tr:nth-child(odd),
.content-mask table tr:nth-child(even),
.content-mask table tr:hover {
    background-color: var(--mask) !important;
}

.content-mask table th {
    background-color: var(--mask) !important;
}

.content-mask a,
.content-mask .noolingo-wikilink {
    color: transparent !important;
    border-bottom-color: transparent !important;
}

.content-mask .noolingo-highlight {
    background-color: var(--mask) !important;
}

.content-mask blockquote {
    border-left-color: transparent !important;
    color: transparent !important;
}


.content-mask span, 
.content-mask strong, 
.content-mask em, 
.content-mask del, 
.content-mask mark {
    color: transparent !important;
    background-color: var(--mask) !important;
}


.content-mask img {
  opacity: 0 !important;
  background-color: var(--mask) !important;
}

.content-mask blockquote {
    background-color: var(--mask) !important;
}

`;
