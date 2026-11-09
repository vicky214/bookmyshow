import axios from 'axios';
import {
  City,
  Movie,
  Cinema,
  Show,
  SeatMatrixData,
  BookingConfirmation,
  AnalyticsData,
  AuthResponse,
  UserBooking
} from '../types/index.js';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  try {
    const rawUser = localStorage.getItem('bms_auth_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.role === 'ADMIN') {
        config.headers['X-Admin-Key'] = user.token || 'bms_admin_master_key_99218';
        config.headers['Authorization'] = `Bearer ${user.token || 'admin-jwt-token-master'}`;
      } else if (user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
      if (user.id) {
        config.headers['X-User-Id'] = user.id;
      }
    }
  } catch (e) {
    console.error('Error attaching auth headers:', e);
  }
  return config;
});

export const apiClient = {

  customerLogin: (params: { email?: string; name?: string; userId?: string }) =>
    api.post<AuthResponse>('/auth/customer-login', params).then(res => res.data),

  adminLogin: (adminKey: string, email?: string) =>
    api.post<AuthResponse>('/auth/admin-login', { adminKey, email }).then(res => res.data),

  partnerLogin: (apiKey: string, apiSecret?: string) =>
    api.post<AuthResponse>('/auth/partner-login', { apiKey, apiSecret }).then(res => res.data),

  getCities: () => api.get<City[]>('/cities').then(res => res.data),
  getMovies: () => api.get<Movie[]>('/movies').then(res => res.data),
  getCinemas: (cityId?: string) => api.get<Cinema[]>('/cinemas', { params: { cityId } }).then(res => res.data),
  getShows: (movieId?: string, cinemaId?: string) => api.get<Show[]>('/shows', { params: { movieId, cinemaId } }).then(res => res.data),
  getShowSeats: (showId: string, userId: string) =>
    api.get<SeatMatrixData>(`/shows/${showId}/seats`, { params: { userId } }).then(res => res.data),

  lockSeats: (showId: string, seatIds: string[], userId: string, admissionToken?: string) =>
    api.post<{ success: boolean; lockedSeats: string[]; expiresAt: string }>('/bookings/lock', {
      showId,
      seatIds,
      userId,
      admissionToken
    }).then(res => res.data),

  releaseSeats: (showId: string, seatIds: string[], userId: string) =>
    api.post<{ success: boolean }>('/bookings/release', { showId, seatIds, userId }).then(res => res.data),

  confirmBooking: (data: {
    showId: string;
    seatIds: string[];
    userId: string;
    userEmail: string;
    userPhone: string;
    idempotencyKey: string;
    paymentMethod: string;
  }) => api.post<BookingConfirmation>('/bookings/confirm', data).then(res => res.data),

  getUserBookings: (userId: string) =>
    api.get<UserBooking[]>(`/users/${userId}/bookings`).then(res => res.data),

  cancelBooking: (bookingId: string, userId: string) =>
    api.post<{ success: boolean; bookingReference: string; message: string }>(`/bookings/${bookingId}/cancel`, { userId }).then(res => res.data),

  waitingRoomJoin: (showId: string, userId: string) =>
    api.post('/waiting-room/join', { showId, userId }).then(res => res.data),

  waitingRoomStatus: (showId: string, userId: string) =>
    api.get('/waiting-room/status', { params: { showId, userId } }).then(res => res.data),

  adminAddCinema: (data: {
    cityId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    amenities: string[];
  }) => api.post<Cinema>('/admin/cinemas', data).then(res => res.data),

  adminAddScreen: (data: {
    cinemaId: string;
    name: string;
    screenType: string;
    rowsConfig: Array<{ rowLabel: string; seatCount: number; tier: 'RECLINER' | 'PRIME' | 'CLASSIC' }>;
  }) => api.post('/admin/screens', data).then(res => res.data),

  adminScheduleShow: (data: {
    movieId: string;
    screenId: string;
    startTime: string;
    endTime: string;
    priceMultiplier: number;
  }) => api.post('/admin/shows', data).then(res => res.data),

  adminGetAnalytics: () => api.get<AnalyticsData>('/admin/analytics').then(res => res.data),
  adminGetOccupancy: (showId: string) => api.get(`/admin/shows/${showId}/occupancy`).then(res => res.data),
};
