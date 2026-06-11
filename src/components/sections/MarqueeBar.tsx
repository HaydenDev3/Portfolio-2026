export default function MarqueeBar() {
  const items = [
    "Next.js", "TypeScript", "React", "Tailwind CSS",
    "Responsive Design", "SEO", "Performance", "Custom CMS",
    "Next.js", "TypeScript", "React", "Tailwind CSS",
    "Responsive Design", "SEO", "Performance", "Custom CMS",
  ];

  return (
    <div className="py-8 border-t border-white/[0.03] border-b border-white/[0.03] overflow-hidden">
      <div className="marquee">
        <div className="marquee-inner">
          {items.map((item, i) => (
            <span
              key={`a-${i}`}
              className="text-[10px] md:text-xs text-zinc-700 uppercase tracking-[0.3em] font-medium whitespace-nowrap"
            >
              {item}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand/30 ml-6" />
            </span>
          ))}
        </div>
        <div className="marquee-inner" aria-hidden>
          {items.map((item, i) => (
            <span
              key={`b-${i}`}
              className="text-[10px] md:text-xs text-zinc-700 uppercase tracking-[0.3em] font-medium whitespace-nowrap"
            >
              {item}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand/30 ml-6" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
