"use client";

import {
  boldExtension,
  createEditorSystem,
  historyExtension,
  italicExtension,
  listExtension,
  richTextExtension,
  underlineExtension,
  type RichTextConfig,
} from "@lexkit/editor";

export function createLexKitNoteExtensions(richTextConfig: RichTextConfig) {
  return [
    richTextExtension.configure({ ...richTextConfig, position: "after", showInToolbar: false }),
    boldExtension,
    italicExtension,
    underlineExtension,
    listExtension,
    historyExtension,
  ] as const;
}

export const { Provider: LexKitNoteProvider, useEditor: useLexKitNoteEditor } = createEditorSystem<ReturnType<typeof createLexKitNoteExtensions>>();
