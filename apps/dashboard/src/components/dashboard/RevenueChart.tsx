"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface DataPoint {
  date: string;
  revenue: number;
  impressions: number;
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A3244" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#2A3244" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#2A3244" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 12, fill: "#2A3244" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="views"
          orientation="right"
          tick={{ fontSize: 12, fill: "#2A3244" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E4E1D8",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Revenue (GHS)"
          stroke="#FF5A1F"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
        <Area
          yAxisId="views"
          type="monotone"
          dataKey="impressions"
          name="Page views"
          stroke="#2A3244"
          strokeWidth={2}
          fill="url(#viewsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
