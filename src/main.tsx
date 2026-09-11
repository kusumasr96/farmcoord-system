import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppProvider } from "@/context/AppContext";
import Layout from "@/components/Layout";
import "./index.css";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const FarmerPortal = lazy(() => import("./pages/FarmerPortal.tsx"));
const MyProfile = lazy(() => import("./pages/MyProfile.tsx"));
const NewRequest = lazy(() => import("./pages/NewRequest.tsx"));
const Requests = lazy(() => import("./pages/Requests.tsx"));
const ResourceOwner = lazy(() => import("./pages/ResourceOwner.tsx"));
const Schedule = lazy(() => import("./pages/Schedule.tsx"));
const Disruptions = lazy(() => import("./pages/Disruptions.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error" };
  }
  componentDidCatch(err: Error) {
    console.error("[FarmGrid] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/farmer-portal" element={<FarmerPortal />} />
                <Route path="/my-profile" element={<MyProfile />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/new" element={<NewRequest />} />
                <Route path="/resource-owner" element={<ResourceOwner />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/disruptions" element={<Disruptions />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AppProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
