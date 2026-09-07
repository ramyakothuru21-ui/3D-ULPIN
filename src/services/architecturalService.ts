import * as THREE from 'three';

/**
 * Creates procedural high-resolution architectural window facade texture
 * with realistic glass panels, mullions, and subtle interior light reflection.
 */
export function createFacadeTexture(type: 'residential' | 'commercial' | 'mixed'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base modern architectural wall color
  ctx.fillStyle = type === 'commercial' ? '#f1f5f9' : '#fafafa';
  ctx.fillRect(0, 0, 512, 512);

  // Modern horizontal reveal grooves
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Windows grid
  const cols = type === 'commercial' ? 6 : 4;
  const rows = 3;
  const padX = 24;
  const padY = 24;
  const winW = (512 - padX * (cols + 1)) / cols;
  const winH = (512 - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (winW + padX);
      const y = padY + r * (winH + padY);

      // Window outer frame
      ctx.fillStyle = '#1e293b'; // Charcoal aluminum frame
      ctx.fillRect(x - 3, y - 3, winW + 6, winH + 6);

      // Glass gradient (subtle sky reflection + warm interior glow)
      const grad = ctx.createLinearGradient(x, y, x + winW, y + winH);
      if (type === 'commercial') {
        grad.addColorStop(0, '#38bdf8'); // Sky cyan reflection
        grad.addColorStop(0.5, '#0284c7');
        grad.addColorStop(1, '#0f172a');
      } else {
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(0.4, '#e0f2fe');
        grad.addColorStop(0.8, '#fef08a'); // Warm indoor room light
        grad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, winW, winH);

      // Window mullions (cross frames)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // vertical mullion
      ctx.moveTo(x + winW / 2, y);
      ctx.lineTo(x + winW / 2, y + winH);
      // horizontal transom
      ctx.moveTo(x, y + winH * 0.35);
      ctx.lineTo(x + winW, y + winH * 0.35);
      ctx.stroke();

      // Specular highlight diagonal
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + winH - 4);
      ctx.lineTo(x + winW * 0.6, y + 4);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates 3D Cantilevered Balconies for a building floor
 */
export function createFloorBalconies(bldgWidth: number, bldgDepth: number, floorHeight: number): THREE.Group {
  const balconyGroup = new THREE.Group();
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    transmission: 0.8,
    thickness: 0.4
  });
  const handrailMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

  // Front and Back Balconies
  const balconyPositions = [
    { x: -1.8, z: bldgDepth / 2 + 0.5, w: 2.8, d: 1.0 },
    { x: 1.8, z: bldgDepth / 2 + 0.5, w: 2.8, d: 1.0 },
    { x: 0, z: -bldgDepth / 2 - 0.5, w: 3.4, d: 1.0 }
  ];

  balconyPositions.forEach(b => {
    // Balcony concrete slab extension
    const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.12, b.d), slabMat);
    slab.position.set(b.x, 0, b.z);
    slab.receiveShadow = true;
    balconyGroup.add(slab);

    // Glass balustrade panel
    const glass = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.08, 0.75, 0.04), glassMat);
    glass.position.set(b.x, 0.4, b.z + (b.z > 0 ? b.d / 2 - 0.03 : -b.d / 2 + 0.03));
    balconyGroup.add(glass);

    // Metal top handrail
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.06, 0.08), handrailMat);
    handrail.position.set(b.x, 0.78, b.z + (b.z > 0 ? b.d / 2 - 0.03 : -b.d / 2 + 0.03));
    balconyGroup.add(handrail);
  });

  return balconyGroup;
}

/**
 * Creates 3D Rooftop Architecture:
 * Lift/Staircase Machine Room, Overhead Water Tanks, Solar Panels, and Safety Parapet Wall
 */
export function createRooftopInfrastructure(bldgWidth: number, bldgDepth: number): THREE.Group {
  const roofGroup = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });

  // 1. Perimeter Parapet Wall (0.9m height)
  const parapetHeight = 0.9;
  const parapetThick = 0.16;

  const parapets = [
    { pos: [0, parapetHeight / 2, -bldgDepth / 2], size: [bldgWidth, parapetHeight, parapetThick] },
    { pos: [0, parapetHeight / 2, bldgDepth / 2], size: [bldgWidth, parapetHeight, parapetThick] },
    { pos: [-bldgWidth / 2, parapetHeight / 2, 0], size: [parapetThick, parapetHeight, bldgDepth] },
    { pos: [bldgWidth / 2, parapetHeight / 2, 0], size: [parapetThick, parapetHeight, bldgDepth] },
  ];

  parapets.forEach(p => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.size[0], p.size[1], p.size[2]), concreteMat);
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.castShadow = true;
    roofGroup.add(mesh);
  });

  // 2. Elevator/Lift & Staircase Machine Room Penthouse
  const liftTower = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 2.6), concreteMat);
  liftTower.position.set(-1.8, 0.9, -1.6);
  liftTower.castShadow = true;
  roofGroup.add(liftTower);

  // Lift room roof overhang
  const liftRoof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 2.8), darkMetalMat);
  liftRoof.position.set(-1.8, 1.85, -1.6);
  roofGroup.add(liftRoof);

  // 3. Overhead Cylindrical Water Storage Tank (Common in Indian cadastre)
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16), tankMat);
  tank.position.set(1.8, 1.0, -1.8);
  tank.castShadow = true;
  roofGroup.add(tank);

  // Tank Stand Stilt Legs
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.4, 16), darkMetalMat);
  stand.position.set(1.8, 0.2, -1.8);
  roofGroup.add(stand);

  // 4. Solar PV Panel Array
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x172554, metalness: 0.9, roughness: 0.1 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

  for (let i = 0; i < 3; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.8), solarMat);
    panel.position.set(0.5 + i * 1.3, 0.45, 1.2);
    panel.rotation.x = -0.35; // Solar tilt angle
    panel.castShadow = true;
    roofGroup.add(panel);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), frameMat);
    leg.position.set(0.5 + i * 1.3, 0.2, 0.6);
    roofGroup.add(leg);
  }

  return roofGroup;
}

