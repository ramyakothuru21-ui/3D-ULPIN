import { OwnershipRecord } from '../types';

// Realistic Andhra Pradesh names for DEMO DATA mode ONLY
const AP_NAMES = [
  'K. Venkateswarlu',
  'M. Lakshmi Devi',
  'B. Rajesh Kumar',
  'S. Ramanjaneyulu',
  'P. Sunitha Reddy',
  'V. Subba Rao',
  'G. Siva Prasad',
  'T. Annapurna',
  'Ch. Srinivasulu',
  'D. Nagaraju',
  'A. Padmavathi',
  'N. Chandrasekhar',
  'R. Mallikarjuna',
  'Y. Surekha',
  'E. Hariprasad'
];

/**
 * Provides ownership and transaction records.
 * STRICT RULE 23 COMPLIANCE:
 * When enableDemoOverlay is false, returns only baseline placeholders ("Not available").
 * When enableDemoOverlay is true, generates deterministic mock data clearly tagged with isDemoData = true.
 */
export function getOwnershipRecord(
  propertyId: string,
  ulpin: string,
  enableDemoOverlay: boolean
): OwnershipRecord {
  if (!enableDemoOverlay) {
    return {
      Property_ID: propertyId,
      ULPIN: ulpin,
      currentOwner: 'Not available in baseline CSV',
      ownershipStatus: 'Active',
      ownershipType: 'Not specified',
      surveyNumber: 'Not available',
      pattaNumber: 'Not available',
      isDemoData: false
    };
  }

  // Deterministic seed based on Property_ID
  const hash = propertyId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const currentOwner = AP_NAMES[hash % AP_NAMES.length];
  const prevOwner = AP_NAMES[(hash + 3) % AP_NAMES.length];
  
  const statuses: OwnershipRecord['ownershipStatus'][] = ['Verified', 'Active', 'Verified', 'Under Mutation'];
  const status = statuses[hash % statuses.length];

  const types: OwnershipRecord['ownershipType'][] = [
    'Individual Freehold',
    'Joint Freehold',
    'Commercial Lease',
    'Corporate'
  ];
  const type = types[hash % types.length];

  const txTypes: ('Registered Sale Deed' | 'Gift Deed' | 'Family Partition' | 'Allotment')[] = [
    'Registered Sale Deed',
    'Gift Deed',
    'Family Partition',
    'Allotment'
  ];
  const txType = txTypes[hash % txTypes.length];

  const year = 2020 + (hash % 5);
  const month = String(1 + (hash % 12)).padStart(2, '0');
  const day = String(1 + (hash % 28)).padStart(2, '0');
  const txDate = `${year}-${month}-${day}`;

  const deedNo = `AP-VSP-DVD-${year}-${String(1000 + (hash * 17) % 9000)}`;
  const surveyNo = `${120 + (hash % 85)}/${1 + (hash % 4)}${String.fromCharCode(65 + (hash % 3))}`;
  const pattaNo = `AP-VSP-PATTA-${20000 + (hash * 23) % 80000}`;
  const consideration = 1800000 + (hash % 60) * 125000;

  return {
    Property_ID: propertyId,
    ULPIN: ulpin,
    currentOwner,
    previousOwner: prevOwner,
    ownershipStatus: status,
    ownershipType: type,
    surveyNumber: surveyNo,
    pattaNumber: pattaNo,
    transactionType: txType,
    transactionDate: txDate,
    deedNumber: deedNo,
    considerationAmountINR: consideration,
    isDemoData: true
  };
}
