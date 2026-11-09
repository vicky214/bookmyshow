import React, { useState } from 'react';
import {
  Film,
  Building2,
  Terminal,
  MapPin,
  User as UserIcon,
  Ticket,
  Shield,
  ChevronDown,
  LogOut,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import { City } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  cities: City[];
  selectedCity: string;
  onSelectCity: (cityId: string) => void;
  activeTab: 'customer' | 'admin' | 'partner';
  onSelectTab: (tab: 'customer' | 'admin' | 'partner') => void;
  customerView: 'movies' | 'bookings';
  onSelectCustomerView: (view: 'movies' | 'bookings') => void;
  bookingCount?: number;
  onOpenAuthModal: (tab?: 'customer' | 'admin' | 'partner') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  activeTab,
  onSelectTab,
  customerView,
  onSelectCustomerView,
  bookingCount = 0,
  onOpenAuthModal
}) => {
  const { user, role, logout, switchCustomerPersona } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPortalMenuOpen, setIsPortalMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center space-x-6">
            <div
              onClick={() => {
                onSelectTab('customer');
                onSelectCustomerView('movies');
              }}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-rose-400 transition">
                  book<span className="text-rose-500">my</span>show
                </span>
                <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  Enterprise Platform
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <MapPin className="w-4 h-4 text-rose-500" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity(e.target.value)}
                className="bg-transparent text-sm text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="bg-slate-900 text-slate-200">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'customer' ? (
              <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                <button
                  onClick={() => {
                    onSelectTab('customer');
                    onSelectCustomerView('movies');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    customerView === 'movies'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Browse Movies</span>
                  <span className="sm:hidden">Movies</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('customer');
                    onSelectCustomerView('bookings');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
                    customerView === 'bookings'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>My Bookings</span>
                  {bookingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                      {bookingCount}
                    </span>
                  )}
                </button>
              </div>
            ) : activeTab === 'admin' ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-900/30 border border-purple-500/40 rounded-xl text-purple-300 text-xs font-bold">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Company Admin Operations Backoffice</span>
                <span className="sm:hidden">Admin</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-900/30 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">B2B Developer & Partner Gateway</span>
                <span className="sm:hidden">B2B</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">

            <div className="relative">
              <button
                onClick={() => {
                  setIsPortalMenuOpen(!isPortalMenuOpen);
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 transition"
              >
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Portals</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {isPortalMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Select Platform Portal
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('customer');
                      onSelectCustomerView('movies');
                      setIsPortalMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                      activeTab === 'customer'
                        ? 'bg-rose-600/20 text-rose-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Film className="w-4 h-4 text-rose-500" />
                      <span>Customer Storefront</span>
                    </div>
                    {activeTab === 'customer' && <span className="text-[10px]">Active</span>}
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('admin');
                      setIsPortalMenuOpen(false);
                      if (role !== 'ADMIN') onOpenAuthModal('admin');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                      activeTab === 'admin'
                        ? 'bg-purple-600/20 text-purple-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>Company Admin Backoffice</span>
                    </div>
                    {role !== 'ADMIN' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('partner');
                      setIsPortalMenuOpen(false);
                      if (role !== 'B2B_PARTNER') onOpenAuthModal('partner');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                      activeTab === 'partner'
                        ? 'bg-emerald-600/20 text-emerald-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>B2B Partner Gateway</span>
                    </div>
                    {role !== 'B2B_PARTNER' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                    setIsPortalMenuOpen(false);
                  }}
                  className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-700/80 p-1.5 pr-3 rounded-xl border border-slate-700 transition"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                    role === 'ADMIN' ? 'bg-purple-600' : role === 'B2B_PARTNER' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block leading-tight">
                    <span className="text-xs font-bold text-slate-200 block truncate max-w-[100px]">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-fade-in text-xs space-y-3">
                    <div className="pb-2 border-b border-slate-800">
                      <div className="font-bold text-slate-200">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' : role === 'B2B_PARTNER' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {role === 'ADMIN' ? 'Administrator' : role === 'B2B_PARTNER' ? 'B2B Partner' : 'Customer Account'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('customer');
                        onSelectCustomerView('bookings');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold transition text-xs border border-rose-500/30 shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4 text-rose-500" />
                        <span>Go to My Bookings</span>
                      </div>
                      {bookingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                          {bookingCount}
                        </span>
                      )}
                    </button>

                    {role === 'CUSTOMER' && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Quick Persona Switch
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              switchCustomerPersona('customer-alice');
                              setIsProfileMenuOpen(false);
                            }}
                            className={`p-1.5 rounded-lg border text-left text-[11px] transition ${
                              user.id === 'customer-alice'
                                ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-bold'
                                : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                            }`}
                          >
                            Alice (VIP)
                          </button>
                          <button
                            onClick={() => {
                              switchCustomerPersona('customer-bob');
                              setIsProfileMenuOpen(false);
                            }}
                            className={`p-1.5 rounded-lg border text-left text-[11px] transition ${
                              user.id === 'customer-bob'
                                ? 'border-blue-500 bg-blue-500/10 text-blue-300 font-bold'
                                : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                            }`}
                          >
                            Bob Smith
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="text-rose-400 hover:underline text-[11px] font-medium"
                      >
                        Change Persona
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setIsProfileMenuOpen(false);
                        }}
                        className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition text-[11px]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuthModal('customer')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/30"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
