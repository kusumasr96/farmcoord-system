import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useApp, findFeasibleSlot } from "@/context/AppContext";
import type { ResourceType, ResourceCategory, PriorityBreakdown } from "@/types/farmgrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";

const resourceTypes: { value: ResourceType; category: ResourceCategory }[] = [
  { value: "Tractor", category: "MACHINERY" },
  { value: "Harvester", category: "MACHINERY" },
  { value: "Tiller", category: "MACHINERY" },
  { value: "Seeder", category: "MACHINERY" },
  { value: "Portable Pump", category: "IRRIGATION" },
  { value: "Drip Lines", category: "IRRIGATION" },
  { value: "Sprinkler Set", category: "IRRIGATION" },
  { value: "Solar Storage", category: "STORAGE" },
  { value: "Cold Storage", category: "STORAGE" },
  { value: "Mini Truck", category: "TRANSPORTATION" },
  { value: "Trailer", category: "TRANSPORTATION" },
  { value: "Grain Cart", category: "TRANSPORTATION" },
  { value: "Sowing Team", category: "LABOUR" },
  { value: "Weeding Team", category: "LABOUR" },
  { value: "Harvesting Team", category: "LABOUR" },
  { value: "Drone Spraying", category: "SERVICES" },
  { value: "Soil Testing", category: "SERVICES" },
  { value: "Grafting", category: "SERVICES" },
];

const attachmentOptions = [
  "No attachment needed",
  "Grain tank extension",
  "Trailer attachment",
  "Plough attachment",
  "Seed drill attachment",
  "Cultivator attachment",
  "Rotavator attachment",
  "Harvester header",
  "Other",
];

const operatorOptions = [
  "Any operator",
  "Experienced operator",
  "Certified operator",
  "Specialized/trained operator",
  "No operator required",
  "Other",
];

