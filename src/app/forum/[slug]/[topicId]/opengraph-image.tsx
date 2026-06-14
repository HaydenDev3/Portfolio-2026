import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~#>|]/g, "")
    .replace(/\n{2,}/g, " ")
    .trim()
    .slice(0, 240);
}

export default async function Image({
  params,
}: {
  params: { slug: string; topicId: string };
}) {
  // Support both id and slug for shareable pretty URLs
  let topic = await prisma.forumTopic.findUnique({
    where: { id: params.topicId },
    include: {
      user: { select: { displayName: true, username: true } },
      category: { select: { name: true, icon: true } },
    },
  });
  if (!topic) {
    topic = await prisma.forumTopic.findUnique({
      where: { slug: params.topicId },
      include: {
        user: { select: { displayName: true, username: true } },
        category: { select: { name: true, icon: true } },
      },
    });
  }

  const displayName = topic?.user?.displayName ?? topic?.user?.username ?? "Anonymous";
  const categoryName = topic?.category?.name ?? "Forum";
  const categoryIcon = topic?.category?.icon ?? "💬";
  const title = topic?.title ?? "Post not found";
  const preview = topic?.content ? stripMarkdown(topic.content) : "";
  const site = "haydenf.fyi";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "56px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Noise overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.035,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Gradient orb */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "auto",
          }}
        >
          <span style={{ fontSize: "20px" }}>{categoryIcon}</span>
          <span
            style={{
              color: "rgba(148,163,184,0.8)",
              fontSize: "16px",
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            {categoryName}
          </span>
          <span style={{ color: "rgba(148,163,184,0.3)", fontSize: "16px" }}>/</span>
          <span
            style={{
              color: "rgba(148,163,184,0.5)",
              fontSize: "14px",
            }}
          >
            {site}
          </span>
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <h1
            style={{
              color: "#f1f5f9",
              fontSize: "42px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: preview ? "16px" : "0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </h1>
          {preview && (
            <p
              style={{
                color: "rgba(148,163,184,0.7)",
                fontSize: "20px",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {preview}
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(148,163,184,0.08)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(59,130,246,0.2)",
              border: "1px solid rgba(59,130,246,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60a5fa",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span
            style={{
              color: "rgba(241,245,249,0.7)",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            {displayName}
          </span>
          <span style={{ color: "rgba(148,163,184,0.3)", fontSize: "14px" }}>
            · {new Date(topic?.createdAt ?? Date.now()).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <div style={{ marginLeft: "auto" }}>
            <span
              style={{
                color: "rgba(59,130,246,0.6)",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              haydenf.fyi
            </span>
          </div>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
