import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Bell, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';
import { LandParcel, Building, VerticalProperty } from '../../types';

interface HeaderProps {
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  enableDemoOverlay?: boolean;
  onToggleDemoOverlay?: (enabled: boolean) => void;
  onSelectEntity: (parcel: LandParcel, building?: Building, property?: VerticalProperty) => void;
  onStartDemoTour?: () => void;
  onOpenAiInsights: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  parcels,
  buildings,
  properties,
  onSelectEntity,
  onOpenAiInsights
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const searchResults = React.useMemo(() => {
    const empty = { parcels: [] as LandParcel[], buildings: [] as Building[], properties: [] as VerticalProperty[] };
    const q = searchQuery.trim().toLowerCase();
    if (!q) return empty;

    const matchedParcels = parcels.filter(p => 
      p.Parcel_ID.toLowerCase().includes(q) ||
      p.Land_Type.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedBuildings = buildings.filter(b => 
      b.Building_ID.toLowerCase().includes(q) ||
      b.Building_Type.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedProperties = properties.filter(u => 
      u.Prototype_3D_ULPIN.toLowerCase().includes(q) ||
      u.Property_ID.toLowerCase().includes(q) ||
      `#${u.Unit_No}`.includes(q) ||
      u.Property_Type.toLowerCase().includes(q)
    ).slice(0, 6);

    return {
      parcels: matchedParcels,
      buildings: matchedBuildings,
      properties: matchedProperties
    };
  }, [searchQuery, parcels, buildings, properties]);

  const hasResults = searchQuery.trim().length > 0 && 
    (searchResults.parcels.length > 0 || searchResults.buildings.length > 0 || searchResults.properties.length > 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-30 sticky top-0 shadow-sm">
      {/* Brand & Gov Emblem */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-cyan-500 text-white flex items-center justify-center shadow-md font-black text-lg">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              <span>3D-ULPIN</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                SIH 2026
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 font-medium hidden md:block">
            Intelligent 3D Land & Property Information System • Andhra Pradesh
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-lg hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search by 3D-ULPIN, Parcel ID (LP001), Building (B001), Unit (#101)..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Results Dropdown */}
        {isSearchOpen && hasResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
            {/* Vertical Properties */}
            {searchResults.properties.length > 0 && (
              <div className="p-2 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Vertical Properties & ULPINs
                </div>
                {searchResults.properties.map(u => {
                  const parcel = parcels.find(p => p.Parcel_ID === u.Parcel_ID);
                  const bldg = buildings.find(b => b.Building_ID === u.Building_ID);
                  return (
                    <div
                      key={u.Property_ID}
                      onClick={() => {
                        if (parcel) onSelectEntity(parcel, bldg, u);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span>Unit #{u.Unit_No}</span>
                          <span className="text-[10px] px-1.5 rounded bg-slate-100 text-slate-600 font-normal">
                            Floor {u.Floor_No}
                          </span>
                          <span className="text-[10px] px-1.5 rounded bg-cyan-50 text-cyan-700 font-normal">
                            {u.Property_Type}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-brand-600 mt-0.5">
                          {u.Prototype_3D_ULPIN}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">{u.Area_sq_m} m²</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Buildings */}
            {searchResults.buildings.length > 0 && (
              <div className="p-2 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  3D Buildings
                </div>
                {searchResults.buildings.map(b => {
                  const parcel = parcels.find(p => p.Parcel_ID === b.Parcel_ID);
                  return (
                    <div
                      key={b.Building_ID}
                      onClick={() => {
                        if (parcel) onSelectEntity(parcel, b);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-600" />
                        <div>
                          <span className="font-bold text-slate-800">Building {b.Building_ID}</span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            {b.Building_Type} • {b.Floors} Floors ({b.Height_m}m)
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">Parcel: {b.Parcel_ID}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Land Parcels */}
            {searchResults.parcels.length > 0 && (
              <div className="p-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Land Parcels
                </div>
                {searchResults.parcels.map(p => {
                  const bldg = buildings.find(b => b.Parcel_ID === p.Parcel_ID);
                  return (
                    <div
                      key={p.Parcel_ID}
                      onClick={() => {
                        onSelectEntity(p, bldg);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-800">Parcel {p.Parcel_ID}</span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            {p.Land_Type} • {p.Area_sq_m} sq.m
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        AP Cadastre
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Andhra Pradesh Location Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Kadapa Urban, Andhra Pradesh</span>
        </div>

        {/* AI Rule-Based Insights Button */}
        <button
          onClick={onOpenAiInsights}
          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          title="View Transparent Cadastral Rule Insights"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span className="hidden sm:inline">AI Insights</span>
        </button>
      </div>
    </header>
  );
};
