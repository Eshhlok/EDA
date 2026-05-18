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
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useGetDataset } from "@workspace/api-client-react";
import Overview from "./sections/overview";
import MissingValues from "./sections/missing";
import Insights from "./sections/insights";
import QualityScore from "./sections/quality-score";
import Univariate from "./sections/univariate";
import Bivariate from "./sections/bivariate";
import Multivariate from "./sections/multivariate";
import Outliers from "./sections/outliers";
import BusinessAnalytics from "./sections/business-analytics";
import logoFull from "@/assets/branding/logo-full.png";
import logoIcon from "@/assets/branding/logo-icon.png";

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
  { name: "Business Analytics", path: "business-analytics", icon: Activity },
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
      case "univariate": return <Univariate datasetId={datasetId} />;
      case "bivariate": return <Bivariate datasetId={datasetId} />;
      case "multivariate": return <Multivariate datasetId={datasetId} />;
      case "outliers": return <Outliers datasetId={datasetId} />;
      case "insights": return <Insights datasetId={datasetId} />;
      case "quality-score": return <QualityScore datasetId={datasetId} />;
      case "business-analytics":return <BusinessAnalytics datasetId={datasetId} />;
      default: return <Overview datasetId={datasetId} />;
    }
  };

  return (
    <div
        className="
          flex
          h-screen
          overflow-hidden
          bg-background
          relative

          before:absolute
          before:inset-0
          before:bg-[radial-gradient(circle_at_top,rgba(224,184,75,0.08),transparent_28%)]

          after:absolute
          after:inset-0
          after:bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.06),transparent_30%)]

          before:pointer-events-none
          after:pointer-events-none
        "
    >
      {/* Sidebar */}
      <aside
          className="
            w-64
            border-r
            bg-card/80
            backdrop-blur-xl
            flex
            flex-col
            flex-shrink-0
            relative z-10
          "
      >

        {/* EDAFlow logo */}

        <div
          className="
            h-20
            border-b
            flex
            items-center
            justify-center
            px-4
            bg-background/80
            backdrop-blur-sm
          "
        >

          <img
            src={logoIcon}
            alt="EDAFlow"
            className="
              w-[180px]
              h-auto
              object-contain
              transition-transform duration-300
              hover:scale-[1.02]
              drop-shadow-[0_0_12px_rgba(224,184,75,0.15)]
            "
          />

        </div>

        {/* Back link */}
        <div
          className="h-12 border-b flex items-center px-4 hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => setLocation("/")}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">All datasets</span>
        </div>
        
        {/* Dataset info */}
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(`/datasets/${datasetId}/${item.path}`)}
                className={`
                  group
                  relative
                  w-full
                  flex
                  items-center
                  space-x-3
                  px-3
                  py-2.5
                  text-sm
                  rounded-xl
                  transition-all
                  duration-300

                  ${
                    isActive
                      ? `
                        bg-primary/10
                        text-primary
                        font-medium
                        border
                        border-primary/20
                        shadow-[0_0_18px_rgba(224,184,75,0.08)]
                        backdrop-blur-sm
                      `
                      : `
                        text-muted-foreground
                        hover:bg-muted/60
                        hover:text-foreground
                        hover:border
                        hover:border-border/50
                      `
                  }
                `}
              >
                <Icon
                  className={`
                    h-4
                    w-4
                    transition-all
                    duration-300

                    ${
                      isActive
                        ? `
                          text-primary
                          scale-110
                        `
                        : `
                          text-muted-foreground
                          group-hover:text-primary
                          group-hover:scale-105
                        `
                    }
                  `}
                />
                {isActive && (

                  <div
                    className="
                      absolute
                      left-0
                      top-1/2
                      -translate-y-1/2
                      h-6
                      w-1
                      rounded-r-full
                      bg-primary
                      shadow-[0_0_12px_rgba(224,184,75,0.8)]
                    "
                  />

                )}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
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
        </header>

        <div className="flex-1 overflow-y-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
