"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { GitBranch, Lock } from "lucide-react";

interface Commit {
  id: string;
  repo: string;
  message: string;
  time: string;
}

export default function CommitHistory() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchGithub() {
      try {
        const res = await fetch("https://api.github.com/users/HaydenDev3/events/public");
        const data = await res.json();
        
        // Filter for PushEvents and map to a readable format
        const pushEvents = data
          .filter((event: any) => event.type === "PushEvent")
          .slice(0, 3) // Get latest 3
          .map((event: any) => ({
            id: event.id,
            repo: event.repo.name.split("/")[1],
            message: event.payload.commits[0]?.message || "Pushed changes",
            time: new Date(event.created_at).toLocaleDateString(),
          }));

        if (pushEvents.length > 0) {
          setCommits(pushEvents);
          setIsLive(true);
        }
      } catch (error) {
        setIsLive(false);
      }
    }
    fetchGithub();
  }, []);

  return (
    <section className="mt-32 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <GitBranch className={isLive ? "text-[#5865F2]" : "text-zinc-600"} />
        <h2 className={`text-2xl font-bold tracking-tighter uppercase italic ${isLive ? "text-white" : "text-zinc-600"}`}>
          System_Logs {isLive ? "[LIVE]" : "[DISABLED]"}
        </h2>
      </div>

      <Card className={`bg-zinc-950/40 border-zinc-800 p-6 transition-opacity duration-500 ${isLive ? "opacity-100" : "opacity-50"}`}>
        {isLive ? (
          <div className="space-y-6">
            {commits.map((commit) => (
              <div key={commit.id} className="flex items-center justify-between text-sm border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{commit.repo}</span>
                  <span className="text-zinc-300 font-mono truncate max-w-[200px] md:max-w-md">{commit.message}</span>
                </div>
                <span className="text-zinc-600 text-xs">{commit.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-700">
            <Lock size={24} className="mb-2 mb-4" />
            <p className="text-xs font-bold uppercase tracking-[0.3em]">Encrypted // Connection Offline</p>
          </div>
        )}
      </Card>
    </section>
  );
}