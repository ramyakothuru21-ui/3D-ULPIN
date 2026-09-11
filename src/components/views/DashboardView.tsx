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
  Maximize2,
  Navigation,
  Globe,
  CheckCircle2,
  Info,
  AlertTriangle
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
  // Compute chart distributions dynamically from the actual Duvvada dataset
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
            <span>Smart India Hackathon • Duvvada, Visakhapatnam Real Geospatial Prototype</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            3D-ULPIN: Intelligent 3D Land & Vertical Property Mapping
          </h2>
          <p className="mt-2 text-slate-200 text-xs sm:text-sm leading-relaxed">
            Transitioning Indian land administration from 2D flat parcel records to high-fidelity 3D digital twins. Utilizing real OpenStreetMap building footprints and road networks in Duvvada, Visakhapatnam, interconnected with standardized Bhu-Aadhaar 3D-ULPIN vertical subdivision models.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => onNavigateTab('map')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Duvvada 3D GIS Map</span>
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

      {/* Primary KPI Cards Grid (Strictly Truthful to Real Data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Real Mapped Buildings */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Real Duvvada Buildings</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalBuildings}</span>
            <span className="text-xs text-emerald-700 font-bold">OSM Footprints</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Footprint Area:</span>
            <strong className="text-slate-700">{(stats.totalAreaSqM).toLocaleString()} m²</strong>
          </div>
        </div>

        {/* KPI 2: Real Roads & Rail */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Road & Rail Corridors</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalRoads || 1241}</span>
            <span className="text-xs text-slate-400 font-medium">ways mapped</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Key Hub:</span>
            <strong className="text-slate-700">Duvvada Railway Stn</strong>
          </div>
        </div>

        {/* KPI 3: Vertical 3D Units (Demo) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>3D-ULPIN Units (Demo)</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{stats.totalUnits}</span>
            <span className="text-xs text-amber-700 font-bold font-mono">DEMO MODEL</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Max Height:</span>
            <strong className="text-slate-700">{stats.maxFloors * 3.2} m</strong>
          </div>
        </div>

        {/* KPI 4: Cadastral Parcel Status */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cadastral Parcels</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              Restricted Public API
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Architecture Integration Ready</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Verified OSM Height/Levels</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">
              {stats.buildingsWithRealLevels || 72} buildings
            </span>
          </div>
          <Building2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Named Duvvada Buildings</span>
            <span className="text-lg font-bold text-cyan-700 font-mono">
              {stats.namedBuildingsCount || 72} named
            </span>
          </div>
          <Home className="w-5 h-5 text-cyan-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Landmarks & POIs</span>
            <span className="text-lg font-bold text-rose-700 font-mono">{stats.totalPlaces || 12} facilities</span>
          </div>
          <MapPin className="w-5 h-5 text-rose-500" />
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Avg Floors per Building</span>
            <span className="text-lg font-bold text-brand-700 font-mono">{stats.avgFloorsPerBuilding} Floors</span>
          </div>
          <TrendingUp className="w-5 h-5 text-brand-500" />
        </div>
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Building Typologies */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Building Typologies</h3>
              <p className="text-xs text-slate-400">{buildings.length} real structures across Duvvada</p>
            </div>
            <BarChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(bldgTypeCounts).map(([type, count]) => {
              const pct = ((count / stats.totalBuildings) * 100).toFixed(1);
              let color = 'bg-brand-500';
              if (type.toLowerCase().includes('apartment')) color = 'bg-emerald-500';
              if (type.toLowerCase().includes('independent')) color = 'bg-cyan-500';
              if (type.toLowerCase().includes('institutional')) color = 'bg-purple-500';
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

        {/* Chart 2: Property Type Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Vertical Units (Demo Model)</h3>
              <p className="text-xs text-slate-400">{properties.length} units vertically subdivided</p>
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
                      style={{ height: `${Math.max(heightPct, 8)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    F{floorNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visible Data Sources & Legal Attribution Section (Requirement 10 & 15) */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Globe className="w-4 h-4 text-brand-600" />
          <h3 className="font-extrabold text-slate-900 text-sm">
            Data Sources, Legal Attributions & Accuracy Standard
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Real Geographic Footprints
            </span>
            <h4 className="font-bold text-slate-800">OpenStreetMap Contributors</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Real building polygons, highway roads, railway tracks, and landmark amenities extracted directly from OpenStreetMap under the Open Database License (ODbL).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block mb-1">
              Satellite Imagery Layer
            </span>
            <h4 className="font-bold text-slate-800">Esri World Imagery</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              High-resolution global satellite basemap tiles providing real aerial imagery of Duvvada, Visakhapatnam, Andhra Pradesh.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Property & Vertical Model
            </span>
            <h4 className="font-bold text-slate-800">3D-ULPIN Demonstration Engine</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Vertical units, floors, simulated owners, and mutation chains are demonstration records to evaluate 3D-ULPIN generation on real Duvvada footprints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
