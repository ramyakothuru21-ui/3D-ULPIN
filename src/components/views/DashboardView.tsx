import React from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Users, 
  Home, 
  Briefcase, 
  ArrowUpRight, 
  TrendingUp, 
  PieChart, 
  BarChart, 
  ShieldCheck, 
  Compass,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { CadastralStats, LandParcel, Building, VerticalProperty, ActiveTab } from '../../types';

interface DashboardViewProps {
  stats: CadastralStats;
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectEntity: (parcel: LandParcel, building?: Building) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  parcels,
  buildings,
  properties,
  onNavigateTab,
  onSelectEntity
}) => {
  // Compute chart distributions dynamically from the actual CSV dataset
  const bldgTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    buildings.forEach(b => {
      counts[b.Building_Type] = (counts[b.Building_Type] || 0) + 1;
    });
    return counts;
  }, [buildings]);

  const landTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    parcels.forEach(p => {
      counts[p.Land_Type] = (counts[p.Land_Type] || 0) + 1;
    });
    return counts;
  }, [parcels]);

  const floorWiseCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    properties.forEach(u => {
      counts[u.Floor_No] = (counts[u.Floor_No] || 0) + 1;
    });
    return counts;
  }, [properties]);

  const propertyTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(u => {
      counts[u.Property_Type] = (counts[u.Property_Type] || 0) + 1;
    });
    return counts;
  }, [properties]);

  const maxFloorCount = Math.max(...Object.values(floorWiseCounts), 1);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Welcome & Presentation Banner */}
      <div className="p-6 bg-gradient-to-r from-brand-900 via-brand-800 to-cyan-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-cyan-300 text-xs font-semibold mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart India Hackathon • Andhra Pradesh Urban Cadastre Prototype</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            3D-ULPIN: Intelligent 3D Land & Property Information System
          </h2>
          <p className="mt-2 text-slate-200 text-xs sm:text-sm leading-relaxed">
            Transitioning Indian land governance from 2D flat parcels to unified 3D digital twins. Seamlessly interconnecting Land Parcels, 3D Building Extrusions, and Individual Vertical Properties under the Unique Land Parcel Identification Number (ULPIN) standard.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => onNavigateTab('map')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Launch 3D GIS Map</span>
            </button>
            <button
              onClick={() => onNavigateTab('about')}
              className="px-4 py-2 bg-white/15 hover:bg-white/20 text-white font-semibold rounded-xl text-xs backdrop-blur-md transition"
            >
              View System Architecture
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Land Parcels */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Land Parcels</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalParcels}</span>
            <span className="text-xs text-slate-400 font-medium">registered plots</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Area:</span>
            <strong className="text-slate-700">{(stats.totalAreaSqM).toLocaleString()} m²</strong>
          </div>
        </div>

        {/* KPI 2: Total Buildings */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total 3D Buildings</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalBuildings}</span>
            <span className="text-xs text-slate-400 font-medium">extrusions</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Avg Floors:</span>
            <strong className="text-slate-700">{stats.avgFloorsPerBuilding} Floors/bldg</strong>
          </div>
        </div>

        {/* KPI 3: Vertical Properties */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Vertical Properties</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalUnits}</span>
            <span className="text-xs text-slate-400 font-medium">3D-ULPIN titles</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Max Height:</span>
            <strong className="text-slate-700">{stats.maxFloors * 3} meters</strong>
          </div>
        </div>

        {/* KPI 4: Registered Owners */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Registered Titles</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalRegisteredOwners}</span>
            <span className="text-xs text-slate-400 font-medium">legal titles</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Unique ULPIN Verification</span>
          </div>
        </div>
      </div>

      {/* Second Row: Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Residential Dwellings</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{stats.residentialCount} units</span>
          </div>
          <Home className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Commercial & Retail</span>
            <span className="text-lg font-bold text-amber-700 font-mono">{stats.shopCount} units</span>
          </div>
          <Briefcase className="w-5 h-5 text-amber-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Commercial Offices</span>
            <span className="text-lg font-bold text-cyan-700 font-mono">{stats.officeCount} units</span>
          </div>
          <Building2 className="w-5 h-5 text-cyan-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Transferred Titles</span>
            <span className="text-lg font-bold text-brand-700 font-mono">{stats.transferredProperties} deeds</span>
          </div>
          <TrendingUp className="w-5 h-5 text-brand-500" />
        </div>
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Property Type Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Property Type Breakdown</h3>
              <p className="text-xs text-slate-400">986 vertical units classified</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(propertyTypeCounts).map(([type, count]) => {
              const pct = ((count / stats.totalUnits) * 100).toFixed(1);
              let color = 'bg-emerald-500';
              if (type.toLowerCase() === 'shop') color = 'bg-amber-500';
              if (type.toLowerCase() === 'office') color = 'bg-cyan-500';
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{type}</span>
                    <span className="font-mono text-slate-500">{count} units ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Building Type Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Building Typologies</h3>
              <p className="text-xs text-slate-400">100 structures across Kadapa Urban</p>
            </div>
            <BarChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(bldgTypeCounts).map(([type, count]) => {
              const pct = ((count / stats.totalBuildings) * 100).toFixed(1);
              let color = 'bg-brand-500';
              if (type.toLowerCase().includes('apartment')) color = 'bg-indigo-500';
              if (type.toLowerCase().includes('independent')) color = 'bg-teal-500';
              if (type.toLowerCase().includes('mixed')) color = 'bg-purple-500';
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{type}</span>
                    <span className="font-mono text-slate-500">{count} bldgs ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Floor-Wise Stacking Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Floor-Wise Vertical Stacking</h3>
              <p className="text-xs text-slate-400">Distribution across storeys 1 to 8</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
            {Array.from({ length: 8 }).map((_, idx) => {
              const floorNum = idx + 1;
              const count = floorWiseCounts[floorNum] || 0;
              const heightPct = Math.round((count / maxFloorCount) * 100);
              return (
                <div key={floorNum} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition">
                    {count}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-32 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-brand-500 group-hover:from-cyan-500 group-hover:to-brand-400 transition-all rounded-t"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">F{floorNum}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Parcels Quick Access */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Notable Cadastral Parcels</h3>
            <p className="text-xs text-slate-400">Directly jump to dense or multi-storey parcels</p>
          </div>
          <button
            onClick={() => onNavigateTab('parcels')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All 100 Parcels</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {parcels.slice(0, 4).map(p => {
            const bldg = buildings.find(b => b.Parcel_ID === p.Parcel_ID);
            const units = properties.filter(u => u.Parcel_ID === p.Parcel_ID);
            return (
              <div
                key={p.Parcel_ID}
                onClick={() => {
                  onSelectEntity(p, bldg);
                  onNavigateTab('map');
                }}
                className="p-3 bg-slate-50 hover:bg-brand-50/60 border border-slate-200 hover:border-brand-300 rounded-xl cursor-pointer transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs font-mono">{p.Parcel_ID}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {p.Land_Type}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span>{p.Area_sq_m} m²</span> • <span>{bldg ? `${bldg.Floors} Floors` : 'No bldg'}</span>
                </div>
                <div className="text-[11px] text-brand-700 font-semibold flex items-center gap-1">
                  <span>{units.length} Vertical Titles</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
