import { useState } from "react";
import { Link } from "react-router";
import { useApp } from "@/context/AppContext";
import type { Farmer } from "@/types/farmgrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Wheat,
  Edit3,
  Save,
  Plus,
  Calendar,
  Bell,
  FileText,
} from "lucide-react";

export default function FarmerPortal() {
  const { state, dispatch, getFarmerRequests } = useApp();
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Farmer>>({});

  function selectFarmer(farmer: Farmer) {
    setSelectedFarmer(farmer);
    setEditing(false);
    setEditForm({});
    dispatch({ type: "SET_SELECTED_FARMER", payload: farmer.id });
  }

  function startEdit() {
    if (!selectedFarmer) return;
    setEditForm({
      name: selectedFarmer.name,
      phone: selectedFarmer.phone,
      city: selectedFarmer.city,
      landArea: selectedFarmer.landArea,
      crops: [...selectedFarmer.crops],
      lat: selectedFarmer.lat,
      lng: selectedFarmer.lng,
    });
    setEditing(true);
  }

  function saveEdit() {
    if (!selectedFarmer || !editForm.name || !editForm.city || !editForm.landArea) return;
    if ((editForm.landArea ?? 0) <= 0) return;
    dispatch({
      type: "UPDATE_FARMER",
      payload: { ...selectedFarmer, ...editForm } as Farmer,
    });
    setSelectedFarmer({
      ...selectedFarmer,
      ...editForm,
    } as Farmer);
    setEditing(false);
  }

  if (!selectedFarmer) {
    return (
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Farmer Portal</h1>
        <p className="text-muted-foreground mb-8">
          Select a farmer to view their profile, requests, and schedule.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.farmers.map((farmer) => {
            const requests = getFarmerRequests(farmer.id);
            return (
              <Card
                key={farmer.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all border-border/60"
                onClick={() => selectFarmer(farmer)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{farmer.name}</h3>
                      <p className="text-xs text-muted-foreground">{farmer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {farmer.city}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Wheat className="h-3.5 w-3.5" />
                    {farmer.landArea} acres
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {farmer.crops.map((crop) => (
                      <Badge key={crop} variant="secondary" className="text-xs">
                        {crop}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{requests.length} request{requests.length !== 1 ? "s" : ""}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View Profile <ArrowLeft className="h-3 w-3 rotate-180 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Selected farmer view
  const farmer = selectedFarmer;
  const requests = getFarmerRequests(farmer.id);

  return (
    <div>
      <button
        onClick={() => {
          setSelectedFarmer(null);
          dispatch({ type: "SET_SELECTED_FARMER", payload: null });
        }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </button>

      {/* My Profile quick access */}
      <div className="mb-6">
        <Link to="/my-profile">
          <Card className="border-primary/30 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">My Profile</p>
                <p className="text-xs text-muted-foreground">
                  View your information and all your resource requests
                </p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Farmer Profile Card */}
      <Card className="mb-6 border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            Farmer Profile
          </CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Farmer Name</Label>
                <Input
                  value={editForm.name ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={editForm.phone ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={editForm.city ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Land Area (Acres)</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.landArea ?? 0}
                  onChange={(e) => setEditForm({ ...editForm, landArea: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Crops (comma separated)</Label>
                <Input
                  value={(editForm.crops ?? []).join(", ")}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      crops: e.target.value.split(",").map((c) => c.trim()).filter(Boolean),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={!editForm.name || !editForm.city || (editForm.landArea ?? 0) <= 0}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{farmer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{farmer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">City</p>
                  <p className="font-medium">{farmer.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wheat className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Farm Size</p>
                  <p className="font-medium">{farmer.landArea} acres</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Location</p>
                  <p className="font-medium">{farmer.lat.toFixed(4)}°N, {farmer.lng.toFixed(4)}°E</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Wheat className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Crops</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {farmer.crops.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Farmer Navigation Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="requests">
            <FileText className="h-4 w-4 mr-1" />
            My Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-1" />
            My Schedule
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-1" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">My Resource Requests</h3>
              {requests.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-3">No resource requests yet.</p>
                  <Link to={`/requests/new?farmerId=${farmer.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Your First Request
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-4 border border-border/60 rounded-lg">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{req.id}</span>
                            <Badge variant={req.status === "scheduled" ? "default" : req.status === "conflict_detected" ? "destructive" : "secondary"} className="text-[10px]">
                              {req.status.replace(/_/g, " ")}
                            </Badge>
                            {req.priority.total >= 70 && (
                              <Badge variant="destructive" className="text-[10px]">High</Badge>
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="text-foreground font-medium">Crop:</span> {req.crop}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Stage:</span> {req.cropStage}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Duration:</span> {req.duration}min
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Urgency:</span> {req.urgency}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Attachment:</span> {req.attachmentNeeded}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Operator:</span> {req.operatorRequirement}
                        </div>
                        {req.conflict && (
                          <div className="col-span-2">
                            <span className="text-red-600 font-medium">⚠️ Conflict:</span>{" "}
                            <span className="text-red-700">{req.conflict.resolution}</span>
                          </div>
                        )}
                      </div>
                      {req.schedule && (
                        <div className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded text-xs">
                          <p className="font-medium text-foreground">📅 Scheduled</p>
                          <p className="text-muted-foreground">
                            Resource: {req.schedule.resourceId} • Date: {new Date(req.schedule.start).toLocaleDateString()} • Time: {" "}
                            {new Date(req.schedule.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {" "}
                            {new Date(req.schedule.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {req.schedule.travelTime > 0 && (
                            <p className="text-muted-foreground">Travel: {req.schedule.travelTime}min • Buffer: {req.schedule.bufferTime}min</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="border-border/60">
            <CardContent className="p-6">
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No requests yet.</p>
                  <Link to={`/requests/new?farmerId=${farmer.id}`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" />
                      Create New Request
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-4 border border-border/60 rounded-lg">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-sm">{req.id} — {req.resourceType}</p>
                          <p className="text-xs text-muted-foreground">{req.city}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant={req.status === "scheduled" ? "default" : req.status === "conflict_detected" ? "destructive" : "secondary"}>
                            {req.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="text-foreground font-medium">Crop:</span> {req.crop}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Stage:</span> {req.cropStage}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Duration:</span> {req.duration}min
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Priority:</span> {req.priority.total}/100
                        </div>
                      </div>
                      {req.schedule && (
                        <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                          📅 Scheduled: {new Date(req.schedule.start).toLocaleString()} → {new Date(req.schedule.end).toLocaleString()}
                          {req.schedule.travelTime > 0 && ` (Travel: ${req.schedule.travelTime}min)`}
                        </div>
                      )}
                      {req.conflict && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                          ⚠️ Conflict: {req.conflict.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                  <Link to={`/requests/new?farmerId=${farmer.id}`}>
                    <Button className="w-full mt-4">
                      <Plus className="h-4 w-4 mr-1" />
                      New Resource Request
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Scheduled Allocations</h3>
              {requests.filter((r) => r.schedule).length === 0 ? (
                <p className="text-muted-foreground text-sm">No scheduled allocations.</p>
              ) : (
                <div className="space-y-3">
                  {requests
                    .filter((r) => r.schedule)
                    .map((req) => (
                      <div key={req.id} className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{req.resourceType}</p>
                          <Badge>Confirmed</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="text-foreground font-medium">Date:</span>{" "}
                            {new Date(req.schedule!.start).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-foreground font-medium">Time:</span>{" "}
                            {new Date(req.schedule!.start).toLocaleTimeString()} –{" "}
                            {new Date(req.schedule!.end).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="text-foreground font-medium">Resource:</span>{" "}
                            {req.schedule!.resourceId}
                          </div>
                          <div>
                            <span className="text-foreground font-medium">Duration:</span>{" "}
                            {req.schedule!.duration}min
                          </div>
                          {req.schedule!.travelTime > 0 && (
                            <div>
                              <span className="text-foreground font-medium">Travel:</span>{" "}
                              {req.schedule!.travelTime}min
                            </div>
                          )}
                          <div>
                            <span className="text-foreground font-medium">Buffer:</span>{" "}
                            {req.schedule!.bufferTime}min
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Notifications</h3>
              {state.notifications.filter((n) => n.farmerId === farmer.id).length === 0 ? (
                <p className="text-muted-foreground text-sm">No notifications for this farmer.</p>
              ) : (
                <div className="space-y-2">
                  {state.notifications
                    .filter((n) => n.farmerId === farmer.id)
                    .map((notif) => (
                      <div key={notif.id} className={`p-3 rounded-lg text-sm ${notif.read ? "bg-muted/30" : "bg-primary/5 border border-primary/10"}`}>
                        <p className="font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
