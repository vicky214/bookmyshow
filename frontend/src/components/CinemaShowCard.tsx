import React from 'react';
import { MapPin, Sparkles, Tv, Volume2 } from 'lucide-react';
import { Cinema, Show } from '../types/index.js';

interface CinemaShowCardProps {
  cinema: Cinema;
  shows: Show[];
  selectedShowId?: string;
  onSelectShow: (showId: string) => void;
}

export const CinemaShowCard: React.FC<CinemaShowCardProps> = ({
  cinema,
  shows,
  selectedShowId,
  onSelectShow
}) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <span>{cinema.name}</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{cinema.address}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {cinema.amenities?.map((amenity, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-3">
          Available Showtimes
        </span>

        {shows.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No scheduled showtimes found for this date.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {shows.map((show) => {
              const isSelected = show.id === selectedShowId;
              return (
                <button
                  key={show.id}
                  onClick={() => onSelectShow(show.id)}
                  className={`group px-4 py-2.5 rounded-xl border text-left transition flex flex-col items-start ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/70 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm">{formatTime(show.startTime)}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5 font-medium">
                    {show.screenType.includes('ATMOS') && <Volume2 className="w-2.5 h-2.5 text-blue-500" />}
                    {show.screenType.includes('IMAX') && <Tv className="w-2.5 h-2.5 text-indigo-500" />}
                    <span className="uppercase">{show.screenType.replace(/_/g, ' ')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
