import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use /tmp/ on Vercel (only writable directory in serverless)
    const uploadsDir = path.join("/tmp", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = file.name.split(".").pop() ?? "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return URL that goes through our serving endpoint
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
