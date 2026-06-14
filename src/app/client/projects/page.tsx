import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DISCOVERY: "Discovery",
  DESIGN: "Design",
  BUILD: "Build",
  LAUNCH: "Launch",
  COMPLETE: "Complete",
};

const STATUS_COLORS: Record<string, string> = {
  DISCOVERY: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  DESIGN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  BUILD: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  LAUNCH: "bg-green-500/10 text-green-400 border-green-500/20",
  COMPLETE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default async function ClientProjects() {
  const session = await auth();
  const email = session?.user?.email ?? "";

  const client = await prisma.client.findUnique({
    where: { email },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-8">Projects</h1>

      {!client || client.projects.length === 0 ? (
        <p className="text-slate-500">No projects yet.</p>
      ) : (
        <div className="grid gap-4">
          {client.projects.map((p) => (
            <Link
              key={p.id}
              href={`/client/projects/${p.id}`}
              className="glass p-6 rounded-xl border border-white/10 block hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{p.name}</h2>
                  <p className="text-sm text-slate-400">
                    {p.tier} — ${(p.price / 100).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full border ${
                    STATUS_COLORS[p.status]
                  }`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
              {p.description && (
                <p className="text-sm text-slate-400">{p.description}</p>
              )}
              {p.liveUrl && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mt-1"
                >
                  Visit live site ↗
                </a>
              )}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  {["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"].map(
                    (step, i) => (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            ["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"].indexOf(
                              p.status
                            ) >= i
                              ? "bg-blue-500"
                              : "bg-slate-700"
                          }`}
                        />
                        {i < 4 && (
                          <div
                            className={`h-0.5 flex-1 ${
                              ["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"].indexOf(
                                p.status
                              ) > i
                                ? "bg-blue-500/50"
                                : "bg-slate-700"
                            }`}
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Discovery</span>
                  <span>Design</span>
                  <span>Build</span>
                  <span>Launch</span>
                  <span>Done</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
