"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Point {
  date: string;
  total: number;
  learning?: number;
  leetcode?: number;
  github?: number;
}

export function ImprovementChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="card empty-state">
        <p className="text-sm font-medium text-[var(--muted-light)]">No score history yet</p>
        <p>Hit Sync on the dashboard to start tracking progress</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="card chart-container p-5">
      <p className="section-title">Score Trend</p>
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#525252"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#525252"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#737373" }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#fafafa"
            strokeWidth={1.5}
            fill="url(#scoreGrad)"
            name="Total"
          />
        </AreaChart>
      </ResponsiveContainer>

      {data.some((d) => d.learning !== undefined) && (
        <>
          <div className="divider my-5" />
          <p className="section-title">Component Breakdown</p>
          <ResponsiveContainer width="100%" height={180} minWidth={0}>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid #1a1a1a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="learning" stroke="#4ade80" name="Learning" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="leetcode" stroke="#fbbf24" name="LeetCode" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="github" stroke="#60a5fa" name="GitHub" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
