import React, { useEffect, useState } from 'react';
import { loadDatasets, LoadedDataset } from './services/dataService';
import { LandParcel, Building, VerticalProperty, ActiveTab } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { MapView } from './components/views/MapView';
import { ParcelsView } from './components/views/ParcelsView';
import { BuildingsView } from './components/views/BuildingsView';
import { VerticalUnitsView } from './components/views/VerticalUnitsView';
import { OwnershipView } from './components/views/OwnershipView';
import { TransactionsView } from './components/views/TransactionsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { DataExplorerView } from './components/views/DataExplorerView';
import { AboutView } from './components/views/AboutView';
import { DemoTourModal } from './components/common/DemoTourModal';
import { AiInsightsModal } from './components/common/AiInsightsModal';
import { Building3DViewer } from './components/threed/Building3DViewer';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [data, setData] = useState<LoadedDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Selected Entities
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<VerticalProperty | null>(null);

  // 3D GIS & Demo Settings
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [enableDemoOverlay, setEnableDemoOverlay] = useState<boolean>(true);

  // Modals
  const [showDemoTour, setShowDemoTour] = useState<boolean>(false);
  const [showAiInsights, setShowAiInsights] = useState<boolean>(false);
  const [showStandalone3DExploder, setShowStandalone3DExploder] = useState<boolean>(false);

  const initData = async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadDatasets();
      setData(loaded);
      // Select default notable parcel (LP014 with B014 - high density 8-floor structure)
      const p = loaded.parcels.find(item => item.Parcel_ID === 'LP014') || loaded.parcels[0];
      const b = loaded.buildings.find(item => item.Building_ID === 'B014') || loaded.buildings[0];
      if (p) setSelectedParcel(p);
      if (b) setSelectedBuilding(b);
    } catch (err: any) {
      console.error('Failed to load datasets:', err);
      setError(err.message || 'Failed to load cadastral datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleSelectParcel = (parcel: LandParcel, building?: Building) => {
    setSelectedParcel(parcel);
    if (building) {
      setSelectedBuilding(building);
    } else if (data) {
      const b = data.parcelToBuildingMap.get(parcel.Parcel_ID);
      setSelectedBuilding(b || null);
    }
  };

  const handleSelectBuilding = (building: Building, parcel?: LandParcel) => {
    setSelectedBuilding(building);
    if (parcel) {
      setSelectedParcel(parcel);
    } else if (data) {
      const p = data.parcelMap.get(building.Parcel_ID);
      setSelectedParcel(p || null);
    }
  };

  const handleSelectProperty = (property: VerticalProperty, parcel?: LandParcel, building?: Building) => {
    setSelectedProperty(property);
    if (building) {
      setSelectedBuilding(building);
    } else if (data) {
      const b = data.buildingMap.get(property.Building_ID);
      if (b) setSelectedBuilding(b);
    }

    if (parcel) {
      setSelectedParcel(parcel);
    } else if (data) {
      const p = data.parcelMap.get(property.Parcel_ID);
      if (p) setSelectedParcel(p);
    }
  };

  const handleOpen3DExploder = (building: Building, parcel: LandParcel) => {
    setSelectedBuilding(building);
    setSelectedParcel(parcel);
    setShowStandalone3DExploder(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 select-none">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">3D-ULPIN Cadastral Engine</h2>
        <p className="text-xs text-slate-500 mt-1">
          Ingesting Andhra Pradesh land parcels, 3D building extrusions & vertical property units...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Dataset Loading Error</h2>
        <p className="text-xs text-slate-600 max-w-md mt-2 mb-4 leading-relaxed">
          {error || 'Unable to parse cadastral CSV datasets.'}
        </p>
        <button
          onClick={initData}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Ingestion</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        parcels={data.parcels}
        buildings={data.buildings}
        properties={data.properties}
        enableDemoOverlay={enableDemoOverlay}
        onToggleDemoOverlay={setEnableDemoOverlay}
        onSelectEntity={(parcel, building, property) => {
          setSelectedParcel(parcel);
          if (building) setSelectedBuilding(building);
          if (property) setSelectedProperty(property);
          setActiveTab('map');
        }}
        onStartDemoTour={() => setShowDemoTour(true)}
        onOpenAiInsights={() => setShowAiInsights(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          stats={data.stats}
        />

        {/* Center / Right Content Panel */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'overview' && (
            <DashboardView
              stats={data.stats}
              parcels={data.parcels}
              buildings={data.buildings}
              properties={data.properties}
              onNavigateTab={setActiveTab}
              onSelectEntity={(parcel, building) => {
                handleSelectParcel(parcel, building);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'map' && (
            <MapView
              parcels={data.parcels}
              buildings={data.buildings}
              properties={data.properties}
              selectedParcel={selectedParcel}
              selectedBuilding={selectedBuilding}
              selectedProperty={selectedProperty}
              enableDemoOverlay={enableDemoOverlay}
              onSelectParcel={p => handleSelectParcel(p)}
              onSelectBuilding={b => handleSelectBuilding(b)}
              onSelectProperty={handleSelectProperty}
              is3DMode={is3DMode}
              onToggle3D={() => setIs3DMode(prev => !prev)}
            />
          )}

          {activeTab === 'parcels' && (
            <ParcelsView
              parcels={data.parcels}
              buildings={data.buildings}
              properties={data.properties}
              onSelectParcel={(parcel, bldg) => handleSelectParcel(parcel, bldg)}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'buildings' && (
            <BuildingsView
              buildings={data.buildings}
              parcels={data.parcels}
              properties={data.properties}
              onSelectBuilding={(bldg, parcel) => {
                handleSelectBuilding(bldg, parcel);
                setActiveTab('map');
              }}
              onOpen3DExploder={(bldg, parcel) => handleOpen3DExploder(bldg, parcel)}
            />
          )}

          {activeTab === 'units' && (
            <VerticalUnitsView
              properties={data.properties}
              parcels={data.parcels}
              buildings={data.buildings}
              onSelectProperty={(prop, parcel, bldg) => handleSelectProperty(prop, parcel, bldg)}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'ownership' && (
            <OwnershipView
              properties={data.properties}
              parcels={data.parcels}
              buildings={data.buildings}
              enableDemoOverlay={enableDemoOverlay}
              onToggleDemoOverlay={setEnableDemoOverlay}
              onSelectProperty={(prop, parcel, bldg) => handleSelectProperty(prop, parcel, bldg)}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              properties={data.properties}
              parcels={data.parcels}
              buildings={data.buildings}
              enableDemoOverlay={enableDemoOverlay}
              onToggleDemoOverlay={setEnableDemoOverlay}
              onSelectProperty={(prop, parcel, bldg) => handleSelectProperty(prop, parcel, bldg)}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              stats={data.stats}
              parcels={data.parcels}
              buildings={data.buildings}
              properties={data.properties}
            />
          )}

          {activeTab === 'explorer' && (
            <DataExplorerView
              parcels={data.parcels}
              buildings={data.buildings}
              properties={data.properties}
              onSelectEntity={(parcel, bldg, prop) => {
                setSelectedParcel(parcel);
                if (bldg) setSelectedBuilding(bldg);
                if (prop) setSelectedProperty(prop);
              }}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'about' && <AboutView />}
        </main>
      </div>

      {/* Standalone 3D Exploder Modal */}
      {showStandalone3DExploder && selectedBuilding && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="flex-1 relative">
              <Building3DViewer
                parcel={selectedParcel}
                building={selectedBuilding}
                properties={data.properties.filter(u => u.Building_ID === selectedBuilding.Building_ID)}
                selectedProperty={selectedProperty}
                onSelectProperty={u => setSelectedProperty(u)}
                onClose={() => setShowStandalone3DExploder(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showAiInsights && (
        <AiInsightsModal
          data={data}
          onClose={() => setShowAiInsights(false)}
          onJumpToEntity={(parcelId, bldgId) => {
            if (parcelId) {
              const p = data.parcels.find(item => item.Parcel_ID === parcelId);
              if (p) setSelectedParcel(p);
            }
            if (bldgId) {
              const b = data.buildings.find(item => item.Building_ID === bldgId);
              if (b) setSelectedBuilding(b);
            }
            setActiveTab('map');
          }}
        />
      )}

      {/* SIH Guided Demo Tour Modal */}
      {showDemoTour && (
        <DemoTourModal
          onClose={() => setShowDemoTour(false)}
          onNavigateTab={setActiveTab}
          onSelectParcel={handleSelectParcel}
          onSelectProperty={setSelectedProperty}
          parcels={data.parcels}
          buildings={data.buildings}
          properties={data.properties}
          onToggle3D={setIs3DMode}
          onToggleDemoOverlay={setEnableDemoOverlay}
        />
      )}
    </div>
  );
};

export default App;
