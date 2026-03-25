export type ItemType = 'text' | 'link' | 'snippet';

export interface RichTextNode {
  type: string;
  content?: RichTextNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

export interface CanvasItem {
  id: string;
  type: ItemType;
  position: { x: number; y: number };
  width?: number;
  content: RichTextNode | null;
  url?: string;
  title?: string;
  sourceUrl?: string;
  favicon?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface BoardState {
  items: CanvasItem[];
  viewport: ViewportState;
  version: number;
}
