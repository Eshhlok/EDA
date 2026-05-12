import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "wouter";
import { useUploadDataset, useListDatasets, getListDatasetsQueryKey } from "@workspace/api-client-react";
import { UploadCloud, FileSpreadsheet, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: datasets, isLoading: datasetsLoading } = useListDatasets();
  const uploadDataset = useUploadDataset();
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setUploadProgress(10);
    
    // Simulate progress for UI
    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    uploadDataset.mutate(
      { data: { file } },
      {
        onSuccess: (data) => {
          clearInterval(interval);
          setUploadProgress(100);
          queryClient.invalidateQueries({ queryKey: getListDatasetsQueryKey() });
          setTimeout(() => {
            setLocation(`/datasets/${data.id}/overview`);
          }, 500);
        },
        onError: () => {
          clearInterval(interval);
          setUploadProgress(0);
        }
      }
    );
  }, [uploadDataset, queryClient, setLocation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
      'application/octet-stream': ['.parquet'],
      'text/tab-separated-values': ['.tsv']
    },
    maxFiles: 1,
    disabled: uploadDataset.isPending
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            EDA Explorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade exploratory data analysis workspace. Drop your data to instantly generate insights, visualizations, and quality scores.
          </p>
        </div>

        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
            ${uploadDataset.isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              {uploadDataset.isPending ? (
                <Loader2 className="h-12 w-12 animate-spin" />
              ) : (
                <UploadCloud className="h-12 w-12" />
              )}
            </div>
            <div>
              <p className="text-xl font-medium text-foreground">
                {isDragActive ? "Drop the file here" : "Drag & drop your dataset"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports CSV, Excel, JSON, Parquet, and TSV files
              </p>
            </div>
            
            {uploadDataset.isPending && (
              <div className="w-full max-w-md mt-6">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-200 ease-out"
                    style={{ width: `\${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">Processing dataset...</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground border-b pb-4">Recent Datasets</h2>
          
          {datasetsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : datasets?.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No datasets uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {datasets?.map((dataset) => (
                <div 
                  key={dataset.id}
                  onClick={() => setLocation(`/datasets/\${dataset.id}/overview`)}
                  className="group flex flex-col justify-between p-6 bg-card border rounded-xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg truncate pr-2 text-card-foreground" title={dataset.filename}>
                        {dataset.filename}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground font-mono">
                        {dataset.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground font-mono">
                      <div>Rows: {dataset.rows.toLocaleString()}</div>
                      <div>Cols: {dataset.cols}</div>
                      <div>Size: {dataset.size_mb.toFixed(2)} MB</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(dataset.created_at), 'MMM d, yyyy')}</span>
                    <span className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                      Open <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
