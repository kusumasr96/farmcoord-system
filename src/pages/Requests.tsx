import { useState } from "react";
import { Link } from "react-router";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Wrench,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ResourceRequest } from "@/types/farmgrid";

export default function Requests() {
  const { state, dispatch, getResourceById } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

  function getFiltered(status: string) {
    switch (status) {
      case "pending":
        return state.requests.filter((r) => r.status === "pending" || r.status === "priority_calculated");
      case "high_priority":
        return state.requests.filter((r) => r.priority.total >= 70);
      case "conflicts":
        return state.requests.filter((r) => r.status === "conflict_detected");
      case "scheduled":
        return state.requests.filter((r) => r.status === "scheduled");
      case "completed":
        return state.requests.filter((r) => r.status === "completed");
      case "disrupted":
        return state.requests.filter((r) => r.status === "disrupted");
      default:
        return state.requests;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "scheduled": return "default";
      case "conflict_detected": return "destructive";
      case "completed": return "secondary";
      case "disrupted": return "destructive";
      case "pending": return "outline";
      case "priority_calculated": return "secondary";
      default: return "secondary";
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "scheduled": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "conflict_detected": return <AlertTriangle className="h-3.5 w-3.5" />;
      case "completed": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "disrupted": return <Wrench className="h-3.5 w-3.5" />;
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "priority_calculated": return <Filter className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  }

  function RequestCard({ req }: { req: ResourceRequest }) {
    const isExpanded = expanded === req.id;
    const resource = getResourceById(req.resourceId ?? "");
    return (
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <button
            onClick={() => setExpanded(isExpanded ? null : req.id)}
            className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{req.id}</span>
                  <Badge variant={statusColor(req.status) as "default" | "destructive" | "secondary" | "outline"} className="text-xs gap-1">
                    {statusIcon(req.status)}
                    {req.status.replace(/_/g, " ")}
                  </Badge>
                  {req.priority.total >= 70 && (
                    <Badge variant="destructive" className="text-[10px]">High Priority</Badge>
                  )}
                </div>
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(req.earliestStart).toLocaleDateString()}
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground mt-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground mt-2" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 border-t border-border/50">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Farmer:</span>
                  <span className="ml-1 font-medium">{req.farmerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-1 font-medium">{req.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">City:</span>
                  <span className="ml-1 font-medium">{req.city}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Land Area:</span>
                  <span className="ml-1 font-medium">{req.landArea} acres</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Crop:</span>
                  <span className="ml-1 font-medium">{req.crop}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Crop Stage:</span>
                  <span className="ml-1 font-medium">{req.cropStage}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-1 font-medium">{req.duration}min</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Urgency:</span>
                  <span className="ml-1 font-medium capitalize">{req.urgency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weather Risk:</span>
                  <span className="ml-1 font-medium capitalize">{req.weatherRisk}</span>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold mb-2">Priority Breakdown</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  {[
                    { label: "Urgency", value: req.priority.urgency, max: 25 },
                    { label: "Weather", value: req.priority.weather, max: 25 },
                    { label: "Crop", value: req.priority.crop, max: 20 },
                    { label: "Waiting", value: req.priority.waiting, max: 15 },
                    { label: "Distance", value: req.priority.distance, max: 10 },
                    { label: "Constraint", value: req.priority.constraint, max: 5 },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <p className="font-medium">{item.value}/{item.max}</p>
                      <p className="text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{req.priority.explanation}</p>
              </div>

              {/* Schedule */}
              {req.schedule && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-lg text-xs">
                  <p className="font-semibold mb-1">📅 Schedule</p>
                  <p>Resource: {req.schedule.resourceId} ({resource?.name ?? ""})</p>
                  <p>
                    Time: {new Date(req.schedule.start).toLocaleString()} →{" "}
                    {new Date(req.schedule.end).toLocaleString()}
                  </p>
                  <p>
                    Duration: {req.schedule.duration}min | Travel: {req.schedule.travelTime}min | Buffer: {req.schedule.bufferTime}min
                  </p>
                  <p className="mt-1">Status: {req.schedule.status}</p>
                </div>
              )}

              {/* Conflict */}
              {req.conflict && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <p className="font-semibold mb-1">⚠️ Conflict</p>
                  <p>{req.conflict.resolution}</p>
                </div>
              )}

              {/* Delete Request */}
              <div className="mt-4 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete Request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this resource request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete request {req.id}
                        {req.schedule ? ` and release the allocation on resource ${req.schedule.resourceId}` : ""}.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => dispatch({ type: "DELETE_REQUEST", payload: req.id })}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Link
        to="/farmer-portal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resource Requests</h1>
          <p className="text-sm text-muted-foreground">{state.requests.length} total requests</p>
        </div>
        <Link to="/requests/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full overflow-x-auto flex flex-nowrap">
          <TabsTrigger value="all">All ({state.requests.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({getFiltered("pending").length})
          </TabsTrigger>
          <TabsTrigger value="high_priority">
            High Priority ({getFiltered("high_priority").length})
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflicts ({getFiltered("conflicts").length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({getFiltered("scheduled").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getFiltered("completed").length})
          </TabsTrigger>
          <TabsTrigger value="disrupted">
            Disrupted ({getFiltered("disrupted").length})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "high_priority", "conflicts", "scheduled", "completed", "disrupted"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {getFiltered(tab).length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No requests in this category
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {getFiltered(tab).map((req) => (
                  <RequestCard key={req.id} req={req} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
