import React, { useState, useEffect, useCallback } from 'react';
import { Film, Building2, Terminal, ArrowLeft, RefreshCw, Sparkles, AlertCircle, Ticket, Layers, ArrowRight } from 'lucide-react';
import { apiClient } from './api/client.js';
import { City, Movie, Cinema, Show, SeatMatrixData, Seat, BookingConfirmation, AnalyticsData } from './types/index.js';
import { useAuth } from './context/AuthContext.js';

import { Navbar } from './components/Navbar.js';
import { MovieCard } from './components/MovieCard.js';
import { CinemaShowCard } from './components/CinemaShowCard.js';
import { SeatMatrix } from './components/SeatMatrix.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { TicketConfirmation } from './components/TicketConfirmation.js';

import { CustomerDashboard } from './components/customer/CustomerDashboard.js';
import { AdminProtectedGate } from './components/admin/AdminProtectedGate.js';
import { PartnerProtectedGate } from './components/partner/PartnerProtectedGate.js';
import { AuthModal } from './components/auth/AuthModal.js';

import { CinemaHallManager } from './components/admin/CinemaHallManager.js';
import { SeatLayoutDesigner } from './components/admin/SeatLayoutDesigner.js';
import { ShowScheduler } from './components/admin/ShowScheduler.js';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard.js';

import { B2BDemoConsole } from './components/partner/B2BDemoConsole.js';

