"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/posthog";

const BLUE = "#3b6ff0";
const NAVY = "#191a2d";
const SLICE_COLORS = ["#3b6ff0", "#ff5a1f", "#191a2d", "#8b96a8", "#2fb67c", "#d93a7a", "#f2b705", "#6b4de6"];

/** Visitors + pageviews per day, across every business. */
export function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="visitors" name="Visitors" stroke={BLUE} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="pageviews" name="Page views" stroke={NAVY} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Pageview → enquiry → booking started → checkout started → booking created, as a horizontal funnel. */
export function FunnelChart({
  data,
}: {
  data: { stage: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill={BLUE} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Businesses created per week, bucketed from Supabase signup dates. */
export function SignupsChart({ data }: { data: { week: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} minTickGap={20} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="New businesses" fill={BLUE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Small donut used for browser / OS / device-type breakdowns. */
export function BreakdownPie({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={1}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
