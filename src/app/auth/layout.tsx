import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Sign In — ${siteConfig.title}`,
  description: "Sign in to your dashboard or client portal.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