export function App() {
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'partner'>('customer');
  const [customerView, setCustomerView] = useState<'movies' | 'bookings'>('movies');
  const [adminSubTab, setAdminSubTab] = useState<'cinemas' | 'seats' | 'shows' | 'analytics'>('analytics');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'admin' | 'partner'>('customer');

  const [bookingCount, setBookingCount] = useState(0);

  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('city-mum');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('');

  const [seatMatrix, setSeatMatrix] = useState<SeatMatrixData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | undefined>();
  const [lockLoading, setLockLoading] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | undefined>();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | undefined>();
  const [confirmedTicket, setConfirmedTicket] = useState<BookingConfirmation | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  const refreshBookingCount = useCallback(() => {
    if (!user) {
      setBookingCount(0);
      return;
    }
    apiClient
      .getUserBookings(user.id)
      .then((data) => {
        const confirmed = data.filter((b) => b.status === 'CONFIRMED').length;
        setBookingCount(confirmed);
      })
      .catch(() => setBookingCount(0));
  }, [user]);

  useEffect(() => {
    refreshBookingCount();
  }, [refreshBookingCount]);

  useEffect(() => {
    apiClient.getCities().then((data) => {
      setCities(data);
      if (data.length > 0) setSelectedCity(data[0].id);
    }).catch(console.error);

    apiClient.getMovies().then((data) => {
      setMovies(data);
      if (data.length > 0) setSelectedMovieId(data[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    apiClient.getCinemas(selectedCity).then(setCinemas).catch(console.error);
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedMovieId) return;
    apiClient.getShows(selectedMovieId).then((data) => {
      setShows(data);
      if (data.length > 0) {
        setSelectedShowId(data[0].id);
      } else {
        setSelectedShowId('');
        setSeatMatrix(null);
      }
    }).catch(console.error);
  }, [selectedMovieId]);

  const refreshSeatMatrix = () => {
    if (!selectedShowId || !user) return;
    apiClient.getShowSeats(selectedShowId, user.id).then((data) => {
      setSeatMatrix(data);
      const myHeldSeats: Seat[] = [];
      for (const row of data.rows) {
        for (const seat of row.seats) {
          if (seat.isLockedByMe) myHeldSeats.push(seat);
        }
      }

      if (myHeldSeats.length > 0) {
        setSelectedSeats(myHeldSeats);
        setIsHoldActive(true);
      } else {
        setIsHoldActive(false);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    refreshSeatMatrix();
    setSelectedSeats([]);
    setIsHoldActive(false);
    setLockError(undefined);
  }, [selectedShowId, user?.id]);

  const refreshAnalytics = () => {
    setAnalyticsLoading(true);
    apiClient.adminGetAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setAnalyticsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'admin' && adminSubTab === 'analytics' && role === 'ADMIN') {
      refreshAnalytics();
    }
  }, [activeTab, adminSubTab, role]);

  const handleToggleSeat = (seat: Seat) => {
    if (isHoldActive) return;

    setLockError(undefined);
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) return prev.filter((s) => s.id !== seat.id);
      if (prev.length >= 10) {
        alert('Maximum 10 seats allowed per booking.');
        return prev;
      }
      return [...prev, seat];
    });
  };

  const handleAcquireHold = async () => {
    if (selectedSeats.length === 0 || !user) return;
    setLockLoading(true);
    setLockError(undefined);

    try {
      const seatIds = selectedSeats.map((s) => s.seatId);
      const res = await apiClient.lockSeats(selectedShowId, seatIds, user.id);

      if (res.success) {
        setIsHoldActive(true);
        setHoldExpiresAt(res.expiresAt);
        refreshSeatMatrix();
      }
    } catch (err: any) {
      setLockError(err.response?.data?.error || err.message || 'Seat hold conflict.');
      refreshSeatMatrix();
    } finally {
      setLockLoading(false);
    }
  };

  const handleHoldExpired = () => {
    setIsHoldActive(false);
    setSelectedSeats([]);
    setIsCheckoutOpen(false);
    alert('Your 10-minute seat hold lease has expired. Seats returned to Available status.');
    refreshSeatMatrix();
  };

  const handleConfirmPayment = async (paymentMethod: string, email: string, phone: string) => {
    if (!user) return;
    setPaymentLoading(true);
    setPaymentError(undefined);

    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const confirmation = await apiClient.confirmBooking({
        showId: selectedShowId,
        seatIds: selectedSeats.map((s) => s.seatId),
        userId: user.id,
        userEmail: email || user.email,
        userPhone: phone,
        idempotencyKey,
        paymentMethod
      });

      setConfirmedTicket(confirmation);
      setIsCheckoutOpen(false);
      setIsHoldActive(false);
      setSelectedSeats([]);
      refreshSeatMatrix();
      refreshBookingCount();
    } catch (err: any) {
      setPaymentError(err.response?.data?.error || err.message || 'Payment confirmation error.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const selectedMovie = movies.find((m) => m.id === selectedMovieId);
  const selectedShow = shows.find((s) => s.id === selectedShowId);

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col font-sans">
      <Navbar
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        customerView={customerView}
        onSelectCustomerView={setCustomerView}
        bookingCount={bookingCount}
        onOpenAuthModal={(tab) => {
          setAuthModalTab(tab || 'customer');
          setIsAuthModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'customer' && (
          <div className="space-y-6">

            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCustomerView('movies')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    customerView === 'movies'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Browse Movies & Shows</span>
                </button>

                <button
                  onClick={() => setCustomerView('bookings')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition relative ${
                    customerView === 'bookings'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>My Bookings & Orders</span>
                  {bookingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold ml-1">
                      {bookingCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 px-2">
                <span>Account:</span>
                <span className="font-bold text-slate-800">{user?.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600">
                  {user?.email}
                </span>
              </div>
            </div>

            {customerView === 'bookings' ? (
              <CustomerDashboard onBrowseMovies={() => setCustomerView('movies')} />
            ) : (

              <>
                {confirmedTicket ? (
                  <div className="space-y-4">
                    <TicketConfirmation
                      confirmation={confirmedTicket}
                      show={selectedShow}
                      movie={selectedMovie}
                      onReset={() => setConfirmedTicket(null)}
                    />
                    <div className="flex items-center justify-center pt-2">
                      <button
                        onClick={() => {
                          setConfirmedTicket(null);
                          setCustomerView('bookings');
                        }}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-2 shadow-lg"
                      >
                        <Ticket className="w-4 h-4 text-rose-500" />
                        <span>View in Customer Dashboard ("My Bookings")</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                          <Film className="w-5 h-5 text-rose-500" />
                          <span>Recommended Movies in {cities.find(c => c.id === selectedCity)?.name || 'City'}</span>
                        </h2>
                        <span className="text-xs text-slate-400 font-semibold">{movies.length} Movies Active</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {movies.map((movie) => (
                          <MovieCard
                            key={movie.id}
                            movie={movie}
                            isSelected={movie.id === selectedMovieId}
                            onSelect={setSelectedMovieId}
                          />
                        ))}
                      </div>
                    </div>

                    {selectedMovie && (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">
                              Cinemas & Theatres for {selectedMovie.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Select a showtime to view live seat availability
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {cinemas.map((cinema) => {
                            const cinemaShows = shows.filter((s) => s.cinemaId === cinema.id);
                            return (
                              <CinemaShowCard
                                key={cinema.id}
                                cinema={cinema}
                                shows={cinemaShows}
                                selectedShowId={selectedShowId}
                                onSelectShow={setSelectedShowId}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedShowId && seatMatrix && (
                      <div className="pt-6 border-t border-slate-200">
                        <SeatMatrix
                          matrix={seatMatrix}
                          selectedSeats={selectedSeats}
                          onToggleSeat={handleToggleSeat}
                          onAcquireHold={handleAcquireHold}
                          onProceedToCheckout={() => setIsCheckoutOpen(true)}
                          isHoldActive={isHoldActive}
                          holdExpiresAt={holdExpiresAt}
                          onHoldExpired={handleHoldExpired}
                          lockLoading={lockLoading}
                          lockError={lockError}
                        />
                      </div>
                    )}
                  </>
                )}

                <CheckoutModal
                  isOpen={isCheckoutOpen}
                  onClose={() => setIsCheckoutOpen(false)}
                  showId={selectedShowId}
                  selectedSeats={selectedSeats}
                  currentUserId={user?.id || 'customer-alice'}
                  onConfirmPayment={handleConfirmPayment}
                  loading={paymentLoading}
                  error={paymentError}
                />
              </>
            )}

          </div>
        )}

        {activeTab === 'admin' && (
          <AdminProtectedGate onExitToCustomer={() => setActiveTab('customer')}>
            <div className="space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <span className="text-[11px] font-mono tracking-wider uppercase text-purple-600 font-bold">
                    BookMyShow Corporate Backoffice
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Company Administration Portal</h2>
                </div>

                <div className="flex flex-wrap gap-1 bg-slate-200/80 p-1 rounded-2xl">
                  <button
                    onClick={() => setAdminSubTab('analytics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      adminSubTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Company Analytics
                  </button>
                  <button
                    onClick={() => setAdminSubTab('cinemas')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      adminSubTab === 'cinemas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Manage Cinemas
                  </button>
                  <button
                    onClick={() => setAdminSubTab('seats')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      adminSubTab === 'seats' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Screen & Seat Designer
                  </button>
                  <button
                    onClick={() => setAdminSubTab('shows')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      adminSubTab === 'shows' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Show Scheduler
                  </button>
                </div>
              </div>

              {adminSubTab === 'analytics' && (
                <AnalyticsDashboard analytics={analytics} loading={analyticsLoading} />
              )}

              {adminSubTab === 'cinemas' && (
                <CinemaHallManager
                  cities={cities}
                  cinemas={cinemas}
                  onCinemaAdded={() => apiClient.getCinemas(selectedCity).then(setCinemas)}
                />
              )}

              {adminSubTab === 'seats' && (
                <SeatLayoutDesigner
                  cinemas={cinemas}
                  onScreenCreated={() => alert('Screen and seat template saved to database!')}
                />
              )}

              {adminSubTab === 'shows' && (
                <ShowScheduler
                  movies={movies}
                  onShowScheduled={() => apiClient.getShows(selectedMovieId).then(setShows)}
                />
              )}
            </div>
          </AdminProtectedGate>
        )}

        {activeTab === 'partner' && (
          <PartnerProtectedGate onExitToCustomer={() => setActiveTab('customer')}>
            <B2BDemoConsole />
          </PartnerProtectedGate>
        )}

      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onLoginSuccess={(target) => {
          setActiveTab(target);
          if (target === 'customer') setCustomerView('movies');
        }}
      />

      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400">
        <p>BookMyShow Enterprise Platform • Role-Based Access Control • Customer Dashboard • Relational ACID Transactions</p>
        <p className="mt-1 font-mono text-[10px]">Zero Double-Bookings Guarantee • Atomic 10-Minute Hold Leases • Multi-Instance Scalable</p>
      </footer>
    </div>
  );
}

export default App;
