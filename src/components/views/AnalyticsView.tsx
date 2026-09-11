import React, { useState } from 'react';
import { CadastralStats, LandParcel, Building, VerticalProperty } from '../../types';
import { BarChart3, PieChart, TrendingUp, Filter, Layers, Building2, MapPin, SlidersHorizontal } from 'lucide-react';

interface AnalyticsViewProps {
  stats: CadastralStats;
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  parcels,
  buildings,
  properties
}) => {
  // Filters for dynamic analytics updates
  const [filterLandType, setFilterLandType] = useState<string>('ALL');
  const [filterBuildingType, setFilterBuildingType] = useState<string>('ALL');
  const [filterPropertyType, setFilterPropertyType] = useState<string>('ALL');
  const [filterFloor, setFilterFloor] = useState<string>('ALL');

  // Filtered dataset
  const filteredProperties = React.useMemo(() => {
    return properties.filter(u => {
      const parcel = parcels.find(p => p.Parcel_ID === u.Parcel_ID);
      const bldg = buildings.find(b => b.Building_ID === u.Building_ID);

      const matchLand = filterLandType === 'ALL' || (parcel && parcel.Land_Type === filterLandType);
      const matchBldg = filterBuildingType === 'ALL' || (bldg && bldg.Building_Type === filterBuildingType);
      const matchProp = filterPropertyType === 'ALL' || u.Property_Type === filterPropertyType;
      const matchFloor = filterFloor === 'ALL' || u.Floor_No.toString() === filterFloor;

      return matchLand && matchBldg && matchProp && matchFloor;
    });
  }, [properties, parcels, buildings, filterLandType, filterBuildingType, filterPropertyType, filterFloor]);

  const filteredParcelIds = new Set(filteredProperties.map(p => p.Parcel_ID));
  const filteredBuildingsIds = new Set(filteredProperties.map(p => p.Building_ID));
  const filteredParcels = parcels.filter(p => filteredParcelIds.has(p.Parcel_ID));
  const filteredBuildings = buildings.filter(b => filteredBuildingsIds.has(b.Building_ID));

  // Area distribution buckets (e.g. < 500, 500-1000, 1000-1500, >1500)
  const areaBuckets = React.useMemo(() => {
    const b = { '< 500 m²': 0, '500 - 1000 m²': 0, '1000 - 1500 m²': 0, '> 1500 m²': 0 };
    filteredParcels.forEach(p => {
      if (p.Area_sq_m < 500) b['< 500 m²']++;
      else if (p.Area_sq_m <= 1000) b['500 - 1000 m²']++;
      else if (p.Area_sq_m <= 1500) b['1000 - 1500 m²']++;
      else b['> 1500 m²']++;
    });
    return b;
  }, [filteredParcels]);

  // Height distribution buckets
  const heightBuckets = React.useMemo(() => {
    const b = { '3 - 6m (Low)': 0, '9 - 15m (Mid)': 0, '18 - 24m (High)': 0 };
    filteredBuildings.forEach(bldg => {
      if (bldg.Height_m <= 6) b['3 - 6m (Low)']++;
      else if (bldg.Height_m <= 15) b['9 - 15m (Mid)']++;
      else b['18 - 24m (High)']++;
    });
    return b;
  }, [filteredBuildings]);

  // Floor count distribution
  const floorCounts = React.useMemo(() => {
    const c: Record<number, number> = {};
    filteredProperties.forEach(u => {
      c[u.Floor_No] = (c[u.Floor_No] || 0) + 1;
    });
    return c;
  }, [filteredProperties]);

  const totalFilteredUnits = filteredProperties.length;
  const resUnits = filteredProperties.filter(u => u.Property_Type === 'Residential').length;
  const commUnits = totalFilteredUnits - resUnits;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Cadastral Spatial & Volumetric Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deriving urban density, Floor Area Ratios (FAR), and vertical growth patterns dynamically from CSV data
          </p>
        </div>
      </div>

      {/* Global Interactive Analytics Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          <span>Filter Analytics:</span>
        </div>

        <select
          value={filterLandType}
          onChange={e => setFilterLandType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Land Types</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
          <option value="Mixed Use">Mixed Use</option>
        </select>

        <select
          value={filterBuildingType}
          onChange={e => setFilterBuildingType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Building Typologies</option>
          <option value="Apartment">Apartment</option>
          <option value="Commercial">Commercial</option>
          <option value="Independent House">Independent House</option>
          <option value="Mixed Use">Mixed Use</option>
        </select>

        <select
          value={filterPropertyType}
          onChange={e => setFilterPropertyType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Property Types</option>
          <option value="Residential">Residential</option>
          <option value="Shop">Shop</option>
          <option value="Office">Office</option>
        </select>

        <select
          value={filterFloor}
          onChange={e => setFilterFloor(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Floors</option>
          {Array.from({ length: 8 }).map((_, i) => (
            <option key={i + 1} value={(i + 1).toString()}>Floor {i + 1}</option>
          ))}
        </select>

        <button
          onClick={() => {
            setFilterLandType('ALL');
            setFilterBuildingType('ALL');
            setFilterPropertyType('ALL');
            setFilterFloor('ALL');
          }}
          className="text-brand-600 hover:underline font-semibold ml-auto"
        >
          Reset Filters
        </button>
      </div>

      {/* Dynamic Summary Numbers for Current Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium">Filtered Parcels</span>
          <div className="text-2xl font-black text-slate-800 font-mono mt-1">{filteredParcels.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium">Filtered Buildings</span>
          <div className="text-2xl font-black text-slate-800 font-mono mt-1">{filteredBuildings.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium">Vertical Units</span>
          <div className="text-2xl font-black text-cyan-700 font-mono mt-1">{totalFilteredUnits}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium">Res vs Commercial</span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {totalFilteredUnits > 0 ? Math.round((resUnits / totalFilteredUnits) * 100) : 0}% Res
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Parcel Area Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Parcel Area Distribution (sq. meters)</h3>
            <p className="text-xs text-slate-400">Ground spatial footprint sizing in Duvvada, Visakhapatnam</p>
          </div>
          <div className="space-y-3 pt-2">
            {Object.entries(areaBuckets).map(([bucket, count]) => {
              const pct = filteredParcels.length > 0 ? Math.round((count / filteredParcels.length) * 100) : 0;
              return (
                <div key={bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{bucket}</span>
                    <span className="font-mono text-slate-500">{count} parcels ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Building Height Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Building Height & Vertical Profile</h3>
            <p className="text-xs text-slate-400">Structural height distribution (3m to 24m)</p>
          </div>
          <div className="space-y-3 pt-2">
            {Object.entries(heightBuckets).map(([bucket, count]) => {
              const pct = filteredBuildings.length > 0 ? Math.round((count / filteredBuildings.length) * 100) : 0;
              return (
                <div key={bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{bucket}</span>
                    <span className="font-mono text-slate-500">{count} structures ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Floor Count Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 md:col-span-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Vertical Units Per Floor Level</h3>
            <p className="text-xs text-slate-400">Vertical concentration across storeys 1 through 8</p>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-4 px-4">
            {Array.from({ length: 8 }).map((_, idx) => {
              const f = idx + 1;
              const count = floorCounts[f] || 0;
              const maxC = Math.max(...Object.values(floorCounts), 1);
              const heightPct = Math.round((count / maxC) * 100);

              return (
                <div key={f} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                    {count}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-brand-600 to-cyan-500 rounded-t-xl transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Floor {f}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
