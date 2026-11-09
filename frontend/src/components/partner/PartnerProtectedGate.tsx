import React, { useState } from 'react';
import { Terminal, Lock, KeyRound, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface PartnerProtectedGateProps {
  children: React.ReactNode;
  onExitToCustomer: () => void;
}

export const PartnerProtectedGate: React.FC<PartnerProtectedGateProps> = ({ children, onExitToCustomer }) => {
  const { user, role, loginAsPartner, logout } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (role === 'B2B_PARTNER') {
    return (
      <div className="space-y-6 animate-fade-in">

        <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white shadow-lg shadow-emerald-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  B2B API Developer Gateway
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  QUOTA: {user?.rateLimitRpm || 600} RPM
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Authenticated as <span className="text-white font-bold">{user?.name}</span> ({user?.apiKey})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onExitToCustomer}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 text-xs font-semibold transition border border-rose-500/30"
            >
              Exit Gateway
            </button>
          </div>
        </div>

        {children}
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please provide the Partner API Key.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginAsPartner(apiKey, apiSecret);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Partner authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 animate-fade-in">
      <div className="bg-slate-900 border border-emerald-900/40 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-lg shadow-emerald-600/20">
          <Terminal className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2 mb-8">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block">
            Partner API Gateway Access
          </span>
          <h2 className="text-2xl font-black tracking-tight">Secured B2B Developer Console</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Authorized partners (Google Pay, Paytm, Corporate Portals) can test HMAC signatures, discover movies, and test rate-limited reservations.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            ⚡ Quick Connect Demo Partners
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                await loginAsPartner('bms_partner_gpay_live_key_2026', 'gpay_secret_live_2026');
                setLoading(false);
              }}
              className="p-3 text-left rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <span className="font-semibold text-slate-200 text-xs group-hover:text-emerald-400 transition block">
                Google Pay India
              </span>
              <span className="text-[10px] text-slate-400 block">Quota: 600 RPM</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                await loginAsPartner('bms_partner_paytm_live_key_2026', 'paytm_secret_live_2026');
                setLoading(false);
              }}
              className="p-3 text-left rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <span className="font-semibold text-slate-200 text-xs group-hover:text-emerald-400 transition block">
                Paytm Entertainment
              </span>
              <span className="text-[10px] text-slate-400 block">Quota: 300 RPM</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Partner API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bms_partner_..."
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Partner API Secret</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter secret..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onExitToCustomer}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition text-center"
            >
              Cancel & Return
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Authenticate Partner'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
