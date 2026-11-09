import React, { useState } from 'react';
import { Lock, Check, X, ShieldAlert, Sparkles, Armchair, ChevronRight } from 'lucide-react';
import { SeatMatrixData, Seat } from '../types/index.js';
import { HoldTimer } from './HoldTimer.js';

interface SeatMatrixProps {
  matrix: SeatMatrixData;
  selectedSeats: Seat[];
  onToggleSeat: (seat: Seat) => void;
  onAcquireHold: () => void;
  onProceedToCheckout: () => void;
  isHoldActive: boolean;
  holdExpiresAt?: string;
  onHoldExpired: () => void;
  lockLoading: boolean;
  lockError?: string;
}

export const SeatMatrix: React.FC<SeatMatrixProps> = ({
  matrix,
  selectedSeats,
  onToggleSeat,
  onAcquireHold,
  onProceedToCheckout,
  isHoldActive,
  onHoldExpired,
  lockLoading,
  lockError
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  const subtotalCents = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (seat.status === 'BOOKED') {
      return 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed';
    }

    if (seat.status === 'LOCKED') {
      if (seat.isLockedByMe || isHoldActive) {
        return 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30';
      }
      return 'bg-amber-100 text-amber-700 border-amber-300 cursor-not-allowed';
    }

    if (isSelected) {
      return 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-500/30';
    }

    switch (seat.seatType) {
      case 'RECLINER':
        return 'bg-amber-50/70 border-amber-400 text-amber-800 hover:bg-amber-100';
      case 'PRIME':
        return 'bg-blue-50/70 border-blue-400 text-blue-800 hover:bg-blue-100';
      case 'CLASSIC':
      default:
        return 'bg-emerald-50/70 border-emerald-400 text-emerald-800 hover:bg-emerald-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold text-rose-600 tracking-wider uppercase">
            {matrix.screenName}
          </span>
          <h3 className="text-xl font-black text-slate-900">Select Your Seats</h3>
        </div>

        {isHoldActive && (
          <HoldTimer initialSeconds={600} onExpire={onHoldExpired} />
        )}
      </div>

      {lockError && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs text-rose-800">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Concurrency Conflict Detected:</span>
            <span>{lockError}</span>
          </div>
        </div>
      )}

      <div className="my-8 flex flex-col items-center">
        <div className="w-3/4 max-w-lg h-3 bg-gradient-to-b from-slate-300 to-transparent rounded-t-full shadow-inner opacity-80" />
        <div className="w-2/3 max-w-md h-1 bg-slate-300 rounded-full mt-1" />
        <span className="text-[10px] tracking-widest font-mono text-slate-400 uppercase mt-2">
          All eyes this way • Screen
        </span>
      </div>

      <div className="overflow-x-auto py-2 flex flex-col items-center space-y-3">
        {matrix.rows.map((row) => (
          <div key={row.rowLabel} className="flex items-center space-x-2">
            <span className="w-5 text-center font-mono font-bold text-xs text-slate-400">
              {row.rowLabel}
            </span>

            <div className="flex items-center space-x-2">
              {row.seats.map((seat) => {
                const isSelected = selectedSeats.some((s) => s.id === seat.id);
                const isLockedOther = seat.status === 'LOCKED' && !seat.isLockedByMe;

                return (
                  <button
                    key={seat.id}
                    disabled={seat.status === 'BOOKED' || isLockedOther || (isHoldActive && !isSelected)}
                    onClick={() => onToggleSeat(seat)}
                    onMouseEnter={() => setHoveredSeat(seat)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    title={`Row ${seat.rowLabel}-${seat.seatNumber} (${seat.seatType}) - ₹${(seat.price / 100).toFixed(0)}`}
                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all flex items-center justify-center relative ${getSeatColor(
                      seat
                    )}`}
                  >
                    {seat.status === 'BOOKED' ? (
                      <X className="w-3 h-3 text-slate-400" />
                    ) : isLockedOther ? (
                      <Lock className="w-3 h-3 text-amber-600" />
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      seat.seatNumber
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border border-emerald-400 bg-emerald-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border border-rose-600 bg-rose-600 text-white flex items-center justify-center">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border border-amber-300 bg-amber-100 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-amber-600" />
          </div>
          <span>Held (10m Lease)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border border-slate-300 bg-slate-200 flex items-center justify-center">
            <X className="w-2.5 h-2.5 text-slate-400" />
          </div>
          <span>Booked</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Selected Seats:</span>
              <span className="font-mono font-bold text-rose-400">
                {selectedSeats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>

            <div className="text-xl font-black text-white mt-1">
              ₹{(subtotalCents / 100).toLocaleString('en-IN')}{' '}
              <span className="text-xs text-slate-400 font-normal">+ convenience fee</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isHoldActive ? (
              <button
                disabled={lockLoading}
                onClick={onAcquireHold}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>{lockLoading ? 'Acquiring Distributed Lock...' : 'Lock Seats (10m Hold)'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onProceedToCheckout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Proceed to Pay</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
