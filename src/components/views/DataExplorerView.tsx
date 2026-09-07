import React, { useState } from 'react';
import { LandParcel, Building, VerticalProperty } from '../../types';
import { Database, Search, Download, ArrowUpDown, Compass, Check, ExternalLink } from 'lucide-react';

interface DataExplorerViewProps {
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  onSelectEntity: (parcel: LandParcel, building?: Building, property?: VerticalProperty) => void;
  onNavigateToMap: () => void;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  parcels,
  buildings,
  properties,
  onSelectEntity,
  onNavigateToMap
}) => {
  const [activeTab, setActiveTab] = useState<'parcels' | 'buildings' | 'properties'>('properties');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Filtered rows based on active tab
  const rows = React.useMemo(() => {
    const q = search.toLowerCase();
    if (activeTab === 'parcels') {
      return parcels.filter(p => 
        p.Parcel_ID.toLowerCase().includes(q) ||
        p.Land_Type.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'buildings') {
      return buildings.filter(b => 
        b.Building_ID.toLowerCase().includes(q) ||
        b.Parcel_ID.toLowerCase().includes(q) ||
        b.Building_Type.toLowerCase().includes(q)
      );
    }
    return properties.filter(u => 
      u.Prototype_3D_ULPIN.toLowerCase().includes(q) ||
      u.Property_ID.toLowerCase().includes(q) ||
      u.Building_ID.toLowerCase().includes(q) ||
      u.Parcel_ID.toLowerCase().includes(q) ||
      u.Property_Type.toLowerCase().includes(q)
    );
  }, [activeTab, parcels, buildings, properties, search]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const displayedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const exportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'parcels') {
      csvContent += 'Parcel_ID,Latitude,Longitude,Area_sq_m,Land_Type\n';
      parcels.forEach(p => {
        csvContent += `${p.Parcel_ID},${p.Latitude},${p.Longitude},${p.Area_sq_m},${p.Land_Type}\n`;
      });
    } else if (activeTab === 'buildings') {
      csvContent += 'Building_ID,Parcel_ID,Latitude,Longitude,Floors,Height_m,Building_Type\n';
      buildings.forEach(b => {
        csvContent += `${b.Building_ID},${b.Parcel_ID},${b.Latitude},${b.Longitude},${b.Floors},${b.Height_m},${b.Building_Type}\n`;
      });
    } else {
      csvContent += 'Property_ID,Building_ID,Parcel_ID,Floor_No,Unit_No,Area_sq_m,Property_Type,Prototype_3D_ULPIN\n';
      properties.forEach(u => {
        csvContent += `${u.Property_ID},${u.Building_ID},${u.Parcel_ID},${u.Floor_No},${u.Unit_No},${u.Area_sq_m},${u.Property_Type},${u.Prototype_3D_ULPIN}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `3d_ulpin_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            <span>Cadastral Data Explorer</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-mono">
              CSV Source of Truth
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and query the raw uploaded land, building, and vertical property datasets
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-brand-600" />
          <span>Export {activeTab.toUpperCase()} CSV</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('properties');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'properties' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vertical Properties ({properties.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('buildings');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'buildings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buildings ({buildings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('parcels');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'parcels' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Land Parcels ({parcels.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Filter ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Table Display */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'properties' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Property_ID</th>
                  <th className="px-4 py-3">Building_ID</th>
                  <th className="px-4 py-3">Parcel_ID</th>
                  <th className="px-4 py-3">Floor_No</th>
                  <th className="px-4 py-3">Unit_No</th>
                  <th className="px-4 py-3">Area_sq_m</th>
                  <th className="px-4 py-3">Property_Type</th>
                  <th className="px-4 py-3">Prototype_3D_ULPIN</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((raw: any) => {
                  const u = raw as VerticalProperty;
                  const parcel = parcels.find(p => p.Parcel_ID === u.Parcel_ID);
                  const bldg = buildings.find(b => b.Building_ID === u.Building_ID);
                  return (
                    <tr key={u.Property_ID} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{u.Property_ID}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.Building_ID}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.Parcel_ID}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{u.Floor_No}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">#{u.Unit_No}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{u.Area_sq_m}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.Property_Type === 'Residential'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.Property_Type === 'Shop'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}>
                          {u.Property_Type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-brand-700 font-bold">{u.Prototype_3D_ULPIN}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (parcel) {
                              onSelectEntity(parcel, bldg, u);
                              onNavigateToMap();
                            }
                          }}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-[11px] transition"
                        >
                          Locate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'buildings' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Building_ID</th>
                  <th className="px-4 py-3">Parcel_ID</th>
                  <th className="px-4 py-3">Latitude</th>
                  <th className="px-4 py-3">Longitude</th>
                  <th className="px-4 py-3">Floors</th>
                  <th className="px-4 py-3">Height_m</th>
                  <th className="px-4 py-3">Building_Type</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((raw: any) => {
                  const b = raw as Building;
                  const parcel = parcels.find(p => p.Parcel_ID === b.Parcel_ID);
                  return (
                    <tr key={b.Building_ID} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.Building_ID}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{b.Parcel_ID}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{b.Latitude.toFixed(6)}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{b.Longitude.toFixed(6)}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{b.Floors}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{b.Height_m}m</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{b.Building_Type}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (parcel) {
                              onSelectEntity(parcel, b);
                              onNavigateToMap();
                            }
                          }}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-[11px] transition"
                        >
                          Locate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'parcels' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Parcel_ID</th>
                  <th className="px-4 py-3">Latitude</th>
                  <th className="px-4 py-3">Longitude</th>
                  <th className="px-4 py-3">Area_sq_m</th>
                  <th className="px-4 py-3">Land_Type</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((raw: any) => {
                  const p = raw as LandParcel;
                  const bldg = buildings.find(b => b.Parcel_ID === p.Parcel_ID);
                  return (
                    <tr key={p.Parcel_ID} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.Parcel_ID}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{p.Latitude.toFixed(6)}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{p.Longitude.toFixed(6)}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{p.Area_sq_m} m²</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{p.Land_Type}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            onSelectEntity(p, bldg);
                            onNavigateToMap();
                          }}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-[11px] transition"
                        >
                          Locate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, rows.length)} of {rows.length} rows
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
    </div>
  );
};
