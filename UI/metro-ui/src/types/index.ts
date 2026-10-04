export interface Line {
  id: number; code: string; name: string; color: string; isActive: boolean;
}
export interface Station {
  id: number; name: string; code: string; latitude: number; longitude: number;
  address?: string; isActive: boolean; hasParking: boolean; hasLift: boolean;
  hasEscalator: boolean; hasToilet: boolean; isAccessible: boolean;
  nearbyLandmarks?: string; openingDate?: string;
}
export interface StationDetail {
  station: Station; lines: Line[]; gates: StationGate[]; feederServices: FeederService[];
}
export interface LineStation {
  id: number; lineId: number; lineName: string; stationId: number; stationName: string; sequenceNo: number;
}
export interface StationConnection {
  id: number; fromStationId: number; fromStationName: string;
  toStationId: number; toStationName: string; distanceKm: number; travelTimeMinutes: number;
}
export interface Interchange {
  id: number; stationId: number; stationName: string;
  line1Id: number; line1Name: string; line2Id: number; line2Name: string; transferTimeMinutes: number;
}
export interface FareRule {
  id: number; minDistanceKm: number; maxDistanceKm: number; fare: number;
}
export interface StationGate {
  id: number; stationId: number; gateNumber: string; latitude: number; longitude: number;
  description?: string; accessibles: string[];
}
export interface FeederService {
  id: number; stationId: number; type: string; description: string;
}
export interface FavouriteRoute {
  id: number; label: string; fromStationId: number; fromStationName: string;
  toStationId: number; toStationName: string;
}
export interface RouteStep {
  stationId: number; stationName: string; lineName: string; lineColor: string;
  distanceFromPrevKm?: number; timeFromPrevMinutes?: number;
}
export interface RouteOption {
  label: string; steps: RouteStep[]; totalDistanceKm: number;
  totalTimeMinutes: number; interchanges: number; fare: number;
}
export interface DashboardStats {
  totalLines: number; totalStations: number; totalConnections: number;
  totalInterchanges: number; activeStations: number; totalFareRules: number;
}
export interface Platform {
  id: number; stationId: number; stationName: string;
  lineId: number; lineName: string; lineColor: string;
  platformNumber: string; towardsDestination: string; isActive: boolean;
}
export interface AuthResponse {
  token: string; email: string; fullName: string; role: string;
  mfaRequired?: boolean; userId?: string;
}
export interface LineTimetable {
  id: number; lineId: number; lineName: string; lineColor: string;
  direction: string; dayType: string;
  firstDeparture: string; lastDeparture: string;
  peakWindows: { start: string; end: string }[];
  peakFrequencyMinutes: number; offPeakFrequencyMinutes: number;
}
export interface NextDeparture {
  lineName: string; lineColor: string; direction: string;
  towardsTerminal: string; departureInMinutes: number;
  departureTime: string; platformNumber: string;
}
export interface LiveTrain {
  runId: number; lineName: string; lineColor: string; direction: string;
  towardsTerminal: string; currentStationId: number; currentStationName: string;
  nextStationId?: number; nextStationName?: string;
  progressPercent: number; departureFromTerminal: string;
}
export interface RecentSearch {
  fromId: number; toId: number;
  fromName: string; toName: string;
  searchedAt?: string;
}
export interface StationLive { stationId: number; stationName: string; nextDepartures: NextDeparture[]; }
export interface LineLive { lineName: string; lineColor: string; activeTrains: LiveTrain[]; }

export interface Ticket {
  id: number; ticketRef: string;
  fromStationName: string; toStationName: string;
  fare: number; distanceKm: number; passengers: number; totalFare: number;
  purchasedAt: string; validUntil: string;
  status: 'Active' | 'Used' | 'Expired';
}

export interface JourneyStats {
  totalTrips: number;
  totalDistanceKm: number;
  totalSpent: number;
  activeTickets: number;
  mostVisitedStation?: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  createdAt: string;
  mfaEnabled: boolean;
}
