import { useState } from "react";
import { Link } from "react-router";
import { useApp, getOccupiedResourceIds } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Truck,
  Clock,
  Wrench,
  User,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Package,
} from "lucide-react";

export default function ResourceOwner() {
  const { state } = useApp();
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  function getBookings(resourceId: string) {
    return state.requests.filter(
      (r) => r.resourceId === resourceId && r.status === "scheduled"
    );
  }

  function maintenanceColor(status: string) {
    switch (status) {
      case "Operational": return "default";
      case "Under Maintenance": return "secondary";
      case "Needs Repair": return "destructive";
      default: return "secondary";
    }
  }

  // Same availability calculation as Master Scheduling Dashboard (shared helper from AppContext):
  // Available = Total resources minus unique resources with an ACTIVE scheduled allocation
  const occupiedResourceIds = getOccupiedResourceIds(state.requests);
  const totalAvailable = state.resources.filter(
    (r) => r.available && r.maintenanceStatus === "Operational" && !occupiedResourceIds.has(r.id)
  ).length;
  const totalMaintenance = state.resources.filter((r) => r.maintenanceStatus !== "Operational").length;
  const totalBookings = state.requests.filter((r) => r.resourceId && r.status === "scheduled").length;

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Resource Owner Portal</h1>
      <p className="text-muted-foreground mb-6">Manage your agricultural resources, view bookings, and track maintenance.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Resources", value: state.resources.length, icon: Package, color: "bg-primary/10 text-primary" },
          { label: "Available", value: totalAvailable, icon: CheckCircle2, color: "bg-green-100 text-green-700" },
          { label: "Active Bookings", value: totalBookings, icon: Clock, color: "bg-amber-100 text-amber-700" },
          { label: "Maintenance", value: totalMaintenance, icon: Wrench, color: "bg-red-100 text-red-700" },
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

      {/* Resource Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {state.resources.map((resource) => {
          const bookings = getBookings(resource.id);
          const isSelected = selectedResource === resource.id;

          return (
            <Card
              key={resource.id}
              className={`border-border/60 cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => setSelectedResource(isSelected ? null : resource.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{resource.id}</h3>
                      <p className="text-sm text-muted-foreground">{resource.name}</p>
                    </div>
                  </div>
                  <Badge variant={maintenanceColor(resource.maintenanceStatus)}>
                    {resource.maintenanceStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    {resource.type}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    {resource.operationalLocation}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {resource.operatingStart}:00 – {resource.operatingEnd}:00
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {resource.operatorAvailable ? "Operator Available" : "No Operator"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant={resource.available ? "default" : "destructive"} className="text-[10px]">
                    {resource.available ? "Available" : "Unavailable"}
                  </Badge>
                  {resource.attachment !== "No attachment needed" && (
                    <Badge variant="secondary" className="text-[10px]">
                      {resource.attachment}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {resource.fuelRequirements}
                  </Badge>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold mb-2">Specifications</h4>
                    <p className="text-xs text-muted-foreground mb-3">{resource.specifications}</p>

                    <h4 className="text-sm font-semibold mb-2">
                      Bookings ({bookings.length})
                    </h4>
                    {bookings.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No active bookings</p>
                    ) : (
                      <div className="space-y-2">
                        {bookings.map((b) => (
                          <div key={b.id} className="p-2 bg-muted/50 rounded text-xs">
                            <p className="font-medium">{b.farmerName}</p>
                            <p className="text-muted-foreground">
                              {new Date(b.earliestStart).toLocaleString()} –{" "}
                              {new Date(b.latestEnd).toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              Duration: {b.duration}min | Priority: {b.priority.total}/100
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
