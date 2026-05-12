import { useRoute, useLocation } from "wouter";
import { 
  BarChart2, 
  Table, 
  AlertTriangle, 
  Activity, 
  ScatterChart, 
  Network, 
  ShieldAlert, 
  Lightbulb, 
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { useGetDataset } from "@workspace/api-client-react";
import Overview from "./sections/overview";
import MissingValues from "./sections/missing";
import Insights from "./sections/insights";
import QualityScore from "./sections/quality-score";

// Placeholder for remaining
const Univariate = () => <div className="p-6">Univariate Component</div>;
const Bivariate = () => <div className="p-6">Bivariate Component</div>;
const Multivariate = () => <div className="p-6">Multivariate Component</div>;
const Outliers = () => <div className="p-6">Outliers Component</div>;

type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { name: "Overview", path: "overview", icon: Table },
  { name: "Missing Values", path: "missing", icon: AlertTriangle },
  { name: "Univariate", path: "univariate", icon: BarChart2 },
  { name: "Bivariate", path: "bivariate", icon: ScatterChart },
  { name: "Multivariate", path: "multivariate", icon: Network },
  { name: "Outliers", path: "outliers", icon: ShieldAlert },
  { name: "Insights", path: "insights", icon: Lightbulb },
  { name: "Quality Score", path: "quality-score", icon: CheckCircle2 },
];

export default function DatasetLayout() {
  const [match, params] = useRoute("/datasets/:id/:section?");
  const [, setLocation] = useLocation();
  const datasetId = params?.id;
  const currentSection = params?.section || "overview";

  const { data: dataset, isLoading } = useGetDataset(datasetId || "", {
    query: { enabled: !!datasetId }
  });

  if (!datasetId) return null;

  const renderSection = () => {
    switch (currentSection) {
      case "overview": return <Overview datasetId={datasetId} />;
      case "missing": return <MissingValues datasetId={datasetId} />;
      case "univariate": return <Univariate />;
      case "bivariate": return <Bivariate />;
      case "multivariate": return <Multivariate />;
      case "outliers": return <Outliers />;
      case "insights": return <Insights datasetId={datasetId} />;
      case "quality-score": return <QualityScore datasetId={datasetId} />;
      default: return <Overview datasetId={datasetId} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col flex-shrink-0">
        <div className="h-14 border-b flex items-center px-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setLocation("/")}>
          <ChevronLeft className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-semibold text-sm">Back to Datasets</span>
        </div>
        
        <div className="p-4 border-b space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <>
              <h2 className="font-medium text-sm truncate" title={dataset?.filename}>
                {dataset?.filename}
              </h2>
              <div className="flex gap-2 text-xs text-muted-foreground font-mono">
                <span>{dataset?.rows.toLocaleString()} rows</span>
                <span>•</span>
                <span>{dataset?.cols} cols</span>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(`/datasets/\${datasetId}/\${item.path}`)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors
                  \${isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className={`h-4 w-4 \${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-background flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="font-semibold text-lg capitalize">
              {currentSection.replace('-', ' ')}
            </h1>
            {dataset?.is_sampled && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-500 rounded border border-amber-500/20">
                Sampled ({dataset.sample_size})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Quality Score calculated in background</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
