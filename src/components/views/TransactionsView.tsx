import React, { useState } from 'react';
import { VerticalProperty, LandParcel, Building } from '../../types';
import { getOwnershipRecord } from '../../services/demoRegistryService';
import { History, Search, ArrowRight, ShieldCheck, FileText, Calendar, IndianRupee, Info } from 'lucide-react';

interface TransactionsViewProps {
  properties: VerticalProperty[];
  parcels: LandParcel[];
  buildings: Building[];
  enableDemoOverlay: boolean;
  onToggleDemoOverlay: (enabled: boolean) => void;
  onSelectProperty: (property: VerticalProperty, parcel: LandParcel, building: Building) => void;
  onNavigateToMap: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  properties,
  parcels,
  buildings,
  enableDemoOverlay,
  onToggleDemoOverlay,
  onSelectProperty,
  onNavigateToMap
}) => {
  const [search, setSearch] = useState('');

  const transactions = React.useMemo(() => {
    // Collect records that have transactions
    return properties.map(p => {
      const ownership = getOwnershipRecord(p.Property_ID, p.Prototype_3D_ULPIN, enableDemoOverlay);
      const parcel = parcels.find(item => item.Parcel_ID === p.Parcel_ID);
      const bldg = buildings.find(item => item.Building_ID === p.Building_ID);
      return { property: p, parcel, bldg, ownership };
    }).filter(r => r.ownership.transactionType !== undefined || enableDemoOverlay);
  }, [properties, parcels, buildings, enableDemoOverlay]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(t => 
      t.property.Prototype_3D_ULPIN.toLowerCase().includes(q) ||
      t.ownership.currentOwner.toLowerCase().includes(q) ||
      (t.ownership.previousOwner && t.ownership.previousOwner.toLowerCase().includes(q)) ||
      (t.ownership.deedNumber && t.ownership.deedNumber.toLowerCase().includes(q))
    );
  }, [transactions, search]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            <span>Cadastral Mutation & Transaction Timeline</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {filtered.length} Deeds
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical chain of ownership titles and MeeSeva registration deeds
          </p>
        </div>

        {/* Demo Toggle */}
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

      {!enableDemoOverlay && (
        <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Baseline CSV Notice:</span> No transaction deeds are included in the baseline spatial datasets. Enable the "AP Meebhoomi Demo Overlay" toggle to visualize simulated Andhra Pradesh Registration & Stamps Department deeds.
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deed #, citizen name, or 3D-ULPIN..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Visual Transaction Cards */}
      <div className="space-y-4">
        {filtered.slice(0, 30).map(({ property, parcel, bldg, ownership }) => (
          <div
            key={property.Property_ID}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                  {property.Prototype_3D_ULPIN}
                </span>
                <span className="text-xs text-slate-500">
                  Unit #{property.Unit_No} (Floor {property.Floor_No}) • {property.Area_sq_m} m²
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {ownership.transactionDate || 'N/A'}
                </span>
                <button
                  onClick={() => {
                    if (parcel && bldg) {
                      onSelectProperty(property, parcel, bldg);
                      onNavigateToMap();
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  Locate
                </button>
              </div>
            </div>

            {/* Timeline Flow */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
              {/* Previous Owner */}
              <div className="w-full sm:w-1/3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Previous Title Holder</span>
                <span className="font-bold text-slate-700 text-xs mt-0.5 block">
                  {ownership.previousOwner || 'Original Land Allotment'}
                </span>
                <span className="text-[10px] text-slate-400">Transferor</span>
              </div>

              {/* Transaction Deed Badge */}
              <div className="flex flex-col items-center gap-1 shrink-0 px-2 text-center">
                <div className="p-2 rounded-full bg-cyan-100 text-cyan-800">
                  <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
                </div>
                <span className="text-[11px] font-bold text-cyan-900">{ownership.transactionType || 'Registration Deed'}</span>
                <span className="text-[10px] font-mono text-slate-400">{ownership.deedNumber || 'Awaiting API'}</span>
              </div>

              {/* Current Owner */}
              <div className="w-full sm:w-1/3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-700 block font-semibold uppercase">Current Registered Title</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {ownership.currentOwner}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Verified Active Cadastre</span>
              </div>
            </div>

            {ownership.considerationAmountINR && (
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Consideration Value: <strong className="text-slate-800">₹{(ownership.considerationAmountINR).toLocaleString('en-IN')}</strong></span>
                <span className="font-mono text-[10px] text-slate-400">Survey No: {ownership.surveyNumber}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
