import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Linktree — ${siteConfig.title}`,
  description: "Browse shared links and social profiles.",
};

export default function LinktreeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
