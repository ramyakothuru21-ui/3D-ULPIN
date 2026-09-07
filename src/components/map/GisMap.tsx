import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { LandParcel, Building, VerticalProperty } from '../../types';
import { getOwnershipRecord } from '../../services/demoRegistryService';
import { Layers, Compass, Sun, Satellite, Eye, ZoomIn, ZoomOut, RotateCcw, Box, Check, AlertCircle, User, ShieldCheck, MapPin, Orbit } from 'lucide-react';

interface GisMapProps {
  parcels: LandParcel[];
  buildings: Building[];
  selectedParcel: LandParcel | null;
  selectedBuilding: Building | null;
  selectedProperty: VerticalProperty | null;
  onSelectParcel: (parcel: LandParcel) => void;
  onSelectBuilding: (building: Building) => void;
  is3DMode: boolean;
  onToggle3D: () => void;
}

type MapStyleMode = 'streets' | 'satellite' | 'light';

interface HoveredCardData {
  id: string;
  parcelId: string;
  bldgType: string;
  floors: number;
  height: number;
  ownerName: string;
  surveyNo: string;
  ulpin: string;
  ownershipStatus: string;
  x: number;
  y: number;
}

export const GisMap: React.FC<GisMapProps> = ({
  parcels,
  buildings,
  selectedParcel,
  selectedBuilding,
  selectedProperty,
  onSelectParcel,
  onSelectBuilding,
  is3DMode,
  onToggle3D
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('light');
  const [showParcelsLayer, setShowParcelsLayer] = useState<boolean>(true);
  const [showBuildingsLayer, setShowBuildingsLayer] = useState<boolean>(true);
  const [showExtrusions, setShowExtrusions] = useState<boolean>(true);
  const [satelliteError, setSatelliteError] = useState<string | null>(null);
  const [hoveredBuildingCard, setHoveredBuildingCard] = useState<HoveredCardData | null>(null);
  const [isMap360Orbiting, setIsMap360Orbiting] = useState<boolean>(false);
  const mapOrbitAnimRef = useRef<number | null>(null);

  // Center of Andhra Pradesh Kadapa dataset
  const DEFAULT_CENTER: [number, number] = [78.8300, 14.4680];
  const DEFAULT_ZOOM = 14.8;

  // Build GeoJSON features
  const parcelsGeoJson = React.useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: parcels.map(p => ({
      type: 'Feature' as const,
      id: p.Parcel_ID,
      properties: {
        Parcel_ID: p.Parcel_ID,
        Area_sq_m: p.Area_sq_m,
        Land_Type: p.Land_Type,
        Latitude: p.Latitude,
        Longitude: p.Longitude
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [p.polygonCoordinates || []]
      }
    }))
  }), [parcels]);

  const buildingsGeoJson = React.useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: buildings.map(b => ({
      type: 'Feature' as const,
      id: b.Building_ID,
      properties: {
        Building_ID: b.Building_ID,
        Parcel_ID: b.Parcel_ID,
        Floors: b.Floors,
        Height_m: b.Height_m,
        Building_Type: b.Building_Type,
        Latitude: b.Latitude,
        Longitude: b.Longitude
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [b.polygonCoordinates || []]
      }
    }))
  }), [buildings]);

  // Construct MapLibre Style Specification dynamically based on chosen basemap
  const getStyleSpec = useCallback((style: MapStyleMode): maplibregl.StyleSpecification => {
    let rasterSourceUrl = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    let attribution = '© CartoDB, © OpenStreetMap contributors';

    if (style === 'streets') {
      rasterSourceUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '© OpenStreetMap contributors';
    } else if (style === 'satellite') {
      // Configurable or open Esri World Imagery
      rasterSourceUrl = ((import.meta as any).env?.VITE_SATELLITE_TILE_URL as string) ||
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }

    return {
      version: 8,
      sources: {
        'basemap-tiles': {
          type: 'raster',
          tiles: [rasterSourceUrl],
          tileSize: 256,
          attribution
        }
      },
      layers: [
        {
          id: 'basemap-layer',
          type: 'raster',
          source: 'basemap-tiles',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleSpec(mapStyle),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: is3DMode ? 55 : 0,
      bearing: is3DMode ? -15 : 0,
      antialias: true
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('error', (e) => {
      if (mapStyle === 'satellite') {
        console.warn('Satellite layer error, falling back:', e);
        setSatelliteError('Satellite tiles temporarily unavailable — switched to standard light view.');
        setMapStyle('light');
      }
    });

    map.on('load', () => {
      addGeoJsonLayers(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update basemap style
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(getStyleSpec(mapStyle), { diff: false });
    map.once('style.load', () => {
      addGeoJsonLayers(map);
      updateSelectionHighlight(map);
    });
  }, [mapStyle, getStyleSpec]);

  // Add all layers
  const addGeoJsonLayers = (map: maplibregl.Map) => {
    // Add Parcels source
    if (!map.getSource('parcels-source')) {
      map.addSource('parcels-source', {
        type: 'geojson',
        data: parcelsGeoJson
      });
    }

    // Add Buildings source
    if (!map.getSource('buildings-source')) {
      map.addSource('buildings-source', {
        type: 'geojson',
        data: buildingsGeoJson
      });
    }

    // 1. Parcels Fill
    if (!map.getLayer('parcels-fill')) {
      map.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'Land_Type'],
            'Residential', '#34d399',
            'Commercial', '#f59e0b',
            'Mixed Use', '#38bdf8',
            '#94a3b8'
          ],
          'fill-opacity': 0.38
        }
      });
    }

    // 2. Parcels Stroke Outline
    if (!map.getLayer('parcels-stroke')) {
      map.addLayer({
        id: 'parcels-stroke',
        type: 'line',
        source: 'parcels-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 1.8,
          'line-dasharray': [3, 2]
        }
      });
    }

    // 3. Parcels Selected Highlight Outline
    if (!map.getLayer('parcels-selected')) {
      map.addLayer({
        id: 'parcels-selected',
        type: 'line',
        source: 'parcels-source',
        filter: ['==', 'Parcel_ID', ''],
        paint: {
          'line-color': '#06b6d4',
          'line-width': 4.5
        }
      });
    }

    // 4. 3D Building Extrusions Layer
    if (!map.getLayer('buildings-extrusion')) {
      map.addLayer({
        id: 'buildings-extrusion',
        type: 'fill-extrusion',
        source: 'buildings-source',
        paint: {
          'fill-extrusion-color': [
            'match',
            ['get', 'Building_Type'],
            'Commercial', '#0284c7',
            'Apartment', '#10b981',
            'Independent House', '#06b6d4',
            'Mixed Use', '#8b5cf6',
            '#64748b'
          ],
          'fill-extrusion-height': is3DMode ? ['get', 'Height_m'] : 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.88
        }
      });
    }

    // 5. Selected Building Extrusion Highlight
    if (!map.getLayer('buildings-selected')) {
      map.addLayer({
        id: 'buildings-selected',
        type: 'fill-extrusion',
        source: 'buildings-source',
        filter: ['==', 'Building_ID', ''],
        paint: {
          'fill-extrusion-color': '#facc15', // vibrant gold highlight
          'fill-extrusion-height': is3DMode ? ['get', 'Height_m'] : 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95
        }
      });
    }

    // Interactive event listeners
    map.on('click', 'buildings-extrusion', (e) => {
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        const bldgId = feat.properties?.Building_ID;
        const bldg = buildings.find(b => b.Building_ID === bldgId);
        if (bldg) {
          onSelectBuilding(bldg);
          const p = parcels.find(item => item.Parcel_ID === bldg.Parcel_ID);
          if (p) onSelectParcel(p);
        }
      }
    });

    map.on('click', 'parcels-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        const pId = feat.properties?.Parcel_ID;
        const parcel = parcels.find(p => p.Parcel_ID === pId);
        if (parcel) {
          onSelectParcel(parcel);
          const b = buildings.find(item => item.Parcel_ID === parcel.Parcel_ID);
          if (b) onSelectBuilding(b);
        }
      }
    });

    // Touch cursor to building -> Immediate Owner Details Hover Card!
    map.on('mousemove', 'buildings-extrusion', (e) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        const bldgId = feat.properties?.Building_ID;
        const parcelId = feat.properties?.Parcel_ID;
        const bldgType = feat.properties?.Building_Type;
        const floors = feat.properties?.Floors;
        const height = feat.properties?.Height_m;

        // Get owner details
        const ulpin = `IND-AP-${parcelId}-${bldgId}`;
        const ownership = getOwnershipRecord(bldgId, ulpin, true);

        setHoveredBuildingCard({
          id: bldgId,
          parcelId,
          bldgType,
          floors,
          height,
          ownerName: ownership.currentOwner,
          surveyNo: ownership.surveyNumber,
          ulpin,
          ownershipStatus: ownership.ownershipStatus,
          x: e.point.x,
          y: e.point.y
        });
      }
    });

    map.on('mouseleave', 'buildings-extrusion', () => {
      map.getCanvas().style.cursor = '';
      setHoveredBuildingCard(null);
    });

    map.on('mousemove', 'parcels-fill', (e) => {
      if (e.features && e.features.length > 0 && !hoveredBuildingCard) {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        const parcelId = feat.properties?.Parcel_ID;
        const ulpin = `IND-AP-${parcelId}`;
        const ownership = getOwnershipRecord(parcelId, ulpin, true);

        setHoveredBuildingCard({
          id: parcelId,
          parcelId,
          bldgType: `Land Parcel (${feat.properties?.Land_Type})`,
          floors: 0,
          height: 0,
          ownerName: ownership.currentOwner,
          surveyNo: ownership.surveyNumber,
          ulpin,
          ownershipStatus: ownership.ownershipStatus,
          x: e.point.x,
          y: e.point.y
        });
      }
    });

    map.on('mouseleave', 'parcels-fill', () => {
      map.getCanvas().style.cursor = '';
      setHoveredBuildingCard(null);
    });
  };

  // Update selection highlights
  const updateSelectionHighlight = (map: maplibregl.Map) => {
    if (map.getLayer('parcels-selected')) {
      const pId = selectedParcel ? selectedParcel.Parcel_ID : '';
      map.setFilter('parcels-selected', ['==', 'Parcel_ID', pId]);
    }
    if (map.getLayer('buildings-selected')) {
      const bId = selectedBuilding ? selectedBuilding.Building_ID : '';
      map.setFilter('buildings-selected', ['==', 'Building_ID', bId]);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateSelectionHighlight(map);
  }, [selectedParcel, selectedBuilding]);

  // Fly to selected parcel / building
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedParcel) {
      map.flyTo({
        center: [selectedParcel.Longitude, selectedParcel.Latitude],
        zoom: 16.5,
        pitch: is3DMode ? 55 : 0,
        speed: 1.4,
        curve: 1.2
      });
    }
  }, [selectedParcel]);

  // 2D / 3D Pitch transition & extrusion heights
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      pitch: is3DMode ? 58 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 1000
    });

    if (map.isStyleLoaded() && map.getLayer('buildings-extrusion')) {
      map.setPaintProperty(
        'buildings-extrusion',
        'fill-extrusion-height',
        is3DMode ? ['get', 'Height_m'] : 0
      );
    }
  }, [is3DMode]);

  // Layer visibility updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('parcels-fill')) {
      map.setLayoutProperty('parcels-fill', 'visibility', showParcelsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('parcels-stroke')) {
      map.setLayoutProperty('parcels-stroke', 'visibility', showParcelsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('buildings-extrusion')) {
      map.setLayoutProperty(
        'buildings-extrusion',
        'visibility',
        showBuildingsLayer && showExtrusions ? 'visible' : 'none'
      );
    }
  }, [showParcelsLayer, showBuildingsLayer, showExtrusions]);

  // Continuous 360° Map Orbit Animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isMap360Orbiting) {
      if (mapOrbitAnimRef.current) cancelAnimationFrame(mapOrbitAnimRef.current);
      return;
    }

    let lastTime = performance.now();
    const step = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        const nextBearing = (mapRef.current.getBearing() + delta * 15) % 360;
        mapRef.current.setBearing(nextBearing);
      }
      mapOrbitAnimRef.current = requestAnimationFrame(step);
    };

    mapOrbitAnimRef.current = requestAnimationFrame(step);

    return () => {
      if (mapOrbitAnimRef.current) cancelAnimationFrame(mapOrbitAnimRef.current);
    };
  }, [isMap360Orbiting]);

  const resetView = () => {
    setIsMap360Orbiting(false);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: is3DMode ? 55 : 0,
      bearing: 0,
      duration: 1200
    });
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Prominent Top-Left 2D / 3D Conversion Control Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-1">
          <button
            onClick={() => {
              if (is3DMode) onToggle3D();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              !is3DMode
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2D Cadastral Plan</span>
          </button>

          <button
            onClick={() => {
              if (!is3DMode) onToggle3D();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              is3DMode
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Digital Twin (55°)</span>
          </button>
        </div>
      </div>

      {/* Satellite Error Fallback Notification */}
      {satelliteError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>{satelliteError}</span>
          <button
            onClick={() => setSatelliteError(null)}
            className="ml-2 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Touch-Cursor Building & Owner Details Hover Card */}
      {hoveredBuildingCard && (
        <div
          className="absolute z-30 pointer-events-none bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-cyan-200 text-xs text-slate-800 -translate-x-1/2 -translate-y-28 transition-all duration-75 min-w-[240px] max-w-xs"
          style={{ left: hoveredBuildingCard.x, top: hoveredBuildingCard.y }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <h4 className="font-extrabold text-slate-900 text-xs">
                {hoveredBuildingCard.id}
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {hoveredBuildingCard.ownershipStatus}
            </span>
          </div>

          {/* Owner details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                {hoveredBuildingCard.ownerName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Registered Owner</span>
                <span className="font-bold text-slate-900 text-xs block -mt-0.5">
                  {hoveredBuildingCard.ownerName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
              <div>
                <span className="text-[9px] text-slate-400 block font-mono uppercase">Survey Number</span>
                <span className="font-bold text-slate-800">{hoveredBuildingCard.surveyNo}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Building Spec</span>
                <span className="font-semibold text-slate-800">
                  {hoveredBuildingCard.floors > 0 ? `${hoveredBuildingCard.floors} Fl (${hoveredBuildingCard.height}m)` : 'Surface Plot'}
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-100 text-[10px] font-mono text-cyan-700 truncate">
              {hoveredBuildingCard.ulpin}
            </div>
          </div>
        </div>
      )}

      {/* Map Style & Layer Switcher Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Style selector */}
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-1 text-xs">
          <button
            onClick={() => setMapStyle('light')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              mapStyle === 'light' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              mapStyle === 'streets' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Street</span>
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              mapStyle === 'satellite' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
        </div>

        {/* 2D / 3D Mode & Layer Toggles */}
        <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-md flex flex-col gap-1.5 text-xs">
          <button
            onClick={onToggle3D}
            className={`w-full px-3 py-1.5 rounded-lg font-semibold transition flex items-center justify-between gap-2 ${
              is3DMode
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              <span>{is3DMode ? '3D View (55°)' : '2D Plan'}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 uppercase font-mono">
              {is3DMode ? '3D' : '2D'}
            </span>
          </button>

          {is3DMode && (
            <button
              onClick={() => setIsMap360Orbiting(prev => !prev)}
              className={`w-full px-3 py-1.5 rounded-lg font-semibold transition flex items-center justify-between gap-2 ${
                isMap360Orbiting
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow ring-2 ring-orange-400/40'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Continuously rotate map bearing 360 degrees"
            >
              <div className="flex items-center gap-1.5">
                <Orbit className={`w-3.5 h-3.5 ${isMap360Orbiting ? 'animate-spin' : ''}`} />
                <span>360° Map Orbit</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 uppercase font-mono">
                {isMap360Orbiting ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          <div className="h-px bg-slate-200 my-0.5" />

          <label className="flex items-center justify-between gap-3 text-slate-600 hover:text-slate-900 cursor-pointer px-1">
            <span>Land Parcels</span>
            <input
              type="checkbox"
              checked={showParcelsLayer}
              onChange={e => setShowParcelsLayer(e.target.checked)}
              className="rounded text-brand-600 accent-brand-600"
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-slate-600 hover:text-slate-900 cursor-pointer px-1">
            <span>Buildings</span>
            <input
              type="checkbox"
              checked={showBuildingsLayer}
              onChange={e => setShowBuildingsLayer(e.target.checked)}
              className="rounded text-brand-600 accent-brand-600"
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-slate-600 hover:text-slate-900 cursor-pointer px-1">
            <span>3D Extrusions</span>
            <input
              type="checkbox"
              checked={showExtrusions}
              onChange={e => setShowExtrusions(e.target.checked)}
              className="rounded text-brand-600 accent-brand-600"
            />
          </label>

          <button
            onClick={resetView}
            className="mt-1 text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1 hover:bg-slate-100 rounded transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Floating Modern Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-xs max-w-xs">
        <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center justify-between">
          <span>Cadastral Symbology</span>
          <span className="text-[10px] text-slate-400 font-normal">Andhra Pradesh</span>
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-600" />
            <span className="text-slate-600">Residential</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-600" />
            <span className="text-slate-600">Commercial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-sky-400 border border-sky-600" />
            <span className="text-slate-600">Mixed Use</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 border border-indigo-700" />
            <span className="text-slate-600">Apartment Block</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-yellow-400 ring-2 ring-yellow-500 ring-offset-1" />
            <span className="text-slate-800 font-semibold">Selected Building</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm border-2 border-cyan-500 bg-cyan-100" />
            <span className="text-slate-800 font-semibold">Selected Parcel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
