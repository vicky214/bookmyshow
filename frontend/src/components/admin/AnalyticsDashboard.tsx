import React from 'react';
import { DollarSign, Percent, TrendingUp, Users, Ticket, BarChart3, Clock } from 'lucide-react';
import { AnalyticsData } from '../../types/index.js';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics, loading }) => {
  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Loading real-time company analytics...
      </div>
    );
  }

  const { financials, occupancy, moviePerformance, cinemaPerformance, hourlyTrafficHeatmap } = analytics;

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Gross Box Office
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {financials.grossRevenueFormatted}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time Ticket Gross</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Convenience Fees
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {financials.convenienceFeesFormatted}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">18% GST + Base Surcharge</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Occupancy
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {occupancy.overallOccupancyPercent}%
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {occupancy.bookedShowSeats} of {occupancy.totalShowSeats} seats
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Confirmed Bookings
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {financials.totalBookings}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Zero Double-Bookings</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <span>Cinema Hall Occupancy Breakdown</span>
          </h4>

          <div className="space-y-4">
            {cinemaPerformance.map((c) => (
              <div key={c.cinemaId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 line-clamp-1">{c.cinemaName}</span>
                  <span className="font-mono font-bold text-slate-900">{c.occupancyPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, c.occupancyPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{c.bookedSeats} booked</span>
                  <span>{c.totalSeats} capacity</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Movie Gross Box Office Ranking</span>
          </h4>

          <div className="space-y-3">
            {moviePerformance.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No confirmed bookings recorded yet.</p>
            ) : (
              moviePerformance.map((m, idx) => (
                <div
                  key={m.movieId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h5 className="font-black text-xs text-slate-900">{m.title}</h5>
                      <span className="text-[10px] text-slate-500">{m.genre}</span>
                    </div>
                  </div>

                  <span className="font-black font-mono text-sm text-emerald-600">
                    {m.revenueFormatted}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Peak Booking Hours Heatmap</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {hourlyTrafficHeatmap.map((slot) => (
            <div
              key={slot.hour}
              className={`p-3.5 rounded-2xl border text-center ${
                slot.volume > 80
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : slot.volume > 40
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-xs font-bold block">{slot.hour}</span>
              <span className="text-lg font-black font-mono mt-1 block">{slot.volume} tx/hr</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                {slot.volume > 80 ? 'Peak Rush' : 'Normal'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
