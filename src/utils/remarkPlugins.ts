import { visit } from 'unist-util-visit';
import { Node } from 'unist';

// 高亮语法插件 (==高亮==)
export function remarkHighlight() {
  return (tree: Node) => {
    visit(tree, ['paragraph', 'heading', 'blockquote'], (node: any) => {
      if (!node.children || !Array.isArray(node.children)) return;
      let newChildren: any[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        
        if (child.type === 'text') {
          const processedNodes = processTextForHighlight(child.value, child.position);
          newChildren.push(...processedNodes);
        } else {
          if (child.children && Array.isArray(child.children)) {
            processNodeChildren(child);
          }
          newChildren.push(child);
        }
      }
      node.children = newChildren;
    });
  };
}


// 处理文本内容中的高亮语法
function processTextForHighlight(text: string, position: any): any[] {
  const nodes: any[] = [];
  let lastIndex = 0;
  let currentPosition = { ...position?.start };
  const regex = /==([^=]+)==/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      nodes.push(createTextNode(textBefore, currentPosition, match.index - lastIndex));
      updatePosition(currentPosition, textBefore);
    }
    const highlightContent = match[1];
    const highlightNode = createHighlightNode(highlightContent, currentPosition);
    nodes.push(highlightNode);
    updatePosition(currentPosition, `==${highlightContent}==`);
    
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    nodes.push(createTextNode(remainingText, currentPosition, text.length - lastIndex));
  }
  return nodes;
}



// 遮盖语法插件 ({{遮盖}})
export function remarkConceal() {
  return (tree: Node) => {
    visit(tree, ['paragraph', 'heading', 'blockquote'], (node: any) => {
      if (!node.children || !Array.isArray(node.children)) return;
      let newChildren: any[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'text') {
          const processedNodes = processTextForConceal(child.value, child.position);
          newChildren.push(...processedNodes);
        } else {
          if (child.children && Array.isArray(child.children)) {
            processNodeChildren(child);
          }
          newChildren.push(child);
        }
      }
      node.children = newChildren;
    });
  };
}


// 处理文本内容中的遮盖语法
function processTextForConceal(text: string, position: any): any[] {
  const nodes: any[] = [];
  let lastIndex = 0;
  let currentPosition = { ...position?.start };
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      nodes.push(createTextNode(textBefore, currentPosition, match.index - lastIndex));
      updatePosition(currentPosition, textBefore);
    }
    // 添加遮盖节点
    const concealContent = match[1];
    const concealNode = createConcealNode(concealContent, currentPosition);
    nodes.push(concealNode);
    updatePosition(currentPosition, `{{${concealContent}}}`);
    lastIndex = match.index + match[0].length;
  }
  // 添加剩余文本
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    nodes.push(createTextNode(remainingText, currentPosition, text.length - lastIndex));
  }
  return nodes;
}


// 递归处理节点的子节点
function processNodeChildren(node: any) {
  let newChildren: any[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'text') {
      const processedNodes = node.type === 'highlight' 
        ? processTextForHighlight(child.value, child.position)
        : processTextForConceal(child.value, child.position);
      newChildren.push(...processedNodes);
    } else {
      if (child.children && Array.isArray(child.children)) {
        processNodeChildren(child);
      }
      newChildren.push(child);
    }
  }
  node.children = newChildren;
}


// 创建文本节点
function createTextNode(value: string, startPosition: any, length: number): any {
  const endPosition = calculateEndPosition(startPosition, value);
  return {
    type: 'text',
    value: value,
    position: {
      start: { ...startPosition },
      end: { ...endPosition }
    }
  };
}


// 创建高亮节点
function createHighlightNode(content: string, startPosition: any): any {
  const fullContent = `==${content}==`;
  const endPosition = calculateEndPosition(startPosition, fullContent);
  return {
    type: 'highlight',
    data: {
      hName: 'mark',
      hProperties: {
        className: 'highlight'
      }
    },
    position: {
      start: { ...startPosition },
      end: { ...endPosition }
    },
    children: [
      {
        type: 'text',
        value: content,
        position: {
          start: calculateEndPosition(startPosition, '=='),
          end: calculateEndPosition(startPosition, `==${content}`)
        }
      }
    ]
  };
}


// 创建遮盖节点
function createConcealNode(content: string, startPosition: any): any {
  const fullContent = `{{${content}}}`;
  const endPosition = calculateEndPosition(startPosition, fullContent);
  return {
    type: 'conceal',
    data: {
      hName: 'span',
      hProperties: {
        style: 'background-color: black; color: black; border-radius: 2px;'
      }
    },
    position: {
      start: { ...startPosition },
      end: { ...endPosition }
    },
    children: [
      {
        type: 'text',
        value: content,
        position: {
          start: calculateEndPosition(startPosition, '{{'),
          end: calculateEndPosition(startPosition, `{{${content}}`)
        }
      }
    ]
  };
}



// 更新位置信息
function updatePosition(position: any, text: string): void {
  const lines = text.split('\n');
  if (lines.length > 1) {
    position.line += lines.length - 1;
    position.column = lines[lines.length - 1].length + 1;
    position.offset += text.length;
  } else {
    position.column += text.length;
    position.offset += text.length;
  }
}


// 计算结束位置
function calculateEndPosition(startPosition: any, text: string): any {
  const endPosition = { ...startPosition };
  updatePosition(endPosition, text);
  return endPosition;
}