"use client";

import { useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

export default function BillingPortalButton({
  variant = "default",
  label = "Payment Portal",
}: {
  variant?: "default" | "compact";
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal");
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      } else {
        alert("Failed to open billing portal. Please try again.");
      }
    } catch {
      alert("Failed to connect to Stripe.");
    }
    setLoading(false);
  };

  if (variant === "compact") {
    return (
      <button onClick={handleClick} disabled={loading}
        className="text-[10px] px-2.5 py-1.5 rounded-lg premium-glass text-slate-400 hover:text-white transition-all font-space disabled:opacity-50">
        {loading ? "Opening..." : label}
      </button>
    );
  }

  return (
    <button onClick={handleClick} disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-xs md:text-sm font-medium font-space transition-all active:scale-[0.97]">
      <CreditCard size={14} /> {loading ? "Opening..." : label}
    </button>
  );
}
