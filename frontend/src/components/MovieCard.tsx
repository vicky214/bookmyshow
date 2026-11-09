import React from 'react';
import { Star, Clock, Globe } from 'lucide-react';
import { Movie } from '../types/index.js';

interface MovieCardProps {
  movie: Movie;
  isSelected: boolean;
  onSelect: (movieId: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(movie.id)}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col ${
        isSelected
          ? 'border-rose-500 shadow-xl shadow-rose-500/10 ring-2 ring-rose-500/20'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
      }`}
    >

      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-white">{movie.rating.toFixed(1)}</span>
        </div>

        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/75 backdrop-blur-md py-1 px-2.5 rounded-lg flex items-center justify-between text-[11px] text-slate-200">
          <span className="flex items-center space-x-1">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>{movie.language}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{movie.duration_mins}m</span>
          </span>
        </div>
      </div>

      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-rose-600 transition">
            {movie.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{movie.genre}</p>
        </div>

        <button
          className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition ${
            isSelected
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          {isSelected ? 'Shows Selected' : 'Book Tickets'}
        </button>
      </div>
    </div>
  );
};
