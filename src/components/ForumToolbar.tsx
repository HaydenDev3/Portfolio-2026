"use client";

import { useRef, useCallback } from "react";
import { Bold, Italic, Link2, Image, Heading1, Heading2, List, Quote, Code } from "lucide-react";

interface ForumToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (before: string, after?: string, placeholder?: string) => void;
}

const tools = [
  { icon: Bold, label: "Bold", insert: ["**", "**", "bold text"] },
  { icon: Italic, label: "Italic", insert: ["*", "*", "italic text"] },
  { icon: Heading1, label: "Heading 1", insert: ["\n# ", "", "Heading"] },
  { icon: Heading2, label: "Heading 2", insert: ["\n## ", "", "Heading"] },
  { icon: Link2, label: "Link", insert: ["[", "](url)", "link text"] },
  { icon: Image, label: "Image", insert: ["\n![", "](image-url)", "alt text"] },
  { icon: List, label: "Bullet List", insert: ["\n- ", "", "item"] },
  { icon: Quote, label: "Blockquote", insert: ["\n> ", "", "quote"] },
  { icon: Code, label: "Code", insert: ["\n```\n", "\n```\n", "code"] },
];

export default function ForumToolbar({ textareaRef, onInsert }: ForumToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap pb-3 border-b border-white/[0.06] mb-3">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.label}
            type="button"
            onClick={() => onInsert(tool.insert[0], tool.insert[1], tool.insert[2])}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title={tool.label}
          >
            <Icon size={15} />
          </button>
        );
      })}
      <span className="ml-auto text-[10px] text-slate-600 font-space">Markdown supported</span>
    </div>
  );
}
