"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  label = "Loading...", 
  className = "" 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        {/* Spinning brand ring */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"
          style={{ animationDuration: "0.8s" }}
        />
        {/* Inner subtle glow */}
        <div className="absolute inset-[3px] rounded-full bg-blue-500/10" />
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
      </div>
      {label && (
        <p className={`${textSizes[size]} text-slate-400 font-space tracking-wide`}>
          {label}
        </p>
      )}
    </div>
  );
}
