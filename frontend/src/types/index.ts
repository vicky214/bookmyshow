export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  slug: string;
}

export interface Cinema {
  id: string;
  city_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  amenities: string[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  language: string;
  duration_mins: number;
  genre: string;
  rating: number;
  poster_url: string;
  release_date: string;
}

export interface Show {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  screenId: string;
  screenName: string;
  screenType: string;
  cinemaId: string;
  cinemaName: string;
  cinemaAddress: string;
  startTime: string;
  endTime: string;
  priceMultiplier: number;
}

export interface Seat {
  id: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: 'RECLINER' | 'PRIME' | 'CLASSIC';
  price: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'BLOCKED';
  isLockedByMe: boolean;
  remainingHoldSeconds: number;
}

export interface SeatRow {
  rowLabel: string;
  seats: Seat[];
}

export interface SeatMatrixData {
  showId: string;
  screenName: string;
  totalSeats: number;
  availableSeats: number;
  rows: SeatRow[];
}

export interface BookingConfirmation {
  success: boolean;
  bookingId: string;
  bookingReference: string;
  transactionRef: string;
  totalAmountCents: number;
  convenienceFeeCents: number;
  seatCount: number;
  bookedSeatIds: string[];
  userEmail: string;
  confirmedAt: string;
  qrPayload: string;
}

export interface AnalyticsData {
  financials: {
    grossRevenueCents: number;
    grossRevenueFormatted: string;
    convenienceFeesCents: number;
    convenienceFeesFormatted: string;
    netTicketSalesCents: number;
    netTicketSalesFormatted: string;
    totalBookings: number;
  };
  occupancy: {
    totalShowSeats: number;
    bookedShowSeats: number;
    lockedShowSeats: number;
    availableShowSeats: number;
    overallOccupancyPercent: number;
  };
  moviePerformance: Array<{
    movieId: string;
    title: string;
    genre: string;
    revenueCents: number;
    revenueFormatted: string;
  }>;
  cinemaPerformance: Array<{
    cinemaId: string;
    cinemaName: string;
    address: string;
    totalSeats: number;
    bookedSeats: number;
    occupancyPercentage: number;
  }>;
  hourlyTrafficHeatmap: Array<{
    hour: string;
    volume: number;
  }>;
}

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'B2B_PARTNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  apiKey?: string;
  apiSecret?: string;
  rateLimitRpm?: number;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface UserBooking {
  id: string;
  bookingReference: string;
  status: 'CONFIRMED' | 'CANCELLED';
  totalAmountCents: number;
  convenienceFeeCents: number;
  createdAt: string;
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    durationMins: number;
    genre: string;
    rating: number;
  };
  cinema: {
    id: string;
    name: string;
    address: string;
  };
  screen: {
    id: string;
    name: string;
    screenType: string;
  };
  show: {
    id: string;
    startTime: string;
    endTime: string;
  };
  seats: string[];
  seatIds: string[];
  qrPayload: string;
}
