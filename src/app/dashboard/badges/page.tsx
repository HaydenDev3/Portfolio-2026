"use client";

import { useState, useEffect } from "react";

export default function BadgesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function fetchUsers() {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const clients = await res.json();
      setUsers(clients.filter((c: any) => c.userId));
    }
    setLoading(false);
  }

  async function toggleBadge(userId: string, badge: string) {
    setMessage("");
    const res = await fetch("/api/user/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, badge }),
    });
    const data = await res.json();
    setMessage(`${badge}: ${data.message}`);
    setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-8 font-space">Badge Manager</h1>

      {message && (
        <div className="glass p-3 rounded-xl border border-blue-500/20 text-sm text-blue-400 mb-4 font-space">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 font-space">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500 font-space">No users with accounts yet.</p>
      ) : (
        <div className="glass rounded-xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-medium font-space">User</th>
                <th className="text-left p-4 font-medium font-space">Email</th>
                <th className="text-center p-4 font-medium font-space">ADMIN</th>
                <th className="text-center p-4 font-medium font-space">VERIFIED</th>
                <th className="text-center p-4 font-medium font-space">PRO</th>
                <th className="text-center p-4 font-medium font-space">EARLY</th>
              </tr>
            </thead>
            <tbody>
              {users.map((client: any) => (
                <UserBadgeRow
                  key={client.userId}
                  client={client}
                  onToggle={toggleBadge}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserBadgeRow({
  client,
  onToggle,
}: {
  client: any;
  onToggle: (userId: string, badge: string) => void;
}) {
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    async function fetchBadges() {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges?.map((b: any) => b.badge) ?? []);
      } else {
        setBadges([]);
      }
    }
    if (client.userId) fetchBadges();
  }, [client.userId]);

  const allBadges = ["ADMIN", "VERIFIED", "PRO", "EARLY_SUPPORTER"];

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="p-4 text-white font-medium font-space">
        {client.user?.displayName ?? client.name}
      </td>
      <td className="p-4 text-slate-400 font-space">{client.email}</td>
      {allBadges.map((badge) => (
        <td key={badge} className="p-4 text-center">
          <button
            onClick={() => onToggle(client.userId, badge)}
            className={`text-xs px-3 py-1 rounded-full border font-semibold font-space transition-all ${
              badges.includes(badge)
                ? badge === "ADMIN"
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : badge === "VERIFIED"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : badge === "PRO"
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-transparent text-slate-600 border-slate-700 hover:border-slate-500"
            }`}
          >
            {badges.includes(badge) ? (badge === "VERIFIED" ? "✓" : badge) : "+"}
          </button>
        </td>
      ))}
    </tr>
  );
}
