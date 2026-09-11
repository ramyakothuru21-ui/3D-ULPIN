import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { LandParcel, Building, VerticalProperty, RoadFeature, PlaceFeature } from '../../types';
import { getOwnershipRecord } from '../../services/demoRegistryService';
import { 
  Layers, 
  Compass, 
  Sun, 
  Satellite, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Box, 
  Check, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  MapPin, 
  Orbit,
  Maximize2,
  Minimize2,
  Navigation,
  Info
} from 'lucide-react';

interface GisMapProps {
  parcels: LandParcel[];
  buildings: Building[];
  roads?: RoadFeature[];
  places?: PlaceFeature[];
  selectedParcel: LandParcel | null;
  selectedBuilding: Building | null;
  selectedProperty: VerticalProperty | null;
  enableDemoOverlay?: boolean;
  onSelectParcel: (parcel: LandParcel) => void;
  onSelectBuilding: (building: Building) => void;
  is3DMode: boolean;
  onToggle3D: () => void;
}

type MapStyleMode = 'streets' | 'satellite' | 'light';

interface HoveredCardData {
  id: string;
  parcelId: string;
  osmId?: number;
  name?: string;
  bldgType: string;
  floors: number;
  hasRealLevels: boolean;
  realFloors?: number | null;
  height: number;
  hasRealHeight: boolean;
  area_sq_m: number;
  street?: string;
  ownerName: string;
  surveyNo: string;
  ulpin: string;
  ownershipStatus: string;
  isDemoOwnership: boolean;
  x: number;
  y: number;
}

