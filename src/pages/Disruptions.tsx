import { useState } from "react";
import { Link } from "react-router";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wrench,
  CloudRain,
  XCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function Disruptions() {
  const { state, dispatch, getResourceById } = useApp();
  const [activeDisruption, setActiveDisruption] = useState<{
    type: string;
    description: string;
    affectedRequestId: string;
    affectedFarmerId: string;
    affectedResourceId: string;
    reallocation?: {
      resourceId: string;
      startTime: string;
      endTime: string;
      travelTime: number;
    };
  } | null>(null);

  const scheduled = state.requests.filter((r) => r.status === "scheduled" && r.schedule);

  function simulateBreakdown() {
    const affected = scheduled[0];
    if (!affected || !affected.schedule) return;

    setActiveDisruption({
      type: "machine_breakdown",
      description: `${affected.schedule.resourceId} has broken down and is no longer operational. The scheduled allocation for ${affected.farmerName} is affected.`,
      affectedRequestId: affected.id,
      affectedFarmerId: affected.farmerId,
      affectedResourceId: affected.schedule.resourceId,
    });

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `N_${Date.now()}`,
        type: "machine_breakdown",
        title: "🔧 Machine Breakdown",
        message: `${affected.schedule.resourceId} has broken down. ${affected.farmerName}'s allocation is affected.`,
        timestamp: new Date().toISOString(),
        read: false,
        farmerId: affected.farmerId,
        requestId: affected.id,
        resourceId: affected.schedule.resourceId,
      },
    });
  }

  function simulateRain() {
    const affected = scheduled.find((r) => r.weatherRisk === "high") ?? scheduled[0];
    if (!affected) return;

    setActiveDisruption({
      type: "rain_disruption",
      description: `Heavy rain expected at ${affected.city}. ${affected.farmerName}'s scheduled ${affected.resourceType} activity may be affected.`,
      affectedRequestId: affected.id,
      affectedFarmerId: affected.farmerId,
      affectedResourceId: affected.schedule?.resourceId ?? "",
    });

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `N_${Date.now()}`,
        type: "weather_alert",
        title: "🌧️ Weather Alert",
        message: `Heavy rain expected at ${affected.city}. ${affected.farmerName}'s scheduled ${affected.resourceType} activity may be affected. Please review your schedule.`,
        timestamp: new Date().toISOString(),
        read: false,
        farmerId: affected.farmerId,
        requestId: affected.id,
      },
    });
  }

  function simulateCancellation() {
    const affected = scheduled[1] ?? scheduled[0];
    if (!affected || !affected.schedule) return;

    setActiveDisruption({
      type: "cancellation",
      description: `${affected.farmerName} has cancelled the ${affected.resourceType} request. The resource slot is now available.`,
      affectedRequestId: affected.id,
      affectedFarmerId: affected.farmerId,
      affectedResourceId: affected.schedule.resourceId,
    });

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `N_${Date.now()}`,
        type: "schedule_change",
        title: "❌ Cancellation",
        message: `${affected.farmerName} has cancelled the ${affected.resourceType} request. The resource slot is now available.`,
        timestamp: new Date().toISOString(),
        read: false,
        farmerId: affected.farmerId,
        requestId: affected.id,
        resourceId: affected.schedule.resourceId,
      },
    });
  }

  function simulateDelay() {
    const affected = scheduled[2] ?? scheduled[0];
    if (!affected || !affected.schedule) return;

    setActiveDisruption({
      type: "delay",
      description: `${affected.farmerName}'s ${affected.resourceType} delivery is delayed by 2 hours due to road conditions.`,
      affectedRequestId: affected.id,
      affectedFarmerId: affected.farmerId,
      affectedResourceId: affected.schedule.resourceId,
    });

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `N_${Date.now()}`,
        type: "schedule_change",
        title: "⏰ Delay Alert",
        message: `${affected.farmerName}'s ${affected.resourceType} delivery is delayed by 2 hours.`,
        timestamp: new Date().toISOString(),
        read: false,
        farmerId: affected.farmerId,
        requestId: affected.id,
        resourceId: affected.schedule.resourceId,
      },
    });
  }

  function handleReallocate() {
    if (!activeDisruption) return;
    const req = state.requests.find((r) => r.id === activeDisruption.affectedRequestId);
    if (!req || !req.schedule) return;

    // Find alternative resource
    const alternativeResources = state.resources.filter(
      (r) =>
        r.type === req.resourceType &&
        r.id !== activeDisruption.affectedResourceId &&
        r.maintenanceStatus === "Operational" &&
        r.available
    );

    if (alternativeResources.length > 0) {
      const altResource = alternativeResources[0];
      const distance = Math.sqrt(
        Math.pow((req.lat - altResource.lat) * 111, 2) +
        Math.pow((req.lng - altResource.lng) * 111 * Math.cos((req.lat * Math.PI) / 180), 2)
      );
      const travelMin = Math.round(distance * 2);

      const newStart = new Date(req.earliestStart);
      const newEnd = new Date(newStart.getTime() + req.duration * 60000);

      dispatch({
        type: "REALLOCATE_REQUEST",
        payload: {
          requestId: req.id,
          resourceId: altResource.id,
          schedule: {
            resourceId: altResource.id,
            farmerId: req.farmerId,
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
            duration: req.duration,
            travelTime: travelMin,
            bufferTime: 30,
            status: "tentative",
          },
        },
      });

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `N_${Date.now()}`,
          type: "reallocation",
          title: "🔄 Reallocation Complete",
          message: `${req.farmerName}'s ${req.resourceType} request has been reallocated to ${altResource.id} (${altResource.name}) at ${altResource.operationalLocation}.`,
          timestamp: new Date().toISOString(),
          read: false,
          farmerId: req.farmerId,
          requestId: req.id,
          resourceId: altResource.id,
        },
      });

      setActiveDisruption({
        ...activeDisruption,
        reallocation: {
          resourceId: altResource.id,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          travelTime: travelMin,
        },
      });
    }
  }

  function handleWeatherReview() {
    if (!activeDisruption || activeDisruption.type !== "rain_disruption") return;
    const req = state.requests.find((r) => r.id === activeDisruption.affectedRequestId);
    if (!req) return;

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `N_${Date.now()}`,
        type: "schedule_change",
        title: "📅 Schedule Reviewed",
        message: `${req.farmerName} has reviewed the weather notification. No changes made to the schedule.`,
        timestamp: new Date().toISOString(),
        read: false,
        farmerId: req.farmerId,
        requestId: req.id,
      },
    });

    setActiveDisruption(null);
  }

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Disruptions & Reallocation</h1>
      <p className="text-muted-foreground mb-6">
        Simulate disruptions and manage reallocations. Weather alerts only create notifications — explicit action is required to reallocate.
      </p>

      {/* Demo Buttons */}
      <Card className="mb-6 border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Simulate Disruption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 border-red-200 hover:bg-red-50"
              onClick={simulateBreakdown}
              disabled={scheduled.length === 0}
            >
              <Wrench className="h-6 w-6 text-red-500" />
              <span className="text-sm font-medium">Machine Breakdown</span>
              <span className="text-[10px] text-muted-foreground">Break a resource</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 border-blue-200 hover:bg-blue-50"
              onClick={simulateRain}
              disabled={scheduled.length === 0}
            >
              <CloudRain className="h-6 w-6 text-blue-500" />
              <span className="text-sm font-medium">Rain Disruption</span>
              <span className="text-[10px] text-muted-foreground">Simulate weather alert</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 border-amber-200 hover:bg-amber-50"
              onClick={simulateCancellation}
              disabled={scheduled.length === 0}
            >
              <XCircle className="h-6 w-6 text-amber-500" />
              <span className="text-sm font-medium">Cancellation</span>
              <span className="text-[10px] text-muted-foreground">Cancel a booking</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 border-orange-200 hover:bg-orange-50"
              onClick={simulateDelay}
              disabled={scheduled.length === 0}
            >
              <Clock className="h-6 w-6 text-orange-500" />
              <span className="text-sm font-medium">Delay</span>
              <span className="text-[10px] text-muted-foreground">Simulate a delay</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Disruption */}
      {activeDisruption && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Active Disruption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-800">{activeDisruption.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Affected Request: {activeDisruption.affectedRequestId} | Resource: {activeDisruption.affectedResourceId}
                </p>
              </div>

              {activeDisruption.reallocation ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">✅ Reallocation Complete</p>
                  <p className="text-xs text-green-700 mt-1">
                    New Resource: {activeDisruption.reallocation.resourceId} |{" "}
                    Time: {new Date(activeDisruption.reallocation.startTime).toLocaleString()} –{" "}
                    {new Date(activeDisruption.reallocation.endTime).toLocaleString()} |{" "}
                    Travel: {activeDisruption.reallocation.travelTime}min
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {activeDisruption.type === "rain_disruption" ? (
                    <>
                      <Button onClick={handleWeatherReview} size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Acknowledge Weather Alert
                      </Button>
                      <Button onClick={handleReallocate} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reallocate Anyway
                      </Button>
                      <Button onClick={() => setActiveDisruption(null)} variant="ghost" size="sm">
                        Dismiss
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleReallocate} size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reallocate
                      </Button>
                      <Button onClick={() => setActiveDisruption(null)} variant="ghost" size="sm">
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affected Allocations */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Scheduled Allocations (can be disrupted)</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduled.length === 0 ? (
            <p className="text-muted-foreground text-sm">No scheduled allocations to disrupt.</p>
          ) : (
            <div className="space-y-3">
              {scheduled.map((req) => {
                const resource = getResourceById(req.schedule?.resourceId ?? "");
                return (
                  <div key={req.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{req.farmerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.resourceType} ({req.schedule?.resourceId}) • {req.city}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.schedule && (
                          <>
                            {new Date(req.schedule.start).toLocaleString()} –{" "}
                            {new Date(req.schedule.end).toLocaleString()}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge variant="default">Scheduled</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
