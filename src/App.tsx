import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import Auth from "./pages/Auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import BackgroundEffect from "./components/BackgroundEffect";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vacatures = lazy(() => import("./pages/Vacatures"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const RecruiterDashboard = lazy(() => import("./pages/RecruiterDashboard"));
const AccountManagerDashboard = lazy(() => import("./pages/AccountManagerDashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Role-specific dashboards */}
              <Route path="/superadmin" element={
                <ProtectedRoute requiredRoles={["superadmin"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/recruiter" element={
                <ProtectedRoute requiredRoles={["recruiter"]}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/accountmanager" element={
                <ProtectedRoute requiredRoles={["accountmanager"]}>
                  <AccountManagerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/manager" element={
                <ProtectedRoute requiredRoles={["ceo"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/bedrijf/:companyId" element={
                <ProtectedRoute requiredRoles={["ceo", "accountmanager", "recruiter"]}>
                  <CompanyDashboard />
                </ProtectedRoute>
              } />
              
              {/* Fallback routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/vacatures" element={
                <ProtectedRoute requiredRoles={["ceo", "accountmanager", "recruiter"]}>
                  <Vacatures />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute requiredRoles={["ceo", "accountmanager"]}>
                  <Analytics />
                </ProtectedRoute>
              } />
              
              {/* Legal pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
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
