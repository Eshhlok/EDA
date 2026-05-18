import React, { useEffect, useState } from "react";
import { useGetUnivariateAnalysis } from "@workspace/api-client-react";
import DataTable from "@/components/analytics/data-table"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://eda-xqob.onrender.com";

type Props = {
  datasetId: string;
};

type GroupByResponse = {
  group_by: string;
  metric: string;
  aggregation: string;
  data: {
    label: string;
    value: number;
  }[];
};
const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "12px",
    color: "#f9fafb",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.35)",
  },

  labelStyle: {
    color: "#ffffff",
    fontWeight: 600,
    marginBottom: "6px",
  },

  itemStyle: {
    color: "#e5e7eb",
    fontSize: "13px",
  },

  cursor: {
    stroke: "#9ca3af",
    strokeDasharray: "4 4",
  },
};
export default function BusinessAnalytics({
  datasetId,
}: Props) {

  const [groupBy, setGroupBy] =
    useState("");

  const [metric, setMetric] =
    useState("");

  const [aggregation, setAggregation] =
    useState("sum");

  const [data, setData] =
    useState<GroupByResponse | null>(null);

  const [loading, setLoading] =
    useState(false);
  const totalValue =
  data?.data.reduce(
    (sum, row) => sum + row.value,
    0
  ) || 0;

const averageValue =
  data?.data.length
    ? totalValue / data.data.length
    : 0;

const topEntry =
  data?.data.length
    ? data.data.reduce((max, row) =>
        row.value > max.value
          ? row
          : max
      )
    : null;

  const { data: univariateData } =
    useGetUnivariateAnalysis(datasetId);

  // -----------------------------
  // DYNAMIC COLUMN DETECTION
  // -----------------------------

  const numericColumns =
    univariateData?.numeric.map(
      (n) => n.column
    ) || [];

  const categoricalColumns =
    univariateData?.categorical.map(
      (c) => c.column
    ) || [];

  const groupableColumns = [
    ...categoricalColumns.filter(
      (col) =>
        col.includes("_month") ||
        col.includes("_year") ||
        col.includes("_quarter")
    ),

    ...categoricalColumns.filter(
      (col) =>
        !col.includes("_month") &&
        !col.includes("_year") &&
        !col.includes("_quarter")
    ),
  ];

  // -----------------------------
  // AUTO DEFAULTS
  // -----------------------------

  useEffect(() => {

    if (
      groupableColumns.length > 0 &&
      !groupBy
    ) {
      setGroupBy(groupableColumns[0]);
    }

    if (
      numericColumns.length > 0 &&
      !metric
    ) {
      setMetric(numericColumns[0]);
    }

  }, [
    groupableColumns,
    numericColumns,
    groupBy,
    metric,
  ]);

  // -----------------------------
  // FETCH DATA
  // -----------------------------

  async function fetchData() {

    if (!groupBy || !metric) return;

    try {

      setLoading(true);

      const params =
        new URLSearchParams({
          group_by: groupBy,
          metric,
          aggregation,
        });

      const response = await fetch(
        `${API_BASE}/api/datasets/${datasetId}/groupby?${params}`
      );

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
  }, [
    groupBy,
    metric,
    aggregation,
  ]);

  if (
    loading ||
    !univariateData
  ) {
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* TOTAL */}

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">
              Total Value
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">

              {totalValue.toLocaleString()}

            </div>

          </CardContent>

        </Card>

        {/* AVERAGE */}

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">
              Average Value
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">

              {averageValue.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              )}

            </div>

          </CardContent>

        </Card>

        {/* TOP CATEGORY */}

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">
              Top Category
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-lg font-bold truncate">

              {topEntry?.label || "-"}

            </div>

          </CardContent>

        </Card>

        {/* TOP VALUE */}

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm text-muted-foreground">
              Top Value
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">

              {topEntry?.value.toLocaleString() || "-"}

            </div>

          </CardContent>

        </Card>

      </div>
      {/* CONTROLS */}

      <div className="flex flex-wrap gap-4">

        {/* GROUP BY */}

        <Select
          value={groupBy}
          onValueChange={setGroupBy}
        >

          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>

          <SelectContent>

            {groupableColumns.map((col) => (

              <SelectItem
                key={col}
                value={col}
              >
                {col}
              </SelectItem>

            ))}

          </SelectContent>

        </Select>

        {/* METRIC */}

        <Select
          value={metric}
          onValueChange={setMetric}
        >

          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Metric" />
          </SelectTrigger>

          <SelectContent>

            {numericColumns.map((col) => (

              <SelectItem
                key={col}
                value={col}
              >
                {col}
              </SelectItem>

            ))}

          </SelectContent>

        </Select>

        {/* AGGREGATION */}

        <Select
          value={aggregation}
          onValueChange={setAggregation}
        >

          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Aggregation" />
          </SelectTrigger>

          <SelectContent>

            <SelectItem value="sum">
              Sum
            </SelectItem>

            <SelectItem value="mean">
              Mean
            </SelectItem>

            <SelectItem value="max">
              Max
            </SelectItem>

            <SelectItem value="min">
              Min
            </SelectItem>

            <SelectItem value="count">
              Count
            </SelectItem>

          </SelectContent>

        </Select>

      </div>

      {/* CHART */}

      <Card>

        <CardHeader>
          <CardTitle>
            Business Analytics
          </CardTitle>
        </CardHeader>

        <CardContent className="h-[500px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={data?.data || []}
              margin={{
                top: 20,
                right: 20,
                left: 20,
                bottom: 120,
              }}
              barCategoryGap="20%"
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                type="category"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={120}
                fontSize={11}
              />

              <YAxis />

              <Tooltip {...chartTooltipStyle} />
              

              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </CardContent>

      </Card>
      <Card>

        <CardHeader>

          <CardTitle>
            Underlying Data
          </CardTitle>

        </CardHeader>

        <CardContent>

          <DataTable
            columns={[
              data?.group_by || "Category",
              data?.metric || "Value",
            ]}
            rows={
              data?.data.map((row) => ({
                [data.group_by]: row.label,
                [data.metric]: row.value,
              })) || []
            }
          />

        </CardContent>

      </Card>
    </div>
  );
}