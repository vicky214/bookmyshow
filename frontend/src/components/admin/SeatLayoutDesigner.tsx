import React, { useState } from 'react';
import { Armchair, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Cinema } from '../../types/index.js';
import { apiClient } from '../../api/client.js';

interface SeatLayoutDesignerProps {
  cinemas: Cinema[];
  onScreenCreated: () => void;
}

export const SeatLayoutDesigner: React.FC<SeatLayoutDesignerProps> = ({
  cinemas,
  onScreenCreated
}) => {
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id || 'cin-01');
  const [screenName, setScreenName] = useState('Audi 3 (IMAX Laser)');
  const [screenType, setScreenType] = useState('IMAX_3D');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [rowsConfig, setRowsConfig] = useState<Array<{ rowLabel: string; seatCount: number; tier: 'RECLINER' | 'PRIME' | 'CLASSIC' }>>([
    { rowLabel: 'A', seatCount: 8, tier: 'RECLINER' },
    { rowLabel: 'B', seatCount: 8, tier: 'PRIME' },
    { rowLabel: 'C', seatCount: 8, tier: 'PRIME' },
    { rowLabel: 'D', seatCount: 8, tier: 'CLASSIC' },
    { rowLabel: 'E', seatCount: 8, tier: 'CLASSIC' },
  ]);

  const addRow = () => {
    const nextLabel = String.fromCharCode(65 + rowsConfig.length);
    setRowsConfig((prev) => [...prev, { rowLabel: nextLabel, seatCount: 8, tier: 'CLASSIC' }]);
  };

  const removeRow = (index: number) => {
    setRowsConfig((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, key: string, val: any) => {
    setRowsConfig((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const totalSeats = rowsConfig.reduce((sum, r) => sum + r.seatCount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      await apiClient.adminAddScreen({
        cinemaId,
        name: screenName,
        screenType,
        rowsConfig
      });

      setSuccessMsg(`Screen "${screenName}" with ${totalSeats} seats created successfully!`);
      onScreenCreated();
    } catch (err: any) {
      setSuccessMsg(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
        <Armchair className="w-5 h-5 text-rose-500" />
        <span>Auditorium Screen & Seat Matrix Layout Designer</span>
      </h3>
      <p className="text-xs text-slate-500 mt-1">
        Configure custom seat row configurations with tiered pricing (Recliner, Prime, Classic).
      </p>

      {successMsg && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Cinema Hall
            </label>
            <select
              value={cinemaId}
              onChange={(e) => setCinemaId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Screen / Audi Name
            </label>
            <input
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Projection / Screen Tech
            </label>
            <select
              value={screenType}
              onChange={(e) => setScreenType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              <option value="IMAX_3D">IMAX Laser 3D</option>
              <option value="DOLBY_ATMOS_4K">Dolby Atmos 4K</option>
              <option value="GOLD_CLASS">Gold Class Luxury</option>
              <option value="4DX">4DX Motion</option>
              <option value="STANDARD_2D">Standard 2D</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Row Layout Configuration (Total: {totalSeats} seats)
            </span>
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="space-y-2">
            {rowsConfig.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60"
              >
                <div className="w-16">
                  <span className="text-[10px] text-slate-400 block font-mono">Row</span>
                  <input
                    type="text"
                    value={row.rowLabel}
                    onChange={(e) => updateRow(idx, 'rowLabel', e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200"
                  />
                </div>

                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 block">Tier Category</span>
                  <select
                    value={row.tier}
                    onChange={(e) => updateRow(idx, 'tier', e.target.value)}
                    className="w-full text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200"
                  >
                    <option value="RECLINER">Recliner (VIP - ₹450)</option>
                    <option value="PRIME">Prime (Premium - ₹280)</option>
                    <option value="CLASSIC">Classic (Standard - ₹180)</option>
                  </select>
                </div>

                <div className="w-24">
                  <span className="text-[10px] text-slate-400 block">Seats Count</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={row.seatCount}
                    onChange={(e) => updateRow(idx, 'seatCount', parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200"
                  />
                </div>

                {rowsConfig.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="mt-4 p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? 'Generating Layout...' : `Save Layout & Generate ${totalSeats} Seats`}</span>
        </button>
      </form>
    </div>
  );
};
