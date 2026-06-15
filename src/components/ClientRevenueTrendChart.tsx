"use client";

import dynamic from "next/dynamic";

const RevenueTrendChart = dynamic(
  () => import("@/components/DashboardCharts").then((mod) => mod.RevenueTrendChart),
  { ssr: false }
);

export default function ClientRevenueTrendChart({ data }: { data: any[] }) {
  return <RevenueTrendChart data={data} />;
}
