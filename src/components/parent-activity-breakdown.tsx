"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type ActivityBreakdownData = {
  subject: string;
  minutes: number;
  color: string;
};

type ParentActivityBreakdownProps = {
  data: ActivityBreakdownData[];
};

export function ParentActivityBreakdown({ data }: ParentActivityBreakdownProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const totalMinutes = data.reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4">
      <h3 className="mb-3 text-xs font-black text-slate-700">Puan Dağılımı</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="minutes"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", fontSize: "11px", fontWeight: "bold" }}
                formatter={(value) => [`${value} XP`, "Kazanılan Puan"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[0.65rem] font-black text-slate-800">{totalMinutes}</span>
            <span className="text-[0.5rem] font-bold text-slate-500">XP</span>
          </div>
        </div>
        
        <div className="flex flex-1 flex-col justify-center gap-2">
          {data.map((item) => (
            <div key={item.subject} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[0.7rem] font-bold text-slate-600">{item.subject}</span>
              </div>
              <span className="text-[0.7rem] font-black text-slate-800">{Math.round((item.minutes / totalMinutes) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
