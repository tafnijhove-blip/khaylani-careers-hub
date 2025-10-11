import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import Auth from "./pages/Auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import BackgroundEffect from "./components/BackgroundEffect";
import { LanguageProvider } from "./contexts/LanguageContext";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vacatures = lazy(() => import("./pages/Vacatures"));
const Kandidaten = lazy(() => import("./pages/Kandidaten"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <BackgroundEffect />
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" message="Applicatie laden..." />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/superadmin" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-14 border-b flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <SuperAdminDashboard />
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              <Route path="/bedrijf/:companyId" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-14 border-b flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <CompanyDashboard />
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              <Route path="/bedrijf/:companyId/vacatures" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-14 border-b flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <Vacatures />
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              <Route path="/bedrijf/:companyId/kandidaten" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-14 border-b flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <Kandidaten />
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              <Route path="/bedrijf/:companyId/analytics" element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="h-14 border-b flex items-center px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <Analytics />
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              } />
              {/* Fallback routes for backwards compatibility */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vacatures" element={<Vacatures />} />
              <Route path="/kandidaten" element={<Kandidaten />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
