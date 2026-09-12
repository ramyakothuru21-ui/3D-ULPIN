import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Building, LandParcel, VerticalProperty } from '../../types';
import { getOwnershipRecord } from '../../services/demoRegistryService';
import { getUnitInteriorLayout, build3DInteriorGroup, RoomInfo } from '../../services/interiorService';
import { 
  createFacadeTexture, 
  createFloorBalconies, 
  createRooftopInfrastructure, 
  createEntrancePortico, 
  createPlotLandscaping 
} from '../../services/architecturalService';
import { 
  Layers, 
  RotateCcw, 
  Eye, 
  Maximize2, 
  Building2, 
  Sparkles, 
  Home, 
  Box, 
  Compass, 
  CheckCircle2, 
  User, 
  FileText, 
  Info,
  SlidersHorizontal,
  Glasses,
  Sun,
  Trees,
  Orbit,
  Play,
  Pause,
  Navigation
} from 'lucide-react';

interface Building3DViewerProps {
  parcel: LandParcel;
  building: Building;
  properties: VerticalProperty[];
  selectedProperty: VerticalProperty | null;
  onSelectProperty: (property: VerticalProperty) => void;
  onClose?: () => void;
}

type ViewerMode = '3d-building' | '3d-interior' | '2d-blueprint';

