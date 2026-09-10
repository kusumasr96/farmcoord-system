import { useState, useRef, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router";
import { useApp } from "@/context/AppContext";
import {
  Bell,
  Menu,
  X,
  Wifi,
  WifiOff,
  Sprout,
  ChevronRight,
  Check,
  CheckCheck,
  RefreshCw,
  CloudOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/farmer-portal", label: "Farmer Portal" },
  { to: "/resource-owner", label: "Resource Owner" },
  { to: "/requests", label: "Requests" },
  { to: "/schedule", label: "Schedule" },
  { to: "/disruptions", label: "Disruptions" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Layout() {
  const location = useLocation();
  const { state, dispatch } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function getNotifIcon(type: string) {
    switch (type) {
      case "weather_alert": return "🌧️";
      case "machine_breakdown": return "🔧";
      case "conflict_detected": return "⚠️";
      case "resource_allocated": return "🚜";
      case "priority_calculated": return "📊";
      case "request_submitted": return "📋";
      case "high_priority": return "🔥";
      case "schedule_change": return "📅";
      case "alternative_available": return "✅";
      case "offline_saved": return "📴";
      case "sync_completed": return "☁️";
      case "reallocation": return "🔄";
      default: return "📌";
    }
  }

  function handleNotifClick(notifId: string, notif: typeof state.notifications[0]) {
    dispatch({ type: "MARK_READ", payload: notifId });
    setNotifOpen(false);
    if (notif.requestId) {
      window.location.href = "/requests";
    } else if (notif.resourceId) {
      window.location.href = "/resource-owner";
    }
  }

  return (
    <div className="min-h-screen bg-background farmgrid-theme">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Sprout className="h-6 w-6" />
            <span>FarmGrid</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Offline controls */}
            {state.offlineMode ? (
              <Badge variant="destructive" className="gap-1 text-xs">
                <WifiOff className="h-3 w-3" />
                Offline
                {state.offlineRequests.length > 0 && (
                  <span>({state.offlineRequests.length} pending)</span>
                )}
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => {
                if (state.offlineMode) {
                  dispatch({ type: "SET_OFFLINE", payload: false });
                  dispatch({ type: "SYNC_OFFLINE_REQUESTS" });
                  if (state.offlineRequests.length > 0) {
                    dispatch({
                      type: "ADD_NOTIFICATION",
                      payload: {
                        id: `N_${Date.now()}`,
                        type: "sync_completed",
                        title: "☁️ Sync Completed",
                        message: `${state.offlineRequests.length} offline request(s) synchronized successfully.`,
                        timestamp: new Date().toISOString(),
                        read: false,
                      },
                    });
                  }
                } else {
                  dispatch({ type: "SET_OFFLINE", payload: true });
                }
              }}
            >
              {state.offlineMode ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restore
                </>
              ) : (
                <>
                  <CloudOff className="h-3.5 w-3.5" />
                  Go Offline
                </>
              )}
            </Button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => dispatch({ type: "MARK_ALL_READ" })}
                      >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {state.notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        No notifications
                      </div>
                    ) : (
                      state.notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotifClick(notif.id, notif)}
                          className={cn(
                            "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                            !notif.read && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg mt-0.5">{getNotifIcon(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn("text-sm font-medium truncate", !notif.read && "font-semibold")}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {new Date(notif.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-white">
            <nav className="p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.to
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
