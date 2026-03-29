// @/styles/note.ts
// 笔记的基础样式

export const noteCSS = `

.note-container {
    max-width: 768px;
    padding-bottom: 120px;
    padding-left: 4px;
    padding-right: 4px;
    overflow-x: visible;
    margin-horizontal: auto;
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto'
}

/* renderNote 根节点：与 WebView .note-container 一致，避免列表 marker 贴边裁切 */
.noolingo-content {
    overflow-x: visible;
    padding-left: 4px;
    padding-right: 4px;
    box-sizing: border-box;
}


strong, b {
    color: var(--bold);
    font-weight: bold;
}


p {
    width: 100%;
    line-height: 1.8;
    paddingBottom:18px;
}

h1, h2, h3, h4, h5, h6 {
    width: 100%;
    line-height: 1.8;
}

ul {
    padding-left: 1.5em;
    margin-top: 8px;
    margin-bottom: 4px;
    line-height: 1.8;
}

ol {
    padding-left: 1.625em;
    margin-top: 0px;
    margin-bottom: 4px;
    line-height: 1.8;
}

.noolingo-wikilink{
    cursor: pointer;
    display: inline-flex;
    gap: 6px;
}

.noolingo-wikilink {
    cursor: pointer;
    display: inline-flex;
    gap: 6px;
    pointer-events: auto;  /* 确保 wikilink 可点击 */
}

a {
    color: var(--primary);
    text-decoration: underline;
    text-decoration-skip-ink: auto;
    text-underline-offset: 5px;
    transition: color 0.2s ease;
    pointer-events: auto;  /* 确保链接可点击 */
    cursor: pointer;       /* 添加手型光标 */
}

a:active {
    opacity: 0.7;
}

mark {
    background-color: var(--highlight);
    border-radius: 2px;
}

mark .noolingo-highlight {
    background-color: var(--highlight);
    border-radius: 2px;
}

.noolingo-speech:active {
  background-color: var(--primary); 
  opacity: 0.7; 
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 2px;
    display: block;
    overflow-x: auto;
}

th, td {
    border: 1px solid var(--border, #ccc);
    padding: 8px 12px;
    vertical-align: top;
    min-width: 50px;
}

th {
    background-color: var(--table-header-bg);
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
}

tr {
    transition: background-color 0.2s;
}

tr:hover {
    background-color: var(--table-alternate-cell-bg);
}

tr:nth-child(odd) {
    background-color: var(--table-cell-bg);
}

tr:nth-child(even) {
    background-color: var(--table-alternate-cell-bg);
}

code {
    font-family: var(--font-mono, monospace);
    padding: 2px 4px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

pre {
    background-color: var(--muted);
    border-radius: 6px;
    overflow-x: auto;
    padding: 0px 8px;
    display: block;
    width: 100%;
    white-space: pre;
    line-height: 1.4;
    font-size: 0.9em;
}


pre > code {
    background-color: var(--muted);
    padding: 0;
    font-size: inherit;
    line-height: inherit;
    white-space: pre;
    display: block;
    min-width: min-content;
}

pre > header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono, monospace);
    opacity: 0.5;
    padding: 0 0 4px 0;
    user-select: none;
}

.noolingo-content span.noolingo-mask {
  font-weight: bold;
  color: var(--primary);
}

.noolingo-code-copy {
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    opacity: 0.7;
}

.noolingo-code-copy:hover {
    opacity: 1;
}

.noolingo-code-copy.text-code-string .noolingo-copy-text {
    color: var(--success);
}

img {
    max-width: 100%;
    height: auto;
    pointer-events: none;
    display: block;
}


blockquote {
    padding: 12px 16px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: var(--muted-foreground);
    position: relative;
    background-color: var(--muted);
}


blockquote p {
    margin: 0;
    line-height: 1.6;
}

blockquote cite {
    display: block;
    margin-top: 8px;
    font-style: normal;
    font-size: 0.9em;
    color: var(--foreground);
    opacity: 0.7;
    text-align: right;
    padding-right: 20px; /* 给右边引号留出空间 */
}


ul.contains-task-list {
    padding-left: 0;
    padding-top: 4px;
    padding-bottom: 4px;
}

ul > li[class="task-list-item enabled"] {
    list-style: none;
    padding-left: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

ul > li[class="task-list-item enabled"]:hover {
    background-color: var(--table-alternate-cell-bg);
}

.task-list-item-checkbox {
    margin: 0;
    background-color: var(--table-alternate-cell-bg);
    border-radius: 2px;
    border: 1px solid var(--border, #ccc);
    width: 12px;
    height: 12px;
    appearance: none;
    cursor: pointer;
    background: var(--secondary);
    border-color: var(--border, #666);
}

.task-list-item-checkbox:checked {
    background-color: var(--success);
}

li[class="task-list-item enabled"]:has(.task-list-item-checkbox:checked) {
    opacity: 0.5;
}

li[class="task-list-item enabled"]:not(:has(.task-list-item-checkbox:checked)) {
    font-weight: 500;
}

img {
  max-width: 100%;
  height: auto;
  user-select: none;
}

.note-divider {
    border-top: 1px solid var(--border);
}

.note-references {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
}

.note-references-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.note-reference-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 0;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;
    overflow: hidden;
}

.note-reference-item:hover {
    opacity: 0.7;
}

.note-reference-item:active {
    opacity: 0.5;
}

.note-reference-icon {
    margin-right: 6px;
    width: 12px;
    height: 12px;
    color: var(--primary);
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.note-reference-icon svg {
    width: 100%;
    height: 100%;
    color: inherit;
}

.note-reference-text {
    flex: 1;
    font-size: 14px;
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

`;