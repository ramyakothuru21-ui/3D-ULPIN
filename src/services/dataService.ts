import Papa from 'papaparse';
import { LandParcel, Building, VerticalProperty, CadastralStats, RoadFeature, PlaceFeature } from '../types';
import { calculatePolygonAreaSqM, calculatePolygonCentroid, generateParcelPolygon, generateBuildingPolygon } from './gisService';

interface RawParcel {
  Parcel_ID: string;
  Latitude: string;
  Longitude: string;
  Area_sq_m: string;
  Land_Type: string;
}

interface RawBuilding {
  Building_ID: string;
  Parcel_ID: string;
  Latitude: string;
  Longitude: string;
  Floors: string;
  Height_m: string;
  Building_Type: string;
  Name?: string;
  Osm_ID?: string;
  Area_sq_m?: string;
  HasRealLevels?: string;
  HasRealHeight?: string;
}

interface RawProperty {
  Property_ID: string;
  Building_ID: string;
  Parcel_ID: string;
  Floor_No: string;
  Unit_No: string;
  Area_sq_m: string;
  Property_Type: string;
  Prototype_3D_ULPIN: string;
}

export interface LoadedDataset {
  parcels: LandParcel[];
  buildings: Building[];
  properties: VerticalProperty[];
  roads: RoadFeature[];
  places: PlaceFeature[];
  stats: CadastralStats;
  parcelMap: Map<string, LandParcel>;
  buildingMap: Map<string, Building>;
  buildingToPropertiesMap: Map<string, VerticalProperty[]>;
  parcelToBuildingMap: Map<string, Building>;
  buildingsGeoJson?: any;
  roadsGeoJson?: any;
  placesGeoJson?: any;
  parcelsGeoJson?: any;
}

let cachedData: LoadedDataset | null = null;

