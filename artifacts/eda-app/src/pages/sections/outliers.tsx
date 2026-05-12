import { useGetOutlierAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Outliers({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useGetOutlierAnalysis(datasetId, { zscore_threshold: 3 });

  if (isLoading) return <div className="p-6"><Skeleton className="h-[500px] w-full" /></div>;
  if (!data) return null;

  const combinedOutliers = [...data.iqr_outliers, ...data.zscore_outliers].slice(0, 100);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase">Total Outlier Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{data.total_outlier_rows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase">IQR Outliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{data.iqr_outliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase">Z-Score Outliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{data.zscore_outliers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detected Outliers (Showing up to 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Row Index</TableHead>
                  <TableHead>Column</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinedOutliers.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell>{o.row_index}</TableCell>
                    <TableCell className="font-mono text-xs">{o.column}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-secondary rounded text-xs">
                        {o.method}
                      </span>
                    </TableCell>
                    <TableCell>{o.value?.toFixed(4)}</TableCell>
                    <TableCell>{o.score?.toFixed(4)}</TableCell>
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
