import React, { useEffect, useState } from "react";
import { useGetUnivariateAnalysis } from "@workspace/api-client-react";
import DataTable from "@/components/analytics/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SmartLoading from "@/components/ui/smart-loading";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "https://eda-xqob.onrender.com";

type Props = { datasetId: string };

type GroupByResponse = {
  group_by: string;
  metric: string;
  aggregation: string;
  data: { label: string; value: number }[];
};

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "12px",
    color: "#f9fafb",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
  },
  labelStyle: { color: "#ffffff", fontWeight: 600, marginBottom: "6px" },
  itemStyle: { color: "#e5e7eb", fontSize: "13px" },
  cursor: { stroke: "#9ca3af", strokeDasharray: "4 4" },
};

const PIE_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#595957",
];

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export default function BusinessAnalytics({ datasetId }: Props) {
  const [groupBy, setGroupBy] = useState("");
  const [rootGroupBy, setRootGroupBy] = useState("");
  const [metric, setMetric] = useState("");
  const [aggregation, setAggregation] = useState("sum");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [showForecast, setShowForecast] = useState(true);
  const [selectedYear, setSelectedYear] =useState("all");
  const [data, setData] = useState<GroupByResponse | null>(null);
  const [drillHistory, setDrillHistory] = useState<{ column: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const isYearMode =selectedYear !== "all";

  const totalValue = data?.data.reduce((sum, row) => sum + row.value, 0) || 0;
  const averageValue = data?.data.length ? totalValue / data.data.length : 0;
  const topEntry = data?.data.length
    ? data.data.reduce((max, row) => (row.value > max.value ? row : max))
    : null;

  const pieData = (() => {
    if (!data?.data) return [];
    const sorted = [...data.data];
    if (sorted.length <= 8) return sorted.map((row) => ({ name: row.label, value: row.value }));
    const top = sorted.slice(0, 8);
    const othersValue = sorted.slice(8).reduce((sum, row) => sum + row.value, 0);
    return [
      ...top.map((row) => ({ name: row.label, value: row.value })),
      { name: "Others", value: othersValue },
    ];
  })();

  const forecastData = (() => {
    if (!data?.data?.length) return [];
    const base = data.data.map((d) => ({ label: d.label, value: d.value, forecast: null }));
    if (base.length < 2) return base;
    const last = base[base.length - 1].value;
    const prev = base[base.length - 2].value;
    const trend = last - prev;
    const future = [];
    for (let i = 1; i <= 3; i++) {
      future.push({ label: `Forecast ${i}`, value: null, forecast: last + trend * i });
    }
    return [...base, ...future];
  })();

  const insights = (() => {
    if (!data?.data?.length) return [];
    const total = data.data.reduce((sum, row) => sum + row.value, 0);
    const sorted = [...data.data].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const topPercent = ((top.value / total) * 100).toFixed(1);
    const top3 = sorted.slice(0, 3).reduce((sum, row) => sum + row.value, 0);
    const top3Percent = ((top3 / total) * 100).toFixed(1);
    const bottom = sorted[sorted.length - 1];
    return [
      `${top.label} contributes ${topPercent}% of total value.`,
      `Top 3 categories contribute ${top3Percent}% of total distribution.`,
      `${bottom.label} has the lowest contribution.`,
      `${data.group_by} analysis contains ${data.data.length} categories.`,
    ];
  })();

  const { data: univariateData } = useGetUnivariateAnalysis(datasetId);

  const numericColumns = univariateData?.numeric.map((n) => n.column) || [];
  const categoricalColumns = univariateData?.categorical.map((c) => c.column) || [];
  const groupableColumns = [
    ...categoricalColumns.filter(
      (col) => col.includes("_month") || col.includes("_year") || col.includes("_quarter")
    ),
    ...categoricalColumns.filter(
      (col) => !col.includes("_month") && !col.includes("_year") && !col.includes("_quarter")
    ),
  ];
  const availableYears =

    univariateData?.categorical
      ?.find(
        (c) =>
          c.column ===
          "Posting Date_year"
      )
      ?.top_values
      ?.map((v) => String(v.value))
      ?.filter((v) =>
        /^\d{4}$/.test(v)
      )
      ?.sort()

    || [];

  useEffect(() => {
    if (groupableColumns.length > 0 && !groupBy) {
      setGroupBy(groupableColumns[0]);
      setRootGroupBy(groupableColumns[0]);
    }
    if (numericColumns.length > 0 && !metric) {
      setMetric(numericColumns[0]);
    }
  }, [groupableColumns, numericColumns, groupBy, metric]);

  useEffect(() => {

    if (
      selectedYear !== "all" &&
      groupableColumns.includes(
        "Posting Date_month"
      )
    ) {

      setGroupBy(
        "Posting Date_month"
      );

      setDrillHistory([
        {
          column: "Posting Date_year",
          value: selectedYear,
        },
      ]);

    }

  }, [selectedYear]);

  function exportCSV() {
    if (!data?.data?.length) return;
    const generatedAt = new Date().toLocaleString();
    const metadata = [
      ["Generated From", "EDAFlow Analytics Platform"],
      ["Website", "https://edaflow.vercel.app"],
      ["Generated At", generatedAt],
      [],
    ];
    const headers = [data.group_by, data.metric];
    const rows = data.data.map((row) => [row.label, row.value]);
    const csvContent = [
      ...metadata.map((r) => r.join(",")),
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EDAFlow_${data.group_by}_${data.metric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const DRILL_HIERARCHY: Record<string, string> = {
    "Cost Center Name": "Posting Date_month",
    "Posting Date_year": "Posting Date_month",
    "Posting Date_month": "Posting Date",
  };

  function handleDrillDown(label: string) {
    if (!groupBy) return;
    setDrillHistory((prev) => [...prev, { column: groupBy, value: label }]);
    const nextLevel = DRILL_HIERARCHY[groupBy];
    if (nextLevel) setGroupBy(nextLevel);
  }

  async function fetchData() {
    if (!groupBy || !metric) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ group_by: groupBy, metric, aggregation });
      if (drillHistory.length > 0) {
        params.append("filter_columns", drillHistory.map((d) => d.column).join(","));
        params.append("filter_values", drillHistory.map((d) => d.value).join(","));
      }
      const response = await fetch(`${API_BASE}/api/datasets/${datasetId}/groupby?${params}`);
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [groupBy, metric, aggregation]);

  if (loading || !univariateData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-2 w-48 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse rounded-full w-2/3" />
        </div>
        <SmartLoading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Value", value: totalValue.toLocaleString() },
          {
            label: "Average Value",
            value: averageValue.toLocaleString(undefined, { maximumFractionDigits: 2 }),
          },
          { label: "Top Category", value: topEntry?.label || "-", truncate: true },
          { label: "Top Value", value: topEntry?.value.toLocaleString() || "-" },
        ].map(({ label, value, truncate }) => (
          <Card
            key={label}
            className="border-border/50 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(224,184,75,0.08)] hover:-translate-y-1"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${truncate ? "truncate text-lg" : ""}`}>
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={groupBy}
          onValueChange={(value) => {
            setGroupBy(value);
            setRootGroupBy(value);
            setDrillHistory([]);
          }}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            {groupableColumns.map((col) => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Metric" />
          </SelectTrigger>
          <SelectContent>
            {numericColumns.map((col) => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={aggregation} onValueChange={setAggregation}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Aggregation" />
          </SelectTrigger>
          <SelectContent>
            {["sum", "mean", "max", "min", "count"].map((a) => (
              <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
        >

          <SelectTrigger className="w-[180px]">

            <SelectValue placeholder="Select Year" />

          </SelectTrigger>

          <SelectContent>

            <SelectItem value="all">
              All Years
            </SelectItem>

            {availableYears.map((year) => (

              <SelectItem
                key={year}
                value={year}
              >

                {year}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

      </div>

      {/* CHART TYPE */}
      <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "line")}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Chart Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bar">Bar Chart</SelectItem>
          <SelectItem value="line">Line Chart</SelectItem>
        </SelectContent>
      </Select>

      {/* DRILL BREADCRUMB */}
      {drillHistory.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setDrillHistory([]); setGroupBy(rootGroupBy); }}
          >
            All Data
          </Button>
          {drillHistory.map((item, index) => (
            <React.Fragment key={index}>
              <span className="text-muted-foreground">→</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDrillHistory(drillHistory.slice(0, index + 1))}
              >
                {item.value}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* CHARTS */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedYear === "all"? "Business Analytics": `${selectedYear} Monthly Trend Analysis`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* BAR / LINE */}
            <div className="h-[560px] border border-border/50 rounded-2xl bg-card/40 backdrop-blur-sm p-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart
                    data={data?.data || []}
                    onClick={(state: any) => { if (state?.activeLabel) handleDrillDown(state.activeLabel); }}
                    margin={{ top: 0, right: 10, left: 0, bottom: 60 }}
                    barCategoryGap="8%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" type="category" angle={-45} textAnchor="end" interval={0} height={120} fontSize={11} />
                    <YAxis tickFormatter={formatCompactNumber} width={70} tick={{ fontSize: 12 }} domain={[0, "dataMax"]} padding={{ top: 0, bottom: 0 }} />
                    <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCompactNumber(value)} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                ) : (
                  <LineChart
                    data={showForecast ? forecastData : data?.data || []}
                    margin={{ top: 0, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={120} fontSize={11} />
                    <YAxis tickFormatter={formatCompactNumber} width={80} tick={{ fontSize: 12 }} />
                    <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCompactNumber(value)} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    {showForecast && (
                      <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={3} strokeDasharray="8 6" dot={{ r: 4 }} />
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* PIE */}
            <div className="h-[560px] border border-border/50 rounded-2xl bg-card/40 backdrop-blur-sm p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    onClick={(entry: any) => { if (entry?.name) handleDrillDown(entry.name); }}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    innerRadius={70}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCompactNumber(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        </CardContent>
      </Card>

      <Button
        variant={showForecast ? "default" : "outline"}
        onClick={() => setShowForecast(!showForecast)}
      >
        {showForecast ? "Hide Forecast" : "Show Forecast"}
      </Button>

      {/* DATA TABLE */}
      <Card>
        <CardHeader><CardTitle>Underlying Data</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[data?.group_by || "Category", data?.metric || "Value"]}
            rows={data?.data.map((row) => ({
              [data.group_by]: row.label,
              [data.metric]: row.value,
            })) || []}
          />
        </CardContent>
      </Card>

      <Button onClick={exportCSV}>Export CSV</Button>

      {/* INSIGHTS */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(224,184,75,0.08)] hover:-translate-y-1">
        <CardHeader><CardTitle>Business Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/40 p-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}