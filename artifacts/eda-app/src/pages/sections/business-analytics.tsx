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

// Full month label map – covers both plain numbers AND "YYYY-MM" format
const MONTH_NAMES: Record<string, string> = {
  "1": "January",  "01": "January",
  "2": "February", "02": "February",
  "3": "March",    "03": "March",
  "4": "April",    "04": "April",
  "5": "May",      "05": "May",
  "6": "June",     "06": "June",
  "7": "July",     "07": "July",
  "8": "August",   "08": "August",
  "9": "September","09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

function labelForMonth(raw: string): string {
  // "2025-04" → "April 2025"
  const yyyyMM = raw.match(/^(\d{4})-(\d{2})$/);
  if (yyyyMM) {
    return `${MONTH_NAMES[yyyyMM[2]] ?? yyyyMM[2]} ${yyyyMM[1]}`;
  }
  return MONTH_NAMES[raw] ?? raw;
}

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

  // ── Year / Month filter ────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  // These come from a dedicated fetch so they work regardless of group_by
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  // ──────────────────────────────────────────────────────────────────────────

  const [data, setData] = useState<GroupByResponse | null>(null);
  const [drillHistory, setDrillHistory] = useState<{ column: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const totalValue = data?.data.reduce((sum, row) => sum + row.value, 0) || 0;
  const averageValue = data?.data.length ? totalValue / data.data.length : 0;
  const topEntry = data?.data.length
    ? data.data.reduce((max, row) => (row.value > max.value ? row : max))
    : null;

  const pieData = (() => {
    if (!data?.data) return [];
    const sorted = [...data.data];
    if (sorted.length <= 8) return sorted.map((row) => ({ name: row.label, value: row.value, breakdown: null as { name: string; value: number }[] | null }));
    const top = sorted.slice(0, 8);
    const othersItems = sorted.slice(8);
    const othersValue = othersItems.reduce((sum, row) => sum + row.value, 0);
    return [
      ...top.map((row) => ({ name: row.label, value: row.value, breakdown: null as { name: string; value: number }[] | null })),
      {
        name: "Others",
        value: othersValue,
        breakdown: othersItems.map((row) => ({ name: row.label, value: row.value })),
      },
    ];
  })();

  const forecastData = (() => {
    if (!data?.data?.length) return [];
    const base = data.data.map((d) => ({ label: d.label, value: d.value, forecast: null as number | null }));
    if (base.length < 2) return base;
    const last = base[base.length - 1].value;
    const prev = base[base.length - 2].value;
    const trend = last - prev;
    const future = [];
    for (let i = 1; i <= 3; i++) {
      future.push({ label: `Forecast ${i}`, value: null as number | null, forecast: last + trend * i });
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

  // ── Detect year/month columns across BOTH numeric and categorical ──────────
  // Year is often numeric (int64) so check numericColumns too
  const yearColumn =
    [...categoricalColumns, ...numericColumns].find((col) =>
      col.toLowerCase() === "year" || col.toLowerCase().endsWith("_year")
    );

  // Month column – look for "month" in name; prefers categorical (must be before metricColumns)
  const monthColumn =
    categoricalColumns.find((col) =>
      col.toLowerCase() === "month" || col.toLowerCase().endsWith("_month")
    ) ??
    numericColumns.find((col) =>
      col.toLowerCase() === "month" || col.toLowerCase().endsWith("_month")
    );

  // ── Exclude year/date-like integer columns from the metric dropdown ────────
  // Year is int64 in this dataset – grouping it by itself breaks the year fetch.
  const DATE_LIKE_PATTERN = /^(year|month|quarter|week|day|id|date)$/i;
  const metricColumns = numericColumns.filter(
    (col) =>
      !DATE_LIKE_PATTERN.test(col.trim()) &&
      col !== yearColumn &&
      col !== monthColumn
  );

  const groupableColumns = [
    ...categoricalColumns.filter(
      (col) => col.includes("_month") || col.includes("_year") || col.includes("_quarter")
    ),
    ...categoricalColumns.filter(
      (col) => !col.includes("_month") && !col.includes("_year") && !col.includes("_quarter")
    ),
  ];

  // ── Initialise defaults once columns resolve ───────────────────────────────
  useEffect(() => {
    if (groupableColumns.length > 0 && !groupBy) {
      // Prefer month column for initial view (richer breakdown)
      const initial =
        groupableColumns.find((col) => col.toLowerCase().includes("month")) ??
        groupableColumns[0];
      setGroupBy(initial);
      setRootGroupBy(initial);
    }
    if (metricColumns.length > 0 && !metric) {
      setMetric(metricColumns[0]);
    }
  }, [groupableColumns.join(","), metricColumns.join(",")]);

  // ── Fetch distinct year values (works even when Year is numeric) ───────────
  useEffect(() => {
    if (!yearColumn || !metric) return;
    const fetchYears = async () => {
      try {
        const params = new URLSearchParams({ group_by: yearColumn, metric, aggregation });
        const res = await fetch(`${API_BASE}/api/datasets/${datasetId}/groupby?${params}`);
        const json: GroupByResponse = await res.json();
        const years = json.data
          .map((d) => {
            // API returns "2025.0" for integer years stored as float – normalize to "2025"
            const raw = String(d.label).trim();
            return raw.replace(/\.0+$/, "");
          })
          .filter((v) => /^\d{4}$/.test(v))
          .sort((a, b) => Number(a) - Number(b));
        setAvailableYears(years);
      } catch (err) {
        console.error("Failed to fetch years", err);
      }
    };
    fetchYears();
  }, [yearColumn, metric, aggregation, datasetId]);

  // ── Fetch distinct month values filtered by the chosen year ───────────────
  useEffect(() => {
    if (!monthColumn || !metric) return;

    const fetchMonths = async () => {
      try {
        const params = new URLSearchParams({ group_by: monthColumn, metric, aggregation });
        // Filter by selected year so only months belonging to that year show
        if (selectedYear !== "all" && yearColumn) {
          params.append("filter_columns", yearColumn);
          params.append("filter_values", selectedYear);
        }
        const res = await fetch(`${API_BASE}/api/datasets/${datasetId}/groupby?${params}`);
        const json: GroupByResponse = await res.json();
        // Sort chronologically
        const months = json.data
          .map((d) => String(d.label).trim())
          .sort((a, b) => {
            // Handle "YYYY-MM" format
            const toNum = (s: string) => {
              const m = s.match(/^(\d{4})-(\d{2})$/);
              return m ? Number(m[1]) * 100 + Number(m[2]) : Number(s);
            };
            return toNum(a) - toNum(b);
          });
        setAvailableMonths(months);
      } catch (err) {
        console.error("Failed to fetch months", err);
      }
    };
    fetchMonths();
  }, [monthColumn, yearColumn, selectedYear, metric, aggregation, datasetId]);

  // ── Reset month when year changes ─────────────────────────────────────────
  useEffect(() => {
    setSelectedMonth("all");
  }, [selectedYear]);

  // ── Reset drill history when date filters change ───────────────────────────
  useEffect(() => {
    setDrillHistory([]);
  }, [selectedYear, selectedMonth]);

  // ── Build filter params merging date filters + drill history ──────────────
  function buildFilterParams(): { columns: string[]; values: string[] } {
    const columns: string[] = [];
    const values: string[] = [];

    if (selectedYear !== "all" && yearColumn) {
      columns.push(yearColumn);
      // Backend filters on plain integer string e.g. "2025"
      values.push(selectedYear);
    }
    if (selectedMonth !== "all" && monthColumn) {
      columns.push(monthColumn);
      values.push(selectedMonth);
    }
    // Manual drill-down on top of date filters
    drillHistory.forEach((d) => {
      columns.push(d.column);
      values.push(d.value);
    });

    return { columns, values };
  }

  async function fetchData() {
    if (!groupBy || !metric) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ group_by: groupBy, metric, aggregation });
      const { columns, values } = buildFilterParams();
      if (columns.length > 0) {
        params.append("filter_columns", columns.join(","));
        params.append("filter_values", values.join(","));
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
  }, [groupBy, metric, aggregation, selectedYear, selectedMonth, drillHistory.length]);

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
    "Cost Center Name": "Month",
    "Year": "Month",
    "Month": "Posting Date",
  };

  function handleDrillDown(label: string) {
    if (!groupBy) return;
    setDrillHistory((prev) => [...prev, { column: groupBy, value: label }]);
    const nextLevel = DRILL_HIERARCHY[groupBy];
    if (nextLevel) setGroupBy(nextLevel);
  }

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

  // ── Active filter label for badge + chart title ────────────────────────────
  const activePeriodLabel = (() => {
    const parts: string[] = [];
    if (selectedYear !== "all") parts.push(selectedYear);
    if (selectedMonth !== "all") parts.push(labelForMonth(selectedMonth));
    return parts.length > 0 ? parts.join(" – ") : null;
  })();

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
      <div className="flex flex-wrap gap-4 items-end">

        {/* Group By */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium pl-1">Group By</span>
          <Select
            value={groupBy}
            onValueChange={(value) => {
              setGroupBy(value);
              setRootGroupBy(value);
              setDrillHistory([]);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              {groupableColumns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium pl-1">Metric</span>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              {metricColumns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aggregation */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium pl-1">Aggregation</span>
          <Select value={aggregation} onValueChange={setAggregation}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Aggregation" />
            </SelectTrigger>
            <SelectContent>
              {["sum", "mean", "max", "min", "count"].map((a) => (
                <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Year filter ── */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium pl-1">Year</span>
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Month filter (available for all years OR filtered by year) ── */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium pl-1">
            Month {selectedYear === "all" ? "(select year first)" : ""}
          </span>
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
            disabled={availableMonths.length === 0}
          >
            <SelectTrigger
              className={`w-[180px] ${availableMonths.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>{labelForMonth(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters button – only visible when filters are active */}
        {(selectedYear !== "all" || selectedMonth !== "all") && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-transparent pl-1 select-none">Clear</span>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => { setSelectedYear("all"); setSelectedMonth("all"); }}
            >
              ✕ Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Active filter badge */}
      {activePeriodLabel && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Showing: {activePeriodLabel}
          </span>
        </div>
      )}

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
            {activePeriodLabel ? `${activePeriodLabel} — Analytics` : "Business Analytics"}
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
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const entry = payload[0].payload;
                      const isOthers = entry.name === "Others" && entry.breakdown?.length;
                      return (
                        <div style={{
                          backgroundColor: "#111827",
                          border: "1px solid #374151",
                          borderRadius: "12px",
                          padding: "12px 16px",
                          color: "#f9fafb",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                          maxWidth: "260px",
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: isOthers ? "8px" : "2px", color: "#ffffff" }}>
                            {entry.name}
                          </p>
                          <p style={{ color: "#e5e7eb", fontSize: "13px", marginBottom: isOthers ? "10px" : 0 }}>
                            Total: {formatCompactNumber(entry.value)}
                          </p>
                          {isOthers && (
                            <div style={{ borderTop: "1px solid #374151", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "5px" }}>
                              <p style={{ color: "#9ca3af", fontSize: "11px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Includes
                              </p>
                              {entry.breakdown.map((item: { name: string; value: number }, i: number) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "16px", fontSize: "12px" }}>
                                  <span style={{ color: "#d1d5db", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>{item.name}</span>
                                  <span style={{ color: "#e5e7eb", fontWeight: 500, flexShrink: 0 }}>{formatCompactNumber(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
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