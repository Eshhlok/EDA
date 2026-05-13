import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import DatasetLayout from "@/pages/dataset-layout";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import Footer from "@/components/ui/footer";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={AnalyticsDashboard} />
      <Route path="/datasets/:id/*?" component={DatasetLayout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isDashboard = location === "/dashboard";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <div className={isDashboard ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}>
            <div className={isDashboard ? "flex-1 overflow-hidden" : "flex-1"}>
              <WouterRouter
                base={import.meta.env.BASE_URL.replace(/\/$/, "")}
              >
                <Router />
              </WouterRouter>
            </div>

            {!isDashboard && <Footer />}

            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function App() {
  return <AppContent />;
}