export const Building3DViewer: React.FC<Building3DViewerProps> = ({
  parcel,
  building,
  properties,
  selectedProperty,
  onSelectProperty,
  onClose
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [viewerMode, setViewerMode] = useState<ViewerMode>('3d-building');
  const [explosionFactor, setExplosionFactor] = useState<number>(0.25);
  const [isExplodingAnimated, setIsExplodingAnimated] = useState<boolean>(false);
  const [isXrayGlassMode, setIsXrayGlassMode] = useState<boolean>(false);
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(1);
  const [hoveredUnit, setHoveredUnit] = useState<VerticalProperty | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<RoomInfo | null>(null);
  const [isAutoRotating360, setIsAutoRotating360] = useState<boolean>(false);
  const [currentBearingDeg, setCurrentBearingDeg] = useState<number>(49);
  const isAutoRotatingRef = useRef<boolean>(false);

  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating360;
  }, [isAutoRotating360]);

  const getCardinal = (deg: number) => {
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return cardinals[Math.round(deg / 45) % 8];
  };

  const setCameraPreset = (preset: 'front' | 'right' | 'back' | 'left' | 'isometric' | 'top' | 'street') => {
    const rad = viewerMode === '3d-interior' ? 17 : 26;
    let theta = 0;
    let phi = 1.15;
    switch (preset) {
      case 'front':
        theta = 0;
        phi = 1.15;
        break;
      case 'right':
        theta = Math.PI / 2;
        phi = 1.15;
        break;
      case 'back':
        theta = Math.PI;
        phi = 1.15;
        break;
      case 'left':
        theta = (3 * Math.PI) / 2;
        phi = 1.15;
        break;
      case 'isometric':
        theta = 0.85;
        phi = 0.82;
        break;
      case 'top':
        theta = 0;
        phi = 0.08;
        break;
      case 'street':
        theta = 0.85;
        phi = 1.95;
        break;
    }
    cameraAngleRef.current = { theta, phi, radius: rad };
    if (cameraRef.current) {
      const camera = cameraRef.current;
      camera.position.x = rad * Math.sin(phi) * Math.sin(theta);
      camera.position.y = rad * Math.cos(phi);
      camera.position.z = rad * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, viewerMode === '3d-interior' ? 0.6 : (building.Floors * 1.5) / 3, 0);
      const deg = Math.round((((theta * 180) / Math.PI) % 360 + 360) % 360);
      setCurrentBearingDeg(deg);
    }
  };

  // Inspected unit: either selectedProperty or the first unit on selectedFloorNum
  const inspectedUnit = React.useMemo(() => {
    if (selectedProperty && selectedProperty.Floor_No === selectedFloorNum) {
      return selectedProperty;
    }
    const onFloor = properties.filter(u => u.Floor_No === selectedFloorNum);
    return onFloor[0] || selectedProperty || properties[0] || {
      Property_ID: 'P0001',
      Building_ID: building.Building_ID,
      Parcel_ID: parcel.Parcel_ID,
      Floor_No: selectedFloorNum,
      Unit_No: selectedFloorNum * 100 + 1,
      Area_sq_m: 115,
      Property_Type: 'Residential',
      Prototype_3D_ULPIN: `IND-AP-VSP-DVD-${parcel.Parcel_ID}-${building.Building_ID}-F${String(selectedFloorNum).padStart(2, '0')}-101`
    };
  }, [selectedProperty, selectedFloorNum, properties, building, parcel]);

  // Group properties by floor
  const floorsMap = React.useMemo(() => {
    const map = new Map<number, VerticalProperty[]>();
    for (let f = 1; f <= building.Floors; f++) {
      map.set(f, []);
    }
    properties.forEach(p => {
      const list = map.get(p.Floor_No) || [];
      list.push(p);
      map.set(p.Floor_No, list);
    });
    return map;
  }, [building.Floors, properties]);

  // Architectural interior layout
  const interiorLayout = React.useMemo(() => {
    return getUnitInteriorLayout(inspectedUnit.Property_Type, inspectedUnit.Area_sq_m);
  }, [inspectedUnit]);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);
  const rooftopGroupRef = useRef<THREE.Group | null>(null);
  const unitMeshesRef = useRef<{ mesh: THREE.Mesh; property: VerticalProperty }[]>([]);
  const roomMeshesRef = useRef<{ mesh: THREE.Mesh; room: RoomInfo }[]>([]);
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0.85, phi: 0.82, radius: 25 });

  // Initialize Three.js scene
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || viewerMode === '2d-blueprint') return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Safely mount canvas without wiping React-managed DOM elements
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Architectural Daylight Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0xe2e8f0, 0.65);
    scene.add(hemiLight);

    // Primary Sun Light with realistic soft shadows
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(25, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0x38bdf8, 0.45);
    skyFill.position.set(-25, 25, -25);
    scene.add(skyFill);

    if (viewerMode === '3d-interior') {
      // 3D INTERIOR DOLLHOUSE
      cameraAngleRef.current = { theta: 0.65, phi: 0.72, radius: 17 };

      const gridHelper = new THREE.GridHelper(24, 24, 0x0284c7, 0xe2e8f0);
      gridHelper.position.y = -0.06;
      scene.add(gridHelper);

      const interiorGroup = build3DInteriorGroup(interiorLayout);
      scene.add(interiorGroup);

      const roomMeshes: { mesh: THREE.Mesh; room: RoomInfo }[] = [];
      interiorGroup.traverse(child => {
        if ((child as THREE.Mesh).isMesh && child.userData?.room) {
          roomMeshes.push({ mesh: child as THREE.Mesh, room: child.userData.room });
        }
      });
      roomMeshesRef.current = roomMeshes;
      unitMeshesRef.current = [];
      floorGroupsRef.current = [];
      rooftopGroupRef.current = null;
    } else {
      // 3D REALISTIC VOLUMETRIC ARCHITECTURAL BUILDING
      cameraAngleRef.current = { theta: 0.85, phi: 0.82, radius: 26 };

      const plotW = 16;
      const plotD = 16;
      const bldgW = 8.2;
      const bldgD = 8.2;
      const floorHeight = 1.5;

      // 1. Realistic Landscaping & Cadastral Plot Ground
      const landscape = createPlotLandscaping(plotW, plotD, bldgD);
      landscape.position.y = 0;
      scene.add(landscape);

      // 2. Procedural Facade Texture
      const isComm = building.Building_Type.toLowerCase().includes('commercial');
      const facadeTex = createFacadeTexture(isComm ? 'commercial' : 'residential');

      // 3. Ground Entrance Portico & Pillars
      const portico = createEntrancePortico(bldgW, bldgD);
      portico.position.y = 0;
      scene.add(portico);

      // 4. Floors Construction
      const floorGroups: THREE.Group[] = [];
      const unitMeshes: { mesh: THREE.Mesh; property: VerticalProperty }[] = [];

      for (let f = 1; f <= building.Floors; f++) {
        const floorGroup = new THREE.Group();
        floorGroup.userData = { floorNumber: f };

        // Floor slab with crisp white reveal
        const slabGeo = new THREE.BoxGeometry(bldgW + 0.4, 0.16, bldgD + 0.4);
        const slabMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.25,
          metalness: 0.05
        });
        const slabMesh = new THREE.Mesh(slabGeo, slabMat);
        slabMesh.position.y = 0;
        slabMesh.castShadow = true;
        slabMesh.receiveShadow = true;
        floorGroup.add(slabMesh);

        // Edge Lines
        const slabEdges = new THREE.EdgesGeometry(slabGeo);
        const slabWire = new THREE.LineSegments(slabEdges, new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 1.5 }));
        slabMesh.add(slabWire);

        // Add Realistic Cantilevered Balconies
        const balconies = createFloorBalconies(bldgW, bldgD, floorHeight);
        balconies.position.y = 0.08;
        floorGroup.add(balconies);

        // Floor Number Plate
        const plateGeo = new THREE.BoxGeometry(0.12, 0.5, 1.4);
        const plateMat = new THREE.MeshStandardMaterial({
          color: f === selectedFloorNum ? 0x0284c7 : 0x0f172a,
          roughness: 0.2
        });
        const plateMesh = new THREE.Mesh(plateGeo, plateMat);
        plateMesh.position.set(bldgW / 2 + 0.25, floorHeight / 2, 0);
        floorGroup.add(plateMesh);

        // Units on this floor
        const unitsOnFloor = floorsMap.get(f) || [];
        const numUnits = Math.max(unitsOnFloor.length, 1);

        unitsOnFloor.forEach((unit, idx) => {
          let unitW = (bldgW - 0.6);
          let unitD = (bldgD - 0.6);
          let posX = 0;
          let posZ = 0;

          if (numUnits === 2) {
            unitW = (bldgW - 0.8) / 2;
            posX = (idx === 0 ? -1 : 1) * (unitW / 2 + 0.2);
          } else if (numUnits === 3) {
            if (idx === 0) {
              unitW = (bldgW - 0.8) / 2;
              unitD = (bldgD - 0.8);
              posX = -unitW / 2 - 0.2;
            } else {
              unitW = (bldgW - 0.8) / 2;
              unitD = (bldgD - 0.8) / 2;
              posX = unitW / 2 + 0.2;
              posZ = (idx === 1 ? -1 : 1) * (unitD / 2 + 0.2);
            }
          } else if (numUnits >= 4) {
            unitW = (bldgW - 0.8) / 2;
            unitD = (bldgD - 0.8) / 2;
            posX = (idx % 2 === 0 ? -1 : 1) * (unitW / 2 + 0.2);
            posZ = (idx < 2 ? -1 : 1) * (unitD / 2 + 0.2);
          }

          const unitGeo = new THREE.BoxGeometry(unitW, floorHeight - 0.22, unitD);

          // Color by Property Type
          let colorHex = 0x10b981;
          if (unit.Property_Type.toLowerCase() === 'commercial' || unit.Property_Type.toLowerCase() === 'shop') {
            colorHex = 0xf59e0b;
          } else if (unit.Property_Type.toLowerCase() === 'office') {
            colorHex = 0x06b6d4;
          }

          // X-ray glass vs Realistic Textured Architectural Facade
          const unitMat = isXrayGlassMode
            ? new THREE.MeshPhysicalMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.35,
                roughness: 0.1,
                transmission: 0.75,
                thickness: 0.8
              })
            : new THREE.MeshStandardMaterial({
                map: facadeTex,
                roughness: 0.3,
                metalness: 0.15
              });

          const unitMesh = new THREE.Mesh(unitGeo, unitMat);
          unitMesh.position.set(posX, (floorHeight - 0.22) / 2 + 0.08, posZ);
          unitMesh.castShadow = true;
          unitMesh.receiveShadow = true;
          unitMesh.userData = { property: unit };

          const unitEdges = new THREE.EdgesGeometry(unitGeo);
          const unitWireframe = new THREE.LineSegments(
            unitEdges,
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
          );
          unitMesh.add(unitWireframe);

          floorGroup.add(unitMesh);
          unitMeshes.push({ mesh: unitMesh, property: unit });
        });

        scene.add(floorGroup);
        floorGroups.push(floorGroup);
      }

      // 5. Crown Top with Realistic Rooftop Infrastructure
      const rooftop = createRooftopInfrastructure(bldgW, bldgD);
      scene.add(rooftop);
      rooftopGroupRef.current = rooftop;

      floorGroupsRef.current = floorGroups;
      unitMeshesRef.current = unitMeshes;
      roomMeshesRef.current = [];
    }

    const updateCamera = () => {
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, viewerMode === '3d-interior' ? 0.6 : (building.Floors * 1.5) / 3, 0);

      const deg = Math.round((((theta * 180) / Math.PI) % 360 + 360) % 360);
      setCurrentBearingDeg(deg);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current) {
        const dx = e.clientX - mousePosRef.current.x;
        const dy = e.clientY - mousePosRef.current.y;
        mousePosRef.current = { x: e.clientX, y: e.clientY };

        cameraAngleRef.current.theta -= dx * 0.008;
        cameraAngleRef.current.phi = Math.max(0.05, Math.min(Math.PI * 0.95, cameraAngleRef.current.phi - dy * 0.008));
        updateCamera();
      }

      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      if (viewerMode === '3d-interior') {
        const intersects = raycaster.intersectObjects(roomMeshesRef.current.map(r => r.mesh));
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const found = roomMeshesRef.current.find(r => r.mesh === hit);
          if (found) {
            setHoveredRoom(found.room);
            if (canvasContainerRef.current) canvasContainerRef.current.style.cursor = 'pointer';
          }
        } else {
          setHoveredRoom(null);
          if (canvasContainerRef.current) {
            canvasContainerRef.current.style.cursor = isMouseDownRef.current ? 'grabbing' : 'grab';
          }
        }
      } else {
        const intersects = raycaster.intersectObjects(unitMeshesRef.current.map(u => u.mesh));
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const found = unitMeshesRef.current.find(u => u.mesh === hit);
          if (found) {
            setHoveredUnit(found.property);
            if (canvasContainerRef.current) canvasContainerRef.current.style.cursor = 'pointer';
          }
        } else {
          setHoveredUnit(null);
          if (canvasContainerRef.current) {
            canvasContainerRef.current.style.cursor = isMouseDownRef.current ? 'grabbing' : 'grab';
          }
        }
      }
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(6, Math.min(70, cameraAngleRef.current.radius + e.deltaY * 0.03));
      updateCamera();
    };

    let initialPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isMouseDownRef.current = true;
        mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isMouseDownRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isMouseDownRef.current) {
        const dx = e.touches[0].clientX - mousePosRef.current.x;
        const dy = e.touches[0].clientY - mousePosRef.current.y;
        mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        cameraAngleRef.current.theta -= dx * 0.008;
        cameraAngleRef.current.phi = Math.max(0.05, Math.min(Math.PI * 0.95, cameraAngleRef.current.phi - dy * 0.008));
        updateCamera();
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = initialPinchDist - dist;
        cameraAngleRef.current.radius = Math.max(6, Math.min(70, cameraAngleRef.current.radius + diff * 0.05));
        initialPinchDist = dist;
        updateCamera();
      }
    };

    const onTouchEnd = () => {
      isMouseDownRef.current = false;
      initialPinchDist = 0;
    };

    const onClick = (e: MouseEvent) => {
      if (viewerMode === '3d-interior') return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const intersects = raycaster.intersectObjects(unitMeshesRef.current.map(u => u.mesh));
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const found = unitMeshesRef.current.find(u => u.mesh === hit);
        if (found) {
          setSelectedFloorNum(found.property.Floor_No);
          onSelectProperty(found.property);
        }
      }
    };

    const el = renderer.domElement;
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('click', onClick);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isAutoRotatingRef.current) {
        cameraAngleRef.current.theta += 0.006;
        updateCamera();
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!canvasContainerRef.current) return;
      const nw = canvasContainerRef.current.clientWidth;
      const nh = canvasContainerRef.current.clientHeight;
      if (nw === 0 || nh === 0) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('click', onClick);
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(el)) {
        container.removeChild(el);
      }
    };
  }, [building, properties, parcel, viewerMode, interiorLayout, isXrayGlassMode, selectedFloorNum]);

  // Update floor explosion vertical heights
  useEffect(() => {
    if (viewerMode !== '3d-building') return;
    const floorHeight = 1.5;
    const baseGap = 0.05;
    const extraSeparation = explosionFactor * 3.4;

    floorGroupsRef.current.forEach((group, idx) => {
      group.position.y = (idx * (floorHeight + baseGap)) + (idx * extraSeparation);
    });

    if (rooftopGroupRef.current) {
      const topIdx = building.Floors;
      rooftopGroupRef.current.position.y = (topIdx * (floorHeight + baseGap)) + (topIdx * extraSeparation);
    }
  }, [explosionFactor, viewerMode, building.Floors]);

  // Highlight selected property
  useEffect(() => {
    if (viewerMode !== '3d-building') return;
    unitMeshesRef.current.forEach(({ mesh, property }) => {
      const isSelected = selectedProperty?.Property_ID === property.Property_ID;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (isSelected) {
        mat.emissive?.setHex(0x0284c7);
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.7;
        mesh.scale.set(1.05, 1.05, 1.05);
      } else {
        mat.emissive?.setHex(0x000000);
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0;
        mesh.scale.set(1, 1, 1);
      }
    });
  }, [selectedProperty, viewerMode]);

  // Auto explosion animation
  const toggleAnimateExplosion = () => {
    setIsExplodingAnimated(prev => !prev);
  };

  useEffect(() => {
    if (!isExplodingAnimated || viewerMode !== '3d-building') return;
    let direction = 1;
    const interval = setInterval(() => {
      setExplosionFactor(prev => {
        if (prev >= 0.95) direction = -1;
        if (prev <= 0.05) direction = 1;
        return parseFloat((prev + direction * 0.02).toFixed(3));
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isExplodingAnimated, viewerMode]);

  const inspectedOwner = getOwnershipRecord(
    inspectedUnit.Property_ID,
    inspectedUnit.Prototype_3D_ULPIN,
    true
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50 select-none overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      {/* Top Banner with 2D / 3D Conversion & Mode Switchers */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 z-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-cyan-500 text-white rounded-xl shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                {building.name || 'Realistic 3D Architectural Digital Twin'}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                {building.Building_ID}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Duvvada, Visakhapatnam
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {building.Building_Type} • {building.hasRealLevels ? `${building.realFloors} Floors (OSM Tag)` : `${building.Floors} Floors (Illustrative Height: ${building.Height_m}m)`} • {building.area_sq_m ? `${building.area_sq_m} m² Footprint` : ''} • Title: <strong className="text-slate-800">{inspectedOwner.currentOwner}</strong> <span className="text-[9px] px-1 bg-amber-100 text-amber-800 font-bold rounded font-mono">DEMO OWNER</span>
            </p>
          </div>
        </div>

        {/* 2D & 3D Conversion Mode Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs text-xs">
          <button
            onClick={() => setViewerMode('3d-building')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewerMode === '3d-building'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Architecture ({building.Floors} Floors)</span>
          </button>

          <button
            onClick={() => setViewerMode('3d-interior')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewerMode === '3d-interior'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="View 3D interior dollhouse with Living Hall, Bedrooms, Kitchen, Balcony"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Floor {selectedFloorNum} Interior (Hall & Beds)</span>
          </button>

          <button
            onClick={() => setViewerMode('2d-blueprint')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewerMode === '2d-blueprint'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="View 2D CAD Floor Plan Blueprint"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2D CAD Blueprint</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition ml-1"
              title="Close 3D View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas / View Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* 2D CAD Blueprint Layout Mode */}
        {viewerMode === '2d-blueprint' ? (
          <div className="w-full h-full bg-[#0a192f] p-6 text-white flex flex-col items-center justify-center overflow-auto select-none">
            <div className="max-w-3xl w-full bg-[#071322] border-2 border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    Cadastral Architectural 2D Blueprint Plan
                  </span>
                  <h4 className="text-lg font-bold font-mono text-cyan-100">
                    Floor {selectedFloorNum} • Unit #{inspectedUnit.Unit_No} ({inspectedUnit.Property_Type})
                  </h4>
                </div>
                <div className="text-right font-mono text-xs text-cyan-400">
                  <div>ULPIN: {inspectedUnit.Prototype_3D_ULPIN}</div>
                  <div>Carpet Area: {inspectedUnit.Area_sq_m} m²</div>
                </div>
              </div>

              {/* 2D Floor Plan Blueprint Canvas */}
              <div className="grid grid-cols-3 gap-3 h-80 border-2 border-cyan-400/60 p-4 rounded-xl bg-[#0e2439] relative">
                <div className="col-span-2 row-span-2 border-2 border-dashed border-cyan-400/70 p-3 rounded-lg flex flex-col justify-between bg-cyan-950/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-200 text-xs uppercase font-mono">Living Hall & Dining</span>
                    <span className="text-[10px] text-cyan-400 font-mono">5.6m × 4.2m</span>
                  </div>
                  <div className="text-center font-mono text-xs text-cyan-300">
                    [ Main Sofa Lounge & Entertainment ]
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Area: ~42 m²</span>
                </div>

                <div className="border-2 border-dashed border-cyan-400/70 p-3 rounded-lg flex flex-col justify-between bg-cyan-950/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-200 text-xs uppercase font-mono">Master Bedroom</span>
                    <span className="text-[10px] text-cyan-400 font-mono">4.5m × 3.8m</span>
                  </div>
                  <div className="text-center font-mono text-xs text-cyan-300">
                    [ King Bed & Attached Bath ]
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Area: ~28 m²</span>
                </div>

                <div className="border-2 border-dashed border-cyan-400/70 p-3 rounded-lg flex flex-col justify-between bg-cyan-950/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-200 text-xs uppercase font-mono">Bedroom 2 / Study</span>
                    <span className="text-[10px] text-cyan-400 font-mono">3.8m × 3.2m</span>
                  </div>
                  <div className="text-center font-mono text-xs text-cyan-300">
                    [ Twin Bed & Study Nook ]
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Area: ~20 m²</span>
                </div>

                <div className="col-span-2 border-2 border-dashed border-cyan-400/70 p-3 rounded-lg flex flex-col justify-between bg-cyan-950/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-200 text-xs uppercase font-mono">Modular Kitchen & Balcony</span>
                    <span className="text-[10px] text-cyan-400 font-mono">3.4m × 2.6m</span>
                  </div>
                  <div className="text-center font-mono text-xs text-cyan-300">
                    [ Granite Hob & Utility Sitout ]
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Area: ~16 m²</span>
                </div>

                <div className="border-2 border-dashed border-cyan-400/70 p-3 rounded-lg flex flex-col justify-between bg-cyan-950/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-200 text-xs uppercase font-mono">Entry Foyer & Bath</span>
                    <span className="text-[10px] text-cyan-400 font-mono">2.8m × 1.8m</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Area: ~14 m²</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-cyan-500/30 text-[11px] font-mono text-cyan-400">
                <span>Cadastral Survey Plot: {parcel.Parcel_ID} ({parcel.Area_sq_m} m²)</span>
                <span>Coordinates: {parcel.Latitude.toFixed(6)}°N, {parcel.Longitude.toFixed(6)}°E</span>
                <span className="text-emerald-400 font-bold">Owner: {inspectedOwner.currentOwner}</span>
              </div>
            </div>
          </div>
        ) : (
          /* WebGL 3D Container & Overlays Wrapper */
          <div className="relative w-full h-full overflow-hidden select-none">
            {/* Dedicated Three.js WebGL Canvas Mount (Only Three.js manages children here) */}
            <div
              ref={canvasContainerRef}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            />

            {/* Hover Tooltip HUD: Room or Unit */}
            {hoveredRoom && (
              <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-cyan-200 pointer-events-none transition-all max-w-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{hoveredRoom.name}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    {hoveredRoom.dimensions}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>Carpet Area: <strong className="text-slate-800">{hoveredRoom.areaSqM} m²</strong></span>
                  <span className="text-brand-600 font-semibold font-mono">Unit #{inspectedUnit.Unit_No}</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1 pt-1 border-t border-slate-100">
                  Registered Owner: {inspectedOwner.currentOwner}
                </div>
              </div>
            )}

            {hoveredUnit && !hoveredRoom && (
              <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-cyan-200 pointer-events-none transition-all max-w-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="font-bold text-xs text-slate-900">
                      Floor {hoveredUnit.Floor_No} • Unit #{hoveredUnit.Unit_No}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {hoveredUnit.Property_Type}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-cyan-700 font-semibold mt-1">
                  {hoveredUnit.Prototype_3D_ULPIN}
                </div>

                {(() => {
                  const owner = getOwnershipRecord(hoveredUnit.Property_ID, hoveredUnit.Prototype_3D_ULPIN, true);
                  return (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Owner:</span>
                        <strong className="text-slate-900">{owner.currentOwner}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Survey #: {owner.surveyNumber}</span>
                        <span className="text-emerald-600 font-bold">{owner.ownershipStatus}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Room Tags overlay when in 3D Interior mode */}
            {viewerMode === '3d-interior' && (
              <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md text-xs flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-800 text-xs">Floor {selectedFloorNum} Rooms:</span>
                {interiorLayout.rooms.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `#${r.colorHex.toString(16)}` }} />
                    <span className="text-slate-700 font-semibold">{r.name} ({r.areaSqM} m²)</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Camera & 360° View Controls (Top Right) */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
              {/* Compass Bearing Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-cyan-200 shadow-md text-xs">
                <Compass className="w-3.5 h-3.5 text-cyan-600" />
                <span className="font-mono font-bold text-slate-800">
                  {currentBearingDeg}°
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-cyan-100 text-cyan-800 uppercase">
                  {getCardinal(currentBearingDeg)}
                </span>
              </div>

              {/* 360° Action Buttons Cluster */}
              <div className="flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-md">
                {/* 360° Continuous Auto Spin */}
                <button
                  onClick={() => setIsAutoRotating360(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                    isAutoRotating360
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm ring-2 ring-orange-400/40'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Toggle Continuous 360° Auto Turntable Rotation"
                >
                  <div className="flex items-center gap-1.5">
                    <Orbit className={`w-3.5 h-3.5 ${isAutoRotating360 ? 'animate-spin' : ''}`} />
                    <span>360° Auto Spin</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">
                    {isAutoRotating360 ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Cardinal Snap Presets */}
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block px-1 mb-1">
                    360° View Angles:
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-semibold">
                    <button
                      onClick={() => setCameraPreset('front')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="North / Front (0°)"
                    >
                      0° N
                    </button>
                    <button
                      onClick={() => setCameraPreset('right')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="East / Right (90°)"
                    >
                      90° E
                    </button>
                    <button
                      onClick={() => setCameraPreset('back')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="South / Back (180°)"
                    >
                      180° S
                    </button>
                    <button
                      onClick={() => setCameraPreset('left')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="West / Left (270°)"
                    >
                      270° W
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] font-medium">
                    <button
                      onClick={() => setCameraPreset('isometric')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="Isometric 3D Perspective"
                    >
                      Iso 45°
                    </button>
                    <button
                      onClick={() => setCameraPreset('top')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="Top Bird's Eye Plan"
                    >
                      Top
                    </button>
                    <button
                      onClick={() => setCameraPreset('street')}
                      className="py-1 px-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg border border-slate-200 transition text-center"
                      title="Street View (Low Angle Look Up)"
                    >
                      Street
                    </button>
                  </div>
                </div>

                {/* Additional Quick Toggles */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  {viewerMode === '3d-building' && (
                    <button
                      onClick={() => setIsXrayGlassMode(prev => !prev)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 ${
                        isXrayGlassMode
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                      title="Toggle X-Ray Glass Facade to see inside every floor"
                    >
                      <Glasses className="w-3.5 h-3.5" />
                      <span>X-Ray</span>
                    </button>
                  )}

                  <button
                    onClick={() => setCameraPreset('isometric')}
                    className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                    title="Reset Camera Angle"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Floor-by-Floor Selector Bar (Visible in all modes) */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 overflow-x-auto z-10 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-slate-700">Select Floor:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {Array.from({ length: building.Floors }).map((_, idx) => {
            const f = idx + 1;
            const count = (floorsMap.get(f) || []).length;
            const isSelected = selectedFloorNum === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setSelectedFloorNum(f);
                  const firstUnit = (floorsMap.get(f) || [])[0];
                  if (firstUnit) onSelectProperty(firstUnit);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>Floor {f}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {count} Units
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setViewerMode(viewerMode === '3d-interior' ? '3d-building' : '3d-interior')}
          className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{viewerMode === '3d-interior' ? 'View Full Building 3D' : `View Floor ${selectedFloorNum} Rooms 3D`}</span>
        </button>
      </div>

      {/* Bottom Exploder Controls Bar (Only in 3D Building Mode) */}
      {viewerMode === '3d-building' && (
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Explode All Floors:</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explosionFactor}
              onChange={e => setExplosionFactor(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <span className="text-xs font-mono font-bold text-brand-700 w-10 text-right">
              {Math.round(explosionFactor * 100)}%
            </span>
            <button
              onClick={toggleAnimateExplosion}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                isExplodingAnimated
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isExplodingAnimated ? 'Pause' : 'Auto'}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Realistic Architecture • Cantilevered Balconies • Rooftop Infrastructure</span>
          </div>
        </div>
      )}
    </div>
  );
};
