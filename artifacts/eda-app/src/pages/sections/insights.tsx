import { useState, useMemo } from "react";
import { useGetInsights } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SmartLoading from "@/components/ui/smart-loading";
import {
  Info,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  Filter,
  TrendingUp,
  Database,
  Hash,
  Type,
  Calendar,
  Layers,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = "INFO" | "WARNING" | "CRITICAL";
type Category = string;

interface Insight {
  severity: Severity;
  category: Category;
  column?: string;
  message: string;
  detail?: string;
  action?: string;
  impact?: "low" | "medium" | "high";
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: "Critical",
    icon: ShieldAlert,
    containerClass: "border-l-red-500 bg-red-500/5",
    badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
    iconClass: "text-red-500",
    dotClass: "bg-red-500",
  },
  WARNING: {
    label: "Warning",
    icon: AlertTriangle,
    containerClass: "border-l-amber-500 bg-amber-500/5",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    iconClass: "text-amber-500",
    dotClass: "bg-amber-500",
  },
  INFO: {
    label: "Info",
    icon: Info,
    containerClass: "border-l-blue-500 bg-blue-500/5",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    iconClass: "text-blue-500",
    dotClass: "bg-blue-500",
  },
} satisfies Record<Severity, object>;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  MISSING: Database,
  COMPLETENESS: Database,
  DUPLICATE: Layers,
  UNIQUENESS: Layers,
  OUTLIER: TrendingUp,
  DISTRIBUTION: TrendingUp,
  TYPE: Type,
  DTYPE: Type,
  CARDINALITY: Hash,
  DATE: Calendar,
  DATETIME: Calendar,
  CORRELATION: TrendingUp,
};

