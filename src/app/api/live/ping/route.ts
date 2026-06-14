import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ACTIVE_TTL_MS = 30_000;

async function geolocateIP(ip: string) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "success") {
      return { lat: data.lat, lng: data.lon, city: data.city, country: data.country };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const existing = await prisma.liveViewer.findUnique({ where: { ip } });
    const now = new Date();

    if (existing) {
      await prisma.liveViewer.update({
        where: { ip },
        data: { lastSeen: now },
      });
    } else {
      const geo = await geolocateIP(ip);
      if (geo) {
        await prisma.liveViewer.create({
          data: {
            ip,
            lat: geo.lat,
            lng: geo.lng,
            city: geo.city ?? null,
            country: geo.country ?? null,
            lastSeen: now,
          },
        });
      }
    }

    const cutoff = new Date(now.getTime() - ACTIVE_TTL_MS);
    const active = await prisma.liveViewer.findMany({
      where: { lastSeen: { gte: cutoff } },
      select: { lat: true, lng: true, city: true, country: true },
    });

    const count = await prisma.liveViewer.count({
      where: { lastSeen: { gte: cutoff } },
    });

    return NextResponse.json({ viewers: active, count });
  } catch {
    return NextResponse.json({ viewers: [], count: 0 });
  }
}
