import type { RichTextNode } from '../../types/board';

// Tiptap's JSONContent structure mirrors our RichTextNode — conversion is a type bridge only.

export function tiptapToRichText(json: object): RichTextNode {
  return json as RichTextNode;
}

export function richTextToTiptap(node: RichTextNode): object {
  return node as object;
}

export function isEditorEmpty(node: RichTextNode | null): boolean {
  if (!node) return true;
  const content = (node as { content?: RichTextNode[] }).content;
  if (!content || content.length === 0) return true;
  // A single empty paragraph counts as empty
  if (content.length === 1 && content[0].type === 'paragraph') {
    const inner = content[0].content;
    return !inner || inner.length === 0;
  }
  return false;
}
