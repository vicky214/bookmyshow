import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Movie } from '../../types/index.js';
import { apiClient } from '../../api/client.js';

interface ShowSchedulerProps {
  movies: Movie[];
  onShowScheduled: () => void;
}

export const ShowScheduler: React.FC<ShowSchedulerProps> = ({ movies, onShowScheduled }) => {
  const [movieId, setMovieId] = useState(movies[0]?.id || 'mov-01');
  const [screenId, setScreenId] = useState('scr-mum-01');
  const [priceMultiplier, setPriceMultiplier] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(21, 45, 0, 0);

  const [startTime, setStartTime] = useState(tomorrow.toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(tomorrowEnd.toISOString().slice(0, 16));

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await apiClient.adminScheduleShow({
        movieId,
        screenId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        priceMultiplier: parseFloat(priceMultiplier)
      });

      setMessage({
        type: 'success',
        text: `Show successfully scheduled! ${res.seatCount} seats initialized in AVAILABLE status.`
      });
      onShowScheduled();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-rose-500" />
        <span>Movie Showtime Scheduler with Conflict Collision Prevention</span>
      </h3>
      <p className="text-xs text-slate-500 mt-1">
        Enforces automatic screen slot collision validation to prevent overlapping movies on the same screen.
      </p>

      {message && (
        <div
          className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSchedule} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Movie
            </label>
            <select
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.duration_mins}m • {m.language})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Screen Auditorium
            </label>
            <select
              value={screenId}
              onChange={(e) => setScreenId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              <option value="scr-mum-01">Audi 1 (Dolby Atmos 4K) — Phoenix Palladium</option>
              <option value="scr-mum-02">Audi 2 (IMAX 3D Laser) — Phoenix Palladium</option>
              <option value="scr-mum-03">Audi 1 (Megaplex Gold Class) — Inorbit Malad</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Show Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Show End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Dynamic Pricing Multiplier
            </label>
            <select
              value={priceMultiplier}
              onChange={(e) => setPriceMultiplier(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium font-mono"
            >
              <option value="1.0">1.0x (Standard Weekday)</option>
              <option value="1.2">1.2x (Weekend Surge)</option>
              <option value="1.5">1.5x (Blockbuster Premiere / Festive)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
        >
          <Clock className="w-4 h-4" />
          <span>{loading ? 'Validating Conflicts...' : 'Schedule Showtime'}</span>
        </button>
      </form>
    </div>
  );
};
