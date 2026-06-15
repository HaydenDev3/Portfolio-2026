"use client";

import dynamic from "next/dynamic";

const ProjectsByTierChart = dynamic(
  () => import("@/components/DashboardCharts").then((mod) => mod.ProjectsByTierChart),
  { ssr: false }
);

export default function ClientProjectsTierChart({ data }: { data: any[] }) {
  return <ProjectsByTierChart data={data} />;
}
