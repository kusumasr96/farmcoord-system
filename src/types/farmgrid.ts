// ── Resource Types ──
export type ResourceCategory =
  | "MACHINERY"
  | "IRRIGATION"
  | "STORAGE"
  | "TRANSPORTATION"
  | "LABOUR"
  | "SERVICES";

export type ResourceType =
  | "Tractor"
  | "Harvester"
  | "Tiller"
  | "Seeder"
  | "Portable Pump"
  | "Drip Lines"
  | "Sprinkler Set"
  | "Solar Storage"
  | "Cold Storage"
  | "Mini Truck"
  | "Trailer"
  | "Grain Cart"
  | "Sowing Team"
  | "Weeding Team"
  | "Harvesting Team"
  | "Drone Spraying"
  | "Soil Testing"
  | "Grafting";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category: ResourceCategory;
  specifications: string;
  operationalLocation: string;
  lat: number;
  lng: number;
  operatingStart: number; // hour 0-23
  operatingEnd: number;
  available: boolean;
  maintenanceStatus: "Operational" | "Under Maintenance" | "Needs Repair";
  operatorAvailable: boolean;
  attachment: string;
  fuelRequirements: string;
}

// ── Farmer ──
export interface Farmer {
  id: string;
  name: string;
  phone: string;
  city: string;
  lat: number;
  lng: number;
  landArea: number; // acres
  crops: string[];
  createdAt: string;
}

// ── Request ──
export type RequestStatus =
  | "pending"
  | "priority_calculated"
  | "conflict_detected"
  | "scheduled"
  | "completed"
  | "disrupted"
  | "cancelled";

export interface PriorityBreakdown {
  urgency: number; // /25
  weather: number; // /25
  crop: number; // /20
  waiting: number; // /15
  distance: number; // /10
  constraint: number; // /5
  total: number; // /100
  explanation: string;
}

export interface ScheduleSlot {
  resourceId: string;
  farmerId: string;
  start: string; // ISO datetime
  end: string;
  duration: number; // minutes
  travelTime: number; // minutes
  bufferTime: number; // minutes
  status: "confirmed" | "tentative" | "disrupted";
}

export interface ConflictInfo {
  conflictId: string;
  resourceId: string;
  conflictingRequests: string[];
  resolution: string;
  preferredFarmerId: string;
}

export interface ResourceRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  city: string;
  lat: number;
  lng: number;
  landArea: number;
  resourceType: ResourceType;
  resourceCategory: ResourceCategory;
  resourceId?: string;
  quantity: number;
  earliestStart: string; // ISO
  latestEnd: string;
  duration: number; // minutes
  crop: string;
  cropStage: string;
  urgency: "low" | "medium" | "high" | "critical";
  urgencyJustification: string;
  weatherRisk: "none" | "low" | "medium" | "high";
  attachmentNeeded: string;
  operatorRequirement: string;
  fuelRequirements: string;
  specializedEquipment: string;
  otherConstraints: string;
  specialRequirements: string;
  priority: PriorityBreakdown;
  schedule?: ScheduleSlot;
  conflict?: ConflictInfo;
  status: RequestStatus;
  createdAt: string;
  offline: boolean;
}

// ── Notification ──
export type NotificationType =
  | "request_submitted"
  | "priority_calculated"
  | "conflict_detected"
  | "resource_allocated"
  | "high_priority"
  | "weather_alert"
  | "machine_breakdown"
  | "schedule_change"
  | "alternative_available"
  | "offline_saved"
  | "sync_completed"
  | "reallocation";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  farmerId?: string;
  requestId?: string;
  resourceId?: string;
}

// ── Disruption ──
export type DisruptionType =
  | "machine_breakdown"
  | "rain_disruption"
  | "cancellation"
  | "delay";

export interface Disruption {
  id: string;
  type: DisruptionType;
  description: string;
  affectedRequestId: string;
  affectedFarmerId: string;
  affectedResourceId: string;
  timestamp: string;
  resolved: boolean;
  reallocation?: ScheduleSlot;
}

// ── App State ──
export interface AppState {
  farmers: Farmer[];
  resources: Resource[];
  requests: ResourceRequest[];
  notifications: Notification[];
  disruptions: Disruption[];
  offlineMode: boolean;
  offlineRequests: ResourceRequest[];
  selectedFarmerId: string | null;
}
