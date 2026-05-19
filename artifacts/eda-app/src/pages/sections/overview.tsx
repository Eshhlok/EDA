import { useGetDatasetOverview, useGetDatasetPreview, useGetDataset, useGetQualityScore} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Database,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Sparkles,
  Columns3,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Fingerprint,
} from "lucide-react";

export default function Overview({ datasetId }: { datasetId: string }) {
  const { data: overview, isLoading: overviewLoading } = useGetDatasetOverview(datasetId);
  const { data: preview, isLoading: previewLoading } = useGetDatasetPreview(datasetId, { rows: 10 });
  const { data: dataset } =
    useGetDataset(datasetId);
  const { data: qualityData } =
    useGetQualityScore(datasetId);

  if (overviewLoading || previewLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!overview || !preview) return null;
  const totalColumns =
    overview.columns.length;

  const totalRows =
  dataset?.rows || 0;

  const totalCells =
    totalRows *
    overview.columns.length;

  const missingCells =
    overview.columns.reduce(
      (sum, col) =>
        sum + col.null_count,
      0
    );

  const missingPct =
    (
      (missingCells /
        Math.max(totalCells, 1)) *
      100
    ).toFixed(1);

  const qualityScore =
    qualityData?.overall_score || 0;

  const riskLevel =

    qualityScore >= 85
      ? "Low"

      : qualityScore >= 65
      ? "Moderate"

      : "High";

  const smartInsights: {
    title: string;
    description: string;
    severity:
      | "success"
      | "warning"
      | "critical";
  }[] = [];

  // --------------------------------
  // COMPLETENESS
  // --------------------------------

  if (
    (qualityData?.completeness || 0) < 70
  ) {

    smartInsights.push({

      title:
        "High Missingness Detected",

      description:
        "Significant missing values detected across the dataset which may impact downstream analytics reliability.",

      severity:
        "critical",

    });

  } else {

    smartInsights.push({

      title:
        "Strong Dataset Completeness",

      description:
        "Most columns maintain healthy completeness levels with minimal missing value disruption.",

      severity:
        "success",

    });
  }

  // --------------------------------
  // UNIQUENESS
  // --------------------------------

  if (
    overview.duplicate_count > 0
  ) {

    smartInsights.push({

      title:
        "Duplicate Records Found",

      description:
        `${overview.duplicate_count} duplicate rows detected which may affect aggregation accuracy and analytical consistency.`,

      severity:
        "warning",

    });
  }

  // --------------------------------
  // CONSISTENCY
  // --------------------------------

  if (
    (qualityData?.consistency || 0) >= 85
  ) {

    smartInsights.push({

      title:
        "Consistent Structural Patterns",

      description:
        "Dataset formatting and structural consistency remain strong across key analytical dimensions.",

      severity:
        "success",

    });
  }

  // --------------------------------
  // VALIDITY
  // --------------------------------

  if (
    (qualityData?.validity || 0) < 70
  ) {

    smartInsights.push({

      title:
        "Potential Validity Risks",

      description:
        "Certain values may fall outside expected ranges or contain inconsistent formatting patterns.",

      severity:
        "warning",

    });
  }

  // --------------------------------
  // OVERALL QUALITY
  // --------------------------------

  if (
    qualityScore >= 90
  ) {

    smartInsights.push({

      title:
        "Executive Ready Dataset",

      description:
        "Dataset quality indicators suggest strong readiness for advanced analytics and executive reporting workflows.",

      severity:
        "success",

    });
  }
  return (
    <motion.div

        initial={{
          opacity: 0,
          y: 20,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}

        className="p-6 space-y-6"
      >
      <div className="space-y-6">

        {/* Executive Header */}

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            glass-card
            executive-border
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
                <div className="flex items-center gap-2 mt-2">

                  <div className="relative flex h-3 w-3 ai-pulse">

                    <span
                      className="
                        animate-ping
                        absolute
                        inline-flex
                        h-full
                        w-full
                        rounded-full
                        bg-green-400
                        opacity-75
                      "
                    />

                    <span
                      className="
                        relative
                        inline-flex
                        rounded-full
                        h-3
                        w-3
                        bg-green-500
                      "
                    />

                  </div>

                  <span className="text-sm text-muted-foreground">

                   EDAFlow Monitoring active

                  </span>

                </div>
                <p className="text-muted-foreground mt-1">

                  EDAFlow-powered dataset intelligence and operational health summary.

                </p>

              </div>

            </div>

          </div>

        </div>

        {/* KPI Grid */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* Rows */}
          <motion.div

            initial={{
              opacity: 0,
              y: 18,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.05,
              duration: 0.35,
            }}

          >
          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

            <CardContent className="p-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-muted-foreground">

                    Total Records

                  </p>

                  <h2 className="text-3xl font-bold mt-2">
                  <motion.span

                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}

                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}

                    transition={{
                      duration: 0.4,
                    }}

                  >

                    {dataset?.rows?.toLocaleString()}
                  </motion.span>
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
        </motion.div>
          {/* Columns */}
        <motion.div

            initial={{
              opacity: 0,
              y: 18,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.05,
              duration: 0.35,
            }}

        >
          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

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
        </motion.div>

          {/* Quality */}
        <motion.div

            initial={{
              opacity: 0,
              y: 18,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.05,
              duration: 0.35,
            }}

          >
          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

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
        </motion.div>
          {/* Missing */}
        <motion.div

            initial={{
              opacity: 0,
              y: 18,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.05,
              duration: 0.35,
            }}

          >
          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

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
        </motion.div>
          {/* Duplicates */}
        <motion.div

            initial={{
              opacity: 0,
              y: 18,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.05,
              duration: 0.35,
            }}

          >    
          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

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
        </motion.div>
          {/* Risk */}
        <motion.div

            initial={{
              opacity: 0,
              y: 18,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.05,
              duration: 0.35,
            }}

          >
          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

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
        </motion.div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Executive Summary */}

          <Card className="xl:col-span-2 glass-card premium-hover ai-glow executive-border rounded-3xl">

            <CardHeader>

              <div className="flex items-center gap-2">

                <Sparkles className="h-5 w-5 text-primary" />

                <CardTitle>

                  Executive Summary

                </CardTitle>

              </div>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                <p className="text-muted-foreground leading-relaxed text-sm">

                  Dataset quality remains
                  <span className="font-semibold text-foreground">
                    {" "}
                    {qualityScore >= 85
                      ? "strong"
                      : qualityScore >= 65
                      ? "stable"
                      : "concerning"}
                  </span>

                  {" "}with{" "}

                  <span className="font-semibold text-foreground">
                    {missingPct}%
                  </span>

                  missing values and{" "}

                  <span className="font-semibold text-foreground">
                    {overview.duplicate_count}
                  </span>

                  duplicate records detected across{" "}

                  <span className="font-semibold text-foreground">
                    {totalColumns}
                  </span>

                  columns.

                </p>

                <div className="flex flex-wrap gap-2">

                  <Badge variant="secondary">

                    Quality Score: {qualityScore}

                  </Badge>

                  <Badge variant="outline">

                    Risk: {riskLevel}

                  </Badge>

                  <Badge variant="outline">

                    {totalRows.toLocaleString()} rows analyzed

                  </Badge>

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Dataset Health */}

          <Card className="glass-card premium-hover ai-glow executive-border rounded-3xl">

            <CardHeader>

              <CardTitle>

                Dataset Health

              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <CheckCircle2 className="h-4 w-4 text-green-500" />

                  <span className="text-sm">

                    Completeness

                  </span>

                </div>

                <span className="font-semibold">

                  {qualityData?.completeness?.toFixed(0)}%

                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Fingerprint className="h-4 w-4 text-blue-500" />

                  <span className="text-sm">

                    Uniqueness

                  </span>

                </div>

                <span className="font-semibold">

                  {qualityData?.uniqueness?.toFixed(0)}%

                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <TrendingUp className="h-4 w-4 text-amber-500" />

                  <span className="text-sm">

                    Consistency

                  </span>

                </div>

                <span className="font-semibold">

                  {qualityData?.consistency?.toFixed(0)}%

                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <ShieldAlert className="h-4 w-4 text-red-500" />

                  <span className="text-sm">

                    Validity

                  </span>

                </div>

                <span className="font-semibold">

                  {qualityData?.validity?.toFixed(0)}%

                </span>

              </div>

            </CardContent>

          </Card>

        </div>
      </div>
      <Card className="glass-card premium-hover executive-border rounded-3xl">

        <CardHeader>

          <div className="flex items-center gap-2">

            <Sparkles className="h-5 w-5 text-primary" />

            <CardTitle>

              AI Recommendations & Warnings

            </CardTitle>

          </div>

        </CardHeader>

        <CardContent className="space-y-4">

          {smartInsights.map(
            (
              insight,
              index
            ) => (
               <motion.div

                  key={index}

                  initial={{
                    opacity: 0,
                    x: -10,
                  }}

                  animate={{
                    opacity: 1,
                    x: 0,
                  }}

                  transition={{
                    delay: index * 0.08,
                    duration: 0.35,
                  }}

                >
              <div
                key={index}
                className={`
                  rounded-3xl
                  border
                  p-4
                  transition-all

                  ${
                    insight.severity ===
                    "critical"

                      ? "border-red-500/30 bg-red-500/5"

                      : insight.severity ===
                        "warning"

                      ? "border-amber-500/30 bg-amber-500/5"

                      : "border-green-500/30 bg-green-500/5"
                  }
                `}
              >

                <div className="flex items-start gap-3">

                  <div
                    className={`
                      mt-0.5
                      transition-all
                      duration-300
                      hover:scale-[1.01]
                      ${
                        insight.severity ===
                        "critical"

                          ? "text-red-500"

                          : insight.severity ===
                            "warning"

                          ? "text-amber-500"

                          : "text-green-500"
                      }
                    `}
                  >

                    {
                      insight.severity ===
                      "critical"

                        ? <ShieldAlert className="h-5 w-5" />

                        : insight.severity ===
                          "warning"

                        ? <AlertTriangle className="h-5 w-5" />

                        : <CheckCircle2 className="h-5 w-5" />
                    }

                  </div>

                  <div className="space-y-1">

                    <h4 className="font-semibold">

                      {insight.title}

                    </h4>

                    <p className="text-sm text-muted-foreground leading-relaxed">

                      {insight.description}

                    </p>

                  </div>

                </div>

              </div>
            </motion.div>
            )
          )}

        </CardContent>

      </Card>
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
    </motion.div>
  );
}
