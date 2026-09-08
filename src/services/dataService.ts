import Papa from 'papaparse';
import { LandParcel, Building, VerticalProperty, CadastralStats } from '../types';
import { generateParcelPolygon, generateBuildingPolygon } from './gisService';

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
  stats: CadastralStats;
  parcelMap: Map<string, LandParcel>;
  buildingMap: Map<string, Building>;
  buildingToPropertiesMap: Map<string, VerticalProperty[]>;
  parcelToBuildingMap: Map<string, Building>;
}

let cachedData: LoadedDataset | null = null;

export async function loadDatasets(): Promise<LoadedDataset> {
  if (cachedData) {
    return cachedData;
  }

  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

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

  const [parcelsRes, buildingsRes, propertiesRes] = await Promise.all([
    fetchCsv('land_parcels.csv'),
    fetchCsv('buildings.csv'),
    fetchCsv('vertical_properties.csv')
  ]);

  const parsedParcels = Papa.parse<RawParcel>(parcelsRes.trim(), { header: true, skipEmptyLines: true });
  const parsedBuildings = Papa.parse<RawBuilding>(buildingsRes.trim(), { header: true, skipEmptyLines: true });
  const parsedProperties = Papa.parse<RawProperty>(propertiesRes.trim(), { header: true, skipEmptyLines: true });

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
      village: 'Kadapa Urban',
      mandal: 'Kadapa',
      district: 'YSR Kadapa, Andhra Pradesh',
      polygonCoordinates: generateParcelPolygon(lat, lon, area, p.Parcel_ID)
    };
  });

  const buildings: Building[] = parsedBuildings.data.map(b => {
    const lat = parseFloat(b.Latitude);
    const lon = parseFloat(b.Longitude);
    const floors = parseInt(b.Floors, 10) || 1;
    const height = parseFloat(b.Height_m) || floors * 3;
    const parcel = parcels.find(p => p.Parcel_ID === b.Parcel_ID);
    const pArea = parcel ? parcel.Area_sq_m : 800;

    return {
      Building_ID: b.Building_ID,
      Parcel_ID: b.Parcel_ID,
      Latitude: lat,
      Longitude: lon,
      Floors: floors,
      Height_m: height,
      Building_Type: b.Building_Type,
      polygonCoordinates: generateBuildingPolygon(lat, lon, pArea, b.Building_ID)
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
    Prototype_3D_ULPIN: u.Prototype_3D_ULPIN || `IND-AP-${u.Parcel_ID}-${u.Building_ID}-F${u.Floor_No}-${u.Unit_No}`
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

  // Calculate dynamic stats
  const totalParcels = parcels.length;
  const totalBuildings = buildings.length;
  const totalUnits = properties.length;
  const totalAreaSqM = parcels.reduce((sum, p) => sum + p.Area_sq_m, 0);

  const residentialCount = properties.filter(p => p.Property_Type.toLowerCase() === 'residential').length;
  const commercialCount = properties.filter(p => p.Property_Type.toLowerCase() !== 'residential').length;
  const officeCount = properties.filter(p => p.Property_Type.toLowerCase() === 'office').length;
  const shopCount = properties.filter(p => p.Property_Type.toLowerCase() === 'shop').length;

  const totalFloors = buildings.reduce((sum, b) => sum + b.Floors, 0);
  const avgFloorsPerBuilding = totalBuildings > 0 ? parseFloat((totalFloors / totalBuildings).toFixed(1)) : 0;
  const maxFloors = Math.max(...buildings.map(b => b.Floors), 0);

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
    totalRegisteredOwners: totalUnits, // each vertical property unit is a distinct legal cadastral title
    activeProperties: totalUnits,
    transferredProperties: Math.floor(totalUnits * 0.28) // dynamic cadastral turnover
  };

  cachedData = {
    parcels,
    buildings,
    properties,
    stats,
    parcelMap,
    buildingMap,
    buildingToPropertiesMap,
    parcelToBuildingMap
  };

  return cachedData;
}
