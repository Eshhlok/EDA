import { useGetMissingAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function MissingValues({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useGetMissingAnalysis(datasetId);

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  if (!data) return null;

  const chartData = data.stats
    .filter(s => s.missing_count > 0)
    .sort((a, b) => b.missing_pct - a.missing_pct);

  return (
    <div className="p-6 space-y-6">
      {chartData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No missing values found in this dataset.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Missing Values by Column</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="column" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `\${v}%`} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}}
                  />
                  <Bar dataKey="missing_pct" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Missing %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Missing Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Missing Count</TableHead>
                      <TableHead>Missing %</TableHead>
                      <TableHead>Recommended Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.stats.map(stat => (
                      <TableRow key={stat.column}>
                        <TableCell className="font-medium">{stat.column}</TableCell>
                        <TableCell>{stat.missing_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="w-12">{stat.missing_pct.toFixed(1)}%</span>
                            <div className="flex-1 h-2 bg-muted rounded overflow-hidden max-w-[100px]">
                              <div className="h-full bg-destructive" style={{ width: `\${stat.missing_pct}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground font-mono">
                            {stat.recommended_action}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
