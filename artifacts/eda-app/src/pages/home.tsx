import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "wouter";
import { useUploadDataset, useListDatasets, getListDatasetsQueryKey } from "@workspace/api-client-react";
import { UploadCloud, FileSpreadsheet, ChevronRight, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import logoFull from "@/assets/branding/logo-full.png";
import logoDark from "@/assets/branding/logo-dark.png";
import { useTheme } from "@/components/theme-provider";
import SmartLoading from "@/components/ui/smart-loading";
import { motion } from "framer-motion";

export default function Home() {
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: datasets, isLoading: datasetsLoading } = useListDatasets();
  const uploadDataset = useUploadDataset();
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    setUploadProgress(10);

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
    <div className="min-h-screen bg-background flex flex-col items-center pt-2 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-0">

        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center -mb-6">
            <img
              src={theme === "dark" ? logoDark : logoFull}
              alt="EDAFlow"
              className="
                w-[340px]
                sm:w-[460px]
                md:w-[520px]
                h-auto
                object-contain
                drop-shadow-[0_0_18px_rgba(224,184,75,0.18)]
                transition-transform duration-300
                hover:scale-[1.02]
              "
            />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Explore your data,
            <br />
            instantly.
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Drop any dataset to generate insights, visualisations, quality scores, and outlier reports — all in seconds.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative
            overflow-hidden

            border
            border-border/50

            rounded-3xl

            p-16

            text-center
            cursor-pointer

            bg-card/50
            backdrop-blur-xl

            transition-all
            duration-500

            hover:border-primary/30
            hover:shadow-[0_0_50px_rgba(224,184,75,0.12)]
            hover:-translate-y-1

            before:absolute
            before:inset-0
            before:bg-[radial-gradient(circle_at_top,rgba(224,184,75,0.08),transparent_40%)]
            before:pointer-events-none

            ${isDragActive ? `
              border-primary
              shadow-[0_0_60px_rgba(224,184,75,0.18)]
              scale-[1.01]
            ` : ""}

            ${uploadDataset.isPending ? `
              opacity-70
              cursor-not-allowed
              pointer-events-none
            ` : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
            <div
              className="
                p-5
                rounded-2xl
                bg-primary/10
                text-primary
                border
                border-primary/20
                shadow-[0_0_25px_rgba(224,184,75,0.12)]
                transition-all
                duration-300
                group-hover:scale-105
              "
            >
              {uploadDataset.isPending ? (
                <Loader2 className="h-12 w-12 animate-spin" />
              ) : (
                <UploadCloud className="h-12 w-12" />
              )}
            </div>

            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">
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
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <SmartLoading />
              </div>
            )}
          </div>
        </div>

        {/* Recent datasets */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground border-b pb-4">Recent Datasets</h2>

          {datasetsLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="
                      relative
                      overflow-hidden
                      h-40
                      rounded-3xl
                      glass-card
                      executive-border
                    "
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-transparent
                        via-white/10
                        to-transparent
                        dark:via-white/5
                      "
                    />
                  </div>
                ))}
              </div>

              <SmartLoading />
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
                  onClick={() => setLocation(`/datasets/${dataset.id}/overview`)}
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