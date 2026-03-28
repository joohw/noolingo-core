
export function extractImageUrlsFromMarkdown(markdown: string): string[] {
  const MD_IMAGE_REGEX = /!\[[^\]]*\]\(([^)]+?)(?:\s+"(?:[^"]*)")?\)/g;
  if (!markdown) return [];
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  MD_IMAGE_REGEX.lastIndex = 0;
  while ((match = MD_IMAGE_REGEX.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (url) urls.push(url);
  }
  return [...new Set(urls)];
}