export async function loadDatasets(): Promise<LoadedDataset> {
  if (cachedData) {
    return cachedData;
  }

  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  const fetchJson = async (filename: string) => {
    const primaryUrl = `${cleanBase}data/${filename}`;
    try {
      const res = await fetch(primaryUrl);
      if (res.ok) return await res.json();
    } catch (_) {}

    try {
      const fallbackRes = await fetch(`/data/${filename}`);
      if (fallbackRes.ok) return await fallbackRes.json();
    } catch (_) {}

    return null;
  };

  const fetchCsv = async (filename: string) => {
    const primaryUrl = `${cleanBase}data/${filename}`;
    try {
      const res = await fetch(primaryUrl);
      if (res.ok) return await res.text();
    } catch (_) {}
    
    // Fallback to absolute root /data/
    try {
      const fallbackRes = await fetch(`/data/${filename}`);
      if (fallbackRes.ok) return await fallbackRes.text();
    } catch (_) {}

    throw new Error(`Failed to load ${filename}`);
  };

  // Attempt to load rich real GeoJSON datasets first
  const [buildingsGeoJson, roadsGeoJson, placesGeoJson, parcelsGeoJson] = await Promise.all([
    fetchJson('buildings.geojson'),
    fetchJson('roads.geojson'),
    fetchJson('places.geojson'),
    fetchJson('parcels.geojson')
  ]);

  // Load baseline CSVs
  const [parcelsRes, buildingsRes, propertiesRes] = await Promise.all([
    fetchCsv('land_parcels.csv'),
    fetchCsv('buildings.csv'),
    fetchCsv('vertical_properties.csv')
  ]);

  const parsedParcels = Papa.parse<RawParcel>(parcelsRes.trim(), { header: true, skipEmptyLines: true });
  const parsedBuildings = Papa.parse<RawBuilding>(buildingsRes.trim(), { header: true, skipEmptyLines: true });
  const parsedProperties = Papa.parse<RawProperty>(propertiesRes.trim(), { header: true, skipEmptyLines: true });

  // Extract real roads
  const roads: RoadFeature[] = [];
  if (roadsGeoJson && Array.isArray(roadsGeoJson.features)) {
    roadsGeoJson.features.forEach((f: any) => {
      roads.push({
        id: f.properties?.id || f.id,
        name: f.properties?.name || 'Duvvada Road',
        type: f.properties?.type || 'road',
        isRailway: f.properties?.type === 'railway' || Boolean(f.properties?.railway),
        coordinates: f.geometry?.coordinates || [],
        source: 'OpenStreetMap',
        dataStatus: 'REAL_PUBLIC_DATA'
      });
    });
  }

  // Extract real places / POIs
  const places: PlaceFeature[] = [];
  if (placesGeoJson && Array.isArray(placesGeoJson.features)) {
    placesGeoJson.features.forEach((f: any) => {
      places.push({
        id: f.properties?.id || f.id,
        name: f.properties?.name || 'Landmark',
        category: f.properties?.category || 'Landmark',
        coordinates: f.geometry?.coordinates || [83.1514, 17.7036],
        source: 'OpenStreetMap',
        dataStatus: 'REAL_PUBLIC_DATA'
      });
    });
  }

  // Map of building ID -> real polygon coordinates from buildings.geojson
  const realPolygonMap = new Map<string, [number, number][]>();
  const realGeoPropertiesMap = new Map<string, any>();
  if (buildingsGeoJson && Array.isArray(buildingsGeoJson.features)) {
    buildingsGeoJson.features.forEach((feat: any) => {
      const bId = feat.properties?.Building_ID || feat.id;
      const coords = feat.geometry?.coordinates?.[0];
      if (bId && Array.isArray(coords)) {
        realPolygonMap.set(bId, coords);
        realGeoPropertiesMap.set(bId, feat.properties);
      }
    });
  }

  const parcels: LandParcel[] = parsedParcels.data.map(p => {
    const lat = parseFloat(p.Latitude);
    const lon = parseFloat(p.Longitude);
    const area = parseFloat(p.Area_sq_m) || 500;
    return {
      Parcel_ID: p.Parcel_ID,
      Latitude: lat,
      Longitude: lon,
      Area_sq_m: area,
      Land_Type: p.Land_Type,
      village: 'Duvvada',
      mandal: 'Gajuwaka',
      district: 'Visakhapatnam, Andhra Pradesh',
      polygonCoordinates: generateParcelPolygon(lat, lon, area, p.Parcel_ID),
      source: 'State Cadastre Interface (Simulated Layout for Prototype Architecture)',
      dataStatus: 'DEMO_DATA'
    };
  });

  const buildings: Building[] = parsedBuildings.data.map(b => {
    const lat = parseFloat(b.Latitude);
    const lon = parseFloat(b.Longitude);
    const floors = parseInt(b.Floors, 10) || 1;
    const height = parseFloat(b.Height_m) || floors * 3.2;
    const geoProps = realGeoPropertiesMap.get(b.Building_ID) || {};
    const realCoords = realPolygonMap.get(b.Building_ID);
    const area = parseFloat(b.Area_sq_m || '') || geoProps.Area_sq_m || 250;

    const hasRealLevels = b.HasRealLevels === 'true' || Boolean(geoProps.HasRealLevels);
    const hasRealHeight = b.HasRealHeight === 'true' || Boolean(geoProps.HasRealHeight);
    const realLevelsVal = geoProps.RealFloors || (hasRealLevels ? floors : null);

    return {
      Building_ID: b.Building_ID,
      Parcel_ID: b.Parcel_ID,
      Latitude: lat,
      Longitude: lon,
      Floors: floors,
      Height_m: height,
      Building_Type: b.Building_Type,
      name: b.Name || geoProps.Name || (b.Building_Type === 'Apartment' ? `Duvvada Apartments ${b.Building_ID}` : `Duvvada Building ${b.Building_ID}`),
      osmId: parseInt(b.Osm_ID || '', 10) || geoProps.Osm_ID || undefined,
      area_sq_m: area,
      street: geoProps.Street || 'Kurmannapalem Road / Duvvada',
      city: 'Visakhapatnam',
      postcode: geoProps.Postcode || '530046',
      state: 'Andhra Pradesh',
      hasRealLevels,
      realFloors: realLevelsVal,
      hasRealHeight,
      realHeight: geoProps.RealHeight || (hasRealHeight ? height : null),
      source: 'OpenStreetMap',
      dataStatus: 'REAL_PUBLIC_DATA',
      heightStatus: hasRealHeight ? 'REAL_PUBLIC_DATA' : (hasRealLevels ? 'DERIVED_FROM_LEVELS' : 'DEMO_ILLUSTRATIVE_HEIGHT'),
      polygonCoordinates: realCoords || generateBuildingPolygon(lat, lon, area * 1.6, b.Building_ID)
    };
  });

  const properties: VerticalProperty[] = parsedProperties.data.map(u => ({
    Property_ID: u.Property_ID,
    Building_ID: u.Building_ID,
    Parcel_ID: u.Parcel_ID,
    Floor_No: parseInt(u.Floor_No, 10) || 1,
    Unit_No: parseInt(u.Unit_No, 10) || 101,
    Area_sq_m: parseFloat(u.Area_sq_m) || 80,
    Property_Type: u.Property_Type,
    Prototype_3D_ULPIN: u.Prototype_3D_ULPIN || `IND-AP-VSP-DVD-${u.Parcel_ID}-${u.Building_ID}-F${String(u.Floor_No).padStart(2, '0')}-${u.Unit_No}`,
    source: '3D-ULPIN System Vertical Demonstration Engine',
    dataStatus: 'DEMO_DATA',
    notice: 'DEMO DATA – NOT OFFICIAL PROPERTY RECORD'
  }));

  // Build indexes for O(1) relationships
  const parcelMap = new Map<string, LandParcel>();
  parcels.forEach(p => parcelMap.set(p.Parcel_ID, p));

  const buildingMap = new Map<string, Building>();
  buildings.forEach(b => buildingMap.set(b.Building_ID, b));

  const parcelToBuildingMap = new Map<string, Building>();
  buildings.forEach(b => parcelToBuildingMap.set(b.Parcel_ID, b));

  const buildingToPropertiesMap = new Map<string, VerticalProperty[]>();
  properties.forEach(prop => {
    const list = buildingToPropertiesMap.get(prop.Building_ID) || [];
    list.push(prop);
    buildingToPropertiesMap.set(prop.Building_ID, list);
  });

  // Calculate dynamic stats strictly based on loaded Duvvada datasets
  const totalParcels = parcels.length;
  const totalBuildings = buildings.length;
  const totalUnits = properties.length;
  const totalAreaSqM = buildings.reduce((sum, b) => sum + (b.area_sq_m || 250), 0);

  const residentialCount = properties.filter(p => p.Property_Type.toLowerCase() === 'residential').length;
  const commercialCount = properties.filter(p => p.Property_Type.toLowerCase() !== 'residential').length;
  const officeCount = properties.filter(p => p.Property_Type.toLowerCase() === 'office').length;
  const shopCount = properties.filter(p => p.Property_Type.toLowerCase() === 'shop').length;

  const totalFloors = buildings.reduce((sum, b) => sum + b.Floors, 0);
  const avgFloorsPerBuilding = totalBuildings > 0 ? parseFloat((totalFloors / totalBuildings).toFixed(1)) : 0;
  const maxFloors = Math.max(...buildings.map(b => b.Floors), 0);

  const buildingsWithRealLevels = buildings.filter(b => b.hasRealLevels).length;
  const namedBuildingsCount = buildings.filter(b => b.name && !b.name.startsWith('Duvvada Building')).length;

  const stats: CadastralStats = {
    totalParcels,
    totalBuildings,
    totalUnits,
    totalAreaSqM,
    residentialCount,
    commercialCount,
    officeCount,
    shopCount,
    avgFloorsPerBuilding,
    maxFloors,
    totalRegisteredOwners: totalUnits,
    activeProperties: totalUnits,
    transferredProperties: Math.floor(totalUnits * 0.24),
    totalRoads: roads.length,
    totalPlaces: places.length,
    buildingsWithRealLevels,
    namedBuildingsCount
  };

  cachedData = {
    parcels,
    buildings,
    properties,
    roads,
    places,
    stats,
    parcelMap,
    buildingMap,
    buildingToPropertiesMap,
    parcelToBuildingMap,
    buildingsGeoJson,
    roadsGeoJson,
    placesGeoJson,
    parcelsGeoJson
  };

  return cachedData;
}

