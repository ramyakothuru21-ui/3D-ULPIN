/**
 * Geodesic spatial utilities for Duvvada, Visakhapatnam, Andhra Pradesh
 * Coordinates: Lat ~17.70°, Lon ~83.15°
 */

/**
 * Calculates accurate geodesic surface area in square meters for a geographic polygon
 * @param coords Array of [lon, lat] coordinates representing a closed ring
 */
export function calculatePolygonAreaSqM(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  const R = 6378137; // Earth's mean radius in meters
  let area = 0;
  const n = coords.length;

  for (let i = 0; i < n - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const x1 = (lon1 * Math.PI / 180) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180) * R;
    const y1 = (lat1 * Math.PI / 180) * R;
    const x2 = (lon2 * Math.PI / 180) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180) * R;
    const y2 = (lat2 * Math.PI / 180) * R;
    area += (x1 * y2 - x2 * y1);
  }
  return Math.round(Math.abs(area / 2) * 10) / 10;
}

/**
 * Calculates geographic centroid [lon, lat] of a polygon ring
 */
export function calculatePolygonCentroid(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [83.1514, 17.7036];
  let sumLon = 0;
  let sumLat = 0;
  const count = coords.length > 1 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
    ? coords.length - 1
    : coords.length;

  for (let i = 0; i < count; i++) {
    sumLon += coords[i][0];
    sumLat += coords[i][1];
  }
  return [
    Math.round((sumLon / count) * 1000000) / 1000000,
    Math.round((sumLat / count) * 1000000) / 1000000
  ];
}

/**
 * Generates boundary polygon around a center [lat, lon]
 * Calibrated for Duvvada, Visakhapatnam latitude ~17.70°
 */
export function generateParcelPolygon(lat: number, lon: number, areaSqM: number, parcelId: string): [number, number][] {
  // Approximate meters per degree at lat ~17.70 (Duvvada, Visakhapatnam)
  // 1 deg lat ~ 110,650 m
  // 1 deg lon ~ 111,320 * cos(17.70 deg) ~ 106,000 m
  const metersPerDegLat = 110650;
  const metersPerDegLon = 106000;

  const side = Math.sqrt(areaSqM);
  const hash = parcelId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const aspect = 1.0 + ((hash % 5) * 0.1);
  const rotRad = ((hash % 12) * 5 * Math.PI) / 180;

  const halfW = (side * Math.sqrt(aspect)) / 2;
  const halfH = (side / Math.sqrt(aspect)) / 2;

  const cornersM = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const coords: [number, number][] = cornersM.map(([x, y]) => {
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    const pLon = lon + rx / metersPerDegLon;
    const pLat = lat + ry / metersPerDegLat;
    return [pLon, pLat];
  });

  coords.push(coords[0]);
  return coords;
}

/**
 * Generates fallback building footprint
 */
export function generateBuildingPolygon(lat: number, lon: number, parcelAreaSqM: number, buildingId: string): [number, number][] {
  const metersPerDegLat = 110650;
  const metersPerDegLon = 106000;

  const bldgArea = parcelAreaSqM * 0.60;
  const side = Math.sqrt(bldgArea);
  const hash = buildingId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const aspect = 1.1 + ((hash % 4) * 0.15);
  const rotRad = ((hash % 12) * 5 * Math.PI) / 180;

  const halfW = (side * Math.sqrt(aspect)) / 2;
  const halfH = (side / Math.sqrt(aspect)) / 2;

  const cornersM = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const coords: [number, number][] = cornersM.map(([x, y]) => {
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    const bLon = lon + rx / metersPerDegLon;
    const bLat = lat + ry / metersPerDegLat;
    return [bLon, bLat];
  });

  coords.push(coords[0]);
  return coords;
}

