"use client";

import { ReactNode } from "react";

export default function TrackedLink({
  href, linktreeId, linkIndex, platform, children,
  className,
}: {
  href: string; linktreeId: string; linkIndex: number; platform: string;
  children: ReactNode; className?: string;
}) {
  const handleClick = () => {
    // Fire and forget analytics
    fetch("/api/linktrees/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linktreeId, linkIndex, platform }),
      keepalive: true,
    }).catch(() => {});
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
