import { siteConfig } from "./config";

export interface ForumPostShareData {
  title: string;
  content: string;
  userName: string;
  userInitial: string;
  categoryName?: string;
  url: string;
}

export async function generateForumPostBlob(data: ForumPostShareData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;

  await document.fonts.ready;

  const { title, content, userName, userInitial, categoryName = "Forum", url } = data;

  const preview = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~#>|]/g, "")
    .replace(/\n{2,}/g, " ")
    .trim()
    .slice(0, 280);

  const draw = () => {
    const w = 1080;
    const h = 1920;

    // Clean dark background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);

    // Simple top accent bar
    ctx.fillStyle = "rgba(59,130,246,0.15)";
    ctx.fillRect(0, 0, w, 80);

    // User section - simple and clean
    let y = 140;

    // Avatar circle
    ctx.beginPath();
    ctx.arc(w / 2, y, 50, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(59,130,246,0.2)";
    ctx.fill();
    ctx.strokeStyle = "rgba(59,130,246,0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 40px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(userInitial, w / 2, y);

    // User name
    y += 90;
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 36px 'Space Grotesk', sans-serif";
    ctx.fillText(userName, w / 2, y);

    // Category
    y += 40;
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "20px 'Space Grotesk', sans-serif";
    ctx.fillText(categoryName, w / 2, y);

    // Divider
    y += 50;
    ctx.strokeStyle = "rgba(59,130,246,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, y);
    ctx.lineTo(w - 150, y);
    ctx.stroke();

    // Title
    y += 70;
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 44px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";

    // Wrap title (simple)
    const maxW = w - 180;
    const words = title.split(" ");
    let line = "";
    let ty = y;
    const lh = 52;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line, w / 2, ty);
        line = words[i] + " ";
        ty += lh;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, w / 2, ty);

    // Content preview box
    y = ty + 70;
    ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    ctx.fillRect(100, y - 20, w - 200, 380);

    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.font = "22px 'Space Grotesk', sans-serif";
    ctx.textAlign = "left";

    const pWords = preview.split(" ");
    let pLine = "";
    let py = y + 20;
    const pLH = 34;
    const pMax = w - 280;
    for (let i = 0; i < pWords.length && py < y + 340; i++) {
      const test = pLine + pWords[i] + " ";
      if (ctx.measureText(test).width > pMax && i > 0) {
        ctx.fillText(pLine, 140, py);
        pLine = pWords[i] + " ";
        py += pLH;
      } else {
        pLine = test;
      }
    }
    if (pLine) ctx.fillText(pLine, 140, py);

    // Bottom link
    ctx.fillStyle = "#3b82f6";
    ctx.font = "22px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    const shortUrl = url.replace(/^https?:\/\//, "");
    ctx.fillText(shortUrl, w / 2, h - 200);

    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.font = "18px 'Space Grotesk', sans-serif";
    ctx.fillText("haydenf.fyi Forum", w / 2, h - 160);
  };

  draw();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
