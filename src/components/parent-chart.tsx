"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ParentChartProps = {
  data: {
    day: string;
    xp: number;
  }[];
};

export function ParentChart({ data }: ParentChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-sm font-bold text-slate-400">Veri bulunamadı.</div>;
  }

  return (
    <div className="h-40 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: "transparent" }}
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontWeight: "bold", fontSize: "12px", color: "#334155" }}
            itemStyle={{ color: "#4f46e5", fontWeight: "black" }}
            formatter={(value: any) => [`${value} XP`, "Kazanılan"]}
          />
          <Bar 
            dataKey="xp" 
            fill="#4f46e5" 
            radius={[4, 4, 4, 4]} 
            barSize={24}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
