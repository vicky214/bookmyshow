import React from 'react';
import { CheckCircle2, QrCode, Download, Printer, ArrowLeft, Calendar, MapPin, Film } from 'lucide-react';
import { BookingConfirmation, Show, Movie } from '../types/index.js';

interface TicketConfirmationProps {
  confirmation: BookingConfirmation;
  show?: Show;
  movie?: Movie;
  onReset: () => void;
}

export const TicketConfirmation: React.FC<TicketConfirmationProps> = ({
  confirmation,
  show,
  movie,
  onReset
}) => {
  return (
    <div className="max-w-xl mx-auto my-6 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">

      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Booking Confirmed!</h2>
        <p className="text-emerald-100 text-xs mt-1">
          A confirmation SMS & M-Ticket has been dispatched to {confirmation.userEmail}
        </p>
      </div>

      <div className="p-6 space-y-6">

        <div className="flex items-center justify-between pb-6 border-b border-dashed border-slate-200">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
              Booking Reference
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              {confirmation.bookingReference}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Tx: {confirmation.transactionRef}
            </span>
          </div>

          <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-2 text-center">
            <QrCode className="w-10 h-10 text-slate-800" />
            <span className="text-[9px] font-mono text-slate-400 mt-0.5">SCAN AT ENTRY</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Film className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-slate-900 text-base">{movie?.title || 'Selected Movie'}</h4>
              <p className="text-xs text-slate-500">{movie?.genre || 'Cinema Experience'} • {movie?.language || 'Hindi/English'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-800">{show?.cinemaName || 'Cinema Hall'}</p>
              <p className="text-xs text-slate-500">{show?.cinemaAddress}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-800">
                {show ? new Date(show.startTime).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
              </p>
              <p className="text-xs text-slate-500">
                {show ? new Date(show.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '7:00 PM'} • {show?.screenName || 'Audi 1'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Seats</span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {confirmation.bookedSeatIds.map((id) => id.replace('seat-scr1-', '')).join(', ')}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Paid</span>
            <span className="font-black text-base text-rose-600">
              ₹{(confirmation.totalAmountCents / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center space-x-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>

          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Book Another Movie</span>
          </button>
        </div>
      </div>
    </div>
  );
};
