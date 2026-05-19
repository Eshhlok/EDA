import { useGetDatasetOverview, useGetDatasetPreview } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Sparkles,
  Columns3,
} from "lucide-react";

export default function Overview({ datasetId }: { datasetId: string }) {
  const { data: overview, isLoading: overviewLoading } = useGetDatasetOverview(datasetId);
  const { data: preview, isLoading: previewLoading } = useGetDatasetPreview(datasetId, { rows: 10 });

  if (overviewLoading || previewLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!overview || !preview) return null;
  const totalColumns =
    overview.columns.length;

  const totalRows =
    preview.rows.length;

  const missingPct =
    (
      (overview.fully_missing_rows /
        Math.max(totalRows, 1)) *
      100
    ).toFixed(1);

  const qualityScore =
    Math.max(
      0,
      Math.min(
        100,
        100 -
          Number(missingPct) * 2 -
          overview.duplicate_count * 0.5
      )
    ).toFixed(0);

  const riskLevel =
    Number(qualityScore) > 85
      ? "Low"

      : Number(qualityScore) > 65
      ? "Moderate"

      : "High";
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">

        {/* Executive Header */}

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            bg-card/70
            backdrop-blur-xl
            p-8
          "
        >

          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_top_right,rgba(224,184,75,0.12),transparent_30%)]
              pointer-events-none
            "
          />

          <div className="relative z-10">

            <div className="flex items-center gap-3 mb-3">

              <div
                className="
                  p-2
                  rounded-2xl
                  bg-primary/10
                  border
                  border-primary/20
                "
              >

                <Sparkles className="h-5 w-5 text-primary" />

              </div>

              <div>

                <h1 className="text-3xl font-bold tracking-tight">

                  Executive Overview

                </h1>

                <p className="text-muted-foreground mt-1">

                  AI-powered dataset intelligence and operational health summary.

                </p>

              </div>

            </div>

          </div>

        </div>

        {/* KPI Grid */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* Rows */}

          <Card>

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Total Records

                  </p>

                  <h2 className="text-3xl font-bold mt-2">

                    {overview.rows.toLocaleString()}

                  </h2>

                </div>

                <div
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    bg-blue-500/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Database className="h-6 w-6 text-blue-500" />

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Columns */}

          <Card>

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Total Columns

                  </p>

                  <h2 className="text-3xl font-bold mt-2">

                    {totalColumns}

                  </h2>

                </div>

                <div
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    bg-violet-500/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Columns3 className="h-6 w-6 text-violet-500" />

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Quality */}

          <Card>

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Quality Score

                  </p>

                  <h2 className="text-3xl font-bold mt-2">

                    {qualityScore}/100

                  </h2>

                </div>

                <div
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    bg-green-500/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <ShieldCheck className="h-6 w-6 text-green-500" />

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Missing */}

          <Card>

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Missing Data

                  </p>

                  <h2 className="text-3xl font-bold mt-2">

                    {missingPct}%

                  </h2>

                </div>

                <div
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    bg-amber-500/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <AlertTriangle className="h-6 w-6 text-amber-500" />

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Duplicates */}

          <Card>

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Duplicate Rows

                  </p>

                  <h2 className="text-3xl font-bold mt-2">

                    {overview.duplicate_count}

                  </h2>

                </div>

                <div
                  className="
                    h-12
                    w-12
                    rounded-2xl
                    bg-red-500/10
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Activity className="h-6 w-6 text-red-500" />

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Risk */}

          <Card>

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Dataset Risk

                  </p>

                  <h2 className="text-3xl font-bold mt-2">

                    {riskLevel}

                  </h2>

                </div>

                <Badge
                  variant={
                    riskLevel === "Low"
                      ? "default"
                      : riskLevel === "Moderate"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-xs"
                >

                  AI Assessed

                </Badge>

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schema Definition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Non-Null</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Unique</TableHead>
                  <TableHead>Samples</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.columns.map(col => (
                  <TableRow key={col.name}>
                    <TableCell className="font-medium">{col.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{col.dtype}</Badge>
                    </TableCell>
                    <TableCell>{col.non_null_count}</TableCell>
                    <TableCell>
                      <span className={col.null_count > 0 ? "text-amber-500 font-bold" : ""}>
                        {col.null_pct.toFixed(1)}% ({col.null_count})
                      </span>
                    </TableCell>
                    <TableCell>{col.unique_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {col.sample_values.join(', ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Preview (First 10 Rows)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.columns.map(col => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row, i) => (
                  <TableRow key={i}>
                    {preview.columns.map(col => (
                      <TableCell key={col} className="truncate max-w-[150px]">
                        {String(row[col] ?? 'null')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
