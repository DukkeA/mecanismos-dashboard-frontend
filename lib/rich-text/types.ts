export type LexicalSerializedNode = {
  type?: string;
  text?: string;
  url?: string;
  children?: LexicalSerializedNode[];
  format?: number | string;
  [key: string]: unknown;
};

export type LexicalRoot = {
  type: "root";
  children: LexicalSerializedNode[];
  [key: string]: unknown;
};

export type LexicalEditorStateJson = {
  root: LexicalRoot;
  [key: string]: unknown;
};

export type RichTextNote = LexicalEditorStateJson | null;
