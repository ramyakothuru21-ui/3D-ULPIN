import * as THREE from 'three';

export interface RoomInfo {
  id: string;
  name: string;
  type: 'hall' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'office' | 'cabin' | 'retail';
  areaSqM: number;
  dimensions: string; // e.g. "5.6m × 4.2m"
  bounds: { x: number; z: number; width: number; depth: number }; // relative 3D floor coordinates
  colorHex: number;
}

export interface UnitInteriorLayout {
  propertyType: string;
  totalCarpetArea: number;
  rooms: RoomInfo[];
}

/**
 * Returns architectural room breakdown for a unit based on its property type and area.
 */
export function getUnitInteriorLayout(propertyType: string, areaSqM: number): UnitInteriorLayout {
  const isResidential = propertyType.toLowerCase() === 'residential';
  const isOffice = propertyType.toLowerCase() === 'office';

  if (isResidential) {
    const hallArea = Math.round(areaSqM * 0.38);
    const masterBedArea = Math.round(areaSqM * 0.25);
    const bed2Area = Math.round(areaSqM * 0.18);
    const kitchenArea = Math.round(areaSqM * 0.11);
    const bathBalconyArea = Math.max(areaSqM - (hallArea + masterBedArea + bed2Area + kitchenArea), 6);

    const rooms: RoomInfo[] = [
      {
        id: 'room-hall',
        name: 'Living Hall & Foyer',
        type: 'hall',
        areaSqM: hallArea,
        dimensions: '5.6m × 4.2m',
        bounds: { x: -1.7, z: 1.7, width: 3.5, depth: 3.5 },
        colorHex: 0x38bdf8
      },
      {
        id: 'room-master-bed',
        name: 'Master Bedroom',
        type: 'bedroom',
        areaSqM: masterBedArea,
        dimensions: '4.5m × 3.8m',
        bounds: { x: 1.8, z: 1.7, width: 3.3, depth: 3.5 },
        colorHex: 0xa78bfa
      },
      {
        id: 'room-bed-2',
        name: 'Bedroom 2 / Guest',
        type: 'bedroom',
        areaSqM: bed2Area,
        dimensions: '3.8m × 3.2m',
        bounds: { x: 1.8, z: -1.8, width: 3.3, depth: 3.3 },
        colorHex: 0x34d399
      },
      {
        id: 'room-kitchen',
        name: 'Modular Kitchen & Dining',
        type: 'kitchen',
        areaSqM: kitchenArea,
        dimensions: '3.4m × 2.6m',
        bounds: { x: -1.7, z: -1.8, width: 2.3, depth: 3.3 },
        colorHex: 0xfbbf24
      },
      {
        id: 'room-bath-balcony',
        name: 'Sitout Balcony & Bath',
        type: 'balcony',
        areaSqM: bathBalconyArea,
        dimensions: '2.8m × 1.8m',
        bounds: { x: -3.0, z: -1.8, width: 1.2, depth: 3.3 },
        colorHex: 0x94a3b8
      }
    ];

    return {
      propertyType: 'Residential Apartment',
      totalCarpetArea: areaSqM,
      rooms
    };
  } else if (isOffice) {
    const confArea = Math.round(areaSqM * 0.28);
    const cabinArea = Math.round(areaSqM * 0.22);
    const workArea = Math.round(areaSqM * 0.38);
    const recepArea = Math.max(areaSqM - (confArea + cabinArea + workArea), 8);

    const rooms: RoomInfo[] = [
      {
        id: 'room-workstations',
        name: 'Open Workstation Bay',
        type: 'office',
        areaSqM: workArea,
        dimensions: '6.2m × 4.8m',
        bounds: { x: -1.4, z: 1.4, width: 3.8, depth: 3.6 },
        colorHex: 0x38bdf8
      },
      {
        id: 'room-conference',
        name: 'Conference Room',
        type: 'office',
        areaSqM: confArea,
        dimensions: '4.6m × 3.6m',
        bounds: { x: 1.8, z: 1.4, width: 3.2, depth: 3.6 },
        colorHex: 0x818cf8
      },
      {
        id: 'room-cabin',
        name: 'Director Cabin',
        type: 'cabin',
        areaSqM: cabinArea,
        dimensions: '3.8m × 3.4m',
        bounds: { x: 1.8, z: -1.8, width: 3.2, depth: 3.2 },
        colorHex: 0x34d399
      },
      {
        id: 'room-reception',
        name: 'Reception & Client Lounge',
        type: 'hall',
        areaSqM: recepArea,
        dimensions: '3.6m × 3.0m',
        bounds: { x: -1.4, z: -1.8, width: 3.8, depth: 3.2 },
        colorHex: 0xf59e0b
      }
    ];

    return {
      propertyType: 'Commercial Corporate Office',
      totalCarpetArea: areaSqM,
      rooms
    };
  } else {
    const displayArea = Math.round(areaSqM * 0.65);
    const billingArea = Math.round(areaSqM * 0.20);
    const storageArea = Math.max(areaSqM - (displayArea + billingArea), 6);

    const rooms: RoomInfo[] = [
      {
        id: 'room-display',
        name: 'Retail Display Showroom',
        type: 'retail',
        areaSqM: displayArea,
        dimensions: '7.2m × 5.4m',
        bounds: { x: 0, z: 1.2, width: 6.8, depth: 4.2 },
        colorHex: 0xf59e0b
      },
      {
        id: 'room-pos',
        name: 'POS Billing Counter',
        type: 'hall',
        areaSqM: billingArea,
        dimensions: '3.8m × 2.6m',
        bounds: { x: -1.8, z: -2.0, width: 3.4, depth: 2.4 },
        colorHex: 0x06b6d4
      },
      {
        id: 'room-storage',
        name: 'Storage & Utilities',
        type: 'kitchen',
        areaSqM: storageArea,
        dimensions: '3.2m × 2.4m',
        bounds: { x: 1.8, z: -2.0, width: 3.4, depth: 2.4 },
        colorHex: 0x94a3b8
      }
    ];

    return {
      propertyType: 'Commercial Retail Shop',
      totalCarpetArea: areaSqM,
      rooms
    };
  }
}

