import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function SetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Strict server-side guard: if admin exists OR DB check fails, deny access.
  // The setup page should NEVER be accessible after initial configuration.
  let adminExists = true;

  try {
    const count = await prisma.user.count({ where: { role: "ADMIN" } });
    adminExists = count > 0;
  } catch {
    // DB unavailable — deny access rather than risk exposing setup
    adminExists = true;
  }

  if (adminExists) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
