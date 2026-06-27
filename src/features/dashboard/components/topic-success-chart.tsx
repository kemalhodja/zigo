"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TopicSuccessPoint } from "@/features/dashboard/services/development-dashboard.service";

type TopicSuccessChartProps = {
  data: TopicSuccessPoint[];
  labels: {
    title: string;
    empty: string;
    successLabel: string;
  };
};

export function TopicSuccessChart({ data, labels }: TopicSuccessChartProps) {
  if (data.length === 0) {
    return <p className="mt-3 text-sm font-semibold text-slate-500">{labels.empty}</p>;
  }

  const chartData = data.map((point) => ({
    ...point,
    shortName: point.areaName.length > 14 ? `${point.areaName.slice(0, 12)}…` : point.areaName,
  }));

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} type="number" />
          <YAxis
            dataKey="shortName"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            type="category"
            width={88}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${value}% (${item.payload.attemptCount})`,
              labels.successLabel,
            ]}
            labelFormatter={(_label, payload) => {
              const point = payload?.[0]?.payload as TopicSuccessPoint | undefined;
              return point?.areaName ?? "";
            }}
          />
          <Bar dataKey="successPercent" fill="#06b6d4" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
