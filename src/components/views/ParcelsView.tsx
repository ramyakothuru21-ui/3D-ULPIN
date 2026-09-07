import React, { useState } from 'react';
import { LandParcel, Building, VerticalProperty } from '../../types';
import { MapPin, Building2, Search, Filter, ArrowUpDown, ArrowUpRight, Compass } from 'lucide-react';

interface ParcelsViewProps {
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  onSelectParcel: (parcel: LandParcel, building?: Building) => void;
  onNavigateToMap: () => void;
}

export const ParcelsView: React.FC<ParcelsViewProps> = ({
  parcels,
  buildings,
  properties,
  onSelectParcel,
  onNavigateToMap
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'area-asc' | 'area-desc'>('id');

  const filteredParcels = React.useMemo(() => {
    return parcels
      .filter(p => {
        const matchesSearch = p.Parcel_ID.toLowerCase().includes(search.toLowerCase()) ||
          p.Land_Type.toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedType === 'ALL' || p.Land_Type === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'area-asc') return a.Area_sq_m - b.Area_sq_m;
        if (sortBy === 'area-desc') return b.Area_sq_m - a.Area_sq_m;
        return a.Parcel_ID.localeCompare(b.Parcel_ID);
      });
  }, [parcels, search, selectedType, sortBy]);

  const uniqueTypes = Array.from(new Set(parcels.map(p => p.Land_Type)));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Cadastral Land Parcels</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {filteredParcels.length} of {parcels.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            2D and 3D land parcels surveyed across Kadapa urban cadastral grid, Andhra Pradesh
          </p>
        </div>

        <button
          onClick={onNavigateToMap}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
        >
          <Compass className="w-4 h-4" />
          <span>View on GIS Map</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parcel ID or land type..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Zoning:</span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Land Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="id">Sort: Parcel ID</option>
            <option value="area-desc">Sort: Largest Area</option>
            <option value="area-asc">Sort: Smallest Area</option>
          </select>
        </div>
      </div>

      {/* Grid of Parcels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredParcels.map(p => {
          const bldg = buildings.find(b => b.Parcel_ID === p.Parcel_ID);
          const unitCount = properties.filter(u => u.Parcel_ID === p.Parcel_ID).length;

          return (
            <div
              key={p.Parcel_ID}
              onClick={() => {
                onSelectParcel(p, bldg);
                onNavigateToMap();
              }}
              className="p-4 bg-white hover:bg-brand-50/50 border border-slate-200/90 hover:border-brand-300 rounded-2xl cursor-pointer transition shadow-xs hover:shadow-md space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    LP
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs font-mono">{p.Parcel_ID}</h4>
                    <span className="text-[10px] text-slate-400">AP Cadastre</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  p.Land_Type === 'Residential'
                    ? 'bg-emerald-100 text-emerald-800'
                    : p.Land_Type === 'Commercial'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-cyan-100 text-cyan-800'
                }`}>
                  {p.Land_Type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Plot Area</span>
                  <span className="font-bold text-slate-800">{p.Area_sq_m} m²</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Vertical Titles</span>
                  <span className="font-bold text-brand-600">{unitCount} units</span>
                </div>
              </div>

              {bldg && (
                <div className="p-2 bg-slate-50 rounded-lg text-xs flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{bldg.Building_ID}</span>
                  </span>
                  <span className="text-[11px] font-medium">{bldg.Floors} Floors ({bldg.Height_m}m)</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-semibold text-brand-600 group-hover:text-brand-700">
                <span>View on 3D GIS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
