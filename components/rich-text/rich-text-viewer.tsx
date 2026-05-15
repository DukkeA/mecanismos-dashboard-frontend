import type { LexicalSerializedNode, RichTextNote } from "@/lib/rich-text";
import { extractPlainTextFromRichText, isRichTextNote, normalizeRichTextNote } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

export function RichTextViewer({ value, emptyText = "Sin notas", className }: { value: RichTextNote | string | undefined; emptyText?: string; className?: string }) {
  const note = normalizeRichTextNote(value);
  if (!note || !isRichTextNote(note)) return <p className={cn("text-sm text-muted-foreground", className)}>{emptyText}</p>;

  return <div className={cn("space-y-2 text-sm", className)}>{renderNodes(note.root.children)}</div>;
}

function renderNodes(nodes: LexicalSerializedNode[] | undefined): React.ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => {
    if (node.type === "paragraph") return <p key={index}>{renderInline(node.children) || <br />}</p>;
    if (node.type === "list") {
      const tag = node.listType === "number" ? "ol" : "ul";
      const children = <>{renderNodes(node.children)}</>;
      return tag === "ol" ? <ol key={index} className="ml-5 list-decimal space-y-1">{children}</ol> : <ul key={index} className="ml-5 list-disc space-y-1">{children}</ul>;
    }
    if (node.type === "listitem") return <li key={index}>{renderInline(node.children) || extractPlainTextFromRichText({ root: { type: "root", children: node.children ?? [] } })}</li>;
    return <p key={index}>{renderInline(node.children) || node.text || null}</p>;
  });
}

function renderInline(nodes: LexicalSerializedNode[] | undefined): React.ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => {
    if (typeof node.text === "string") {
      let content: React.ReactNode = node.text;
      const format = typeof node.format === "number" ? node.format : 0;
      if (format & 1) content = <strong>{content}</strong>;
      if (format & 2) content = <em>{content}</em>;
      if (format & 8) content = <span className="underline">{content}</span>;
      return <span key={index}>{content}</span>;
    }
    if (node.type === "link" && typeof node.url === "string") {
      return <a key={index} href={node.url} className="underline underline-offset-4" rel="noreferrer" target="_blank">{renderInline(node.children) || node.url}</a>;
    }
    return <span key={index}>{renderInline(node.children)}</span>;
  });
}
