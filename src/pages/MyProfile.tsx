import { Link, useSearchParams } from "react-router";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Wheat,
  Plus,
  FileText,
} from "lucide-react";
import type { ResourceRequest } from "@/types/farmgrid";

function statusColor(status: string) {
  switch (status) {
    case "scheduled": return "default";
    case "conflict_detected": return "destructive";
    case "disrupted": return "destructive";
    case "cancelled": return "outline";
    case "completed": return "secondary";
    default: return "secondary";
  }
}

function RequestRow({ req }: { req: ResourceRequest }) {
  return (
    <div className="p-4 border border-border/60 rounded-lg">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm">{req.id}</span>
            <Badge variant={statusColor(req.status) as "default" | "destructive" | "secondary" | "outline"} className="text-[10px]">
              {req.status.replace(/_/g, " ")}
            </Badge>
            {req.priority.total >= 70 && (
              <Badge variant="destructive" className="text-[10px]">High Priority</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{req.resourceType} • {req.city} • {req.crop}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-xs">
            {req.priority.total}<span className="text-[9px] font-normal">/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="text-foreground font-medium">Requested:</span>{" "}
          {new Date(req.earliestStart).toLocaleDateString()}
        </div>
        <div>
          <span className="text-foreground font-medium">Duration:</span> {req.duration}min
        </div>
        <div>
          <span className="text-foreground font-medium">Crop Stage:</span> {req.cropStage || "—"}
        </div>
        <div>
          <span className="text-foreground font-medium">Attachment:</span> {req.attachmentNeeded}
        </div>
        <div>
          <span className="text-foreground font-medium">Operator:</span> {req.operatorRequirement}
        </div>
        <div>
          <span className="text-foreground font-medium">Conflict:</span>{" "}
          {req.conflict ? (
            <span className="text-red-600">⚠️ Yes</span>
          ) : (
            "None"
          )}
        </div>
      </div>

      {req.conflict && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          ⚠️ {req.conflict.resolution}
        </div>
      )}

      {req.schedule ? (
        <div className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded text-xs">
          <p className="font-medium text-foreground">📅 Scheduled</p>
          <p className="text-muted-foreground">
            Assigned Resource: {req.schedule.resourceId} • Date:{" "}
            {new Date(req.schedule.start).toLocaleDateString()} • Time:{" "}
            {new Date(req.schedule.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
            {new Date(req.schedule.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {req.schedule.travelTime > 0 && (
            <p className="text-muted-foreground">
              Travel: {req.schedule.travelTime}min • Buffer: {req.schedule.bufferTime}min
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {req.status === "completed" ? "✅ Completed" : req.status === "cancelled" ? "🚫 Cancelled" : "Not scheduled yet"}
        </p>
      )}
    </div>
  );
}

export default function MyProfile() {
  const { state } = useApp();

  const [searchParams] = useSearchParams();
  const paramId = searchParams.get("farmerId");

  // Selected farmer from context; fall back to ?farmerId= lookup (also covers
  // manually-entered farmers whose requests carry a generated F_NEW_* id).
  const farmer =
    state.farmers.find((f) => f.id === state.selectedFarmerId) ??
    state.farmers.find((f) => f.id === paramId) ??
    null;

  if (!farmer) {
    return (
      <div>
        <Link
          to="/farmer-portal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <Card className="border-border/60">
          <CardContent className="p-8 text-center">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              No farmer selected yet. Choose your name from the Farmer Portal to open your profile.
            </p>
            <Link to="/farmer-portal">
              <Button>
                <User className="h-4 w-4 mr-1" />
                Open Farmer Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only this farmer's requests (existing request data — no second system).
  const requests = state.requests.filter((r) => r.farmerId === farmer.id);

  return (
    <div>
      <Link
        to="/farmer-portal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">My Profile</h1>
      <p className="text-muted-foreground mb-6">Your information and your resource requests.</p>

      {/* Farmer Information */}
      <Card className="mb-6 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            Farmer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Farmer Name</p>
                <p className="font-medium">{farmer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Phone Number</p>
                <p className="font-medium">{farmer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">City / Location</p>
                <p className="font-medium">{farmer.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Farm Location / Geolocation</p>
                <p className="font-medium">{farmer.lat.toFixed(4)}°N, {farmer.lng.toFixed(4)}°E</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wheat className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Land Area / Farm Size</p>
                <p className="font-medium">{farmer.landArea} acres</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Wheat className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Crops</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {farmer.crops.length > 0 ? (
                    farmer.crops.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Resource Requests */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            My Resource Requests ({requests.length})
          </CardTitle>
          <Link to={`/requests/new?farmerId=${farmer.id}`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-3">
                No resource requests yet. Requests you submit will automatically appear here.
              </p>
              <Link to={`/requests/new?farmerId=${farmer.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => <RequestRow key={req.id} req={req} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
