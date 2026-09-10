import { useState } from "react";
import { Link } from "react-router";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  BarChart3,
} from "lucide-react";

export default function Schedule() {
  const { state, getResourceById } = useApp();
  const [selectedDate, setSelectedDate] = useState("2026-09-12");

  const scheduled = state.requests.filter((r) => r.schedule);
  const conflicted = state.requests.filter((r) => r.conflict);
  const highPriority = state.requests.filter((r) => r.priority.total >= 70);
  // Available = Total resources minus unique resources that have a confirmed schedule
  const occupiedResourceIds = new Set(
    scheduled.map((r) => r.schedule!.resourceId)
  );
  const availableResources = state.resources.filter(
    (r) => r.available && r.maintenanceStatus === "Operational" && !occupiedResourceIds.has(r.id)
  );

  // Group schedule by date
  const byDate: Record<string, typeof scheduled> = {};
  for (const req of scheduled) {
    if (req.schedule) {
      const date = req.schedule.start.split("T")[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(req);
    }
  }

  const dates = Object.keys(byDate).sort();

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Master Scheduling Dashboard</h1>
      <p className="text-muted-foreground mb-6">Unified view of all resources, allocations, and scheduling constraints.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Resources", value: state.resources.length, icon: Truck, color: "bg-primary/10 text-primary" },
          { label: "Available Resources", value: availableResources.length, icon: CheckCircle2, color: "bg-green-100 text-green-700" },
          { label: "Scheduled Allocations", value: scheduled.length, icon: Calendar, color: "bg-blue-100 text-blue-700" },
          { label: "Active Conflicts", value: conflicted.length, icon: AlertTriangle, color: "bg-red-100 text-red-700" },
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

      <Tabs defaultValue="timeline">
        <TabsList className="mb-4">
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Truck className="h-4 w-4 mr-1" />
            By Resource
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Conflicts
          </TabsTrigger>
          <TabsTrigger value="priority">
            <BarChart3 className="h-4 w-4 mr-1" />
            Priority Ranking
          </TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline">
          {dates.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center text-muted-foreground">
                No scheduled allocations yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Date selector */}
              <div className="flex flex-wrap gap-2">
                {dates.map((date) => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(date)}
                  >
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {(byDate[date] ?? []).length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Timeline for selected date */}
              <div className="space-y-3">
                {(byDate[selectedDate] ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No allocations on this date</p>
                ) : (
                  (byDate[selectedDate] ?? [])
                    .sort((a, b) =>
                      new Date(a.schedule!.start).getTime() -
                      new Date(b.schedule!.start).getTime()
                    )
                    .map((req, i) => {
                      const resource = getResourceById(req.schedule!.resourceId);
                      const start = new Date(req.schedule!.start);
                      const end = new Date(req.schedule!.end);
                      const startH = start.getHours();
                      const endH = end.getHours() + end.getMinutes() / 60;
                      const width = Math.max(10, ((endH - startH) / 12) * 100); // scale to 12hr day

                      return (
                        <div key={req.id} className="flex items-center gap-4">
                          <div className="w-16 text-right text-xs text-muted-foreground shrink-0">
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="flex-1 relative">
                            {/* Time grid background */}
                            <div className="h-12 bg-muted/30 rounded-lg relative overflow-hidden">
                              {/* Allocation bar */}
                              <div
                                className="absolute top-1 bottom-1 rounded-md bg-primary/80 flex items-center px-3 text-xs text-white font-medium overflow-hidden"
                                style={{
                                  left: `${((startH - 6) / 12) * 100}%`,
                                  width: `${width}%`,
                                  minWidth: "120px",
                                }}
                              >
                                <span className="truncate">
                                  {req.farmerName} • {req.schedule!.resourceId}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-24 text-right shrink-0">
                            <Badge variant={req.priority.total >= 70 ? "destructive" : "default"} className="text-[10px]">
                              {req.priority.total}/100
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary/80" />
                  <span>Scheduled Allocation</span>
                </div>
                <span>|</span>
                <div className="flex items-center gap-1.5">
                  <span>Travel/Buffer: 30min between allocations</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* By Resource View */}
        <TabsContent value="resources">
          <div className="space-y-4">
            {state.resources.map((resource) => {
              const bookings = scheduled.filter(
                (r) => r.schedule?.resourceId === resource.id
              );
              return (
                <Card key={resource.id} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-sm">{resource.id} – {resource.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {resource.operationalLocation} | {resource.operatingStart}:00 – {resource.operatingEnd}:00
                          </p>
                        </div>
                      </div>
                      <Badge variant={resource.maintenanceStatus === "Operational" ? "default" : "destructive"}>
                        {resource.maintenanceStatus}
                      </Badge>
                    </div>

                    {bookings.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No bookings</p>
                    ) : (
                      <div className="space-y-2">
                        {bookings.map((b) => (
                          <div key={b.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded text-xs">
                            <div className="w-20 shrink-0">
                              <p className="font-medium">{b.farmerName}</p>
                              <p className="text-muted-foreground">{b.city}</p>
                            </div>
                            <div className="flex-1">
                              <p>
                                {new Date(b.schedule!.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                                {new Date(b.schedule!.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-muted-foreground">
                                Duration: {b.schedule!.duration}min
                                {b.schedule!.travelTime > 0 && ` | Travel: ${b.schedule!.travelTime}min`}
                                {b.schedule!.bufferTime > 0 && ` | Buffer: ${b.schedule!.bufferTime}min`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant={b.priority.total >= 70 ? "destructive" : "secondary"}>
                                {b.priority.total}/100
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Conflicts View */}
        <TabsContent value="conflicts">
          {conflicted.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No active conflicts
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conflicted.map((req) => (
                <Card key={req.id} className="border-red-200 bg-red-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-red-800">
                          ⚠️ Scheduling Conflict – {req.resourceType}
                        </h3>
                        <p className="text-xs text-red-700 mt-1">{req.conflict?.resolution}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge variant="destructive">
                            {req.farmerName} ({req.priority.total}/100)
                          </Badge>
                          <Badge variant="outline">
                            {new Date(req.earliestStart).toLocaleString()} – {new Date(req.latestEnd).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Priority Ranking */}
        <TabsContent value="priority">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Requests Ranked by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...state.requests]
                  .sort((a, b) => b.priority.total - a.priority.total)
                  .map((req, i) => (
                    <div key={req.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{req.farmerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.resourceType} • {req.city} • {req.crop}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {req.priority.total}
                          <span className="text-[10px] font-normal">/100</span>
                        </div>
                        <Badge
                          variant={
                            req.priority.total >= 70
                              ? "destructive"
                              : req.priority.total >= 40
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1 text-[10px]"
                        >
                          {req.priority.total >= 70 ? "High" : req.priority.total >= 40 ? "Medium" : "Low"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
