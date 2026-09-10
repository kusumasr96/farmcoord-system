import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type {
  Farmer,
  Resource,
  ResourceRequest,
  Notification,
  Disruption,
  RequestStatus,
  PriorityBreakdown,
  ScheduleSlot,
  ConflictInfo,
  AppState,
} from "@/types/farmgrid";
import {
  demoFarmers,
  demoResources,
  demoRequests,
  demoNotifications,
} from "@/data/demoData";

// ── Priority Engine ──
export function calculatePriority(params: {
  urgency: "low" | "medium" | "high" | "critical";
  weatherRisk: "none" | "low" | "medium" | "high";
  cropStage: string;
  createdAt: string;
  distance: number; // km
  hasAttachmentNeed: boolean;
  hasOperatorNeed: boolean;
  duration: number;
}): PriorityBreakdown {
  // Urgency / Deadline Proximity — 25
  const urgencyMap = { critical: 25, high: 20, medium: 13, low: 6 };
  const urgencyScore = urgencyMap[params.urgency];

  // Weather Risk Exposure — 25
  const weatherMap = { high: 25, medium: 17, low: 9, none: 2 };
  const weatherScore = weatherMap[params.weatherRisk];

  // Crop Readiness / Biological Stage — 20
  const cropLower = params.cropStage.toLowerCase();
  let cropScore = 5;
  if (cropLower.includes("ready") || cropLower.includes("harvest")) cropScore = 20;
  else if (cropLower.includes("wilting") || cropLower.includes("dying")) cropScore = 19;
  else if (cropLower.includes("mature")) cropScore = 18;
  else if (cropLower.includes("pest") || cropLower.includes("infestation")) cropScore = 15;
  else if (cropLower.includes("growing") || cropLower.includes("mid")) cropScore = 12;
  else if (cropLower.includes("sowing") || cropLower.includes("pre")) cropScore = 10;

  // Queue Waiting Time — 15
  const daysWaiting = Math.min(
    15,
    Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(params.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    )
  );
  const waitingScore = Math.round((daysWaiting / 15) * 15);

  // Distance & Logistics Overhead — 10
  const distanceScore = Math.round(Math.max(0, Math.min(10, 10 - (params.distance / 50) * 10)));

  // Resource Constraints — 5
  let constraintScore = 5;
  if (params.hasAttachmentNeed && params.hasOperatorNeed) constraintScore = 2;
  else if (params.hasAttachmentNeed || params.hasOperatorNeed) constraintScore = 3;
  if (params.duration > 480) constraintScore = Math.max(1, constraintScore - 1);

  const total = urgencyScore + weatherScore + cropScore + waitingScore + distanceScore + constraintScore;

  const explanation = `This request received ${total >= 70 ? "high" : total >= 40 ? "moderate" : "low"} priority. ` +
    `Urgency: ${urgencyScore}/25 (${params.urgency}). ` +
    `Weather risk: ${weatherScore}/25 (${params.weatherRisk}). ` +
    `Crop stage: ${cropScore}/20 (${params.cropStage}). ` +
    `Waiting time: ${waitingScore}/15 (${daysWaiting} days). ` +
    `Distance: ${distanceScore}/10 (${Math.round(params.distance)}km). ` +
    `Constraints: ${constraintScore}/5.`;

  return {
    urgency: urgencyScore,
    weather: weatherScore,
    crop: cropScore,
    waiting: waitingScore,
    distance: distanceScore,
    constraint: constraintScore,
    total,
    explanation,
  };
}

