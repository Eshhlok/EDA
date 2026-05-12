import { useGetQualityScore } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2 } from "lucide-react";

export default function QualityScore({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useGetQualityScore(datasetId);

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!data) return null;

  const chartData = [
    { subject: 'Completeness', A: data.completeness },
    { subject: 'Uniqueness', A: data.uniqueness },
    { subject: 'Consistency', A: data.consistency },
    { subject: 'Validity', A: data.validity },
  ];

  const getColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/20 bg-green-500/10";
    if (score >= 60) return "text-amber-500 border-amber-500/20 bg-amber-500/10";
    return "text-destructive border-destructive/20 bg-destructive/10";
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle>Overall Quality Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
          <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center text-4xl font-extrabold \${getColor(data.overall_score)}`}>
            {data.overall_score.toFixed(0)}
          </div>
          <p className="text-muted-foreground text-sm text-center px-8">
            This score represents the general health of your dataset based on completeness, uniqueness, consistency, and validity.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              <Tooltip 
                contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recommendations to Improve</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
            {data.recommendations.length === 0 && (
              <li className="text-muted-foreground italic">Your dataset looks great! No specific recommendations at this time.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
