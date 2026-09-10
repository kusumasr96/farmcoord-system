import { Link } from "react-router";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Truck,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  BarChart3,
  CloudRain,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";

export default function Dashboard() {
  const { state, getResourceById } = useApp();

  const scheduled = state.requests.filter((r) => r.status === "scheduled");
  const pending = state.requests.filter((r) => r.status === "pending" || r.status === "priority_calculated");
  const conflicted = state.requests.filter((r) => r.status === "conflict_detected");
  const highPriority = state.requests.filter((r) => r.priority.total >= 70);
  const availableResources = state.resources.filter((r) => r.available && r.maintenanceStatus === "Operational");
  const weatherNotifs = state.notifications.filter((n) => n.type === "weather_alert" && !n.read);

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">FarmGrid overview and real-time status</p>
        </div>
        <Link to="/requests/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Resources", value: state.resources.length, icon: Truck, color: "bg-primary/10 text-primary" },
          { label: "Available Resources", value: availableResources.length, icon: CheckCircle2, color: "bg-green-100 text-green-700" },
          { label: "Active Requests", value: state.requests.length, icon: FileText, color: "bg-blue-100 text-blue-700" },
          { label: "Pending Requests", value: pending.length, icon: Clock, color: "bg-amber-100 text-amber-700" },
          { label: "Conflicts", value: conflicted.length, icon: AlertTriangle, color: "bg-red-100 text-red-700" },
          { label: "High Priority", value: highPriority.length, icon: BarChart3, color: "bg-orange-100 text-orange-700" },
          { label: "Scheduled", value: scheduled.length, icon: Calendar, color: "bg-green-100 text-green-700" },
          { label: "Weather Alerts", value: weatherNotifs.length, icon: CloudRain, color: "bg-blue-100 text-blue-700" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Allocations */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Allocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduled.length === 0 ? (
              <p className="text-muted-foreground text-sm">No scheduled allocations</p>
            ) : (
              <div className="space-y-3">
                {scheduled.slice(0, 5).map((req) => {
                  const resource = getResourceById(req.schedule?.resourceId ?? "");
                  return (
                    <div key={req.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">{req.farmerName}</p>
                        <Badge variant="default" className="text-[10px]">
                          {req.priority.total}/100
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.resourceType} ({req.schedule?.resourceId}) • {req.city}
                      </p>
                      {req.schedule && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(req.schedule.start).toLocaleString()} –{" "}
                          {new Date(req.schedule.end).toLocaleString()}
                          {req.schedule.travelTime > 0 && ` (Travel: ${req.schedule.travelTime}min)`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Alerts */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CloudRain className="h-5 w-5 text-blue-500" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.notifications.filter((n) => n.type === "weather_alert").length === 0 ? (
              <p className="text-muted-foreground text-sm">No weather alerts</p>
            ) : (
              <div className="space-y-3">
                {state.notifications
                  .filter((n) => n.type === "weather_alert")
                  .map((notif) => (
                    <div key={notif.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">{notif.title}</p>
                      <p className="text-xs text-blue-700 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-blue-600 mt-1">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* High Priority Requests */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              High Priority Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highPriority.length === 0 ? (
              <p className="text-muted-foreground text-sm">No high priority requests</p>
            ) : (
              <div className="space-y-3">
                {highPriority.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{req.farmerName}</p>
                      <Badge variant="destructive" className="text-[10px]">
                        {req.priority.total}/100
                      </Badge>
                    </div>
                    <p className="text-xs text-orange-700">
                      {req.resourceType} • {req.city} • Urgency: {req.urgency}
                    </p>
                    <p className="text-xs text-orange-600 mt-1 line-clamp-2">
                      {req.priority.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conflicted.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground text-sm">No active conflicts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conflicted.map((req) => (
                  <div key={req.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-sm text-red-800">
                      {req.resourceType} Conflict
                    </p>
                    <p className="text-xs text-red-700 mt-1">{req.conflict?.resolution}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
