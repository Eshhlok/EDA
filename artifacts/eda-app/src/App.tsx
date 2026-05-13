import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import DatasetLayout from "@/pages/dataset-layout";
import "@/components/ui/footer";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/datasets/:id/*?" component={DatasetLayout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              <WouterRouter
                base={import.meta.env.BASE_URL.replace(/\/$/, "")}
              >
                <Router />
              </WouterRouter>
            </div>

            <Footer />

            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
