import { useState } from "react";
import { useGetBivariateAnalysis, useGetScatterData } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function Bivariate({ datasetId }: { datasetId: string }) {
  const { data: bivariate, isLoading: bivLoading } = useGetBivariateAnalysis(datasetId);
  const [useSpearman, setUseSpearman] = useState(false);
  const [colX, setColX] = useState<string>("");
  const [colY, setColY] = useState<string>("");

  if (bivLoading) return <div className="p-6"><Skeleton className="h-[500px] w-full" /></div>;
  if (!bivariate) return null;

  if (!colX && bivariate.numeric_columns.length > 0) setColX(bivariate.numeric_columns[0]);
  if (!colY && bivariate.numeric_columns.length > 1) setColY(bivariate.numeric_columns[1]);
  else if (!colY && bivariate.numeric_columns.length > 0) setColY(bivariate.numeric_columns[0]);

  const matrix = useSpearman ? bivariate.spearman_matrix : bivariate.pearson_matrix;
  
  // Build a 2D array for heatmap
  const cols = bivariate.numeric_columns;
  const heatmapData = matrix.reduce((acc, curr) => {
    if (!acc[curr.row]) acc[curr.row] = {};
    acc[curr.row][curr.col] = curr.value;
    return acc;
  }, {} as Record<string, Record<string, number | null>>);

  const getHeatmapColor = (val: number | null) => {
    if (val === null) return 'var(--muted)';
    // Blue to Red scale (-1 to 1)
    if (val > 0) {
      const alpha = Math.min(val, 1);
      return `rgba(239, 68, 68, \${alpha})`; // red-500
    } else {
      const alpha = Math.min(Math.abs(val), 1);
      return `rgba(59, 130, 246, \${alpha})`; // blue-500
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Correlation Heatmap</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="spearman" className="text-sm text-muted-foreground">Pearson</Label>
            <Switch id="spearman" checked={useSpearman} onCheckedChange={setUseSpearman} />
            <Label htmlFor="spearman" className="text-sm text-muted-foreground">Spearman</Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border"></th>
                  {cols.map(c => (
                    <th key={c} className="p-2 text-xs font-medium border break-all max-w-[100px] whitespace-nowrap overflow-hidden text-ellipsis" title={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cols.map(r => (
                  <tr key={r}>
                    <th className="p-2 text-xs font-medium border text-left break-all max-w-[100px] whitespace-nowrap overflow-hidden text-ellipsis" title={r}>{r}</th>
                    {cols.map(c => {
                      const val = heatmapData[r]?.[c];
                      return (
                        <td 
                          key={c} 
                          className="w-10 h-10 border text-center text-xs font-mono font-medium transition-colors"
                          style={{ 
                            backgroundColor: getHeatmapColor(val),
                            color: val !== null && Math.abs(val) > 0.5 ? '#fff' : 'inherit'
                          }}
                          title={`\${r} vs \${c}: \${val !== null ? val.toFixed(3) : 'N/A'}`}
                        >
                          {val !== null ? val.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scatter Plot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Label>X Axis</Label>
              <Select value={colX} onValueChange={setColX}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Y Axis</Label>
              <Select value={colY} onValueChange={setColY}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <ScatterPlotData datasetId={datasetId} colX={colX} colY={colY} />
        </CardContent>
      </Card>
    </div>
  );
}

function ScatterPlotData({ datasetId, colX, colY }: { datasetId: string, colX: string, colY: string }) {
  const { data, isLoading } = useGetScatterData(datasetId, { col_x: colX, col_y: colY }, { query: { enabled: !!colX && !!colY } });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (!data) return null;

  const chartData = data.x.map((xVal, i) => ({
    x: xVal,
    y: data.y[i],
    color: data.color?.[i]
  })).filter(p => p.x !== null && p.y !== null);

  return (
    <div className="space-y-4">
      <div className="h-[400px] border rounded-lg bg-card/50">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" name={colX} stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
            <YAxis type="number" dataKey="y" name={colY} stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
            <ZAxis type="number" range={[20]} />
            <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}} />
            <Scatter data={chartData} fill="hsl(var(--primary))" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-sm bg-muted/50 p-3 rounded">
        {data.pearson_r !== null && (
          <div><span className="font-semibold">Pearson r:</span> <span className="font-mono">{data.pearson_r?.toFixed(3)}</span></div>
        )}
        {data.spearman_r !== null && (
          <div><span className="font-semibold">Spearman r:</span> <span className="font-mono">{data.spearman_r?.toFixed(3)}</span></div>
        )}
      </div>
    </div>
  );
}
