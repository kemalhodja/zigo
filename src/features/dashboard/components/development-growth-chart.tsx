"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GrowthCurvePoint } from "@/features/dashboard/services/development-dashboard.service";

type DevelopmentGrowthChartProps = {
  data: GrowthCurvePoint[];
  labels: {
    title: string;
    empty: string;
    scoreLabel: string;
  };
};

export function DevelopmentGrowthChart({ data, labels }: DevelopmentGrowthChartProps) {
  const hasActivity = data.some((point) => point.activityCount > 0);
  if (!hasActivity) {
    return <p className="mt-3 text-sm font-semibold text-slate-500">{labels.empty}</p>;
  }

  const chartData = data.map((point) => ({
    ...point,
    label: point.date.slice(5),
  }));

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`${value}%`, labels.scoreLabel]}
            labelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload as GrowthCurvePoint | undefined;
              return point?.date ?? String(label);
            }}
          />
          <Line
            dataKey="averageScore"
            dot={{ fill: "#7c3aed", r: 3 }}
            stroke="#7c3aed"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
