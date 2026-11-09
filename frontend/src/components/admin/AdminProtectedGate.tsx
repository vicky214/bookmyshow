import React, { useState } from 'react';
import { Shield, Lock, KeyRound, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AdminProtectedGateProps {
  children: React.ReactNode;
  onExitToCustomer: () => void;
}

export const AdminProtectedGate: React.FC<AdminProtectedGateProps> = ({ children, onExitToCustomer }) => {
  const { user, role, loginAsAdmin, logout } = useAuth();
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (role === 'ADMIN') {
    return (
      <div className="space-y-6 animate-fade-in">

        <div className="bg-slate-900 border border-purple-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white shadow-lg shadow-purple-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  Operations Control Center
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-500/30">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Signed in as <span className="text-white font-bold">{user?.name}</span> ({user?.email})
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
              Exit Admin
            </button>
          </div>
        </div>

        {children}
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey) {
      setError('Please provide the Administrator Authorization Key.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginAsAdmin(adminKey);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 animate-fade-in">
      <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-6 shadow-lg shadow-purple-600/20">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2 mb-8">
          <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 block">
            Access Control Protection
          </span>
          <h2 className="text-2xl font-black tracking-tight">Restricted Company Admin Backoffice</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            This dashboard is restricted to authorized multiplex operations managers. Enter your master administrator key to proceed.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Administrator Authorization Key</label>
              <button
                type="button"
                onClick={() => setAdminKey('bms_admin_master_key_99218')}
                className="text-[11px] text-purple-400 hover:text-purple-300 transition underline"
              >
                Use Demo Master Key
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter master authorization key..."
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono transition"
              />
              <KeyRound className="w-4 h-4 text-slate-600 absolute right-3.5 top-3" />
            </div>
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Unlock Backoffice'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