const getCategoryIcon = (category: string): React.ElementType => {
  const upper = category.toUpperCase();
  return (
    Object.entries(CATEGORY_ICONS).find(([key]) => upper.includes(key))?.[1] ??
    Lightbulb
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SeverityPill({
  severity,
  count,
  active,
  onClick,
}: {
  severity: Severity | "ALL";
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  if (severity === "ALL") {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
        }`}
      >
        <Filter className="h-3 w-3" />
        All
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20" : "bg-muted"}`}>
          {count}
        </span>
      </button>
    );
  }

  const cfg = SEVERITY_CONFIG[severity];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? cfg.badgeClass + " border-current"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? cfg.dotClass : "bg-muted-foreground"}`} />
      {cfg.label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-current/10" : "bg-muted"}`}>
        {count}
      </span>
    </button>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.INFO;
  const Icon = cfg.icon;
  const CatIcon = getCategoryIcon(insight.category);
  const hasExtra = !!(insight.detail || insight.action);

  return (
    <div
      className={`border-l-4 rounded-r-lg border border-l-[3px] transition-all ${cfg.containerClass} ${
        hasExtra ? "cursor-pointer select-none" : ""
      }`}
      onClick={() => hasExtra && setExpanded((e) => !e)}
      role={hasExtra ? "button" : undefined}
      aria-expanded={hasExtra ? expanded : undefined}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${cfg.iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${cfg.badgeClass}`}>
              <CatIcon className="h-2.5 w-2.5" />
              {insight.category}
            </span>
            {insight.column && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {insight.column}
              </span>
            )}
            {insight.impact && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                insight.impact === "high"
                  ? "bg-red-500/10 text-red-500"
                  : insight.impact === "medium"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                {insight.impact} impact
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground leading-snug">{insight.message}</p>
          {hasExtra && expanded && (
            <div className="mt-3 space-y-2 border-t border-current/10 pt-3">
              {insight.detail && (
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.detail}</p>
              )}
              {insight.action && (
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{insight.action}</span>
                </div>
              )}
            </div>
          )}
          {hasExtra && !expanded && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Click for details & recommended action
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryGroup({ category, insights }: { category: string; insights: Insight[] }) {
  const CatIcon = getCategoryIcon(category);
  const criticalCount = insights.filter((i) => i.severity === "CRITICAL").length;
  const warningCount = insights.filter((i) => i.severity === "WARNING").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {category}
        </h3>
        <div className="flex gap-1 ml-auto">
          {criticalCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold">
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
              {warningCount}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2 pl-1">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  );
}

function InsightsSummary({ insights }: { insights: Insight[] }) {
  const critical = insights.filter((i) => i.severity === "CRITICAL").length;
  const warning = insights.filter((i) => i.severity === "WARNING").length;
  const info = insights.filter((i) => i.severity === "INFO").length;

  const healthLabel =
    critical > 0
      ? { text: "Needs attention", cls: "text-red-500 bg-red-500/10" }
      : warning > 2
      ? { text: "Some issues found", cls: "text-amber-500 bg-amber-500/10" }
      : { text: "Looking good", cls: "text-green-500 bg-green-500/10" };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/40 border">
      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${healthLabel.cls}`}>
        {healthLabel.text}
      </div>
      <div className="flex gap-4 text-sm ml-auto">
        <span className="flex items-center gap-1.5 text-red-500">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span className="font-bold">{critical}</span>
          <span className="text-muted-foreground font-normal">critical</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="font-bold">{warning}</span>
          <span className="text-muted-foreground font-normal">warnings</span>
        </span>
        <span className="flex items-center gap-1.5 text-blue-500">
          <Info className="h-3.5 w-3.5" />
          <span className="font-bold">{info}</span>
          <span className="text-muted-foreground font-normal">info</span>
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Insights({ datasetId }: { datasetId: string }) {
  const { data: insights, isLoading } = useGetInsights(datasetId);
  const [activeSeverity, setActiveSeverity] = useState<Severity | "ALL">("ALL");
  const [groupByCategory, setGroupByCategory] = useState(true);

  const filtered = useMemo(() => {
    if (!insights) return [];
    if (activeSeverity === "ALL") return insights as Insight[];
    return (insights as Insight[]).filter((i) => i.severity === activeSeverity);
  }, [insights, activeSeverity]);

  const grouped = useMemo(() => {
    const map: Record<string, Insight[]> = {};
    for (const insight of filtered) {
      const key = insight.category;
      if (!map[key]) map[key] = [];
      map[key].push(insight);
    }
    return Object.entries(map).sort(([, a], [, b]) => {
      const aHasCrit = a.some((i) => i.severity === "CRITICAL") ? 1 : 0;
      const bHasCrit = b.some((i) => i.severity === "CRITICAL") ? 1 : 0;
      return bHasCrit - aHasCrit || b.length - a.length;
    });
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-2 w-48 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse rounded-full w-2/3" />
        </div>
        <SmartLoading />
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <div className="p-4 rounded-full bg-green-500/10">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <p className="text-lg font-semibold">No issues detected</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          EDAFlow found no anomalies or data quality issues in this dataset.
        </p>
      </div>
    );
  }

  const counts = {
    ALL: (insights as Insight[]).length,
    CRITICAL: (insights as Insight[]).filter((i) => i.severity === "CRITICAL").length,
    WARNING: (insights as Insight[]).filter((i) => i.severity === "WARNING").length,
    INFO: (insights as Insight[]).filter((i) => i.severity === "INFO").length,
  };

  return (
    <div className="p-6 space-y-6">
      <InsightsSummary insights={insights as Insight[]} />

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((s) => (
            <SeverityPill
              key={s}
              severity={s}
              count={counts[s]}
              active={activeSeverity === s}
              onClick={() => setActiveSeverity(s)}
            />
          ))}
        </div>
        <button
          onClick={() => setGroupByCategory((g) => !g)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            groupByCategory
              ? "bg-primary/10 text-primary border-primary/20"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Layers className="h-3 w-3" />
          Group by category
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No {activeSeverity.toLowerCase()} insights found.
        </div>
      )}

      {groupByCategory ? (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <CategoryGroup key={category} category={category} insights={items} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((insight, i) => (
            <InsightCard key={i} insight={insight as Insight} />
          ))}
        </div>
      )}
    </div>
  );
}