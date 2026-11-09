import React, { useState } from 'react';
import { Building2, Plus, MapPin, Check, Sparkles } from 'lucide-react';
import { City, Cinema } from '../../types/index.js';
import { apiClient } from '../../api/client.js';

interface CinemaHallManagerProps {
  cities: City[];
  cinemas: Cinema[];
  onCinemaAdded: () => void;
}

export const CinemaHallManager: React.FC<CinemaHallManagerProps> = ({
  cities,
  cinemas,
  onCinemaAdded
}) => {
  const [cityId, setCityId] = useState(cities[0]?.id || 'city-mum');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('19.0760');
  const [longitude, setLongitude] = useState('72.8777');
  const [amenities, setAmenities] = useState<string[]>(['Parking', 'M-Ticket', 'Food & Beverage']);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const allAmenitiesOptions = ['Parking', 'M-Ticket', 'Food & Beverage', 'Dolby Atmos', 'IMAX Laser', 'Recliner Loungers', 'Wheelchair Friendly'];

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      await apiClient.adminAddCinema({
        cityId,
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        amenities
      });

      setMsg(`Cinema hall "${name}" added successfully!`);
      setName('');
      setAddress('');
      onCinemaAdded();
    } catch (err: any) {
      setMsg(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-rose-500" />
          <span>Add New Cinema Hall / Theatre Location</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Register new multiplexes with precise GPS latitude and longitude coordinates.
        </p>

        {msg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
            {msg}
          </div>
        )}

        <form onSubmit={handleAddCinema} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City / Region
              </label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Cinema Hall Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PVR ICON: Oberoi Mall, Goregaon"
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 3rd Floor, Oberoi Mall, Western Express Hwy, Goregaon East, Mumbai 400063"
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Latitude (GPS)
              </label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Longitude (GPS)
              </label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Auditorium Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {allAmenitiesOptions.map((opt) => {
                const checked = amenities.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleAmenity(opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                      checked
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Adding Cinema...' : 'Save Cinema Hall'}</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h4 className="font-extrabold text-sm text-slate-900 mb-4 uppercase tracking-wider">
          Active Cinema Halls Directory ({cinemas.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cinemas.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="font-black text-sm text-slate-900">{c.name}</span>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.address}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>GPS: {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}</span>
                <span className="text-rose-600 font-semibold">{c.amenities?.length || 0} amenities</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
