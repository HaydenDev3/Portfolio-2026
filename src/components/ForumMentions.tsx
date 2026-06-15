"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MentionUser {
  id: string; username?: string | null; displayName?: string | null; image?: string | null;
}

export default function ForumMentions({ textareaRef, onInsert }: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<MentionUser[]>([]);
  const [show, setShow] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [atPos, setAtPos] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return; }
    const res = await fetch(`/api/mentions?q=${encodeURIComponent(q)}`);
    if (res.ok) { const d = await res.json(); setResults(d.users || []); setSelectedIdx(0); }
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const handleInput = () => {
      const pos = ta.selectionStart;
      const text = ta.value;
      const before = text.slice(0, pos);
      const atIdx = before.lastIndexOf("@");

      // Check if we're inside a word (after the @)
      if (atIdx >= 0 && (atIdx === 0 || /\s/.test(text[atIdx - 1]))) {
        const after = text.slice(atIdx + 1, pos);
        if (after.length <= 20 && !/\s/.test(after) && !/[<>]/.test(after)) {
          setSearch(after);
          setAtPos(atIdx);
          setShow(true);
          fetchUsers(after);
          return;
        }
      }
      setShow(false);
    };

    ta.addEventListener("input", handleInput);
    return () => ta.removeEventListener("input", handleInput);
  }, [textareaRef, fetchUsers]);

  const selectUser = (user: MentionUser) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = ta.value.slice(0, atPos);
    const after = ta.value.slice(ta.selectionStart);
    const mention = `@${user.username || user.displayName || "user"} `;
    ta.value = before + mention + after;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = before.length + mention.length;
    onInsert(ta.value);
    setShow(false);
  };

  if (!show || results.length === 0) return null;

  return (
    <div ref={dropdownRef}
      className="absolute z-50 premium-glass-strong rounded-xl border border-white/10 shadow-2xl p-1.5 w-56"
      style={{ top: -4, left: 0, transform: "translateY(-100%)" }}
    >
      {results.map((user, i) => (
        <button key={user.id} onClick={() => selectUser(user)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-space transition-all ${
            i === selectedIdx ? "accent-bg-subtle accent-text" : "text-slate-300 hover:bg-white/5"
          }`}>
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center text-[7px] font-bold accent-text shrink-0">
            {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" /> : (user.displayName || "U")[0]}
          </div>
          <span className="font-medium">{user.displayName || user.username}</span>
          <span className="text-slate-500">@{user.username}</span>
        </button>
      ))}
    </div>
  );
}
