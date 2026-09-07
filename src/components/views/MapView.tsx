import React, { useState } from 'react';
import { LandParcel, Building, VerticalProperty } from '../../types';
import { GisMap } from '../map/GisMap';
import { PropertyPanel } from '../details/PropertyPanel';
import { Building3DViewer } from '../threed/Building3DViewer';
import { X, Box, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface MapViewProps {
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  selectedParcel: LandParcel | null;
  selectedBuilding: Building | null;
  selectedProperty: VerticalProperty | null;
  enableDemoOverlay: boolean;
  onSelectParcel: (parcel: LandParcel) => void;
  onSelectBuilding: (building: Building) => void;
  onSelectProperty: (property: VerticalProperty) => void;
  is3DMode: boolean;
  onToggle3D: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  parcels,
  buildings,
  properties,
  selectedParcel,
  selectedBuilding,
  selectedProperty,
  enableDemoOverlay,
  onSelectParcel,
  onSelectBuilding,
  onSelectProperty,
  is3DMode,
  onToggle3D
}) => {
  const [show3DExploderModal, setShow3DExploderModal] = useState(false);

  // Associated properties for the selected building
  const associatedProperties = React.useMemo(() => {
    if (!selectedBuilding) return [];
    return properties.filter(u => u.Building_ID === selectedBuilding.Building_ID);
  }, [selectedBuilding, properties]);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full relative overflow-hidden bg-slate-100">
      {/* Left / Center: Interactive Map */}
      <div className="flex-1 h-full relative">
        <GisMap
          parcels={parcels}
          buildings={buildings}
          selectedParcel={selectedParcel}
          selectedBuilding={selectedBuilding}
          selectedProperty={selectedProperty}
          onSelectParcel={onSelectParcel}
          onSelectBuilding={onSelectBuilding}
          is3DMode={is3DMode}
          onToggle3D={onToggle3D}
        />
      </div>

      {/* Right Side: Property Information Panel */}
      <div className="w-full md:w-96 lg:w-[420px] h-1/2 md:h-full shrink-0 z-20">
        <PropertyPanel
          parcel={selectedParcel}
          building={selectedBuilding}
          property={selectedProperty}
          associatedProperties={associatedProperties}
          enableDemoOverlay={enableDemoOverlay}
          onSelectProperty={onSelectProperty}
          onOpen3DViewer={() => setShow3DExploderModal(true)}
        />
      </div>

      {/* 3D Exploder Modal View (Full Screen Digital Twin Inspector) */}
      {show3DExploderModal && selectedBuilding && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="flex-1 relative">
              <Building3DViewer
                parcel={selectedParcel}
                building={selectedBuilding}
                properties={associatedProperties}
                selectedProperty={selectedProperty}
                onSelectProperty={onSelectProperty}
                onClose={() => setShow3DExploderModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
