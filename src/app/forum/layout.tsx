import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Forum — ${siteConfig.title}`,
  description: "Join the conversation. Share ideas, ask questions, and connect with the community.",
  openGraph: {
    title: `Forum — ${siteConfig.name}`,
    description: "Community forum for discussion, support, and sharing.",
  },
};

export default function ForumLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