// ── Conflict Detection ──
export function detectConflicts(
  requests: ResourceRequest[],
  resources: Resource[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const scheduled = requests.filter((r) => r.resourceId && r.status !== "cancelled");

  // Group by resource
  const byResource: Record<string, ResourceRequest[]> = {};
  for (const req of scheduled) {
    if (!req.resourceId) continue;
    if (!byResource[req.resourceId]) byResource[req.resourceId] = [];
    byResource[req.resourceId].push(req);
  }

  for (const [resourceId, reqs] of Object.entries(byResource)) {
    for (let i = 0; i < reqs.length; i++) {
      for (let j = i + 1; j < reqs.length; j++) {
        const a = reqs[i];
        const b = reqs[j];
        const aStart = new Date(a.earliestStart).getTime();
        const aEnd = new Date(a.latestEnd).getTime();
        const bStart = new Date(b.earliestStart).getTime();
        const bEnd = new Date(b.latestEnd).getTime();

        if (aStart < bEnd && bStart < aEnd) {
          // Overlap detected
          const preferred =
            a.priority.total >= b.priority.total ? a.farmerId : b.farmerId;
          const preferredName =
            preferred === a.farmerId ? a.farmerName : b.farmerName;
          conflicts.push({
            conflictId: `C_${resourceId}_${a.id}_${b.id}`,
            resourceId,
            conflictingRequests: [a.id, b.id],
            resolution: `Resource ${resourceId} has overlapping requests. ${preferredName} is preferred due to higher priority score (${Math.max(a.priority.total, b.priority.total)}/100). Alternative resource or time slot recommended for the other request.`,
            preferredFarmerId: preferred,
          });
        }
      }
    }
  }
  return conflicts;
}

// ── Scheduling Engine ──
export function findFeasibleSlot(
  request: ResourceRequest,
  resources: Resource[],
  existingRequests: ResourceRequest[]
): ScheduleSlot | null {
  const compatible = resources.filter(
    (r) =>
      r.type === request.resourceType &&
      r.maintenanceStatus === "Operational" &&
      r.available
  );

  const reqStart = new Date(request.earliestStart).getTime();
  const reqEnd = new Date(request.latestEnd).getTime();
  const duration = request.duration;

  // Try each compatible resource
  for (const resource of compatible) {
    // Get existing bookings for this resource
    const bookings = existingRequests
      .filter(
        (r) =>
          r.resourceId === resource.id &&
          r.id !== request.id &&
          r.status !== "cancelled"
      )
      .map((r) => ({
        start: new Date(r.earliestStart).getTime(),
        end: new Date(r.latestEnd).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    // Try the requested window first
    if (isSlotFree(reqStart, reqStart + duration * 60000, bookings, resource)) {
      const distance = haversineKm(request.lat, request.lng, resource.lat, resource.lng);
      const travelMin = Math.round(distance * 2); // rough: 2 min per km
      return {
        resourceId: resource.id,
        farmerId: request.farmerId,
        start: new Date(reqStart).toISOString(),
        end: new Date(reqStart + duration * 60000).toISOString(),
        duration,
        travelTime: travelMin,
        bufferTime: 30,
        status: "confirmed",
      };
    }

    // Search nearby slots within the requested window
    const step = 30 * 60000; // 30 min steps
    for (let t = reqStart; t + duration * 60000 <= reqEnd; t += step) {
      if (isSlotFree(t, t + duration * 60000, bookings, resource)) {
        const distance = haversineKm(request.lat, request.lng, resource.lat, resource.lng);
        const travelMin = Math.round(distance * 2);
        return {
          resourceId: resource.id,
          farmerId: request.farmerId,
          start: new Date(t).toISOString(),
          end: new Date(t + duration * 60000).toISOString(),
          duration,
          travelTime: travelMin,
          bufferTime: 30,
          status: "tentative",
        };
      }
    }

    // Try 1-day extension
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const dayStart = reqStart + dayOffset * 24 * 60 * 60000;
      const rStart = resource.operatingStart * 60 * 60000;
      const slotStart = dayStart - (dayStart % (24 * 60 * 60000)) + rStart;
      const slotEnd = slotStart + duration * 60000;

      if (slotEnd <= dayStart - (dayStart % (24 * 60 * 60000)) + resource.operatingEnd * 60 * 60000) {
        if (isSlotFree(slotStart, slotEnd, bookings, resource)) {
          const distance = haversineKm(request.lat, request.lng, resource.lat, resource.lng);
          const travelMin = Math.round(distance * 2);
          return {
            resourceId: resource.id,
            farmerId: request.farmerId,
            start: new Date(slotStart).toISOString(),
            end: new Date(slotEnd).toISOString(),
            duration,
            travelTime: travelMin,
            bufferTime: 30,
            status: "tentative",
          };
        }
      }
    }
  }

  return null;
}

function isSlotFree(
  start: number,
  end: number,
  bookings: { start: number; end: number }[],
  _resource: Resource
): boolean {
  const buffer = 30 * 60000; // 30 min buffer
  for (const booking of bookings) {
    if (start - buffer < booking.end + buffer && end + buffer > booking.start - buffer) {
      return false;
    }
  }
  return true;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Actions ──
type Action =
  | { type: "ADD_REQUEST"; payload: ResourceRequest }
  | { type: "UPDATE_REQUEST"; payload: ResourceRequest }
  | { type: "UPDATE_REQUEST_STATUS"; payload: { id: string; status: RequestStatus } }
  | { type: "UPDATE_FARMER"; payload: Farmer }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_READ"; payload: string }
  | { type: "MARK_ALL_READ" }
  | { type: "ADD_DISRUPTION"; payload: Disruption }
  | { type: "RESOLVE_DISRUPTION"; payload: string }
  | { type: "SET_OFFLINE"; payload: boolean }
  | { type: "ADD_OFFLINE_REQUEST"; payload: ResourceRequest }
  | { type: "SYNC_OFFLINE_REQUESTS" }
  | { type: "SET_SELECTED_FARMER"; payload: string | null }
  | { type: "REALLOCATE_REQUEST"; payload: { requestId: string; schedule: ScheduleSlot; resourceId: string } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_REQUEST":
      return { ...state, requests: [...state.requests, action.payload] };
    case "UPDATE_REQUEST":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case "UPDATE_REQUEST_STATUS":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload.id
            ? { ...r, status: action.payload.status }
            : r
        ),
      };
    case "UPDATE_FARMER":
      return {
        ...state,
        farmers: state.farmers.map((f) =>
          f.id === action.payload.id ? action.payload : f
        ),
        requests: state.requests.map((r) =>
          r.farmerId === action.payload.id
            ? {
                ...r,
                farmerName: action.payload.name,
                phone: action.payload.phone,
                city: action.payload.city,
                landArea: action.payload.landArea,
              }
            : r
        ),
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case "MARK_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "ADD_DISRUPTION":
      return {
        ...state,
        disruptions: [...state.disruptions, action.payload],
      };
    case "RESOLVE_DISRUPTION":
      return {
        ...state,
        disruptions: state.disruptions.map((d) =>
          d.id === action.payload ? { ...d, resolved: true } : d
        ),
      };
    case "SET_OFFLINE":
      return { ...state, offlineMode: action.payload };
    case "ADD_OFFLINE_REQUEST":
      return {
        ...state,
        offlineRequests: [...state.offlineRequests, action.payload],
      };
    case "SYNC_OFFLINE_REQUESTS": {
      const synced = state.offlineRequests.map((r) => ({ ...r, offline: false }));
      return {
        ...state,
        requests: [...state.requests, ...synced],
        offlineRequests: [],
      };
    }
    case "SET_SELECTED_FARMER":
      return { ...state, selectedFarmerId: action.payload };
    case "REALLOCATE_REQUEST":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload.requestId
            ? {
                ...r,
                resourceId: action.payload.resourceId,
                schedule: action.payload.schedule,
                status: "scheduled",
                conflict: undefined,
              }
            : r
        ),
      };
    default:
      return state;
  }
}