export default function NewRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, addRequest, dispatch } = useApp();
  const preselectedFarmerId = searchParams.get("farmerId") || "";
  const preselectedFarmer = state.farmers.find((f) => f.id === preselectedFarmerId);

  const [form, setForm] = useState({
    farmerId: preselectedFarmerId,
    farmerName: preselectedFarmer?.name ?? "",
    phone: preselectedFarmer?.phone ?? "",
    city: preselectedFarmer?.city ?? "",
    lat: preselectedFarmer?.lat ?? 13.93,
    lng: preselectedFarmer?.lng ?? 75.57,
    landArea: preselectedFarmer?.landArea ?? 5,
    resourceType: "" as ResourceType | "",
    quantity: 1,
    earliestStart: "",
    latestEnd: "",
    duration: 60,
    crop: "",
    cropStage: "",
    urgency: "medium" as "low" | "medium" | "high" | "critical",
    urgencyJustification: "",
    weatherRisk: "low" as "none" | "low" | "medium" | "high",
    attachmentNeeded: "No attachment needed",
    attachmentOther: "",
    operatorRequirement: "Any operator",
    operatorOther: "",
    fuelRequirements: "",
    specializedEquipment: "",
    otherConstraints: "",
    specialRequirements: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    priority: PriorityBreakdown;
    conflict: boolean;
    conflictInfo?: string;
    scheduled: boolean;
    scheduleInfo?: string;
    resourceId?: string;
    suggestedTime?: string;
    alternativeReason?: string;
  } | null>(null);

  function handleSelectFarmer(farmerId: string) {
    const farmer = state.farmers.find((f) => f.id === farmerId);
    if (farmer) {
      setForm({
        ...form,
        farmerId: farmer.id,
        farmerName: farmer.name,
        phone: farmer.phone,
        city: farmer.city,
        lat: farmer.lat,
        lng: farmer.lng,
        landArea: farmer.landArea,
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.farmerId || !form.farmerName || !form.city || form.landArea <= 0 || !form.resourceType || !form.earliestStart || !form.latestEnd) return;

    // Handle offline mode
    if (state.offlineMode) {
      const rt = resourceTypes.find((r) => r.value === form.resourceType);
      const attachment = form.attachmentNeeded === "Other" ? form.attachmentOther : form.attachmentNeeded;
      const operator = form.operatorRequirement === "Other" ? form.operatorOther : form.operatorRequirement;
      dispatch({
        type: "ADD_OFFLINE_REQUEST",
        payload: {
          id: `OFF_${Date.now()}`,
          farmerId: form.farmerId,
          farmerName: form.farmerName,
          phone: form.phone,
          city: form.city,
          lat: form.lat,
          lng: form.lng,
          landArea: form.landArea,
          resourceType: form.resourceType,
          resourceCategory: rt?.category ?? "MACHINERY",
          resourceId: undefined,
          quantity: form.quantity,
          earliestStart: form.earliestStart,
          latestEnd: form.latestEnd,
          duration: form.duration,
          crop: form.crop,
          cropStage: form.cropStage,
          urgency: form.urgency,
          urgencyJustification: form.urgencyJustification,
          weatherRisk: form.weatherRisk,
          attachmentNeeded: attachment,
          operatorRequirement: operator,
          fuelRequirements: form.fuelRequirements,
          specializedEquipment: form.specializedEquipment,
          otherConstraints: form.otherConstraints,
          specialRequirements: form.specialRequirements,
          priority: { urgency: 0, weather: 0, crop: 0, waiting: 0, distance: 0, constraint: 0, total: 0, explanation: "Pending sync" },
          status: "pending" as const,
          createdAt: new Date().toISOString(),
          offline: true,
        },
      });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `N_${Date.now()}`,
          type: "offline_saved",
          title: "📴 Request Saved Offline",
          message: `Your request for ${form.resourceType} has been saved locally. It will sync when connectivity is restored.`,
          timestamp: new Date().toISOString(),
          read: false,
          farmerId: form.farmerId,
        },
      });
      setResult({
        priority: { urgency: 0, weather: 0, crop: 0, waiting: 0, distance: 0, constraint: 0, total: 0, explanation: "Request saved offline. Priority will be calculated upon sync." },
        conflict: false,
        scheduled: false,
        scheduleInfo: "Will be scheduled upon sync",
      });
      setSubmitted(true);
      return;
    }

    const rt = resourceTypes.find((r) => r.value === form.resourceType);
    const attachment = form.attachmentNeeded === "Other" ? form.attachmentOther : form.attachmentNeeded;
    const operator = form.operatorRequirement === "Other" ? form.operatorOther : form.operatorRequirement;

    const req = addRequest({
      farmerId: form.farmerId,
      farmerName: form.farmerName,
      phone: form.phone,
      city: form.city,
      lat: form.lat,
      lng: form.lng,
      landArea: form.landArea,
      resourceType: form.resourceType,
      resourceCategory: rt?.category ?? "MACHINERY",
      resourceId: undefined,
      quantity: form.quantity,
      earliestStart: form.earliestStart,
      latestEnd: form.latestEnd,
      duration: form.duration,
      crop: form.crop,
      cropStage: form.cropStage,
      urgency: form.urgency,
      urgencyJustification: form.urgencyJustification,
      weatherRisk: form.weatherRisk,
      attachmentNeeded: attachment,
      operatorRequirement: operator,
      fuelRequirements: form.fuelRequirements,
      specializedEquipment: form.specializedEquipment,
      otherConstraints: form.otherConstraints,
      specialRequirements: form.specialRequirements,
    });

    // Try to find a feasible slot
    const sched = findFeasibleSlot(req, state.resources, [...state.requests, req]);
    const hasConflict = !!req.conflict;

    let scheduleInfo = "";
    let alternativeReason = "";
    let suggestedTime = "";
    let resourceId = "";

    if (sched) {
      const res = state.resources.find((r) => r.id === sched.resourceId);
      resourceId = sched.resourceId;
      suggestedTime = `${new Date(sched.start).toLocaleString()} – ${new Date(sched.end).toLocaleString()}`;
      if (sched.status === "tentative") {
        alternativeReason = "The originally requested resource/time was unavailable, so the system found the nearest feasible alternative.";
      }
      scheduleInfo = `${res?.name ?? sched.resourceId} (${sched.duration}min, Travel: ${sched.travelTime}min, Buffer: ${sched.bufferTime}min)`;
    }

    setResult({
      priority: req.priority,
      conflict: hasConflict,
      conflictInfo: req.conflict?.resolution,
      scheduled: !!sched,
      scheduleInfo,
      resourceId,
      suggestedTime,
      alternativeReason,
    });
    setSubmitted(true);
  }

  if (submitted && result) {
    return (
      <div>
        <button
          onClick={() => {
            setSubmitted(false);
            setResult(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Request Submitted</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Priority Score */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Priority Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-primary">{result.priority.total}/100</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.priority.total >= 70 ? "High Priority" : result.priority.total >= 40 ? "Moderate Priority" : "Low Priority"}
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Urgency", value: result.priority.urgency, max: 25 },
                  { label: "Weather", value: result.priority.weather, max: 25 },
                  { label: "Crop Stage", value: result.priority.crop, max: 20 },
                  { label: "Waiting Time", value: result.priority.waiting, max: 15 },
                  { label: "Distance", value: result.priority.distance, max: 10 },
                  { label: "Constraints", value: result.priority.constraint, max: 5 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24">{item.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">{item.value}/{item.max}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                {result.priority.explanation}
              </p>
            </CardContent>
          </Card>

          {/* Schedule / Conflict */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {result.conflict ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Conflict Detected
                  </>
                ) : result.scheduled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Schedule Generated
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Scheduling Status
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.conflict && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-sm font-medium text-amber-800">⚠️ Scheduling Conflict Detected</p>
                  <p className="text-xs text-amber-700 mt-1">{result.conflictInfo}</p>
                </div>
              )}

              {result.scheduled && (
                <div className="space-y-3">
                  {result.alternativeReason && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-800">Recommended Alternative</p>
                      <p className="text-xs text-blue-700 mt-1">{result.alternativeReason}</p>
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resource:</span>
                      <span className="font-medium">{result.resourceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{result.suggestedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Details:</span>
                      <span className="font-medium text-right">{result.scheduleInfo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge>Feasible Slot</Badge>
                    </div>
                  </div>
                </div>
              )}

              {!result.scheduled && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">No feasible slot found in the requested window.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check availability, try an earlier/later slot, or choose another resource.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => navigate("/requests")}>Try Earlier Slot</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate("/requests")}>Try Later Slot</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate("/requests")}>Choose Another Resource</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-6">
          <Link to="/requests">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              View All Requests
            </Button>
          </Link>
          <Link to="/schedule">
            <Button>View Schedule</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">New Resource Request</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farmer Selection */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Farmer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Select Farmer</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {state.farmers.map((f) => (
                  <Button
                    key={f.id}
                    type="button"
                    variant={form.farmerId === f.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectFarmer(f.id)}
                  >
                    {f.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Farmer Name *</Label>
                <Input
                  required
                  value={form.farmerName}
                  onChange={(e) => setForm({ ...form, farmerName: e.target.value })}
                  className="mt-1"
                  placeholder="Enter farmer name"
                />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <Label className="text-xs">Land Area (Acres) *</Label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={form.landArea}
                  onChange={(e) => setForm({ ...form, landArea: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">City *</Label>
                <Input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Shivamogga"
                />
              </div>
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Details */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Resource Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Resource Type *</Label>
                <Select value={form.resourceType} onValueChange={(v) => setForm({ ...form, resourceType: v as ResourceType })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.value} ({rt.category.toLowerCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Duration (minutes) *</Label>
                <Input
                  type="number"
                  required
                  min={15}
                  step={15}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Earliest Start *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.earliestStart}
                  onChange={(e) => setForm({ ...form, earliestStart: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Latest End *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.latestEnd}
                  onChange={(e) => setForm({ ...form, latestEnd: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crop & Urgency */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Crop & Urgency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Crop</Label>
                <Input
                  value={form.crop}
                  onChange={(e) => setForm({ ...form, crop: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Paddy"
                />
              </div>
              <div>
                <Label className="text-xs">Crop Stage</Label>
                <Input
                  value={form.cropStage}
                  onChange={(e) => setForm({ ...form, cropStage: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Ready for harvest"
                />
              </div>
              <div>
                <Label className="text-xs">Urgency *</Label>
                <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as typeof form.urgency })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Weather Risk</Label>
                <Select value={form.weatherRisk} onValueChange={(v) => setForm({ ...form, weatherRisk: v as typeof form.weatherRisk })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Urgency Justification</Label>
              <Textarea
                value={form.urgencyJustification}
                onChange={(e) => setForm({ ...form, urgencyJustification: e.target.value })}
                className="mt-1"
                rows={2}
                placeholder="Explain why this request is urgent..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Special Requirements */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Special Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Attachment Needed</Label>
                <Select value={form.attachmentNeeded} onValueChange={(v) => setForm({ ...form, attachmentNeeded: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {attachmentOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.attachmentNeeded === "Other" && (
                  <Input
                    value={form.attachmentOther}
                    onChange={(e) => setForm({ ...form, attachmentOther: e.target.value })}
                    className="mt-2"
                    placeholder="Specify attachment requirement"
                  />
                )}
              </div>
              <div>
                <Label className="text-xs">Operator Requirement</Label>
                <Select value={form.operatorRequirement} onValueChange={(v) => setForm({ ...form, operatorRequirement: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.operatorRequirement === "Other" && (
                  <Input
                    value={form.operatorOther}
                    onChange={(e) => setForm({ ...form, operatorOther: e.target.value })}
                    className="mt-2"
                    placeholder="Specify operator requirement"
                  />
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Fuel Requirements</Label>
                <Input
                  value={form.fuelRequirements}
                  onChange={(e) => setForm({ ...form, fuelRequirements: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Diesel, ~15L/hour"
                />
              </div>
              <div>
                <Label className="text-xs">Specialized Equipment</Label>
                <Input
                  value={form.specializedEquipment}
                  onChange={(e) => setForm({ ...form, specializedEquipment: e.target.value })}
                  className="mt-1"
                  placeholder="Any specialized equipment needed"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Other Constraints</Label>
              <Textarea
                value={form.otherConstraints}
                onChange={(e) => setForm({ ...form, otherConstraints: e.target.value })}
                className="mt-1"
                rows={2}
                placeholder="Any other constraints or notes..."
              />
            </div>
            <div>
              <Label className="text-xs">Special Requirements</Label>
              <Textarea
                value={form.specialRequirements}
                onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                className="mt-1"
                rows={2}
                placeholder="Additional special requirements..."
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={!form.farmerId || !form.farmerName || !form.city || form.landArea <= 0 || !form.resourceType || !form.earliestStart || !form.latestEnd}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Request
        </Button>
      </form>
    </div>
  );
}
