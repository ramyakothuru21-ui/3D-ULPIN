import React, { useState } from 'react';
import { Building, LandParcel, VerticalProperty } from '../../types';
import { Building2, Layers, Search, Box, ArrowUpRight, ArrowUpDown } from 'lucide-react';

interface BuildingsViewProps {
  buildings: Building[];
  parcels: LandParcel[];
  properties: VerticalProperty[];
  onSelectBuilding: (building: Building, parcel: LandParcel) => void;
  onOpen3DExploder: (building: Building, parcel: LandParcel) => void;
}

export const BuildingsView: React.FC<BuildingsViewProps> = ({
  buildings,
  parcels,
  properties,
  onSelectBuilding,
  onOpen3DExploder
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedFloors, setSelectedFloors] = useState<string>('ALL');

  const filteredBuildings = React.useMemo(() => {
    const q = search.toLowerCase();
    return buildings.filter(b => {
      const matchesSearch = b.Building_ID.toLowerCase().includes(q) ||
        b.Parcel_ID.toLowerCase().includes(q) ||
        b.Building_Type.toLowerCase().includes(q) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.street && b.street.toLowerCase().includes(q));
      const matchesType = selectedType === 'ALL' || b.Building_Type === selectedType;
      const matchesFloors = selectedFloors === 'ALL' || b.Floors.toString() === selectedFloors;
      return matchesSearch && matchesType && matchesFloors;
    });
  }, [buildings, search, selectedType, selectedFloors]);

  const uniqueTypes = Array.from(new Set(buildings.map(b => b.Building_Type)));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span>3D Buildings & Vertical Structures</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {filteredBuildings.length} of {buildings.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Volumetric structural geometries with height profiles and floor divisions
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search building ID, parcel ID, or type..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Typologies</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={selectedFloors}
            onChange={e => setSelectedFloors(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Floor Counts</option>
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>{i + 1} Floors</option>
            ))}
          </select>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBuildings.map(b => {
          const parcel = parcels.find(p => p.Parcel_ID === b.Parcel_ID);
          const units = properties.filter(u => u.Building_ID === b.Building_ID);

          return (
            <div
              key={b.Building_ID}
              className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-cyan-300 rounded-2xl transition shadow-xs hover:shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                      {b.name || b.Building_ID}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {b.Building_ID} {b.osmId ? `• OSM ${b.osmId}` : ''}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {b.Building_Type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Floors</span>
                  <span className="font-bold text-slate-800">
                    {b.hasRealLevels ? `${b.realFloors} (OSM)` : b.Floors}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Area</span>
                  <span className="font-bold text-slate-800">{b.area_sq_m} m²</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Units (Demo)</span>
                  <span className="font-bold text-cyan-700">{units.length}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (parcel) onSelectBuilding(b, parcel);
                  }}
                  className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition text-center"
                >
                  Locate
                </button>
                <button
                  onClick={() => {
                    if (parcel) onOpen3DExploder(b, parcel);
                  }}
                  className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                >
                  <Box className="w-3 h-3" />
                  <span>3D Exploder</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
