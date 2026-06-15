"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart 
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  invoices: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

const glassTooltipStyle = {
  backgroundColor: "rgba(10, 10, 10, 0.9)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "12px",
  color: "#f1f5f9",
  fontSize: "12px",
  padding: "10px 14px",
  backdropFilter: "blur(16px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export function RevenueTrendChart({ data }: { data: MonthlyData[] }) {
  if (!data.length) return <div className="text-xs text-slate-500 py-8 text-center">No trend data yet.</div>;

  return (
    <div className="h-48 md:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: "rgba(255,255,255,0.04)" }} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={glassTooltipStyle}
            formatter={((value: number) => [`$${(value / 100).toLocaleString()}`, "Revenue"]) as any}
            labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#60a5fa", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProjectsByTierChart({ data }: { data: StatusData[] }) {
  if (!data.length) return <div className="text-xs text-slate-500 py-8 text-center">No project data.</div>;

  return (
    <div className="h-48 md:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.04)" }} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={glassTooltipStyle}
            labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InvoiceStatusPie({ data }: { data: StatusData[] }) {
  if (!data.length) return <div className="text-xs text-slate-500 py-8 text-center">No invoice data.</div>;

  return (
    <div className="h-48 md:h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={glassTooltipStyle}
            formatter={((value: number, name: string) => [value, name]) as any}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
