import { useState, useEffect } from "react";
import { useGetUnivariateAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger as UITooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
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
};
export default function Univariate({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useGetUnivariateAnalysis(datasetId);
  const [selectedCol, setSelectedCol] = useState<string>("");

  useEffect(() => {
    if (data && !selectedCol) {
      if (data.numeric.length > 0) setSelectedCol(data.numeric[0].column);
      else if (data.categorical.length > 0) setSelectedCol(data.categorical[0].column);
    }
  }, [data, selectedCol]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return null;

  const numericStat = data.numeric.find(n => n.column === selectedCol);
  const catStat = data.categorical.find(c => c.column === selectedCol);

  const allCols = [
    ...data.numeric.map(n => ({ name: n.column, type: 'numeric' })),
    ...data.categorical.map(c => ({ name: c.column, type: 'categorical' }))
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <label className="text-sm font-medium">Select Column:</label>
        <Select value={selectedCol} onValueChange={setSelectedCol}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {allCols.map(c => (
              <SelectItem key={c.name} value={c.name}>
                {c.name} ({c.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {numericStat && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <StatCard title="Mean" value={numericStat.mean?.toFixed(4)} />
            <StatCard title="Median" value={numericStat.median?.toFixed(4)} />
            <StatCard title="Min" value={numericStat.min?.toFixed(4)} />
            <StatCard title="Max" value={numericStat.max?.toFixed(4)} />
            <StatCard title="Std Dev" value={numericStat.std?.toFixed(4)} />
            <StatCard title="Skewness" value={numericStat.skewness?.toFixed(4)} />
            <StatCard title="Kurtosis" value={numericStat.kurtosis?.toFixed(4)} />
            <StatCard title="Missing" value={0} /> {/* We could pass missing info here but keep simple for now */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution (Histogram + KDE)</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={numericStat.histogram}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="bin"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Frequency" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Percentiles & IQR</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Q1 (25%)</TableCell>
                      <TableCell>{numericStat.q1?.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Median (50%)</TableCell>
                      <TableCell>{numericStat.median?.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Q3 (75%)</TableCell>
                      <TableCell>{numericStat.q3?.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">IQR</TableCell>
                      <TableCell>{numericStat.iqr?.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Range</TableCell>
                      <TableCell>{numericStat.range?.toFixed(4)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {catStat && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Cardinality" value={catStat.cardinality} />
            <StatCard title="Entropy" value={catStat.entropy?.toFixed(4)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catStat.top_values} layout="vertical" margin={{ top: 0, right: 0, left: 50, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="value" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proportions</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catStat.top_values.slice(0, 10)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="value"
                      label={({ value }) => value}
                    >
                      {catStat.top_values.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: any }) {
  const displayValue = value ?? '-';
  const fullValue = value != null ? String(value) : '-';

  return (
    <TooltipProvider delayDuration={200}>
      <UITooltip>
        <UITooltipTrigger asChild>
          <Card className="cursor-default">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">{title}</p>
              <p className="text-xl font-bold truncate w-full">{displayValue}</p>
            </CardContent>
          </Card>
        </UITooltipTrigger>
        <TooltipContent side="bottom" className="bg-zinc-900 border border-zinc-700 text-white font-mono text-sm px-3 py-2 shadow-lg">
          <span className="font-semibold text-muted-foreground mr-2">{title}:</span>
          {fullValue}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}
