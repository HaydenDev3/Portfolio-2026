import { prisma } from "./db";

async function tryUsername(username: string): Promise<string | null> {
  const taken = await prisma.user.findUnique({ where: { username } });
  return taken ? null : username;
}

export async function generateUsername(name: string): Promise<string> {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  // Extract first and last name
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  // Build candidate bases with separators
  const candidates: string[] = [];

  // firstname.lastname, firstname_lastname, firstname-lastname
  if (first && last && last !== first) {
    candidates.push(`${first}.${last}`);
    candidates.push(`${first}_${last}`);
    candidates.push(`${first}-${last}`);
  }

  // firstname.last.last, etc for multi-word names
  if (parts.length > 2) {
    const rest = parts.slice(1).join("");
    candidates.push(`${first}.${rest}`);
    candidates.push(`${first}_${rest}`);
    candidates.push(`${first}-${rest}`);
  }

  // just firstname
  if (first) {
    candidates.push(first);
  }

  // Sanitize: only keep a-z, 0-9, dots, hyphens, underscores
  const sanitize = (s: string) =>
    s.replace(/[^a-z0-9._-]/g, "").slice(0, 20);

  for (const raw of candidates) {
    const base = sanitize(raw);
    if (!base || base.length < 2) continue;

    // Try as-is
    const result = await tryUsername(base);
    if (result) return result;

    // Try with 2-digit suffix (00-99)
    for (let d = 0; d < 100; d++) {
      const suffixed = `${base}${d.toString().padStart(2, "0")}`.slice(0, 20);
      if (suffixed.length < 3) continue;
      const r = await tryUsername(suffixed);
      if (r) return r;
    }
  }

  // Absolute fallback
  return `user${Math.floor(Math.random() * 9000) + 1000}`;
}
