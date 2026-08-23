"use client";

import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ParentChartData = {
  day: string;
  minutes: number;
  quizzes: number;
};

type ParentChartProps = {
  data: ParentChartData[];
};

export function ParentChart({ data }: ParentChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm font-bold text-slate-400">Veri bulunamadı.</div>;
  }

  return (
    <div className="mt-4 h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false}
            dy={10}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold", fontSize: "12px", color: "#334155" }}
            formatter={(value, name) => {
              if (name === "minutes") return [`${value} XP`, "Kazanılan Puan"];
              if (name === "quizzes") return [`${value} Quiz`, "Tamamlanan Quiz"];
              return [value, name];
            }}
            labelStyle={{ color: "#0f172a", marginBottom: "4px" }}
          />
          
          <Bar 
            yAxisId="right"
            dataKey="quizzes" 
            name="quizzes"
            fill="#e2e8f0" 
            radius={[4, 4, 0, 0]} 
            barSize={32}
            animationDuration={1500}
            animationEasing="ease-out"
          />

          <Line 
            yAxisId="left"
            type="monotone"
            dataKey="minutes" 
            name="minutes"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
