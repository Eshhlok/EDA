import { useState } from "react";
import { useGetMultivariateAnalysis, useGetPcaAnalysis, useGetTsneAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";

export default function Multivariate({ datasetId }: { datasetId: string }) {
  const { data, isLoading } = useGetMultivariateAnalysis(datasetId);

  if (isLoading) return <div className="p-6"><Skeleton className="h-[500px] w-full" /></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cluster Elbow Method</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data.cluster_elbow} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis dataKey="k" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                 <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                 <Tooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}} />
                 <Line type="monotone" dataKey="inertia" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r: 4}} />
               </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Silhouette Scores</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data.silhouette_scores} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis dataKey="k" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                 <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                 <Tooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}} />
                 <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{r: 4}} />
               </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <PcaSection datasetId={datasetId} />
      <TsneSection datasetId={datasetId} />
    </div>
  );
}

function PcaSection({ datasetId }: { datasetId: string }) {
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading } = useGetPcaAnalysis(datasetId, { n_components: 2 }, { query: { enabled } });

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Principal Component Analysis (PCA)</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setEnabled(true)} variant="outline">Run PCA</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>PCA: Components 1 vs 2</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="pc1" name="PC1" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
              <YAxis type="number" dataKey="pc2" name="PC2" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
              <ZAxis type="number" range={[20]} />
              <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}} />
              <Scatter data={data.components_2d} fill="hsl(var(--chart-3))" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TsneSection({ datasetId }: { datasetId: string }) {
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading } = useGetTsneAnalysis(datasetId, { perplexity: 30 }, { query: { enabled } });

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>t-SNE Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setEnabled(true)} variant="outline">Run t-SNE</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>t-SNE (perplexity: {data.perplexity})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="x" name="X" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
              <YAxis type="number" dataKey="y" name="Y" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
              <ZAxis type="number" range={[20]} />
              <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}} />
              <Scatter data={data.coordinates} fill="hsl(var(--chart-4))" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
