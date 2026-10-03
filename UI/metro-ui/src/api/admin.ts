import api from './axios';
import type { Line, Station, LineStation, StationConnection, Interchange, FareRule, StationGate, FeederService, DashboardStats, Platform, LineTimetable } from '../types';

export const adminApi = {
  getDashboard: () => api.get<DashboardStats>('/admin/dashboard'),

  getLines: () => api.get<Line[]>('/admin/lines'),
  createLine: (data: Omit<Line, 'id'>) => api.post<Line>('/admin/lines', data),
  updateLine: (id: number, data: Omit<Line, 'id'>) => api.put<Line>(`/admin/lines/${id}`, data),
  deleteLine: (id: number) => api.delete(`/admin/lines/${id}`),

  getStations: () => api.get<Station[]>('/admin/stations'),
  createStation: (data: Omit<Station, 'id'>) => api.post<Station>('/admin/stations', data),
  updateStation: (id: number, data: Omit<Station, 'id'>) => api.put<Station>(`/admin/stations/${id}`, data),
  deleteStation: (id: number) => api.delete(`/admin/stations/${id}`),

  getLineStations: (lineId: number) => api.get<LineStation[]>(`/admin/line-stations/${lineId}`),
  createLineStation: (data: Omit<LineStation, 'id' | 'lineName' | 'stationName'>) => api.post<LineStation>('/admin/line-stations', data),
  updateLineStation: (id: number, data: Omit<LineStation, 'id' | 'lineName' | 'stationName'>) => api.put<LineStation>(`/admin/line-stations/${id}`, data),
  deleteLineStation: (id: number) => api.delete(`/admin/line-stations/${id}`),

  getConnections: () => api.get<StationConnection[]>('/admin/connections'),
  createConnection: (data: Omit<StationConnection, 'id' | 'fromStationName' | 'toStationName'>) => api.post<StationConnection>('/admin/connections', data),
  updateConnection: (id: number, data: Omit<StationConnection, 'id' | 'fromStationName' | 'toStationName'>) => api.put<StationConnection>(`/admin/connections/${id}`, data),
  deleteConnection: (id: number) => api.delete(`/admin/connections/${id}`),

  getInterchanges: () => api.get<Interchange[]>('/admin/interchanges'),
  createInterchange: (data: Omit<Interchange, 'id' | 'stationName' | 'line1Name' | 'line2Name'>) => api.post<Interchange>('/admin/interchanges', data),
  updateInterchange: (id: number, data: Omit<Interchange, 'id' | 'stationName' | 'line1Name' | 'line2Name'>) => api.put<Interchange>(`/admin/interchanges/${id}`, data),
  deleteInterchange: (id: number) => api.delete(`/admin/interchanges/${id}`),

  getFares: () => api.get<FareRule[]>('/admin/fares'),
  createFare: (data: Omit<FareRule, 'id'>) => api.post<FareRule>('/admin/fares', data),
  updateFare: (id: number, data: Omit<FareRule, 'id'>) => api.put<FareRule>(`/admin/fares/${id}`, data),
  deleteFare: (id: number) => api.delete(`/admin/fares/${id}`),

  getGates: (stationId: number) => api.get<StationGate[]>(`/admin/gates/${stationId}`),
  createGate: (data: Omit<StationGate, 'id'>) => api.post<StationGate>('/admin/gates', data),
  updateGate: (id: number, data: Omit<StationGate, 'id'>) => api.put<StationGate>(`/admin/gates/${id}`, data),
  deleteGate: (id: number) => api.delete(`/admin/gates/${id}`),

  getFeeders: (stationId: number) => api.get<FeederService[]>(`/admin/feeders/${stationId}`),
  createFeeder: (data: Omit<FeederService, 'id'>) => api.post<FeederService>('/admin/feeders', data),
  deleteFeeder: (id: number) => api.delete(`/admin/feeders/${id}`),

  getPlatforms: (stationId: number) => api.get<Platform[]>(`/admin/platforms/${stationId}`),
  createPlatform: (data: Omit<Platform, 'id' | 'stationName' | 'lineName' | 'lineColor'>) => api.post<Platform>('/admin/platforms', data),
  updatePlatform: (id: number, data: Omit<Platform, 'id' | 'stationName' | 'lineName' | 'lineColor'>) => api.put<Platform>(`/admin/platforms/${id}`, data),
  deletePlatform: (id: number) => api.delete(`/admin/platforms/${id}`),

  getTimetables: () => api.get<LineTimetable[]>('/admin/timetables'),
  getTimetablesByLine: (lineId: number) => api.get<LineTimetable[]>(`/admin/timetables/line/${lineId}`),
  createTimetable: (data: Omit<LineTimetable, 'id' | 'lineName' | 'lineColor'>) => api.post<LineTimetable>('/admin/timetables', data),
  updateTimetable: (id: number, data: Omit<LineTimetable, 'id' | 'lineName' | 'lineColor'>) => api.put<LineTimetable>(`/admin/timetables/${id}`, data),
  deleteTimetable: (id: number) => api.delete(`/admin/timetables/${id}`),
};
