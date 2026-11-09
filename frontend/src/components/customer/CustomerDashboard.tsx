import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Film,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  Download,
  Sparkles,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { UserBooking } from '../../types/index.js';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

interface CustomerDashboardProps {
  onBrowseMovies: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onBrowseMovies }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<UserBooking | null>(null);

  const fetchBookings = () => {
    if (!user) return;
    setLoading(true);
    apiClient
      .getUserBookings(user.id)
      .then((data) => {
        setBookings(data);
      })
      .catch((err) => {
        console.error('Failed to fetch user bookings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.id]);

  const handleCancelBooking = async (booking: UserBooking) => {
    if (!user) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel booking ${booking.bookingReference} for ${booking.movie.title}? Your seats will be released back to the auditorium immediately.`
    );
    if (!confirmCancel) return;

    setCancellingId(booking.id);
    try {
      await apiClient.cancelBooking(booking.id, user.id);
      fetchBookings();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const totalSpentCents = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((acc, b) => acc + b.totalAmountCents, 0);

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 border border-slate-700/80 shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-rose-600/30">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight">{user?.name || 'Customer Dashboard'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>VIP Member</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Confirmed Tickets
              </span>
              <span className="text-xl font-black text-rose-400">{confirmedCount}</span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Total Spent
              </span>
              <span className="text-xl font-black text-emerald-400">
                ₹{(totalSpentCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <button
              onClick={onBrowseMovies}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-rose-600/20"
            >
              <span>Book Movies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-rose-600" />
            <span>My Bookings & Tickets</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View active boarding passes, seat allocations, payment receipts, or cancel reservations.
          </p>
        </div>

        <div className="flex items-center space-x-2">

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Active ({confirmedCount})
            </button>
            <button
              onClick={() => setFilter('CANCELLED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Cancelled
            </button>
          </div>

          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition hover:bg-slate-50"
            title="Refresh Bookings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-500" />
          <p className="text-sm">Fetching your live tickets and reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
            <Film className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Bookings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You don't have any {filter !== 'ALL' ? filter.toLowerCase() : ''} tickets yet. Pick a blockbuster movie and reserve your seats!
            </p>
          </div>
          <button
            onClick={onBrowseMovies}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 inline-flex items-center space-x-1.5"
          >
            <span>Explore Movies</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            const showDate = b.show?.startTime ? new Date(b.show.startTime) : new Date();

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>

                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-4 h-4 text-rose-600" />
                      <span className="font-mono text-xs font-bold text-slate-800">{b.bookingReference}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CONFIRMED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>CANCELLED</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-5 flex gap-4">

                    <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                      <img
                        src={b.movie?.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
                        alt={b.movie?.title || 'Movie Poster'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{b.movie?.title || 'Movie Title'}</h4>
                      <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                        <span>{b.movie?.genre || 'Cinema'}</span>
                        <span>•</span>
                        <span>{b.movie?.durationMins || 120}m</span>
                        <span>•</span>
                        <span className="text-amber-600 font-bold">★ {b.movie?.rating || 8.5}</span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center space-x-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{b.cinema?.name || 'Multiplex Cinema'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <Film className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{b.screen?.name || 'Audi 1'} ({b.screen?.screenType || '4K'})</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>
                            {showDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                            {showDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
                        Reserved Seats ({(b.seats || []).length})
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(b.seats || []).map((seatLabel) => (
                          <span
                            key={seatLabel}
                            className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 font-mono"
                          >
                            Seat {seatLabel}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
                        Amount Paid
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        ₹{(b.totalAmountCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedTicketForModal(b)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Boarding Pass</span>
                  </button>

                  {isConfirmed && (
                    <button
                      onClick={() => handleCancelBooking(b)}
                      disabled={cancellingId === b.id}
                      className="py-2 px-3 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center justify-center space-x-1 disabled:opacity-50"
                    >
                      <span>{cancellingId === b.id ? 'Cancelling...' : 'Cancel Ticket'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTicketForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

            <div className="bg-rose-600 p-6 text-white text-center relative">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-80 block mb-1">
                Official Digital Admission Pass
              </span>
              <h3 className="text-xl font-black">{selectedTicketForModal.movie?.title || 'Movie'}</h3>
              <p className="text-xs opacity-90 mt-0.5">{selectedTicketForModal.cinema?.name || 'Multiplex Cinema'}</p>

              <button
                onClick={() => setSelectedTicketForModal(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/30 transition text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Date & Showtime</span>
                  <span className="font-bold text-slate-800">
                    {selectedTicketForModal.show?.startTime ? new Date(selectedTicketForModal.show.startTime).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Today'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Auditorium</span>
                  <span className="font-bold text-slate-800">{selectedTicketForModal.screen?.name || 'Audi 1'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Allocated Seats</span>
                  <span className="font-bold text-rose-600 font-mono text-sm">
                    {(selectedTicketForModal.seats || []).join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Reference #</span>
                  <span className="font-bold text-slate-800 font-mono text-xs">
                    {selectedTicketForModal.bookingReference}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center">

                <div className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                    <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                    <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                    <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                    <rect x="40" y="10" width="20" height="10" fill="currentColor" />
                    <rect x="35" y="30" width="30" height="10" fill="currentColor" />
                    <rect x="45" y="50" width="20" height="20" fill="currentColor" />
                    <rect x="70" y="70" width="15" height="15" fill="currentColor" />
                    <rect x="85" y="85" width="15" height="15" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-2">
                  Scan at multiplex turnstile for contactless entry
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Total Paid: ₹{(selectedTicketForModal.totalAmountCents / 100).toFixed(2)}
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
