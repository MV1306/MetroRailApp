import api from './axios';
import type { Station, StationDetail, Line, LineStation, RouteOption, FavouriteRoute, StationLive, LineLive, Ticket, LineTimetable, JourneyStats } from '../types';

export const metroApi = {
  getStations: (search?: string) =>
    api.get<Station[]>('/metro/stations', { params: search ? { search } : {} }),
  getStationDetail: (id: number) => api.get<StationDetail>(`/metro/stations/${id}`),
  getLines: () => api.get<Line[]>('/metro/lines'),
  getLineStations: (lineId: number) => api.get<LineStation[]>(`/metro/lines/${lineId}/stations`),
  findRoutes: (fromStationId: number, toStationId: number) =>
    api.post<RouteOption[]>('/metro/routes', { fromStationId, toStationId }),
  getFare: (fromStationId: number, toStationId: number) =>
    api.get<{ distanceKm: number; fare: number }>('/metro/fare', { params: { fromStationId, toStationId } }),
  getFavourites: () => api.get<FavouriteRoute[]>('/metro/favourites'),
  addFavourite: (label: string, fromStationId: number, toStationId: number) =>
    api.post<FavouriteRoute>('/metro/favourites', { label, fromStationId, toStationId }),
  deleteFavourite: (id: number) => api.delete(`/metro/favourites/${id}`),
  getStationLive: (stationId: number, count = 5, toStationId?: number) =>
    api.get<StationLive>(`/metro/live/stations/${stationId}`, { params: { count, ...(toStationId ? { toStationId } : {}) } }),
  getLineLive: (lineId: number) => api.get<LineLive>(`/metro/live/lines/${lineId}`),
  getRecentSearches: () => api.get<{ fromStationId: number; fromStationName: string; toStationId: number; toStationName: string; searchedAt: string }[]>('/metro/recent-searches'),
  saveRecentSearch: (fromStationId: number, toStationId: number) => api.post('/metro/recent-searches', { fromStationId, toStationId }),
  bookTicket: (fromStationId: number, toStationId: number, passengers: number) =>
    api.post<Ticket>('/tickets', { fromStationId, toStationId, passengers }),
  getMyTickets: () => api.get<Ticket[]>('/tickets'),
  cancelTicket: (ticketId: number) => api.delete<Ticket>(`/tickets/${ticketId}`),
  getTicketStats: () => api.get<JourneyStats>('/tickets/stats'),
  getTimetable: () => api.get<LineTimetable[]>('/metro/timetable'),
  getTimetableByLine: (lineId: number) => api.get<LineTimetable[]>(`/metro/timetable/line/${lineId}`),
};

export const adminTicketApi = {
  getTicket: (ticketRef: string) => api.get<Ticket>(`/tickets/${ticketRef}`),
  validateTicket: (ticketRef: string) => api.post<Ticket>(`/tickets/${ticketRef}/validate`),
};
