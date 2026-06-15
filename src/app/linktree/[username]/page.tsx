import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlatformLabel, getSocialIcon } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import { ExternalLink, Copy } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    website: "🌐", github: "🐙", linkedin: "💼", twitter: "🐦", x: "𝕏",
    youtube: "▶️", instagram: "📷", facebook: "👍", tiktok: "🎵",
    discord: "💬", telegram: "✈️", whatsapp: "💚", email: "✉️", other: "🔗",
  };
  return <span className="text-lg">{icons[platform] || "🔗"}</span>;
}

const PLATFORM_COLORS: Record<string, string> = {
  github: "hover:border-slate-500/40 hover:bg-slate-500/5",
  linkedin: "hover:border-blue-500/40 hover:bg-blue-500/5",
  twitter: "hover:border-sky-500/40 hover:bg-sky-500/5",
  youtube: "hover:border-red-500/40 hover:bg-red-500/5",
  instagram: "hover:border-pink-500/40 hover:bg-pink-500/5",
  discord: "hover:border-indigo-500/40 hover:bg-indigo-500/5",
  email: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
};

export default async function LinktreePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, name: true, displayName: true, username: true,
      image: true, banner: true, bio: true, socialLinks: true, role: true, clientStatus: true,
    },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: username },
      select: {
        id: true, name: true, displayName: true, username: true,
        image: true, banner: true, bio: true, socialLinks: true, role: true, clientStatus: true,
      },
    });
  }

  if (!user) notFound();

  const displayName = user.displayName ?? user.name ?? user.username ?? "User";
  const links: SocialLink[] = Array.isArray(user.socialLinks) ? user.socialLinks as unknown as SocialLink[] : [];

  const projects = user.id ? await prisma.project.findMany({
    where: { clientUserId: user.id },
    select: { id: true, name: true, status: true, liveUrl: true },
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex flex-col relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-500/4 blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full bg-blue-500/4 blur-[120px]" />
      </div>

      {/* Banner */}
      {user.banner && (
        <div className="h-40 md:h-48 w-full relative overflow-hidden">
          <img src={user.banner} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>
      )}

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pb-16">
        {/* Avatar */}
        <div className={`flex justify-center ${user.banner ? "-mt-14" : "mt-12"}`}>
          <div className="w-22 h-22 md:w-24 md:h-24 rounded-full ring-4 ring-[#07070a] bg-gradient-to-br from-[var(--accent,#3b82f6)]/20 to-purple-500/20 overflow-hidden shadow-xl">
            {user.image ? (
              <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl font-bold accent-text">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mt-4 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white font-space tracking-tight">{displayName}</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-space">@{user.username}</p>
          {user.bio && (
            <p className="mt-3 text-sm text-slate-400 leading-relaxed font-space max-w-sm mx-auto">{user.bio}</p>
          )}
        </div>

        {/* Copyable URL */}
        <div className="mt-4 premium-glass-strong rounded-xl border border-white/10 px-4 py-2.5 flex items-center gap-2">
          <span className="flex-1 text-center text-[11px] font-mono text-blue-400 truncate select-all font-space">
            {siteConfig.url}/linktree/{user.username}
          </span>
        </div>

        {/* Links */}
        <div className="mt-8 space-y-2.5 message-enter">
          {links.length === 0 ? (
            <div className="premium-glass-strong rounded-2xl p-8 text-center border border-white/10">
              <p className="text-sm text-slate-500 font-space">No links added yet.</p>
            </div>
          ) : (
            links.map((link, index) => {
              const label = getPlatformLabel(link.platform);
              const shortUrl = link.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
              const hoverColor = PLATFORM_COLORS[link.platform] || "hover:border-white/15 hover:bg-white/5";
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between w-full premium-glass-strong rounded-2xl border border-white/10 px-4 py-3.5 ${hoverColor} transition-all active:scale-[0.98]`}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getSocialIcon(link.platform, "w-4 h-4") || <PlatformIcon platform={link.platform} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate font-space group-hover:accent-text transition-colors">
                        {label || link.platform}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate font-space">{shortUrl}</div>
                    </div>
                  </div>
                  <ExternalLink size={13} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </a>
              );
            })
          )}
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mt-10">
            <div className="text-center mb-4">
              <div className="text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold font-space">Featured Work</div>
            </div>
            <div className="space-y-2">
              {projects.slice(0, 4).map((p) => (
                <div key={p.id} className="premium-glass-strong rounded-xl border border-white/10 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white font-space">{p.name}</div>
                    <span className={`text-[9px] px-1.5 py-px rounded-full font-medium font-space mt-0.5 inline-block ${
                      p.status === "COMPLETE" ? "bg-emerald-500/10 text-emerald-400" :
                      p.status === "BUILD" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>{p.status}</span>
                  </div>
                  {p.liveUrl && (
                    <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] px-2.5 py-1 rounded-lg premium-glass text-blue-400 hover:text-blue-300 transition-all shrink-0">
                      Live ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link href="/forum"
            className="text-xs text-slate-500 hover:text-slate-300 font-space transition-colors">
            View profile &amp; community on {siteConfig.name}
          </Link>
        </div>
        <div className="mt-4 text-center text-[9px] text-slate-700 font-space">
          Powered by {siteConfig.name} · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
