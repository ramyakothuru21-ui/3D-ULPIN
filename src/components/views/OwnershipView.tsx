import React, { useState } from 'react';
import { VerticalProperty, LandParcel, Building } from '../../types';
import { getOwnershipRecord } from '../../services/demoRegistryService';
import { UserCheck, Search, ShieldCheck, Info, FileText, CheckCircle2 } from 'lucide-react';

interface OwnershipViewProps {
  properties: VerticalProperty[];
  parcels: LandParcel[];
  buildings: Building[];
  enableDemoOverlay: boolean;
  onToggleDemoOverlay: (enabled: boolean) => void;
  onSelectProperty: (property: VerticalProperty, parcel: LandParcel, building: Building) => void;
  onNavigateToMap: () => void;
}

export const OwnershipView: React.FC<OwnershipViewProps> = ({
  properties,
  parcels,
  buildings,
  enableDemoOverlay,
  onToggleDemoOverlay,
  onSelectProperty,
  onNavigateToMap
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const records = React.useMemo(() => {
    return properties.map(p => {
      const ownership = getOwnershipRecord(p.Property_ID, p.Prototype_3D_ULPIN, enableDemoOverlay);
      const parcel = parcels.find(item => item.Parcel_ID === p.Parcel_ID);
      const bldg = buildings.find(item => item.Building_ID === p.Building_ID);
      return { property: p, parcel, bldg, ownership };
    });
  }, [properties, parcels, buildings, enableDemoOverlay]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => 
      r.property.Prototype_3D_ULPIN.toLowerCase().includes(q) ||
      r.ownership.currentOwner.toLowerCase().includes(q) ||
      r.property.Property_ID.toLowerCase().includes(q) ||
      r.ownership.surveyNumber.toLowerCase().includes(q)
    );
  }, [records, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const displayed = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Cadastral Ownership & Title Register</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {filtered.length} Titles
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            MeeSeva and AP Registration & Stamps Department cadastral title deeds
          </p>
        </div>

        {/* Demo Toggle Banner */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={enableDemoOverlay}
              onChange={e => onToggleDemoOverlay(e.target.checked)}
              className="rounded text-brand-600 accent-brand-600"
            />
            <span>Enable AP Meebhoomi Demo Overlay</span>
            {enableDemoOverlay && (
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-mono font-bold rounded">
                DEMO DATA
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Info Notice */}
      {!enableDemoOverlay ? (
        <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Baseline CSV Mode (Strict Rule 23):</span> The provided baseline CSV files contain spatial and architectural data (parcels, buildings, vertical units, and ULPINs). Legal citizen ownership and deed records are kept separate from baseline data. Enable the toggle above to preview the simulated Andhra Pradesh MeeSeva citizen deed overlay for hackathon demonstration.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Andhra Pradesh Cadastral Demo Registry Active:</span> Displaying simulated MeeSeva e-deeds, survey numbers, and mutation certificates tagged explicitly with [DEMO DATA].
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by registered owner name, 3D-ULPIN, Survey #, or Property ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Titles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Property ID</th>
                <th className="px-4 py-3">3D-ULPIN</th>
                <th className="px-4 py-3">Registered Owner</th>
                <th className="px-4 py-3">Title Status</th>
                <th className="px-4 py-3">Ownership Type</th>
                <th className="px-4 py-3">Survey #</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map(({ property, parcel, bldg, ownership }) => (
                <tr key={property.Property_ID} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {property.Property_ID}
                  </td>
                  <td className="px-4 py-3 font-mono text-cyan-700 font-semibold">
                    {property.Prototype_3D_ULPIN}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {ownership.currentOwner}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ownership.ownershipStatus === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ownership.ownershipStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ownership.ownershipType}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {ownership.surveyNumber}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (parcel && bldg) {
                          onSelectProperty(property, parcel, bldg);
                          onNavigateToMap();
                        }
                      }}
                      className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg transition text-[11px]"
                    >
                      Locate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} titles
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
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
