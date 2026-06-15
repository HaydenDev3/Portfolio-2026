import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: `Thank You — ${siteConfig.title}`,
  description: "Your message has been received. I'll get back to you soon.",
};

export default function ThankYouLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
