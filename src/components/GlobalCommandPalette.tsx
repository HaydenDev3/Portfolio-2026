"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import CommandPalette from "./CommandPalette";

export default function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Global keyboard shortcut (Cmd/Ctrl + K) - works on mobile too via OS keyboards
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Context-aware actions based on current section
  const isDashboard = pathname?.startsWith("/dashboard");
  const isClient = pathname?.startsWith("/client");
  const isForum = pathname?.startsWith("/forum");

  const contextActions = [];

  if (isDashboard) {
    contextActions.push(
      { id: "new-lead", label: "Create New Lead", icon: "🎯", action: () => window.location.assign("/dashboard/leads") },
      { id: "new-project", label: "Create New Project", icon: "🚀", action: () => window.location.assign("/dashboard/projects") },
      { id: "new-ticket", label: "View Support Tickets", icon: "🎫", action: () => window.location.assign("/dashboard/tickets") },
      { id: "users", label: "Manage Users & Clients", icon: "👥", action: () => window.location.assign("/dashboard/users") }
    );
  }

  if (isClient) {
    contextActions.push(
      { id: "new-support", label: "Open New Support Ticket", icon: "🆘", action: () => window.location.assign("/client/support") },
      { id: "my-projects", label: "View My Projects", icon: "📁", action: () => window.location.assign("/client/projects") },
      { id: "invoices", label: "View Invoices", icon: "💳", action: () => window.location.assign("/client/invoices") },
      { id: "my-profile", label: "Edit My Profile", icon: "👤", action: () => window.location.assign("/client/profile") }
    );
  }

  if (isForum) {
    contextActions.push(
      { id: "new-topic", label: "Start New Forum Topic", icon: "✍️", action: () => window.location.assign("/forum/new") }
    );
  }

  // Always useful cross-app actions
  contextActions.push(
    { id: "public-forum", label: "Public Forum", icon: "🌐", action: () => window.location.assign("/forum") }
  );

  return (
    <CommandPalette
      open={open}
      onClose={() => setOpen(false)}
      forumActions={contextActions}
    />
  );
}
