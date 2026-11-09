import React, { useState } from 'react';
import { X, User, Shield, Terminal, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'customer' | 'admin' | 'partner';
  onLoginSuccess?: (targetPortal: 'customer' | 'admin' | 'partner') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'customer',
  onLoginSuccess
}) => {
  const { loginAsCustomer, loginAsAdmin, loginAsPartner, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'partner'>(initialTab);

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [adminKey, setAdminKey] = useState('');

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginAsCustomer({ email: customerEmail, name: customerName });
      onLoginSuccess?.('customer');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminKey) {
      setError('Please provide the Administrator Authorization Key.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginAsAdmin(adminKey);
      onLoginSuccess?.('admin');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKey) {
      setError('Partner API Key is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginAsPartner(apiKey, apiSecret);
      onLoginSuccess?.('partner');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Partner authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Identity & Role Gateway</h3>
              <p className="text-xs text-slate-400">Select persona or authenticate with role credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 p-2 bg-slate-950/50 border-b border-slate-800 gap-1.5 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('customer'); setError(null); }}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl transition ${
              activeTab === 'customer'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>

          <button
            onClick={() => { setActiveTab('admin'); setError(null); }}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl transition ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Company Admin</span>
          </button>

          <button
            onClick={() => { setActiveTab('partner'); setError(null); }}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl transition ${
              activeTab === 'partner'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>B2B Partner</span>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ⚡ Quick Demo Customer Personas
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      await loginAsCustomer({ userId: 'customer-alice' });
                      setLoading(false);
                      onLoginSuccess?.('customer');
                      onClose();
                    }}
                    className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/50 transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 text-xs group-hover:text-rose-400 transition">
                        Alice Johnson
                      </span>
                      <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-mono">
                        VIP
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">alice@bookmyshow.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      await loginAsCustomer({ userId: 'customer-bob' });
                      setLoading(false);
                      onLoginSuccess?.('customer');
                      onClose();
                    }}
                    className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 text-xs group-hover:text-blue-400 transition">
                        Bob Smith
                      </span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-mono">
                        Regular
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">bob@bookmyshow.com</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  or sign in with custom account
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In as Customer'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                <span className="font-bold block mb-1 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Restricted Operations Backoffice</span>
                </span>
                Multiplex managers can add cinemas, design screen seating matrix layouts, schedule showtimes, and inspect box office revenues.
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Master Administrator Key</label>
                    <button
                      type="button"
                      onClick={() => setAdminKey('bms_admin_master_key_99218')}
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Fill Demo Key
                    </button>
                  </div>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin authorization key..."
                    required
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying Key...' : 'Unlock Company Admin Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'partner' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <span className="font-bold block mb-1 flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Enterprise B2B Partner Gateway</span>
                </span>
                For external payment apps (Google Pay, Paytm) to discover movies, inspect seat availability, and lock tickets via HMAC SHA-256 API.
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ⚡ Pre-Configured Partners
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      await loginAsPartner('bms_partner_gpay_live_key_2026', 'gpay_secret_live_2026');
                      setLoading(false);
                      onLoginSuccess?.('partner');
                      onClose();
                    }}
                    className="p-2.5 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition group"
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
                      onLoginSuccess?.('partner');
                      onClose();
                    }}
                    className="p-2.5 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition group"
                  >
                    <span className="font-semibold text-slate-200 text-xs group-hover:text-emerald-400 transition block">
                      Paytm Entertainment
                    </span>
                    <span className="text-[10px] text-slate-400 block">Quota: 300 RPM</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handlePartnerSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Partner API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="bms_partner_..."
                    required
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Partner API Secret</label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="API Secret Key..."
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  <span>{loading ? 'Validating Key...' : 'Sign In to Partner Console'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
