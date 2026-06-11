import { siteConfig } from "./config";

export async function generateStoryBlob(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d")!;

  await document.fonts.ready;

  const { name, tagline, url, location, priceRange } = siteConfig;

  const draw = () => {
    const w = 1080;
    const h = 1920;

    /* background */
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#050505");
    grad.addColorStop(0.5, "#0a0a12");
    grad.addColorStop(1, "#050505");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    /* top glow */
    const g1 = ctx.createRadialGradient(w / 2, 300, 0, w / 2, 300, 500);
    g1.addColorStop(0, "rgba(59,130,246,0.12)");
    g1.addColorStop(1, "transparent");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, 800);

    /* bottom glow */
    const g2 = ctx.createRadialGradient(w / 2, h - 300, 0, w / 2, h - 300, 500);
    g2.addColorStop(0, "rgba(59,130,246,0.08)");
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.fillRect(0, h - 800, w, 800);

    /* divider */
    const divY = 820;
    ctx.strokeStyle = "rgba(59,130,246,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, divY);
    ctx.lineTo(w - 120, divY);
    ctx.stroke();

    /* name */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 80px "Space Grotesk", sans-serif`;
    ctx.fillText(name, w / 2, divY + 130);

    /* tagline */
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `36px "Space Grotesk", sans-serif`;
    ctx.fillText(tagline, w / 2, divY + 210);

    /* url */
    ctx.fillStyle = "#3b82f6";
    ctx.font = `28px "Space Grotesk", sans-serif`;
    const urlText = url.replace(/^https?:\/\//, "");
    ctx.fillText(urlText, w / 2, divY + 280);

    /* location + price mini */
    ctx.fillStyle = "rgba(161,161,170,0.5)";
    ctx.font = `20px "Space Grotesk", sans-serif`;
    ctx.fillText(`${location}  ·  ${priceRange}`, w / 2, divY + 350);

    /* bottom text */
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = `18px "Space Grotesk", sans-serif`;
    ctx.fillText("Built with Next.js", w / 2, h - 100);

    /* subtle decorative dots */
    for (let i = 0; i < 3; i++) {
      const cx = [w * 0.25, w * 0.5, w * 0.75][i];
      const cy = h - 60;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59,130,246,0.15)";
      ctx.fill();
    }
  };

  draw();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
