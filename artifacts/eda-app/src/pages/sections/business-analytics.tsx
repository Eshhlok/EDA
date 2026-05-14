import { useEffect, useState } from "react";
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
  "https://eda-xqob.onrender.com/api";

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

export default function BusinessAnalytics({
  datasetId,
}: Props) {
  const [groupBy, setGroupBy] = useState("Posting Date_month");

  const [metric, setMetric] = useState(
    "Amt.in loc.cur."
  );

  const [aggregation, setAggregation] =
    useState("sum");

  const [data, setData] =
    useState<GroupByResponse | null>(null);

  const [loading, setLoading] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        group_by: groupBy,
        metric,
        aggregation,
      });

      const response = await fetch(
        `${API_BASE}/datasets/${datasetId}/groupby?${params}`
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
  }, [groupBy, metric, aggregation]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Controls */}
      <div className="flex flex-wrap gap-4">

        <Select
          value={groupBy}
          onValueChange={setGroupBy}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="Posting Date_month">
              Month
            </SelectItem>

            <SelectItem value="Posting Date_year">
              Year
            </SelectItem>

            <SelectItem value="Cost Center Name">
              Cost Center
            </SelectItem>

            <SelectItem value="Movement type">
              Movement Type
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={metric}
          onValueChange={setMetric}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Metric" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="Amt.in loc.cur.">
              LNG Cost
            </SelectItem>

            <SelectItem value="Qty in unit of entry">
              LNG Quantity
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={aggregation}
          onValueChange={setAggregation}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Aggregation" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="mean">Mean</SelectItem>
            <SelectItem value="max">Max</SelectItem>
            <SelectItem value="min">Min</SelectItem>
            <SelectItem value="count">Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
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
                bottom: 100,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={120}
                fontSize={11}
              />

              <YAxis />

              <Tooltip
                contentStyle={{
                  backgroundColor:
                    "hsl(var(--card))",
                  borderColor:
                    "hsl(var(--border))",
                }}
              />

              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}