const COLORS = [
  ["#3b82f6", "#60a5fa"], // blue
  ["#8b5cf6", "#a78bfa"], // purple
  ["#10b981", "#34d399"], // emerald
  ["#f43f5e", "#fb7185"], // rose
  ["#f59e0b", "#fbbf24"], // amber
  ["#06b6d4", "#22d3ee"], // cyan
  ["#ec4899", "#f472b6"], // pink
  ["#14b8a6", "#2dd4bf"], // teal
  ["#e11d48", "#fb7185"], // red
  ["#a855f7", "#c084fc"], // violet
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const PATTERNS = [
  // Circles in corner
  (cx: number, cy: number, s: number) => `
    <circle cx="${cx}" cy="${cy}" r="${s * 0.35}" fill="rgba(255,255,255,0.15)" />
    <circle cx="${cx + s * 0.3}" cy="${cy - s * 0.2}" r="${s * 0.15}" fill="rgba(255,255,255,0.1)" />
    <circle cx="${cx - s * 0.25}" cy="${cy + s * 0.25}" r="${s * 0.1}" fill="rgba(255,255,255,0.12)" />
    <text x="${cx}" y="${cy + s * 0.08}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700"
          font-size="${s * 0.42}" fill="white" dominant-baseline="central">{INITIALS}</text>
  `,
  // Diagonal
  (cx: number, cy: number, s: number) => `
    <polygon points="${cx - s * 0.4},${cy + s * 0.4} ${cx + s * 0.4},${cy - s * 0.4} ${cx + s * 0.4},${cy + s * 0.4}" fill="rgba(255,255,255,0.08)" />
    <polygon points="${cx - s * 0.3},${cy - s * 0.3} ${cx + s * 0.3},${cy - s * 0.3} ${cx - s * 0.3},${cy + s * 0.3}" fill="rgba(255,255,255,0.06)" />
    <text x="${cx}" y="${cy + s * 0.08}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700"
          font-size="${s * 0.42}" fill="white" dominant-baseline="central">{INITIALS}</text>
  `,
  // Wave
  (cx: number, cy: number, s: number) => `
    <path d="M ${cx - s * 0.4} ${cy} Q ${cx - s * 0.2} ${cy - s * 0.3} ${cx} ${cy} Q ${cx + s * 0.2} ${cy + s * 0.3} ${cx + s * 0.4} ${cy}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="${s * 0.04}" />
    <circle cx="${cx}" cy="${cy + s * 0.15}" r="${s * 0.08}" fill="rgba(255,255,255,0.1)" />
    <text x="${cx}" y="${cy + s * 0.08}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700"
          font-size="${s * 0.42}" fill="white" dominant-baseline="central">{INITIALS}</text>
  `,
  // Dots grid
  (cx: number, cy: number, s: number) => `
    ${[-1, 0, 1].map((dx) => [-1, 0, 1].map((dy) =>
      `<circle cx="${cx + dx * s * 0.2}" cy="${cy + dy * s * 0.2}" r="${s * 0.04}" fill="rgba(255,255,255,0.1)" />`
    ).join("")).join("")}
    <text x="${cx}" y="${cy + s * 0.08}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700"
          font-size="${s * 0.42}" fill="white" dominant-baseline="central">{INITIALS}</text>
  `,
  // Rings
  (cx: number, cy: number, s: number) => `
    <circle cx="${cx}" cy="${cy}" r="${s * 0.3}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="${s * 0.03}" />
    <circle cx="${cx}" cy="${cy}" r="${s * 0.2}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="${s * 0.02}" />
    <circle cx="${cx}" cy="${cy}" r="${s * 0.1}" fill="rgba(255,255,255,0.08)" />
    <text x="${cx}" y="${cy + s * 0.08}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700"
          font-size="${s * 0.42}" fill="white" dominant-baseline="central">{INITIALS}</text>
  `,
  // Sparkle
  (cx: number, cy: number, s: number) => `
    ${[0, 1, 2, 3].map((i) => {
      const angle = (i * Math.PI) / 2;
      const x = cx + Math.cos(angle) * s * 0.3;
      const y = cy + Math.sin(angle) * s * 0.3;
      return `<circle cx="${x}" cy="${y}" r="${s * 0.03}" fill="rgba(255,255,255,0.2)" />`;
    }).join("")}
    <text x="${cx}" y="${cy + s * 0.08}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700"
          font-size="${s * 0.42}" fill="white" dominant-baseline="central">{INITIALS}</text>
  `,
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function generateAvatarSvg(name: string, seed?: string): string {
  const initials = getInitials(name);
  const hash = hashString(seed || name);

  const colorIndex = hash % COLORS.length;
  const patternIndex = Math.floor(hash / COLORS.length) % PATTERNS.length;
  const [color1, color2] = COLORS[colorIndex];

  const size = 128;
  const cx = size / 2;
  const cy = size / 2;

  let body = PATTERNS[patternIndex](cx, cy, size);
  body = body.replace(/\{INITIALS\}/g, initials);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)" />
  ${body}
</svg>`;

  return svg;
}

export function generateAvatarDataUrl(name: string, seed?: string): string {
  const svg = generateAvatarSvg(name, seed);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
