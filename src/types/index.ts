export interface LandParcel {
  Parcel_ID: string;
  Latitude: number;
  Longitude: number;
  Area_sq_m: number;
  Land_Type: 'Residential' | 'Commercial' | 'Mixed Use' | string;
  polygonCoordinates?: [number, number][];
  surveyNumber?: string;
  village?: string;
  mandal?: string;
  district?: string;
  source?: string;
  dataStatus?: 'REAL_PUBLIC_DATA' | 'DEMO_DATA' | 'UNAVAILABLE_PUBLIC_SOURCE' | string;
}

export interface Building {
  Building_ID: string;
  Parcel_ID: string;
  Latitude: number;
  Longitude: number;
  Floors: number;
  Height_m: number;
  Building_Type: 'Commercial' | 'Apartment' | 'Independent House' | 'Institutional' | 'Healthcare' | 'Mixed Use' | string;
  polygonCoordinates?: [number, number][];
  osmId?: number;
  name?: string;
  street?: string;
  city?: string;
  postcode?: string;
  state?: string;
  area_sq_m?: number;
  hasRealLevels?: boolean;
  realFloors?: number | null;
  hasRealHeight?: boolean;
  realHeight?: number | null;
  source?: string;
  dataStatus?: 'REAL_PUBLIC_DATA' | 'DEMO_DATA' | 'UNAVAILABLE_PUBLIC_SOURCE' | string;
  heightStatus?: 'REAL_PUBLIC_DATA' | 'DERIVED_FROM_LEVELS' | 'DEMO_ILLUSTRATIVE_HEIGHT' | string;
}

export interface VerticalProperty {
  Property_ID: string;
  Building_ID: string;
  Parcel_ID: string;
  Floor_No: number;
  Unit_No: number;
  Area_sq_m: number;
  Property_Type: 'Shop' | 'Office' | 'Residential' | string;
  Prototype_3D_ULPIN: string;
  source?: string;
  dataStatus?: 'REAL_PUBLIC_DATA' | 'DEMO_DATA' | 'UNAVAILABLE_PUBLIC_SOURCE' | string;
  notice?: string;
}

export interface RoadFeature {
  id: string | number;
  name: string;
  type: string;
  isRailway: boolean;
  coordinates: [number, number][];
  source: string;
  dataStatus: string;
}

export interface PlaceFeature {
  id: string | number;
  name: string;
  category: string;
  coordinates: [number, number];
  source: string;
  dataStatus: string;
}

export interface OwnershipRecord {
  Property_ID: string;
  ULPIN: string;
  currentOwner: string;
  ownershipStatus: 'Verified' | 'Active' | 'Under Mutation' | 'Encumbered';
  ownershipType: 'Individual Freehold' | 'Joint Freehold' | 'Commercial Lease' | 'Corporate' | 'Not specified';
  surveyNumber: string;
  pattaNumber: string;
  previousOwner?: string;
  transactionType?: 'Registered Sale Deed' | 'Gift Deed' | 'Family Partition' | 'Allotment';
  transactionDate?: string;
  deedNumber?: string;
  considerationAmountINR?: number;
  isDemoData: boolean;
}

export interface CadastralStats {
  totalParcels: number;
  totalBuildings: number;
  totalUnits: number;
  totalAreaSqM: number;
  residentialCount: number;
  commercialCount: number;
  officeCount: number;
  shopCount: number;
  avgFloorsPerBuilding: number;
  maxFloors: number;
  totalRegisteredOwners: number;
  activeProperties: number;
  transferredProperties: number;
  totalRoads?: number;
  totalPlaces?: number;
  buildingsWithRealLevels?: number;
  namedBuildingsCount?: number;
}

export interface FilterState {
  searchQuery: string;
  landTypes: string[];
  buildingTypes: string[];
  propertyTypes: string[];
  minFloors: number;
  maxFloors: number;
  minArea: number;
  maxArea: number;
  floorNo?: number | null;
}

export type ActiveTab = 
  | 'overview' 
  | 'map' 
  | 'parcels' 
  | 'buildings' 
  | 'units' 
  | 'ownership' 
  | 'transactions' 
  | 'analytics' 
  | 'explorer' 
  | 'about';