export const GisMap: React.FC<GisMapProps> = ({
  parcels,
  buildings,
  roads = [],
  places = [],
  selectedParcel,
  selectedBuilding,
  selectedProperty,
  enableDemoOverlay = true,
  onSelectParcel,
  onSelectBuilding,
  is3DMode,
  onToggle3D
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('satellite');
  const [showParcelsLayer, setShowParcelsLayer] = useState<boolean>(false); // Cadastral parcel data unavailable from public source
  const [showBuildingsLayer, setShowBuildingsLayer] = useState<boolean>(true);
  const [showRoadsLayer, setShowRoadsLayer] = useState<boolean>(true);
  const [showPlacesLayer, setShowPlacesLayer] = useState<boolean>(true);
  const [showExtrusions, setShowExtrusions] = useState<boolean>(true);
  const [satelliteError, setSatelliteError] = useState<string | null>(null);
  const [hoveredBuildingCard, setHoveredBuildingCard] = useState<HoveredCardData | null>(null);
  const [isMap360Orbiting, setIsMap360Orbiting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapOrbitAnimRef = useRef<number | null>(null);

  // Geographic center of Duvvada, Visakhapatnam, Andhra Pradesh, India
  const DEFAULT_CENTER: [number, number] = [83.1514, 17.7036];
  const DEFAULT_ZOOM = 15.4;

  // Build GeoJSON features for Parcels
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

  // Build GeoJSON features for Real Duvvada Buildings
  const buildingsGeoJson = React.useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: buildings.map(b => ({
      type: 'Feature' as const,
      id: b.Building_ID,
      properties: {
        Building_ID: b.Building_ID,
        Parcel_ID: b.Parcel_ID,
        Osm_ID: b.osmId,
        Name: b.name || b.Building_ID,
        Building_Type: b.Building_Type,
        Floors: b.Floors,
        HasRealLevels: Boolean(b.hasRealLevels),
        RealFloors: b.realFloors ?? null,
        Height_m: b.Height_m,
        HasRealHeight: Boolean(b.hasRealHeight),
        RealHeight: b.realHeight ?? null,
        Area_sq_m: b.area_sq_m || 250,
        Street: b.street || 'Kurmannapalem Road / Duvvada',
        Latitude: b.Latitude,
        Longitude: b.Longitude,
        Source: 'OpenStreetMap',
        DataStatus: 'REAL_PUBLIC_DATA'
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [b.polygonCoordinates || []]
      }
    }))
  }), [buildings]);

  // Build GeoJSON features for Real Duvvada Roads & Railways
  const roadsGeoJson = React.useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: roads.map(r => ({
      type: 'Feature' as const,
      id: String(r.id),
      properties: {
        id: r.id,
        name: r.name,
        type: r.type,
        isRailway: r.isRailway
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: r.coordinates
      }
    }))
  }), [roads]);

  // Build GeoJSON features for Real Duvvada Landmarks & Places
  const placesGeoJson = React.useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: places.map(p => ({
      type: 'Feature' as const,
      id: String(p.id),
      properties: {
        id: p.id,
        name: p.name,
        category: p.category
      },
      geometry: {
        type: 'Point' as const,
        coordinates: p.coordinates
      }
    }))
  }), [places]);

  // Construct MapLibre Style Specification dynamically based on chosen basemap
  const getStyleSpec = useCallback((style: MapStyleMode): maplibregl.StyleSpecification => {
    let rasterSourceUrl = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    let attribution = '© CartoDB, © OpenStreetMap contributors';

    if (style === 'streets') {
      rasterSourceUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '© OpenStreetMap contributors (ODbL)';
    } else if (style === 'satellite') {
      // High-resolution Esri World Imagery
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
        setSatelliteError('Live satellite tiles temporarily slow — fallback light vector active.');
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
    // 1. Roads & Railway Source
    if (!map.getSource('roads-source')) {
      map.addSource('roads-source', {
        type: 'geojson',
        data: roadsGeoJson
      });
    }

    // Road Casing
    if (!map.getLayer('roads-casing')) {
      map.addLayer({
        id: 'roads-casing',
        type: 'line',
        source: 'roads-source',
        filter: ['!=', 'type', 'railway'],
        paint: {
          'line-color': mapStyle === 'satellite' ? '#0f172a' : '#ffffff',
          'line-width': 4.0,
          'line-opacity': 0.75
        }
      });
    }

    // Road Centerline
    if (!map.getLayer('roads-line')) {
      map.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'roads-source',
        filter: ['!=', 'type', 'railway'],
        paint: {
          'line-color': mapStyle === 'satellite' ? '#fbbf24' : '#334155',
          'line-width': 2.2,
          'line-opacity': 0.95
        }
      });
    }

    // Railway line (Duvvada Station railway line)
    if (!map.getLayer('railway-line')) {
      map.addLayer({
        id: 'railway-line',
        type: 'line',
        source: 'roads-source',
        filter: ['==', 'type', 'railway'],
        paint: {
          'line-color': '#e11d48',
          'line-width': 3.0,
          'line-dasharray': [4, 2]
        }
      });
    }

    // 2. Parcels Source
    if (!map.getSource('parcels-source')) {
      map.addSource('parcels-source', {
        type: 'geojson',
        data: parcelsGeoJson
      });
    }

    // Parcels Fill
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
          'fill-opacity': 0.28
        }
      });
    }

    // Parcels Stroke
    if (!map.getLayer('parcels-stroke')) {
      map.addLayer({
        id: 'parcels-stroke',
        type: 'line',
        source: 'parcels-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 1.6,
          'line-dasharray': [3, 2]
        }
      });
    }

    // Selected Parcel Highlight
    if (!map.getLayer('parcels-selected')) {
      map.addLayer({
        id: 'parcels-selected',
        type: 'line',
        source: 'parcels-source',
        filter: ['==', 'Parcel_ID', ''],
        paint: {
          'line-color': '#06b6d4',
          'line-width': 4.0
        }
      });
    }

    // 3. Buildings Source
    if (!map.getSource('buildings-source')) {
      map.addSource('buildings-source', {
        type: 'geojson',
        data: buildingsGeoJson
      });
    }

    // 2D Building Footprints Fill
    if (!map.getLayer('buildings-fill')) {
      map.addLayer({
        id: 'buildings-fill',
        type: 'fill',
        source: 'buildings-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'Building_Type'],
            'Commercial', '#0284c7',
            'Apartment', '#10b981',
            'Independent House', '#06b6d4',
            'Institutional', '#8b5cf6',
            'Healthcare', '#ec4899',
            '#64748b'
          ],
          'fill-opacity': is3DMode && showExtrusions ? 0 : 0.82
        }
      });
    }

    // 2D Building Footprints Stroke
    if (!map.getLayer('buildings-stroke')) {
      map.addLayer({
        id: 'buildings-stroke',
        type: 'line',
        source: 'buildings-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.2,
          'line-opacity': 0.9
        }
      });
    }

    // 3D Building Extrusions Layer
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
            'Institutional', '#8b5cf6',
            'Healthcare', '#ec4899',
            '#64748b'
          ],
          'fill-extrusion-height': is3DMode ? ['get', 'Height_m'] : 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.88
        }
      });
    }

    // Selected Building Extrusion Highlight
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
          'fill-extrusion-opacity': 0.98
        }
      });
    }

    // 4. Places & Landmarks Source
    if (!map.getSource('places-source')) {
      map.addSource('places-source', {
        type: 'geojson',
        data: placesGeoJson
      });
    }

    if (!map.getLayer('places-circles')) {
      map.addLayer({
        id: 'places-circles',
        type: 'circle',
        source: 'places-source',
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#f43f5e',
          'circle-stroke-width': 2.0,
          'circle-stroke-color': '#ffffff'
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

    map.on('click', 'buildings-fill', (e) => {
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

    // Touch cursor to building -> Immediate Details Hover Card
    map.on('mousemove', 'buildings-extrusion', (e) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        const props = feat.properties || {};
        const bldgId = props.Building_ID;
        const parcelId = props.Parcel_ID;
        const osmId = props.Osm_ID;
        const name = props.Name;
        const bldgType = props.Building_Type;
        const floors = props.Floors;
        const height = props.Height_m;
        const hasRealLevels = Boolean(props.HasRealLevels);
        const realFloors = props.RealFloors;
        const hasRealHeight = Boolean(props.HasRealHeight);
        const area_sq_m = props.Area_sq_m || 250;
        const street = props.Street;

        const ulpin = `IND-AP-VSP-DVD-${parcelId}-${bldgId}`;
        const ownership = getOwnershipRecord(bldgId, ulpin, enableDemoOverlay);

        setHoveredBuildingCard({
          id: bldgId,
          parcelId,
          osmId,
          name,
          bldgType,
          floors,
          hasRealLevels,
          realFloors,
          height,
          hasRealHeight,
          area_sq_m,
          street,
          ownerName: ownership.currentOwner,
          surveyNo: ownership.surveyNumber,
          ulpin,
          ownershipStatus: ownership.ownershipStatus,
          isDemoOwnership: ownership.isDemoData,
          x: e.point.x,
          y: e.point.y
        });
      }
    });

    map.on('mouseleave', 'buildings-extrusion', () => {
      map.getCanvas().style.cursor = '';
      setHoveredBuildingCard(null);
    });

    map.on('mousemove', 'buildings-fill', (e) => {
      if (!is3DMode && e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        const props = feat.properties || {};
        const bldgId = props.Building_ID;
        const parcelId = props.Parcel_ID;
        const osmId = props.Osm_ID;
        const name = props.Name;
        const bldgType = props.Building_Type;
        const floors = props.Floors;
        const height = props.Height_m;
        const hasRealLevels = Boolean(props.HasRealLevels);
        const realFloors = props.RealFloors;
        const hasRealHeight = Boolean(props.HasRealHeight);
        const area_sq_m = props.Area_sq_m || 250;
        const street = props.Street;

        const ulpin = `IND-AP-VSP-DVD-${parcelId}-${bldgId}`;
        const ownership = getOwnershipRecord(bldgId, ulpin, enableDemoOverlay);

        setHoveredBuildingCard({
          id: bldgId,
          parcelId,
          osmId,
          name,
          bldgType,
          floors,
          hasRealLevels,
          realFloors,
          height,
          hasRealHeight,
          area_sq_m,
          street,
          ownerName: ownership.currentOwner,
          surveyNo: ownership.surveyNumber,
          ulpin,
          ownershipStatus: ownership.ownershipStatus,
          isDemoOwnership: ownership.isDemoData,
          x: e.point.x,
          y: e.point.y
        });
      }
    });

    map.on('mouseleave', 'buildings-fill', () => {
      map.getCanvas().style.cursor = '';
      setHoveredBuildingCard(null);
    });

    // Hover on places/POIs
    map.on('mouseenter', 'places-circles', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'places-circles', () => {
      map.getCanvas().style.cursor = '';
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

    if (selectedBuilding) {
      map.flyTo({
        center: [selectedBuilding.Longitude, selectedBuilding.Latitude],
        zoom: 17.2,
        pitch: is3DMode ? 58 : 0,
        speed: 1.4,
        curve: 1.2
      });
    } else if (selectedParcel) {
      map.flyTo({
        center: [selectedParcel.Longitude, selectedParcel.Latitude],
        zoom: 16.5,
        pitch: is3DMode ? 55 : 0,
        speed: 1.4,
        curve: 1.2
      });
    }
  }, [selectedBuilding, selectedParcel]);

  // 2D / 3D Pitch transition & extrusion heights
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      pitch: is3DMode ? 58 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 1000
    });

    if (map.isStyleLoaded()) {
      if (map.getLayer('buildings-extrusion')) {
        map.setPaintProperty(
          'buildings-extrusion',
          'fill-extrusion-height',
          is3DMode ? ['get', 'Height_m'] : 0
        );
        map.setLayoutProperty(
          'buildings-extrusion',
          'visibility',
          is3DMode && showBuildingsLayer && showExtrusions ? 'visible' : 'none'
        );
      }

      if (map.getLayer('buildings-fill')) {
        map.setPaintProperty(
          'buildings-fill',
          'fill-opacity',
          is3DMode && showExtrusions ? 0 : 0.82
        );
      }
    }
  }, [is3DMode, showBuildingsLayer, showExtrusions]);

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
    if (map.getLayer('buildings-fill')) {
      map.setLayoutProperty('buildings-fill', 'visibility', showBuildingsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('buildings-stroke')) {
      map.setLayoutProperty('buildings-stroke', 'visibility', showBuildingsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('buildings-extrusion')) {
      map.setLayoutProperty(
        'buildings-extrusion',
        'visibility',
        is3DMode && showBuildingsLayer && showExtrusions ? 'visible' : 'none'
      );
    }
    if (map.getLayer('roads-casing')) {
      map.setLayoutProperty('roads-casing', 'visibility', showRoadsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('roads-line')) {
      map.setLayoutProperty('roads-line', 'visibility', showRoadsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('railway-line')) {
      map.setLayoutProperty('railway-line', 'visibility', showRoadsLayer ? 'visible' : 'none');
    }
    if (map.getLayer('places-circles')) {
      map.setLayoutProperty('places-circles', 'visibility', showPlacesLayer ? 'visible' : 'none');
    }
  }, [showParcelsLayer, showBuildingsLayer, showRoadsLayer, showPlacesLayer, showExtrusions, is3DMode]);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-900">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top-Left Geographic Location & 2D/3D Mode Pill */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-md flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900">Duvvada</span>
            <span className="text-[11px] text-slate-500">• Visakhapatnam, AP</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            REAL OSM DATA
          </span>
        </div>

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
            <span>2D Footprints</span>
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
            <span>3D GIS (55°)</span>
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

      {/* Live Building Details Hover Card */}
      {hoveredBuildingCard && (
        <div
          className="absolute z-30 pointer-events-none bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-cyan-300 text-xs text-slate-800 -translate-x-1/2 -translate-y-32 transition-all duration-75 min-w-[260px] max-w-sm"
          style={{ left: hoveredBuildingCard.x, top: hoveredBuildingCard.y }}
        >
          {/* Header with verified Real Public Data badge */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs truncate max-w-[160px]">
                  {hoveredBuildingCard.name || hoveredBuildingCard.id}
                </h4>
                <span className="text-[9px] text-slate-400 font-mono block">
                  OSM Way: {hoveredBuildingCard.osmId || hoveredBuildingCard.id}
                </span>
              </div>
            </div>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              REAL OSM DATA
            </span>
          </div>

          {/* Building Specifications */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <span className="text-[9px] text-slate-400 block uppercase font-medium">Footprint Area</span>
                <span className="font-extrabold text-slate-800">{hoveredBuildingCard.area_sq_m} m²</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <span className="text-[9px] text-slate-400 block uppercase font-medium">Floor Profile</span>
                <span className="font-extrabold text-slate-800">
                  {hoveredBuildingCard.hasRealLevels 
                    ? `${hoveredBuildingCard.realFloors} Fl (OSM Tag)` 
                    : `${hoveredBuildingCard.floors} Fl (Demo Height)`}
                </span>
              </div>
            </div>

            {hoveredBuildingCard.street && (
              <div className="text-[10px] text-slate-500 truncate">
                <span className="text-slate-400">Road:</span> {hoveredBuildingCard.street}
              </div>
            )}

            {/* Ownership Section: Explicitly marked as DEMO DATA */}
            <div className="pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-[9px]">
                  Vertical Property Owner
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  DEMO RECORD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  {hoveredBuildingCard.ownerName}
                </span>
                <span className="text-[10px] text-cyan-700 font-mono font-bold">
                  {hoveredBuildingCard.ownershipStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Style & Layer Switcher Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Style selector */}
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-1 text-xs">
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapStyle === 'satellite' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Real high-resolution satellite imagery of Duvvada, Visakhapatnam"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapStyle === 'streets' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Streets</span>
          </button>
          <button
            onClick={() => setMapStyle('light')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapStyle === 'light' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
        </div>

        {/* 2D / 3D Mode & Layer Toggles */}
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-md flex flex-col gap-2 text-xs w-60">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-extrabold text-slate-800 text-[11px]">GIS Layer Controls</span>
            <button
              onClick={toggleFullscreen}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
              title="Toggle Fullscreen Map"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Building footprints layer */}
          <label className="flex items-center justify-between gap-3 text-slate-700 hover:text-slate-900 cursor-pointer px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-emerald-500" />
              <span className="font-semibold">OSM Buildings ({buildings.length})</span>
            </div>
            <input
              type="checkbox"
              checked={showBuildingsLayer}
              onChange={e => setShowBuildingsLayer(e.target.checked)}
              className="rounded text-emerald-600 accent-emerald-600"
            />
          </label>

          {/* 3D Extrusions */}
          {is3DMode && (
            <label className="flex items-center justify-between gap-3 text-slate-700 hover:text-slate-900 cursor-pointer px-1 pl-3 text-[11px]">
              <span className="text-slate-600">3D Extrusions</span>
              <input
                type="checkbox"
                checked={showExtrusions}
                onChange={e => setShowExtrusions(e.target.checked)}
                className="rounded text-brand-600 accent-brand-600"
              />
            </label>
          )}

          {/* Roads & Railways */}
          <label className="flex items-center justify-between gap-3 text-slate-700 hover:text-slate-900 cursor-pointer px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-amber-400" />
              <span className="font-semibold">Roads & Rail ({roads.length})</span>
            </div>
            <input
              type="checkbox"
              checked={showRoadsLayer}
              onChange={e => setShowRoadsLayer(e.target.checked)}
              className="rounded text-amber-600 accent-amber-600"
            />
          </label>

          {/* Landmarks / POIs */}
          <label className="flex items-center justify-between gap-3 text-slate-700 hover:text-slate-900 cursor-pointer px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-semibold">Landmarks / Transit ({places.length})</span>
            </div>
            <input
              type="checkbox"
              checked={showPlacesLayer}
              onChange={e => setShowPlacesLayer(e.target.checked)}
              className="rounded text-rose-600 accent-rose-600"
            />
          </label>

          {/* Cadastral Parcels (Truth in Advertising: Public Source Unavailable) */}
          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <label className="flex items-center justify-between gap-2 text-slate-700 cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-800">Cadastral Parcels</span>
              </div>
              <input
                type="checkbox"
                checked={showParcelsLayer}
                onChange={e => setShowParcelsLayer(e.target.checked)}
                className="rounded text-cyan-600 accent-cyan-600"
              />
            </label>
            <p className="text-[9px] text-slate-500 mt-1 leading-tight">
              {showParcelsLayer ? (
                <span className="text-amber-700 font-medium">
                  Showing architectural parcel setback grid (AP Meebhoomi cadastral vector API restricted).
                </span>
              ) : (
                <span>Public cadastral data restricted; architecture ready for official API.</span>
              )}
            </p>
          </div>

          {/* 360 Orbit */}
          {is3DMode && (
            <button
              onClick={() => setIsMap360Orbiting(prev => !prev)}
              className={`w-full px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-between gap-2 ${
                isMap360Orbiting
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow ring-2 ring-orange-400/40'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Orbit className={`w-3.5 h-3.5 ${isMap360Orbiting ? 'animate-spin' : ''}`} />
                <span>360° Orbit</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 uppercase font-mono">
                {isMap360Orbiting ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={resetView}
              className="flex-1 text-[11px] text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Duvvada</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Modern Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-xs max-w-xs">
        <h4 className="font-extrabold text-slate-900 text-xs mb-2 flex items-center justify-between">
          <span>Duvvada Urban Cadastre</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
            ODbL
          </span>
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600" />
            <span className="text-slate-600 font-medium">Apartments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-sky-500 border border-sky-600" />
            <span className="text-slate-600 font-medium">Commercial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-cyan-500 border border-cyan-600" />
            <span className="text-slate-600 font-medium">House / Res</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-purple-500 border border-purple-600" />
            <span className="text-slate-600 font-medium">Institutional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-amber-400 rounded" />
            <span className="text-slate-600 font-medium">OSM Roads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-rose-500 border-b border-dashed border-white" />
            <span className="text-slate-600 font-medium">Rail Corridor</span>
          </div>
        </div>

        {/* Data Attribution Footer */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[9px] text-slate-400 leading-tight">
          Satellite: Esri World Imagery • Footprints: OpenStreetMap contributors under ODbL license.
        </div>
      </div>
    </div>
  );
};