// ── Context ──
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addRequest: (req: Omit<ResourceRequest, "id" | "priority" | "status" | "createdAt" | "offline" | "schedule" | "conflict">) => ResourceRequest;
  getFarmerRequests: (farmerId: string) => ResourceRequest[];
  getResourceById: (id: string) => Resource | undefined;
  getFarmerById: (id: string) => Farmer | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    farmers: demoFarmers,
    resources: demoResources,
    requests: demoRequests,
    notifications: demoNotifications,
    disruptions: [],
    offlineMode: false,
    offlineRequests: [],
    selectedFarmerId: null,
  });

  const addRequest = useCallback(
    (partial: Omit<ResourceRequest, "id" | "priority" | "status" | "createdAt" | "offline" | "schedule" | "conflict">): ResourceRequest => {
      const id = `R${String(state.requests.length + 1).padStart(3, "0")}`;
      const distance = haversineKm(
        partial.lat,
        partial.lng,
        state.resources.find((r) => r.id === partial.resourceId)?.lat ?? partial.lat,
        state.resources.find((r) => r.id === partial.resourceId)?.lng ?? partial.lng
      );
      const priority = calculatePriority({
        urgency: partial.urgency,
        weatherRisk: partial.weatherRisk,
        cropStage: partial.cropStage,
        createdAt: new Date().toISOString(),
        distance,
        hasAttachmentNeed: partial.attachmentNeeded !== "No attachment needed",
        hasOperatorNeed: partial.operatorRequirement !== "Any operator" && partial.operatorRequirement !== "No operator required",
        duration: partial.duration,
      });

      const conflicts = detectConflicts(
        [...state.requests, { ...partial, id, priority, status: "pending", createdAt: new Date().toISOString() } as ResourceRequest],
        state.resources
      );
      const conflict = conflicts.find((c) => c.conflictingRequests.includes(id));

      let status: RequestStatus = "priority_calculated";
      if (conflict) status = "conflict_detected";

      const schedule = findFeasibleSlot(
        { ...partial, id, priority, status, createdAt: new Date().toISOString() } as ResourceRequest,
        state.resources,
        state.requests
      );

      if (schedule && !conflict) {
        status = "scheduled";
      }

      const request: ResourceRequest = {
        ...partial,
        id,
        priority,
        status,
        createdAt: new Date().toISOString(),
        schedule: schedule ?? undefined,
        conflict: conflict ?? undefined,
        offline: false,
      };

      dispatch({ type: "ADD_REQUEST", payload: request });

      // Add notification
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `N${Date.now()}`,
          type: "priority_calculated",
          title: "Priority Score Calculated",
          message: `${partial.farmerName}'s request ${id} scored ${priority.total}/100`,
          timestamp: new Date().toISOString(),
          read: false,
          farmerId: partial.farmerId,
          requestId: id,
        },
      });

      if (conflict) {
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            id: `N${Date.now() + 1}`,
            type: "conflict_detected",
            title: "Scheduling Conflict Detected",
            message: `Conflict for resource ${partial.resourceType} between ${partial.farmerName} and another request`,
            timestamp: new Date().toISOString(),
            read: false,
            farmerId: partial.farmerId,
            requestId: id,
          },
        });
      }

      return request;
    },
    [state.requests, state.resources]
  );

  const getFarmerRequests = useCallback(
    (farmerId: string) => state.requests.filter((r) => r.farmerId === farmerId),
    [state.requests]
  );

  const getResourceById = useCallback(
    (id: string) => state.resources.find((r) => r.id === id),
    [state.resources]
  );

  const getFarmerById = useCallback(
    (id: string) => state.farmers.find((f) => f.id === id),
    [state.farmers]
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addRequest,
        getFarmerRequests,
        getResourceById,
        getFarmerById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
