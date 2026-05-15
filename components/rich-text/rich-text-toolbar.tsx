"use client";

import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, Redo2Icon, UnderlineIcon, Undo2Icon } from "lucide-react";

import { useLexKitNoteEditor } from "@/components/rich-text/lexkit-note-system";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RichTextToolbar({ disabled }: { disabled?: boolean }) {
  const { activeStates, commands } = useLexKitNoteEditor();

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1" aria-label="Formato de notas">
      <ToolbarButton label="Negrita" active={activeStates.bold} disabled={disabled} onClick={() => commands.toggleBold()}><BoldIcon aria-hidden="true" /></ToolbarButton>
      <ToolbarButton label="Cursiva" active={activeStates.italic} disabled={disabled} onClick={() => commands.toggleItalic()}><ItalicIcon aria-hidden="true" /></ToolbarButton>
      <ToolbarButton label="Subrayado" active={activeStates.underline} disabled={disabled} onClick={() => commands.toggleUnderline()}><UnderlineIcon aria-hidden="true" /></ToolbarButton>
      <ToolbarButton label="Lista con viñetas" disabled={disabled} onClick={() => commands.toggleUnorderedList()}><ListIcon aria-hidden="true" /></ToolbarButton>
      <ToolbarButton label="Lista numerada" disabled={disabled} onClick={() => commands.toggleOrderedList()}><ListOrderedIcon aria-hidden="true" /></ToolbarButton>
      <ToolbarButton label="Deshacer" disabled={disabled || !activeStates.canUndo} onClick={() => commands.undo()}><Undo2Icon aria-hidden="true" /></ToolbarButton>
      <ToolbarButton label="Rehacer" disabled={disabled || !activeStates.canRedo} onClick={() => commands.redo()}><Redo2Icon aria-hidden="true" /></ToolbarButton>
    </div>
  );
}

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} aria-pressed={active} disabled={disabled} className={cn("size-8", active && "bg-primary/10 text-primary")} onClick={onClick}>
      {children}
    </Button>
  );
}
