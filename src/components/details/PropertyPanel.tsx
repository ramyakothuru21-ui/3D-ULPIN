import React, { useState } from 'react';
import { LandParcel, Building, VerticalProperty, OwnershipRecord } from '../../types';
import { getOwnershipRecord } from '../../services/demoRegistryService';
import { getUnitInteriorLayout } from '../../services/interiorService';
import { 
  Building2, 
  MapPin, 
  Layers, 
  User, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  Box, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Info,
  Calendar,
  IndianRupee,
  Share2,
  Home,
  Layout
} from 'lucide-react';

interface PropertyPanelProps {
  parcel: LandParcel | null;
  building: Building | null;
  property: VerticalProperty | null;
  associatedProperties: VerticalProperty[];
  enableDemoOverlay: boolean;
  onSelectProperty: (property: VerticalProperty) => void;
  onOpen3DViewer: () => void;
  onClose?: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  parcel,
  building,
  property,
  associatedProperties,
  enableDemoOverlay,
  onSelectProperty,
  onOpen3DViewer,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'rooms' | 'ownership' | 'units'>('details');

  if (!parcel && !building && !property) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white border-l border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mb-4 shadow-sm">
          <Building2 className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Select a Cadastral Entity</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          Hover over or click on any 2D land parcel, 3D building, or vertical property unit on the GIS map to view its verified owner details and 3D interior.
        </p>
      </div>
    );
  }

  // Active or derived ULPIN
  const activeUlpin = property
    ? property.Prototype_3D_ULPIN
    : parcel && building
    ? `IND-AP-${parcel.Parcel_ID}-${building.Building_ID}`
    : parcel
    ? `IND-AP-${parcel.Parcel_ID}`
    : 'IND-AP';

  const ownership: OwnershipRecord = getOwnershipRecord(
    property ? property.Property_ID : (parcel ? parcel.Parcel_ID : 'P0000'),
    activeUlpin,
    enableDemoOverlay
  );

  // Interior room layout if unit is active
  const interiorLayout = getUnitInteriorLayout(
    property ? property.Property_Type : 'Residential',
    property ? property.Area_sq_m : 110
  );

  const handleCopyUlpin = () => {
    navigator.clipboard.writeText(activeUlpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 select-none overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
            {property ? 'Vertical Property Unit' : building ? '3D Building' : 'Land Parcel'}
          </span>
          <div className="flex items-center gap-1.5">
            {building && (
              <button
                onClick={onOpen3DViewer}
                className="text-xs px-3 py-1.5 bg-gradient-to-r from-brand-600 via-cyan-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                title="View every floor and interior rooms in 3D"
              >
                <Box className="w-4 h-4" />
                <span>View in 3D</span>
              </button>
            )}
          </div>
        </div>

        {/* ULPIN Display Box */}
        <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Prototype 3D-ULPIN</span>
            <span className="text-emerald-600 font-medium">Verified Andhra Pradesh</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="font-mono text-xs font-bold text-slate-900 break-all select-all">
              {activeUlpin}
            </span>
            <button
              onClick={handleCopyUlpin}
              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition shrink-0"
              title="Copy ULPIN"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3 p-1 bg-slate-200/60 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition ${
              activeTab === 'details' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attributes
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition flex items-center justify-center gap-1 ${
              activeTab === 'rooms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Rooms (BIM)</span>
          </button>
          <button
            onClick={() => setActiveTab('ownership')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition flex items-center justify-center gap-1 ${
              activeTab === 'ownership' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Ownership</span>
            {enableDemoOverlay && (
              <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-mono">DEMO</span>
            )}
          </button>
          {building && (
            <button
              onClick={() => setActiveTab('units')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition ${
                activeTab === 'units' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Units ({associatedProperties.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Attributes Tab */}
        {activeTab === 'details' && (
          <>
            {/* Owner Quick Card */}
            <div className="p-3 bg-gradient-to-br from-emerald-50/70 to-white rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {ownership.currentOwner.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Title Holder</span>
                  <h4 className="font-bold text-slate-900 text-xs">{ownership.currentOwner}</h4>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {ownership.ownershipStatus}
              </span>
            </div>

            {/* 1. Vertical Property Details if selected */}
            {property && (
              <div className="p-3.5 bg-gradient-to-br from-brand-50/50 to-white rounded-xl border border-brand-100 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-600" />
                    <span>Vertical Unit Details</span>
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    {property.Property_Type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Unit Number</span>
                    <span className="font-bold text-slate-800">#{property.Unit_No}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Floor Number</span>
                    <span className="font-bold text-slate-800">Floor {property.Floor_No}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Carpet Area</span>
                    <span className="font-bold text-slate-800">{property.Area_sq_m} sq.m</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Property ID</span>
                    <span className="font-mono font-bold text-slate-800">{property.Property_ID}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Building Details */}
            {building && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    <span>Building Structure ({building.Building_ID})</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {building.Building_Type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Total Height</span>
                    <span className="font-bold text-slate-800">{building.Height_m} meters</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Storeys / Floors</span>
                    <span className="font-bold text-slate-800">{building.Floors} Floors</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Associated Units</span>
                    <span className="font-bold text-slate-800">{associatedProperties.length} Properties</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Parent Parcel</span>
                    <span className="font-mono font-bold text-slate-800">{building.Parcel_ID}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Land Parcel Details */}
            {parcel && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Cadastral Parcel ({parcel.Parcel_ID})</span>
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {parcel.Land_Type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Parcel Area</span>
                    <span className="font-bold text-slate-800">{parcel.Area_sq_m} sq.m</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Coordinates</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {parcel.Latitude.toFixed(5)}, {parcel.Longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rooms & BIM Layout Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-3">
            <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900">
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-cyan-700" />
                  <span>3D Architectural BIM Layout</span>
                </span>
                <span className="font-mono text-cyan-800">{interiorLayout.totalCarpetArea} m²</span>
              </div>
              <p className="text-[11px] text-cyan-800 leading-relaxed">
                Volumetric room dimensions with Living Hall, Master Bedroom, Kitchen & Balcony. Click below to inspect in 3D:
              </p>
              <button
                onClick={onOpen3DViewer}
                className="w-full mt-2 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Open 3D Interior Model (Hall & Beds)</span>
              </button>
            </div>

            {/* Room Schedule Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Room Schedule & Dimensions:
              </span>
              {interiorLayout.rooms.map(r => (
                <div
                  key={r.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-cyan-300 shadow-2xs transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: `#${r.colorHex.toString(16)}` }}
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{r.name}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{r.dimensions}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-xs font-mono">{r.areaSqM} m²</span>
                    <span className="text-[10px] text-slate-400 block">Carpet</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ownership Tab */}
        {activeTab === 'ownership' && (
          <div className="space-y-4">
            {enableDemoOverlay ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Andhra Pradesh Meebhoomi Cadastre Overlay</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 text-amber-900 font-bold rounded">DEMO DATA</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Simulated citizen registry & MeeSeva e-deed mutation chain for hackathon presentation demonstration.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Info className="w-4 h-4 text-brand-600" />
                  <span>Baseline Mode (Strict Rule 23)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Showing raw dataset values. Citizen owner names and deed timestamps are not in the primary CSV files. Toggle "Cadastre Demo Overlay" in top header to view simulated Meebhoomi records.
                </p>
              </div>
            )}

            {/* Current Owner Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Legal Owner</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ownership.ownershipStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {ownership.ownershipStatus}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                  {ownership.currentOwner.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{ownership.currentOwner}</h4>
                  <span className="text-xs text-slate-500">{ownership.ownershipType}</span>
                </div>
              </div>

              {enableDemoOverlay && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Survey Number</span>
                    <span className="font-bold text-slate-800">{ownership.surveyNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Patta Number</span>
                    <span className="font-mono text-slate-800">{ownership.pattaNumber}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Timeline */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Ownership & Mutation Timeline</span>
              </h4>

              {enableDemoOverlay ? (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 block">Previous Title Holder</span>
                      <span className="font-semibold text-slate-700">{ownership.previousOwner}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-white animate-pulse" />
                    <div className="text-xs p-2.5 bg-cyan-50/70 rounded-lg border border-cyan-100">
                      <div className="flex items-center justify-between text-cyan-900 font-bold">
                        <span>{ownership.transactionType}</span>
                        <span>{ownership.transactionDate}</span>
                      </div>
                      <div className="text-[11px] text-cyan-800 mt-1">
                        Deed #{ownership.deedNumber}
                      </div>
                      {ownership.considerationAmountINR && (
                        <div className="text-[11px] text-cyan-700 mt-0.5 font-medium flex items-center gap-0.5">
                          <span>Consideration:</span>
                          <strong>₹{(ownership.considerationAmountINR).toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="text-xs">
                      <span className="text-[10px] text-emerald-600 font-bold block">Current Registered Cadastre</span>
                      <span className="font-bold text-slate-800">{ownership.currentOwner}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-lg">
                  No historical transaction deed linked in baseline dataset.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Associated Units Tab */}
        {activeTab === 'units' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-500 mb-2">
              Select a vertical property unit to inspect its unique 3D-ULPIN identity:
            </div>
            {associatedProperties.map(u => {
              const isSelected = property?.Property_ID === u.Property_ID;
              return (
                <div
                  key={u.Property_ID}
                  onClick={() => onSelectProperty(u)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">Unit #{u.Unit_No}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        Floor {u.Floor_No}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {u.Property_Type}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-brand-700 mt-1">
                      {u.Prototype_3D_ULPIN}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">{u.Area_sq_m} m²</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
