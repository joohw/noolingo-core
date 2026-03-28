import { HTMLElement } from 'node-html-parser';



// 当给元素添加遮盖时，移除其所有子元素的遮盖样式
export function addMaskClass(element: HTMLElement, hideContent: boolean) {
  element.querySelectorAll('.content-mask, .content-mask-off').forEach(child => {
    if (child instanceof HTMLElement) {
      child.classList.remove('content-mask');
      child.classList.remove('content-mask-off');
    }
  });
  if (hideContent) {
    element.classList.add('content-mask');
    element.classList.remove('content-mask-off');
  } else {
    element.classList.add('content-mask-off');
    element.classList.remove('content-mask');
  }
}


// 修复 SVG 命名空间
export function fixSvgNamespace(svgString: string): string {
  if (!svgString.trim()) return '';
  return svgString
    .replace(/(ns\d+:)|(xmlns:ns\d+="[^"]*")/g, '')
    .replace(/<svg([^>]*)>/, (match, attrs) => {
      if (!/width="100%"/.test(attrs) && !/style=/.test(attrs)) {
        return `<svg${attrs} style="width: 100%; height: 100%;">`;
      }
      return match;
    });
}

