"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SignupTrendChart({
  data,
}: {
  data: Array<{ date: string; signups: number }>;
}) {
  const ticks = data.filter((_, index) => index % Math.max(1, Math.ceil(data.length / 6)) === 0);

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" vertical={false} />
        <XAxis
          dataKey="date"
          ticks={ticks.map((point) => point.date)}
          tickFormatter={(value: string) => value.slice(5)}
          tick={{ fontSize: 12, fill: "#2A3244" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
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
        <Area
          type="monotone"
          dataKey="signups"
          name="Signups"
          stroke="#FF5A1F"
          strokeWidth={2}
          fill="url(#signupFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
