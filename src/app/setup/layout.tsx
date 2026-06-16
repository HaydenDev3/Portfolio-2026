import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function SetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side guard: if an admin already exists, redirect to login
  // This prevents anyone from accessing the setup page after initial setup
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0) {
      redirect("/auth/login");
    }
  } catch (e) {
    // DB might not be ready yet — allow setup to proceed
    console.error("Setup layout guard check failed:", e);
  }

  return <>{children}</>;
}