/**
 * Creates high-detail 3D Three.js floor model with Living Hall, Bedrooms, Kitchen, Balcony, cutaway walls and 3D furniture.
 */
export function build3DInteriorGroup(layout: UnitInteriorLayout): THREE.Group {
  const interiorGroup = new THREE.Group();
  const wallHeight = 1.25;
  const wallThickness = 0.14;

  // Base Slab
  const floorGeo = new THREE.BoxGeometry(8.2, 0.12, 8.2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.3,
    metalness: 0.1
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.y = -0.06;
  floorMesh.receiveShadow = true;
  interiorGroup.add(floorMesh);

  // Outer Edge Trim
  const edgeGeo = new THREE.EdgesGeometry(floorGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
  const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
  edgeLines.position.y = -0.06;
  interiorGroup.add(edgeLines);

  // Outer Perimeter Walls (Cutaway at 1.25m height)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.4,
    metalness: 0.1
  });

  const perimeterWalls = [
    { pos: [0, wallHeight / 2, -4.05], size: [8.2, wallHeight, wallThickness] },
    { pos: [0, wallHeight / 2, 4.05], size: [8.2, wallHeight, wallThickness] },
    { pos: [-4.05, wallHeight / 2, 0], size: [wallThickness, wallHeight, 8.2] },
    { pos: [4.05, wallHeight / 2, 0], size: [wallThickness, wallHeight, 8.2] },
  ];

  perimeterWalls.forEach(w => {
    const wallGeo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]);
    const mesh = new THREE.Mesh(wallGeo, wallMat);
    mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    interiorGroup.add(mesh);
  });

  // Balcony Glass Railing
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5
  });
  const railingGeo = new THREE.BoxGeometry(0.06, 0.75, 3.4);
  const railing = new THREE.Mesh(railingGeo, glassMat);
  railing.position.set(-4.08, 0.4, -1.8);
  interiorGroup.add(railing);

  // Rooms Tiles & 3D Furniture
  layout.rooms.forEach(room => {
    const { bounds } = room;

    // Room Floor Tile
    const tileGeo = new THREE.BoxGeometry(bounds.width - 0.1, 0.05, bounds.depth - 0.1);
    const tileMat = new THREE.MeshStandardMaterial({
      color: room.colorHex,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.35
    });
    const tileMesh = new THREE.Mesh(tileGeo, tileMat);
    tileMesh.position.set(bounds.x, 0.025, bounds.z);
    tileMesh.receiveShadow = true;
    tileMesh.userData = { room };
    interiorGroup.add(tileMesh);

    // Tile border
    const tileEdges = new THREE.EdgesGeometry(tileGeo);
    const tileEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const tileWire = new THREE.LineSegments(tileEdges, tileEdgeMat);
    tileMesh.add(tileWire);

    // Furniture models
    if (room.type === 'hall') {
      // 1. LIVING HALL: L-Shaped Sectional Sofa + Designer Coffee Table + TV Entertainment Unit
      const sofaGroup = new THREE.Group();
      const sofaMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // Blue fabric
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 }); // Dark walnut wood

      // Main 3-Seater Sofa
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.65), sofaMat);
      seat.position.set(0, 0.14, 0);
      seat.castShadow = true;
      sofaGroup.add(seat);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.2), sofaMat);
      back.position.set(0, 0.4, -0.28);
      back.castShadow = true;
      sofaGroup.add(back);

      // Armrests
      const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.65), sofaMat);
      arm1.position.set(-0.85, 0.25, 0);
      sofaGroup.add(arm1);
      const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.65), sofaMat);
      arm2.position.set(0.85, 0.25, 0);
      sofaGroup.add(arm2);

      // Chaise Lounge extension
      const chaise = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.8), sofaMat);
      chaise.position.set(0.6, 0.14, 0.6);
      chaise.castShadow = true;
      sofaGroup.add(chaise);

      // Modern Coffee Table
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.55), woodMat);
      tableTop.position.set(-0.15, 0.2, 0.65);
      sofaGroup.add(tableTop);
      const tableLeg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.45), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      tableLeg.position.set(-0.15, 0.09, 0.65);
      sofaGroup.add(tableLeg);

      // TV Entertainment Console against wall
      const tvConsole = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.25), woodMat);
      tvConsole.position.set(-0.1, 0.15, 1.55);
      sofaGroup.add(tvConsole);

      const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.04), new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 }));
      tvScreen.position.set(-0.1, 0.65, 1.58);
      sofaGroup.add(tvScreen);

      sofaGroup.position.set(bounds.x, 0, bounds.z - 0.4);
      interiorGroup.add(sofaGroup);
    } else if (room.type === 'bedroom' && room.id === 'room-master-bed') {
      // 2. MASTER BEDROOM: King Bed + Mattress + Headboard + Dual Nightstands + Wardrobe
      const bedGroup = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const mattressMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.4 }); // Royal violet/indigo
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

      // Bed Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.8), frameMat);
      frame.position.set(0, 0.11, 0);
      frame.castShadow = true;
      bedGroup.add(frame);

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.24, 1.7), mattressMat);
      mattress.position.set(0, 0.24, 0);
      mattress.castShadow = true;
      bedGroup.add(mattress);

      // Pillows
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.32), pillowMat);
      p1.position.set(-0.35, 0.38, -0.65);
      bedGroup.add(p1);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.32), pillowMat);
      p2.position.set(0.35, 0.38, -0.65);
      bedGroup.add(p2);

      // Tall Headboard
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.14), frameMat);
      headboard.position.set(0, 0.45, -0.92);
      bedGroup.add(headboard);

      // Dual Nightstands
      const nStand1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), frameMat);
      nStand1.position.set(-1.0, 0.15, -0.75);
      bedGroup.add(nStand1);
      const nStand2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), frameMat);
      nStand2.position.set(1.0, 0.15, -0.75);
      bedGroup.add(nStand2);

      // Built-in Wardrobe Closet
      const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      wardrobe.position.set(1.4, 0.55, 0.4);
      bedGroup.add(wardrobe);

      bedGroup.position.set(bounds.x, 0, bounds.z);
      interiorGroup.add(bedGroup);
    } else if (room.type === 'bedroom') {
      // 3. BEDROOM 2 / GUEST / STUDY: Single/Twin Bed + Study Desk + Chair
      const bed2Group = new THREE.Group();
      const bedMat = new THREE.MeshStandardMaterial({ color: 0x059669 }); // Emerald bedding
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x475569 });

      // Bed
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 1.6), bedMat);
      bed.position.set(-0.6, 0.175, 0);
      bed.castShadow = true;
      bed2Group.add(bed);

      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      pillow.position.set(-0.6, 0.38, -0.6);
      bed2Group.add(pillow);

      // Study Desk
      const desk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.5), deskMat);
      desk.position.set(0.7, 0.225, -0.5);
      bed2Group.add(desk);

      // Chair
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      chair.position.set(0.7, 0.225, 0.1);
      bed2Group.add(chair);

      bed2Group.position.set(bounds.x, 0, bounds.z);
      interiorGroup.add(bed2Group);
    } else if (room.type === 'kitchen') {
      // 4. KITCHEN: L-Shaped Countertop + Hob/Stove + Upper Cabinets + Dining Table
      const kGroup = new THREE.Group();
      const counterBase = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
      const graniteTop = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });

      // Main Counter
      const counter1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.48, 0.55), counterBase);
      counter1.position.set(0, 0.24, -0.8);
      kGroup.add(counter1);
      const top1 = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.06, 0.58), graniteTop);
      top1.position.set(0, 0.5, -0.8);
      kGroup.add(top1);

      // L-extension
      const counter2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.9), counterBase);
      counter2.position.set(-0.52, 0.24, -0.15);
      kGroup.add(counter2);
      const top2 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.94), graniteTop);
      top2.position.set(-0.52, 0.5, -0.15);
      kGroup.add(top2);

      // Gas Burner Hob
      const hob = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.35), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
      hob.position.set(0.2, 0.54, -0.8);
      kGroup.add(hob);

      // Dining Table + Chairs
      const table = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.8), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
      table.position.set(0.3, 0.225, 0.6);
      kGroup.add(table);

      kGroup.position.set(bounds.x, 0, bounds.z);
      interiorGroup.add(kGroup);
    } else if (room.type === 'balcony') {
      // 5. BALCONY: Sitout chairs and small planter
      const bGroup = new THREE.Group();
      const chair1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0x059669 }));
      chair1.position.set(0, 0.175, -0.5);
      bGroup.add(chair1);

      const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
      planter.position.set(0, 0.175, 0.6);
      bGroup.add(planter);

      bGroup.position.set(bounds.x, 0, bounds.z);
      interiorGroup.add(bGroup);
    }
  });

  // Internal Dividing Walls with Doorways
  const divWallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });

  // Central Vertical Wall (X = 0) with door openings
  const wallV1 = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 3.2), divWallMat);
  wallV1.position.set(0, wallHeight / 2, 2.3);
  wallV1.castShadow = true;
  interiorGroup.add(wallV1);

  const wallV2 = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 3.2), divWallMat);
  wallV2.position.set(0, wallHeight / 2, -2.3);
  wallV2.castShadow = true;
  interiorGroup.add(wallV2);

  // Horizontal Dividing Walls (Z = 0)
  const wallH1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, wallHeight, wallThickness), divWallMat);
  wallH1.position.set(-2.3, wallHeight / 2, 0);
  wallH1.castShadow = true;
  interiorGroup.add(wallH1);

  const wallH2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, wallHeight, wallThickness), divWallMat);
  wallH2.position.set(2.3, wallHeight / 2, 0);
  wallH2.castShadow = true;
  interiorGroup.add(wallH2);

  return interiorGroup;
}
