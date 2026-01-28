import SplitText from "@/components/bits/SplitText";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Bot, Zap, Clock, GitBranch } from "lucide-react";
import CommitHistory from "@/components/commit-history";

export default function ProjectsPage() {
  const projects = [
    {
      title: "AJA_MODULAR_BOT",
      description: "A fully modular Discord engine. Design your own experience using a robust plugin system—write your own modules or hot-swap community plugins to build the ultimate utility.",
      tech: ["Node.js", "Discord.js", "Plugin Architecture", "TypeScript"],
      link: "https://github.com/HaydenDev3",
      icon: <Bot className="text-purple-500" size={32} />,
      color: "from-purple-500/20",
      status: "Coming Soon"
    },
    {
      title: "AETHER_SOCIAL",
      description: "Next-gen social media powered by local AI. Integrating Ollama models for intelligent content assistance and privacy-focused AI interactions directly in the feed.",
      tech: ["Next.js", "Ollama AI", "Llama 3", "Supabase"],
      link: "https://github.com/HaydenDev3",
      icon: <Zap className="text-purple-500" size={32} />,
      color: "from-purple-500/20",
      status: "Coming Soon"
    }
  ];

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
      <header className="mb-20">
        <SplitText text="PROJECT_LOG" className="text-5xl md:text-7xl font-black tracking-tighter text-white italic mb-6" />
        <p className="text-zinc-500 uppercase tracking-[0.3em] font-bold text-sm italic">Status: System Operational</p>
      </header>

      {/* PROJECT CARDS */}
      <div className="flex flex-col gap-16">
        {projects.map((project, idx) => (
          <Card key={idx} className="bg-zinc-950/40 border-zinc-800 p-1 group hover:border-zinc-700 transition-all duration-500">
            <div className={`bg-gradient-to-br ${project.color} to-transparent p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center`}>
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-2xl group-hover:rotate-3 transition-transform">
                {project.icon}
              </div>
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase">{project.title}</h3>
                  {project.status === "Coming Soon" && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 flex gap-2">
                      <Clock size={12} /> {project.status}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map(t => <Badge key={t} variant="outline" className="border-zinc-700 text-zinc-500 uppercase text-[10px]">{t}</Badge>)}
                </div>
                <p className="text-zinc-400 text-lg leading-relaxed">{project.description}</p>
                <div className="flex gap-4 pt-4">
                  <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-bold" asChild>
                    <a href={project.link} target="_blank"><Github className="w-4 h-4 mr-2" /> Repo</a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* COMMIT HISTORY SECTION */}
      <CommitHistory />
    </div>
  );
}