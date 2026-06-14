import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlatformLabel, getSocialIcon } from "@/lib/utils";

interface SocialLink {
  platform: string;
  url: string;
}

export default async function LinktreePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      displayName: true,
      username: true,
      image: true,
      banner: true,
      bio: true,
      socialLinks: true,
      role: true,
      clientStatus: true,
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = user.displayName || user.name || user.username;
  const links: SocialLink[] = Array.isArray(user.socialLinks) ? user.socialLinks : [];

  const projects = user.id ? await prisma.project.findMany({
    where: { clientUserId: user.id },
    select: { id: true, name: true, status: true },
  }) : [];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Banner */}
      {user.banner && (
        <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${user.banner})` }} />
      )}

      <div className="max-w-md mx-auto w-full px-6 pb-12 -mt-12 relative z-10">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full ring-4 ring-[#050505] bg-blue-500/20 border border-blue-500/30 overflow-hidden">
            {user.image ? (
              <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-3xl font-bold font-space tracking-tight">{displayName}</h1>
          <p className="text-zinc-400 mt-1">@{user.username}</p>
          {user.bio && <p className="mt-3 text-sm text-zinc-300 leading-relaxed font-space">{user.bio}</p>}
        </div>

        {/* Shareable Linktree URL (simple selectable for social copy) */}
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[1px] text-zinc-500 text-center mb-1.5">Your Linktree link — copy for social bios</div>
          <div
            className="glass rounded-xl border border-white/10 px-4 py-2 text-center text-sm font-mono text-blue-400 select-all cursor-pointer active:bg-white/5 transition"
            title="Click to select, then copy"
          >
            https://haydenf.fyi/linktree/{user.username}
          </div>
        </div>

        {/* Links */}
        <div className="mt-10 space-y-3">
          <h2 className="text-xs uppercase tracking-[2px] text-zinc-500 text-center font-space mb-3">Connect with me</h2>

          {links.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 p-8 text-center text-sm text-zinc-400">
              No links added yet.
            </div>
          ) : (
            links.map((link, index) => {
              const label = getPlatformLabel(link.platform);
              const shortUrl = link.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between w-full glass rounded-2xl border border-white/10 px-5 py-4 hover:border-blue-500/40 hover:bg-white/5 transition-all active:scale-[0.985]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getSocialIcon(link.platform, "w-6 h-6")}
                    <span className="text-sm text-zinc-200 truncate font-space group-hover:text-white transition-colors">
                      {label} · {shortUrl}
                    </span>
                  </div>
                  <span className="text-blue-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shrink-0">↗</span>
                </a>
              );
            })
          )}

          {/* Projects linked to this user */}
          {projects.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs uppercase tracking-[2px] text-zinc-500 text-center font-space mb-3">Projects linked to this user</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {projects.map((p: any) => (
                  <span key={p.id} className="text-xs px-3 py-1 glass rounded-xl border border-white/10 text-zinc-300 font-space">
                    {p.name} <span className="text-zinc-500">({p.status})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/forum" 
            className="text-xs text-zinc-500 hover:text-zinc-300 font-space transition-colors"
          >
            View full profile &amp; forum on haydenf.fyi
          </Link>
        </div>
      </div>
    </div>
  );
}
