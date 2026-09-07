export interface LandParcel {
  Parcel_ID: string;
  Latitude: number;
  Longitude: number;
  Area_sq_m: number;
  Land_Type: 'Residential' | 'Commercial' | 'Mixed Use' | string;
  // Computed GIS geometry for realistic cadastral boundaries
  polygonCoordinates?: [number, number][];
  surveyNumber?: string;
  village?: string;
  mandal?: string;
  district?: string;
}

export interface Building {
  Building_ID: string;
  Parcel_ID: string;
  Latitude: number;
  Longitude: number;
  Floors: number;
  Height_m: number;
  Building_Type: 'Commercial' | 'Apartment' | 'Independent House' | 'Mixed Use' | string;
  polygonCoordinates?: [number, number][];
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
