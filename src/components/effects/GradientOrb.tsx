"use client";

export default function GradientOrb() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full animate-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full animate-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute top-[40%] right-[20%] w-[30%] aspect-square rounded-full animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
