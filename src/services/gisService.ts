/**
 * Generates realistic GIS polygon coordinates around a center [lat, lon]
 * scaled according to the exact Area_sq_m from the dataset.
 */
export function generateParcelPolygon(lat: number, lon: number, areaSqM: number, parcelId: string): [number, number][] {
  // Approximate meters per degree at lat ~14.47 (Kadapa, AP)
  // 1 deg lat ~ 110,600 m
  // 1 deg lon ~ 111,320 * cos(14.47 deg) ~ 107,800 m
  const metersPerDegLat = 110600;
  const metersPerDegLon = 107800;

  // Derive side lengths from areaSqM. E.g. side = sqrt(area)
  const side = Math.sqrt(areaSqM);
  // Introduce a deterministic variation based on parcelId hash
  const hash = parcelId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const aspect = 1.0 + ((hash % 5) * 0.1); // 1.0 to 1.4 ratio
  const rotRad = ((hash % 12) * 5 * Math.PI) / 180; // slight rotation angle

  const halfW = (side * Math.sqrt(aspect)) / 2;
  const halfH = (side / Math.sqrt(aspect)) / 2;

  // 4 corners relative to center in meters
  const cornersM = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  // Rotate corners
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const coords: [number, number][] = cornersM.map(([x, y]) => {
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    const pLon = lon + rx / metersPerDegLon;
    const pLat = lat + ry / metersPerDegLat;
    return [pLon, pLat];
  });

  // Close the polygon
  coords.push(coords[0]);
  return coords;
}

/**
 * Generates building footprint inside a parcel polygon (approx 55% coverage)
 */
export function generateBuildingPolygon(lat: number, lon: number, parcelAreaSqM: number, buildingId: string): [number, number][] {
  const metersPerDegLat = 110600;
  const metersPerDegLon = 107800;

  // Building footprint is ~55% of parcel area
  const bldgArea = parcelAreaSqM * 0.55;
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
