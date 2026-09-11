import React, { useState } from 'react';
import { X, Play, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Building2, MapPin, Layers, UserCheck, BarChart3, Database } from 'lucide-react';
import { LandParcel, Building, VerticalProperty, ActiveTab } from '../../types';

interface DemoTourStep {
  step: number;
  title: string;
  badge: string;
  description: string;
  talkingPoints: string[];
  action: () => void;
}

interface DemoTourModalProps {
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectParcel: (parcel: LandParcel, building?: Building) => void;
  onSelectProperty: (property: VerticalProperty) => void;
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  onToggle3D: (is3D: boolean) => void;
  onToggleDemoOverlay: (enabled: boolean) => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  onClose,
  onNavigateTab,
  onSelectParcel,
  onSelectProperty,
  parcels,
  buildings,
  properties,
  onToggle3D,
  onToggleDemoOverlay
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Notable real Duvvada building (KBC Heights on Kurmannapalem Road)
  const demoParcel = parcels[0];
  const demoBuilding = buildings[0];
  const demoProperty = properties.find(u => u.Building_ID === demoBuilding?.Building_ID) || properties[0];

  const steps: DemoTourStep[] = [
    {
      step: 1,
      title: 'Cadastral Overview & Duvvada Real KPIs',
      badge: 'Step 1 of 6',
      description: 'Start at the analytical dashboard showcasing real OpenStreetMap geospatial statistics for Duvvada, Visakhapatnam.',
      talkingPoints: [
        'Point out the 464 real OpenStreetMap buildings, 1,241 road & rail segments, and 12+ landmarks in Duvvada.',
        'Emphasize that building footprints, area, and coordinates are real public data (ODbL).',
        'Explain the distinction between real geospatial vectors and simulated 3D vertical titles.'
      ],
      action: () => {
        onNavigateTab('overview');
      }
    },
    {
      step: 2,
      title: 'Interactive 3D GIS Map & Duvvada Footprints',
      badge: 'Step 2 of 6',
      description: 'Navigate to the live GIS map, toggle satellite imagery, and inspect real Duvvada building footprints.',
      talkingPoints: [
        'Show real high-resolution Esri satellite imagery matching Duvvada terrain.',
        'Demonstrate real road networks (Kurmannapalem Road, Duvvada Station Line).',
        'Select KBC Heights (B001) to reveal its exact architectural footprint on the ground.'
      ],
      action: () => {
        onNavigateTab('map');
        onToggle3D(true);
        if (demoParcel && demoBuilding) onSelectParcel(demoParcel, demoBuilding);
      }
    },
    {
      step: 3,
      title: '3D Building Volumetric Extrusion',
      badge: 'Step 3 of 6',
      description: `Inspect ${demoBuilding?.name || 'Building B001'} (${demoBuilding?.Floors || 5} Floors, ${demoBuilding?.Height_m || 16}m Height) in Duvvada.`,
      talkingPoints: [
        'Explain how 2D flat parcels fail to represent multi-level vertical property rights.',
        'Show real building levels tagged in OpenStreetMap or illustrative height where unrecorded.',
        'Click "View in 3D" to launch the WebGL digital twin.'
      ],
      action: () => {
        onNavigateTab('map');
        if (demoParcel && demoBuilding) onSelectParcel(demoParcel, demoBuilding);
      }
    },
    {
      step: 4,
      title: 'The Showstopper: 3D Vertical Unit Exploder',
      badge: 'Step 4 of 6',
      description: 'Experience the vertical separation of floors into individual apartments, offices, and rooms.',
      talkingPoints: [
        'Move the "Vertical Explode" slider to separate the building into floating floor slices.',
        'Click on individual units in 3D to inspect their Prototype 3D-ULPIN.',
        'Show BIM room layouts with Living Hall, Master Bedroom, Kitchen & Balcony.'
      ],
      action: () => {
        onNavigateTab('map');
        if (demoProperty) onSelectProperty(demoProperty);
      }
    },
    {
      step: 5,
      title: 'Ownership & MeeSeva Mutation Timeline',
      badge: 'Step 5 of 6',
      description: 'Inspect legal title registry and chronological transfer deeds for Andhra Pradesh.',
      talkingPoints: [
        'Demonstrate strict adherence to dataset honesty with baseline mode.',
        'Toggle the AP Meebhoomi Demo Overlay to preview simulated MeeSeva e-deed mutation history.',
        'Trace the visual timeline: Previous Owner -> Registered Sale Deed -> Current Owner.'
      ],
      action: () => {
        onToggleDemoOverlay(true);
        onNavigateTab('transactions');
      }
    },
    {
      step: 6,
      title: 'Data Explorer & Multi-Criteria Analytics',
      badge: 'Step 6 of 6',
      description: 'Conclude with verifiable open data integrity and instant CSV export.',
      talkingPoints: [
        'Show searchable tables for all 3 CSVs with pagination and sorting.',
        'Filter by zoning, floor, or property type.',
        'Click "Export CSV" to demonstrate interoperability with government GIS databases.'
      ],
      action: () => {
        onNavigateTab('explorer');
      }
    }
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      steps[nextIdx].action();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      steps[prevIdx].action();
    }
  };

  // Run initial step action on mount
  React.useEffect(() => {
    steps[0].action();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <h3 className="font-bold text-sm">SIH 3-Minute Guided Demo Tour</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
            {current.badge}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition text-slate-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 text-xs">
        <div>
          <h4 className="font-extrabold text-slate-900 text-base">{current.title}</h4>
          <p className="text-slate-500 mt-1 leading-relaxed">{current.description}</p>
        </div>

        {/* Presenter Talking Points */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Presenter Talking Points for Judges:
          </span>
          <ul className="space-y-1.5 text-slate-700">
            {current.talkingPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            disabled={currentStep === 0}
            onClick={handlePrev}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold disabled:opacity-30 hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-5 bg-emerald-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
            >
              Finish Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
