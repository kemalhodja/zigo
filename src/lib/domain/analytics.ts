export type TimeRange = "7d" | "30d" | "all";

export type MetricSummary = {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
};

export type ChartDataPoint = {
  date: string;
  views: number;
  engagement: number;
};

export type QuizPerformanceData = {
  quizName: string;
  avgScore: number;
  completionRate: number;
};

export type EngagementBreakdownData = {
  name: string;
  value: number;
  fill: string;
};

/**
 * Returns mock analytics data based on the selected time range.
 * In the future, this should fetch real data from Supabase.
 */
export function getAnalyticsData(timeRange: TimeRange, baseMultiplier: number = 1) {
  // Generate random but realistic looking data
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  
  const chartData: ChartDataPoint[] = [];
  let currentViews = 150 * baseMultiplier;
  let currentEngagement = 20 * baseMultiplier;

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    
    // Add some random noise
    currentViews += (Math.random() - 0.4) * 30 * baseMultiplier;
    currentEngagement += (Math.random() - 0.4) * 5 * baseMultiplier;
    
    chartData.push({
      date: d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
      views: Math.max(0, Math.floor(currentViews)),
      engagement: Math.max(0, Math.floor(currentEngagement)),
    });
  }

  const quizPerformance: QuizPerformanceData[] = [
    { quizName: "Matematik - Türev", avgScore: 78, completionRate: 92 },
    { quizName: "Fizik - Dinamik", avgScore: 65, completionRate: 85 },
    { quizName: "Biyoloji - Hücre", avgScore: 88, completionRate: 96 },
    { quizName: "Kimya - Mol", avgScore: 72, completionRate: 78 },
  ];

  const engagementBreakdown: EngagementBreakdownData[] = [
    { name: "Beğeni", value: 65, fill: "#8b5cf6" }, // Violet 500
    { name: "Yorum", value: 20, fill: "#f59e0b" }, // Amber 500
    { name: "Paylaşım", value: 15, fill: "#10b981" }, // Emerald 500
  ];

  const totalViews = chartData.reduce((acc, curr) => acc + curr.views, 0);
  const prevViews = totalViews * (0.8 + Math.random() * 0.4); // Random past comparison
  const viewsChange = ((totalViews - prevViews) / prevViews) * 100;

  const summaryMetrics: MetricSummary[] = [
    {
      label: "Toplam Görüntülenme",
      value: totalViews.toLocaleString("tr-TR"),
      change: `${viewsChange > 0 ? "+" : ""}${viewsChange.toFixed(1)}%`,
      isPositive: viewsChange >= 0,
    },
    {
      label: "Ortalama Soru Başarısı",
      value: "75.8%",
      change: "+2.4%",
      isPositive: true,
    },
    {
      label: "Etkileşim Oranı",
      value: "8.4%",
      change: "-0.5%",
      isPositive: false,
    },
    {
      label: "Aktif Öğrenci",
      value: (142 * baseMultiplier).toLocaleString("tr-TR"),
      change: "+12",
      isPositive: true,
    },
  ];

  return {
    chartData,
    quizPerformance,
    engagementBreakdown,
    summaryMetrics,
  };
}
