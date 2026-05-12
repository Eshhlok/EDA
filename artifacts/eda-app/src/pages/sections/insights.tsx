import { useGetInsights } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, ShieldAlert } from "lucide-react";

export default function Insights({ datasetId }: { datasetId: string }) {
  const { data: insights, isLoading } = useGetInsights(datasetId);

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  if (!insights) return null;

  const severityConfig = {
    INFO: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Info },
    WARNING: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertTriangle },
    CRITICAL: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ShieldAlert },
  };

  return (
    <div className="p-6 space-y-4">
      {insights.map((insight, i) => {
        const config = severityConfig[insight.severity as keyof typeof severityConfig] || severityConfig.INFO;
        const Icon = config.icon;

        return (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: `var(--\${insight.severity.toLowerCase()})` }}>
            <CardContent className="p-4 flex items-start space-x-4">
              <div className={`p-2 rounded-full \${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="uppercase text-[10px]">{insight.category}</Badge>
                  {insight.column && <span className="text-xs font-mono text-muted-foreground">{insight.column}</span>}
                </div>
                <p className="text-sm font-medium">{insight.message}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
