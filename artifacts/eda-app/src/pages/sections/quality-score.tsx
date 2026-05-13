import { useGetQualityScore } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Database,
  Fingerprint,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QualityData {
  overall_score: number;
  completeness: number;
  uniqueness: number;
  consistency: number;
  validity: number;
  recommendations: string[];
  // optional enriched fields
  completeness_detail?: string;
  uniqueness_detail?: string;
  consistency_detail?: string;
  validity_detail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getScoreColor = (score: number) => {
  if (score >= 80) return { text: "text-green-500", bg: "bg-green-500/10", bar: "#22c55e", border: "border-green-500/30" };
  if (score >= 60) return { text: "text-amber-500", bg: "bg-amber-500/10", bar: "#f59e0b", border: "border-amber-500/30" };
  return { text: "text-red-500", bg: "bg-red-500/10", bar: "#ef4444", border: "border-red-500/30" };
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
};

const getRecommendationSeverity = (rec: string) => {
  const lower = rec.toLowerCase();
  if (lower.includes("critical") || lower.includes("missing") || lower.includes("duplicate")) return "critical";
  if (lower.includes("warning") || lower.includes("inconsist") || lower.includes("invalid")) return "warning";
  return "info";
};

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // SVG arc math
  const r = 70;
  const cx = 100;
  const cy = 100;
  const startAngle = -220;
  const totalAngle = 260;
  const angle = startAngle + (score / 100) * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) };
    const e = { x: cx + radius * Math.cos(toRad(end)), y: cy + radius * Math.sin(toRad(end)) };
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const trackPath = arcPath(startAngle, startAngle + totalAngle, r);
  const fillPath = arcPath(startAngle, angle, r);

  const strokeColor =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="200" height="160" viewBox="0 0 200 160">
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={fillPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize="32"
          fontWeight="800"
          fill={strokeColor}
          fontFamily="var(--font-sans)"
        >
          {score.toFixed(0)}
        </text>
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--muted-foreground))"
          fontFamily="var(--font-sans)"
        >
          out of 100
        </text>
        {/* Labels */}
        <text x="22" y="145" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="var(--font-sans)">0</text>
        <text x="178" y="145" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="var(--font-sans)">100</text>
      </svg>
      <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${color.text} ${color.bg} ${color.border} border`}>
        {label}
      </div>
    </div>
  );
}

// ─── Dimension card ───────────────────────────────────────────────────────────

function DimensionCard({
  label,
  score,
  icon: Icon,
  detail,
}: {
  label: string;
  score: number;
  icon: React.ElementType;
  detail?: string;
}) {
  const color = getScoreColor(score);

  return (
    <div className={`p-4 rounded-xl border ${color.border} ${color.bg} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color.text}`} />
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span className={`text-lg font-extrabold tabular-nums ${color.text}`}>
          {score.toFixed(0)}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">/ 100</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color.bar }}
        />
      </div>

      {detail && (
        <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
      )}

      <div className={`text-xs font-medium ${color.text}`}>
        {getScoreLabel(score)}
      </div>
    </div>
  );
}

// ─── Recommendation ───────────────────────────────────────────────────────────

function RecommendationItem({ rec, index }: { rec: string; index: number }) {
  const sev = getRecommendationSeverity(rec);
  const Icon = sev === "critical" ? ShieldAlert : sev === "warning" ? AlertTriangle : Info;
  const cls =
    sev === "critical"
      ? "text-red-500 bg-red-500/10"
      : sev === "warning"
      ? "text-amber-500 bg-amber-500/10"
      : "text-blue-500 bg-blue-500/10";

  return (
    <li className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${cls}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{rec}</p>
      </div>
      <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">
        #{index + 1}
      </span>
    </li>
  );
}

// ─── Radar tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { subject: string; A: number } }> }) {
  if (!active || !payload?.length) return null;
  const { subject, A } = payload[0].payload;
  const color = getScoreColor(A);
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{subject}</p>
      <p className={`font-mono font-bold ${color.text}`}>{A.toFixed(1)}</p>
    </div>
  );
}

// ─── Bar chart tooltip ────────────────────────────────────────────────────────

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { subject: string } }> }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const label = payload[0].payload.subject;
  const color = getScoreColor(val);
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>
      <p className={`font-mono font-bold ${color.text}`}>{val.toFixed(1)}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QualityScore({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useGetQualityScore(datasetId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = [
    { subject: "Completeness", A: data.completeness },
    { subject: "Uniqueness", A: data.uniqueness },
    { subject: "Consistency", A: data.consistency },
    { subject: "Validity", A: data.validity },
  ];

  const dimensions = [
    {
      label: "Completeness",
      score: data.completeness,
      icon: Database,
      detail: (data as QualityData).completeness_detail ?? "Measures the proportion of non-missing values across all columns.",
    },
    {
      label: "Uniqueness",
      score: data.uniqueness,
      icon: Fingerprint,
      detail: (data as QualityData).uniqueness_detail ?? "Checks for duplicate rows and repeated values in key columns.",
    },
    {
      label: "Consistency",
      score: data.consistency,
      icon: CheckSquare,
      detail: (data as QualityData).consistency_detail ?? "Evaluates whether data conforms to expected formats and patterns.",
    },
    {
      label: "Validity",
      score: data.validity,
      icon: ShieldCheck,
      detail: (data as QualityData).validity_detail ?? "Assesses whether values fall within expected ranges and types.",
    },
  ];

  const worstDimension = [...dimensions].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="p-6 space-y-6">

      {/* Top row: gauge + radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Overall Quality Score</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Weighted average across all four dimensions
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2 pb-4">
            <ScoreGauge score={data.overall_score} />
            {worstDimension.score < 80 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg w-full">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Biggest opportunity: improve{" "}
                  <span className={`font-semibold ${getScoreColor(worstDimension.score).text}`}>
                    {worstDimension.label}
                  </span>{" "}
                  ({worstDimension.score.toFixed(0)})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Dimension Radar</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Score distribution across quality dimensions
            </p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dimension Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32, top: 4, bottom: 4 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={90} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="A" radius={[0, 4, 4, 0]} barSize={18}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.subject}
                    fill={getScoreColor(entry.A).bar}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dimension cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {dimensions.map((d) => (
          <DimensionCard key={d.label} {...d} />
        ))}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recommendations</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Prioritised actions to improve your data quality score
              </p>
            </div>
            {data.recommendations.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                {data.recommendations.length} action{data.recommendations.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.recommendations.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-green-500">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">
                Your dataset looks great — no specific recommendations at this time.
              </span>
            </div>
          ) : (
            <ul className="space-y-0">
              {data.recommendations.map((rec, i) => (
                <RecommendationItem key={i} rec={rec} index={i} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

    </div>
  );
}