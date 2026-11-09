import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { Seat } from '../types/index.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string;
  selectedSeats: Seat[];
  currentUserId: string;
  onConfirmPayment: (paymentMethod: string, email: string, phone: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedSeats,
  currentUserId,
  onConfirmPayment,
  loading,
  error
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [email, setEmail] = useState(`${currentUserId}@example.com`);
  const [phone, setPhone] = useState('+91 9876543210');

  if (!isOpen) return null;

  const subtotalCents = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFeeCents = Math.round(subtotalCents * 0.18) + 3000;
  const totalAmountCents = subtotalCents + convenienceFeeCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmPayment(paymentMethod, email, phone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">

        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              10-Minute Hold Active
            </span>
            <h3 className="font-extrabold text-lg text-slate-900">Order Summary & Checkout</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Reserved Seats:</span>
              <span className="font-mono font-bold text-slate-900">
                {selectedSeats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Ticket Subtotal ({selectedSeats.length} seats)</span>
              <span className="font-bold text-slate-900">₹{(subtotalCents / 100).toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Convenience Fee (18% GST + Base)</span>
              <span className="font-bold text-slate-900">₹{(convenienceFeeCents / 100).toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-rose-600">₹{(totalAmountCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ticket Delivery Information
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                  paymentMethod === 'UPI'
                    ? 'border-rose-600 bg-rose-50/60 text-rose-700 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-rose-500" />
                <span>UPI (GPay/Paytm)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                  paymentMethod === 'CARD'
                    ? 'border-rose-600 bg-rose-50/60 text-rose-700 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span>Debit/Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
                  paymentMethod === 'NETBANKING'
                    ? 'border-rose-600 bg-rose-50/60 text-rose-700 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 text-emerald-500" />
                <span>Net Banking</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Confirming with Bank Gateway...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹{(totalAmountCents / 100).toFixed(2)} & Generate Ticket</span>
              </>
            )}
          </button>
        </form>

        <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit Encrypted • Guaranteed Double-Booking Protection</span>
        </div>
      </div>
    </div>
  );
};
