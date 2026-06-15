"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";

export default function ForumBookmark({ topicId, initial }: { topicId: string; initial?: boolean }) {
  const [bookmarked, setBookmarked] = useState(initial || false);

  const toggle = async () => {
    setBookmarked(!bookmarked);
    const res = await fetch("/api/bookmarks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    if (!res.ok) setBookmarked(bookmarked);
  };

  return (
    <button onClick={toggle} className="flex items-center gap-1 hover:text-zinc-300 transition-colors" title={bookmarked ? "Remove bookmark" : "Bookmark"}>
      <Bookmark size={12} className={bookmarked ? "fill-[var(--accent)] text-[var(--accent)]" : ""} />
    </button>
  );
}
