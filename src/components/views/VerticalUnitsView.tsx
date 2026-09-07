import React, { useState } from 'react';
import { VerticalProperty, LandParcel, Building } from '../../types';
import { Layers, Search, Copy, Check, Filter, Compass, ArrowUpRight } from 'lucide-react';

interface VerticalUnitsViewProps {
  properties: VerticalProperty[];
  parcels: LandParcel[];
  buildings: Building[];
  onSelectProperty: (property: VerticalProperty, parcel: LandParcel, building: Building) => void;
  onNavigateToMap: () => void;
}

export const VerticalUnitsView: React.FC<VerticalUnitsViewProps> = ({
  properties,
  parcels,
  buildings,
  onSelectProperty,
  onNavigateToMap
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 24;

  const filtered = React.useMemo(() => {
    return properties.filter(u => {
      const q = search.toLowerCase();
      const matchesSearch = u.Prototype_3D_ULPIN.toLowerCase().includes(q) ||
        u.Property_ID.toLowerCase().includes(q) ||
        u.Building_ID.toLowerCase().includes(q) ||
        u.Parcel_ID.toLowerCase().includes(q) ||
        `#${u.Unit_No}`.includes(q);
      const matchesType = selectedType === 'ALL' || u.Property_Type === selectedType;
      const matchesFloor = selectedFloor === 'ALL' || u.Floor_No.toString() === selectedFloor;
      return matchesSearch && matchesType && matchesFloor;
    });
  }, [properties, search, selectedType, selectedFloor]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const displayed = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCopy = (ulpin: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ulpin);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            <span>Vertical Property Units & 3D-ULPINs</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              {filtered.length} of {properties.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Individually titled apartments, commercial shops, and offices stacked vertically
          </p>
        </div>

        <button
          onClick={onNavigateToMap}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
        >
          <Compass className="w-4 h-4" />
          <span>View on Map</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search 3D-ULPIN, Unit #, Building, or Property ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Property Types</option>
            <option value="Residential">Residential</option>
            <option value="Shop">Shop / Retail</option>
            <option value="Office">Commercial Office</option>
          </select>

          <select
            value={selectedFloor}
            onChange={e => {
              setSelectedFloor(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Floors</option>
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>Floor {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayed.map(u => {
          const parcel = parcels.find(p => p.Parcel_ID === u.Parcel_ID);
          const bldg = buildings.find(b => b.Building_ID === u.Building_ID);

          return (
            <div
              key={u.Property_ID}
              onClick={() => {
                if (parcel && bldg) {
                  onSelectProperty(u, parcel, bldg);
                  onNavigateToMap();
                }
              }}
              className="p-4 bg-white hover:bg-cyan-50/50 border border-slate-200/90 hover:border-cyan-400 rounded-2xl cursor-pointer transition shadow-xs hover:shadow-md space-y-2.5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">Unit #{u.Unit_No}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    Floor {u.Floor_No}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  u.Property_Type === 'Residential'
                    ? 'bg-emerald-100 text-emerald-800'
                    : u.Property_Type === 'Shop'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-cyan-100 text-cyan-800'
                }`}>
                  {u.Property_Type}
                </span>
              </div>

              {/* ULPIN Box */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-1">
                <div className="font-mono text-[10px] font-bold text-brand-700 truncate select-all">
                  {u.Prototype_3D_ULPIN}
                </div>
                <button
                  onClick={(e) => handleCopy(u.Prototype_3D_ULPIN, u.Property_ID, e)}
                  className="p-1 text-slate-400 hover:text-brand-600 rounded transition shrink-0"
                  title="Copy ULPIN"
                >
                  {copiedId === u.Property_ID ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                <span>Carpet Area: <strong className="text-slate-800">{u.Area_sq_m} m²</strong></span>
                <span className="font-mono text-[11px]">{u.Building_ID} • {u.Parcel_ID}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-700 group-hover:text-cyan-800">
                <span>Inspect in GIS & 3D</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs">
          <span className="text-slate-500">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} units
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
            >
              Previous
            </button>
            <span className="font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