/**
 * Creates Ground Floor Entrance Portico, Canopy, and Pillars
 */
export function createEntrancePortico(bldgWidth: number, bldgDepth: number): THREE.Group {
  const porticoGroup = new THREE.Group();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }); // Charcoal modern columns
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  // Canopy Overhang
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.8), canopyMat);
  canopy.position.set(0, 1.5, bldgDepth / 2 + 0.9);
  canopy.castShadow = true;
  porticoGroup.add(canopy);

  // 2 Entrance Pillars
  const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 12), pillarMat);
  pillar1.position.set(-1.6, 0.75, bldgDepth / 2 + 1.6);
  pillar1.castShadow = true;
  porticoGroup.add(pillar1);

  const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 12), pillarMat);
  pillar2.position.set(1.6, 0.75, bldgDepth / 2 + 1.6);
  pillar2.castShadow = true;
  porticoGroup.add(pillar2);

  // Glass Front Entrance Doors
  const glassDoorMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    transmission: 0.8
  });
  const doors = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.05), glassDoorMat);
  doors.position.set(0, 0.65, bldgDepth / 2 + 0.05);
  porticoGroup.add(doors);

  return porticoGroup;
}

/**
 * Creates Landscaping & Cadastral Plot Features:
 * Paved driveway, green lawn, trees/shrubs, and boundary compound wall with pillars
 */
export function createPlotLandscaping(plotWidth: number, plotDepth: number, bldgDepth: number): THREE.Group {
  const landscapeGroup = new THREE.Group();

  // Green Lawn Base
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(plotWidth - 0.2, 0.02, plotDepth - 0.2), lawnMat);
  lawn.position.y = 0.01;
  lawn.receiveShadow = true;
  landscapeGroup.add(lawn);

  // Paved Driveway leading to Entrance
  const driveMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const driveway = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.03, (plotDepth - bldgDepth) / 2 + 0.5), driveMat);
  driveway.position.set(0, 0.02, plotDepth / 4 + 1.5);
  driveway.receiveShadow = true;
  landscapeGroup.add(driveway);

  // Architectural Trees & Shrubs
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b });
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

  const treePositions = [
    [-plotWidth / 2 + 1.2, -plotDepth / 2 + 1.2],
    [plotWidth / 2 - 1.2, -plotDepth / 2 + 1.2],
    [-plotWidth / 2 + 1.2, plotDepth / 2 - 1.2],
    [plotWidth / 2 - 1.2, plotDepth / 2 - 1.2],
  ];

  treePositions.forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 8), trunkMat);
    trunk.position.set(x, 0.4, z);
    trunk.castShadow = true;
    landscapeGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 8), leavesMat);
    foliage.position.set(x, 1.2, z);
    foliage.castShadow = true;
    landscapeGroup.add(foliage);
  });

  // Perimeter Compound Wall with Corner Cadastral Marker Pillars
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
  const wallHeight = 0.6;
  const wallThick = 0.12;

  const walls = [
    { pos: [0, wallHeight / 2, -plotDepth / 2], size: [plotWidth, wallHeight, wallThick] },
    { pos: [-plotWidth / 2, wallHeight / 2, 0], size: [wallThick, wallHeight, plotDepth] },
    { pos: [plotWidth / 2, wallHeight / 2, 0], size: [wallThick, wallHeight, plotDepth] },
    // Front wall split with entrance gate opening (4m opening)
    { pos: [-(plotWidth / 4 + 1), wallHeight / 2, plotDepth / 2], size: [(plotWidth - 4) / 2, wallHeight, wallThick] },
    { pos: [(plotWidth / 4 + 1), wallHeight / 2, plotDepth / 2], size: [(plotWidth - 4) / 2, wallHeight, wallThick] },
  ];

  walls.forEach(w => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]), wallMat);
    mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
    mesh.castShadow = true;
    landscapeGroup.add(mesh);
  });

  // Corner Survey Cadastral Boundary Pillars (Red & White cadastre markers)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
  const cornerCoords = [
    [-plotWidth / 2, -plotDepth / 2],
    [plotWidth / 2, -plotDepth / 2],
    [-plotWidth / 2, plotDepth / 2],
    [plotWidth / 2, plotDepth / 2],
  ];
  cornerCoords.forEach(([cx, cz]) => {
    const cornerPeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), pillarMat);
    cornerPeg.position.set(cx, 0.425, cz);
    landscapeGroup.add(cornerPeg);
  });

  return landscapeGroup;
}
