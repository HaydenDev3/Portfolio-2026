"use client";

import { useState, useCallback } from "react";
import type { ContextMenuAction } from "@/components/ContextMenu";

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuAction[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const show = useCallback((e: React.MouseEvent, items: ContextMenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const hide = useCallback(() => {
    setMenu(null);
  }, []);

  return { menu, show, hide };
}
