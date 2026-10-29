import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Camera,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  Grid,
  Sun,
  Sunset,
  Moon,
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  Layers,
  Bot,
  Lock,
  PencilOff,
} from 'lucide-react';
import {
  FurnitureItem,
  FurnitureType,
  LightingPreset,
  OfficeAgent,
  OfficeSpace,
  WallDisplayMode,
  computePolygonCentroid,
  isPointInPolygon,
} from '../types';
import { FURNITURE_CATALOG } from '../presets';
import {
  WallSegmentRecord,
  buildAgent3DFigure,
  buildFurniture3DModel,
  buildRoomArchitecture,
} from '../utils/threeBuilders';

interface Office3DCanvasProps {
  office: OfficeSpace;
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
  onOpenAgentChat?: (agent: OfficeAgent) => void;
  onUpdateFurniture: (id: string, patch: Partial<FurnitureItem>) => void;
  onAddFurnitureAt: (type: FurnitureType, x: number, z: number) => void;
  onDeleteFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
  onUpdateOfficeMeta: (patch: Partial<OfficeSpace>) => void;
  draggingCatalogType: FurnitureType | null;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  compactMode?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

type CameraViewPreset = 'isometric' | 'top_down' | 'walkthrough' | 'corner';

export const Office3DCanvas: React.FC<Office3DCanvasProps> = ({
  office,
  selectedFurnitureId,
  onSelectFurniture,
  selectedAgentId,
  onSelectAgent,
  onOpenAgentChat,
  onUpdateFurniture,
  onAddFurnitureAt,
  onDeleteFurniture,
  onDuplicateFurniture,
  onUpdateOfficeMeta,
  draggingCatalogType,
  snapToGrid,
  onToggleSnapToGrid,
  compactMode = false,
  isFullscreen = false,
  onToggleFullscreen,
  isEditMode: propIsEditMode,
  onToggleEditMode: propOnToggleEditMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglLost, setWebglLost] = useState(false);
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);
  const [isDragging3D, setIsDragging3D] = useState(false);
  const [liveDragCoords, setLiveDragCoords] = useState<{ x: number; z: number } | null>(null);
  const [activeCamPreset, setActiveCamPreset] = useState<CameraViewPreset>('isometric');

  // Edit Mode state: if disabled (default), furniture cannot be dragged, moved, or deleted
  const [internalEditMode, setInternalEditMode] = useState(false);
  const isEditMode = propIsEditMode !== undefined ? propIsEditMode : internalEditMode;
  const isEditModeRef = useRef(isEditMode);
  isEditModeRef.current = isEditMode;

  const toggleEditMode = useCallback(() => {
    if (propOnToggleEditMode) {
      propOnToggleEditMode();
    } else {
      setInternalEditMode((prev) => !prev);
    }
    if (isEditMode) {
      onSelectFurniture(null);
    }
  }, [propOnToggleEditMode, isEditMode, onSelectFurniture]);

  // Mutable refs for Three.js objects & interaction state inside event listeners
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roomGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const agentsGroupRef = useRef<THREE.Group | null>(null);
  const wallSegmentsRef = useRef<WallSegmentRecord[]>([]);
  const ghostMeshRef = useRef<THREE.Mesh | null>(null);

  // Camera spherical orbit state
  const sphericalRef = useRef({
    radius: 17.5,
    phi: Math.PI / 3.1,   // Polar angle from Y-up
    theta: Math.PI / 4,   // Azimuth angle in XZ
    targetX: 0,
    targetY: 0.6,
    targetZ: 0,
    desiredRadius: 17.5,
    desiredPhi: Math.PI / 3.1,
    desiredTheta: Math.PI / 4,
    desiredTargetX: 0,
    desiredTargetY: 0.6,
    desiredTargetZ: 0,
  });

  // Pointer interaction state
  const pointerStateRef = useRef<{
    mode: 'idle' | 'orbit' | 'pan' | 'drag_furniture';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    draggedId: string | null;
    dragOffsetX: number;
    dragOffsetZ: number;
    pointerMoved: boolean;
  }>({
    mode: 'idle',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    draggedId: null,
    dragOffsetX: 0,
    dragOffsetZ: 0,
    pointerMoved: false,
  });

  // Latest props refs for event listeners
  const officeRef = useRef(office);
  officeRef.current = office;
  const snapRef = useRef(snapToGrid);
  snapRef.current = snapToGrid;
  const selectedIdRef = useRef(selectedFurnitureId);
  selectedIdRef.current = selectedFurnitureId;
  const onUpdateFurnitureRef = useRef(onUpdateFurniture);
  onUpdateFurnitureRef.current = onUpdateFurniture;
  const onSelectFurnitureRef = useRef(onSelectFurniture);
  onSelectFurnitureRef.current = onSelectFurniture;

  const snapValue = useCallback((val: number, enabled: boolean) => {
    if (!enabled) return Number(val.toFixed(2));
    const step = 0.25;
    return Number((Math.round(val / step) * step).toFixed(2));
  }, []);

  // Apply camera preset
  const applyCameraPreset = useCallback((preset: CameraViewPreset) => {
    const centroid = computePolygonCentroid(officeRef.current.vertices);
    const sph = sphericalRef.current;
    sph.desiredTargetX = centroid.x;
    sph.desiredTargetZ = centroid.z;

    if (preset === 'isometric') {
      sph.desiredRadius = 17.5;
      sph.desiredPhi = Math.PI / 3.1;
      sph.desiredTheta = Math.PI / 4;
      sph.desiredTargetY = 0.6;
    } else if (preset === 'top_down') {
      sph.desiredRadius = 19.5;
      sph.desiredPhi = 0.08; // Nearly straight down
      sph.desiredTheta = 0;
      sph.desiredTargetY = 0;
    } else if (preset === 'walkthrough') {
      sph.desiredRadius = 6.5;
      sph.desiredPhi = Math.PI / 2.25;
      sph.desiredTheta = Math.PI / 6;
      sph.desiredTargetY = 1.35;
    } else if (preset === 'corner') {
      sph.desiredRadius = 16.0;
      sph.desiredPhi = Math.PI / 2.8;
      sph.desiredTheta = -Math.PI / 3;
      sph.desiredTargetY = 0.7;
    }
    setActiveCamPreset(preset);
  }, []);

  // Initialize Three.js WebGL scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#faf9f6');
    scene.fog = new THREE.FogExp2('#faf9f6', 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglLost(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const canvasEl = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const handleContextRestored = () => {
      setWebglLost(false);
    };
    canvasEl.addEventListener('webglcontextlost', handleContextLost);
    canvasEl.addEventListener('webglcontextrestored', handleContextRestored);

    // Exterior architectural ground grid with light neon orange lines
    const gridHelper = new THREE.GridHelper(44, 44, '#fb923c', '#ffedd5');
    gridHelper.position.y = -0.17;
    scene.add(gridHelper);

    // Subtle ground shadow catcher plane outside room
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.95,
        metalness: 0.05,
      })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.185;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // Three-point studio + architectural lighting rig with warm key & neon orange rim
    const ambientLight = new THREE.AmbientLight('#fffbeb', 0.85);
    ambientLight.name = 'studio-ambient';
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#ffedd5', 0.65);
    hemiLight.position.set(0, 20, 0);
    hemiLight.name = 'studio-hemi';
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fff7ed', 1.55);
    keyLight.position.set(14, 22, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    const d = 16;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.name = 'studio-key';
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#f97316', 0.55);
    rimLight.position.set(-14, 12, -14);
    rimLight.name = 'studio-rim';
    scene.add(rimLight);

    // Groups for room architecture and furniture
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);
    roomGroupRef.current = roomGroup;

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    const agentsGroup = new THREE.Group();
    scene.add(agentsGroup);
    agentsGroupRef.current = agentsGroup;

    // Translucent 3D placement ghost for catalog drag-and-drop
    const ghostGeo = new THREE.BoxGeometry(1.5, 0.8, 1.0);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      wireframe: false,
      transparent: true,
      opacity: 0.38,
    });
    const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    ghostMesh.visible = false;
    scene.add(ghostMesh);
    ghostMeshRef.current = ghostMesh;

    // Raycaster & floor plane (y = 0)
    const raycaster = new THREE.Raycaster();
    const floorMathPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pointerNDC = new THREE.Vector2();
    const intersectionPt = new THREE.Vector3();

    const getNormalizedPointer = (clientX: number, clientY: number) => {
      const rect = canvasEl.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const raycastAgent = (clientX: number, clientY: number): string | null => {
      if (!agentsGroupRef.current || !cameraRef.current) return null;
      getNormalizedPointer(clientX, clientY);
      raycaster.setFromCamera(pointerNDC, cameraRef.current);
      const intersects = raycaster.intersectObjects(agentsGroupRef.current.children, true);
      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && obj !== agentsGroupRef.current) {
          if (obj.userData && obj.userData.agentId) {
            return obj.userData.agentId as string;
          }
          obj = obj.parent;
        }
      }
      return null;
    };

    const raycastFurniture = (clientX: number, clientY: number): string | null => {
      if (!furnitureGroupRef.current || !cameraRef.current) return null;
      getNormalizedPointer(clientX, clientY);
      raycaster.setFromCamera(pointerNDC, cameraRef.current);
      const intersects = raycaster.intersectObjects(furnitureGroupRef.current.children, true);
      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && obj !== furnitureGroupRef.current) {
          if (obj.userData && obj.userData.furnitureId) {
            return obj.userData.furnitureId as string;
          }
          obj = obj.parent;
        }
      }
      return null;
    };

    const raycastFloorPlane = (clientX: number, clientY: number): THREE.Vector3 | null => {
      if (!cameraRef.current) return null;
      getNormalizedPointer(clientX, clientY);
      raycaster.setFromCamera(pointerNDC, cameraRef.current);
      const hit = raycaster.ray.intersectPlane(floorMathPlane, intersectionPt);
      return hit ? intersectionPt.clone() : null;
    };

    // Pointer Event Listeners for 3D Furniture Dragging + Camera Orbit/Pan
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2 || e.shiftKey) {
        // Right click or Shift+Left click -> Pan camera
        pointerStateRef.current = {
          mode: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          draggedId: null,
          dragOffsetX: 0,
          dragOffsetZ: 0,
          pointerMoved: false,
        };
        canvasEl.setPointerCapture(e.pointerId);
        return;
      }

      if (e.button !== 0) return;

      const hitAgentId = raycastAgent(e.clientX, e.clientY);
      if (hitAgentId) {
        if (onSelectAgent) onSelectAgent(hitAgentId);
        const ag = officeRef.current.agents?.find((a) => a.id === hitAgentId);
        if (ag && onOpenAgentChat) {
          onOpenAgentChat(ag);
        }
        return;
      }

      const hitFurnitureId = isEditModeRef.current ? raycastFurniture(e.clientX, e.clientY) : null;
      if (hitFurnitureId) {
        onSelectFurnitureRef.current(hitFurnitureId);
        const item = officeRef.current.furniture.find((f) => f.id === hitFurnitureId);
        const floorHit = raycastFloorPlane(e.clientX, e.clientY);
        const offsetX = item && floorHit ? item.x - floorHit.x : 0;
        const offsetZ = item && floorHit ? item.z - floorHit.z : 0;

        pointerStateRef.current = {
          mode: 'drag_furniture',
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          draggedId: hitFurnitureId,
          dragOffsetX: offsetX,
          dragOffsetZ: offsetZ,
          pointerMoved: false,
        };
        setIsDragging3D(true);
        if (item) {
          setLiveDragCoords({ x: item.x, z: item.z });
        }
        canvasEl.setPointerCapture(e.pointerId);
      } else {
        pointerStateRef.current = {
          mode: 'orbit',
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          draggedId: null,
          dragOffsetX: 0,
          dragOffsetZ: 0,
          pointerMoved: false,
        };
        canvasEl.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const st = pointerStateRef.current;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      if (Math.hypot(e.clientX - st.startX, e.clientY - st.startY) > 4) {
        st.pointerMoved = true;
      }
      st.lastX = e.clientX;
      st.lastY = e.clientY;

      if (st.mode === 'drag_furniture' && st.draggedId) {
        const floorPt = raycastFloorPlane(e.clientX, e.clientY);
        if (floorPt) {
          const rawX = floorPt.x + st.dragOffsetX;
          const rawZ = floorPt.z + st.dragOffsetZ;
          const clampedX = Math.max(-12, Math.min(12, snapValue(rawX, snapRef.current)));
          const clampedZ = Math.max(-12, Math.min(12, snapValue(rawZ, snapRef.current)));
          setLiveDragCoords({ x: clampedX, z: clampedZ });

          // Immediately move the 3D object for 60fps responsiveness
          if (furnitureGroupRef.current) {
            const targetGroup = furnitureGroupRef.current.getObjectByName(
              `furniture-${st.draggedId}`
            );
            if (targetGroup) {
              targetGroup.position.set(clampedX, 0, clampedZ);
            }
          }
          onUpdateFurnitureRef.current(st.draggedId, { x: clampedX, z: clampedZ });
        }
        return;
      }

      if (st.mode === 'orbit') {
        const sph = sphericalRef.current;
        sph.desiredTheta -= dx * 0.0075;
        sph.desiredPhi = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, sph.desiredPhi - dy * 0.0065));
        return;
      }

      if (st.mode === 'pan') {
        const sph = sphericalRef.current;
        const panScale = sph.radius * 0.0014;
        const forwardX = -Math.sin(sph.theta);
        const forwardZ = -Math.cos(sph.theta);
        const rightX = Math.cos(sph.theta);
        const rightZ = -Math.sin(sph.theta);

        sph.desiredTargetX -= (rightX * dx - forwardX * dy) * panScale;
        sph.desiredTargetZ -= (rightZ * dx - forwardZ * dy) * panScale;
        return;
      }

      // Hover detection when idle (only in edit mode)
      const hovered = isEditModeRef.current ? raycastFurniture(e.clientX, e.clientY) : null;
      setHoveredFurnitureId((prev) => (prev !== hovered ? hovered : prev));
    };

    const onPointerUp = (e: PointerEvent) => {
      const st = pointerStateRef.current;
      if (st.mode === 'orbit' && !st.pointerMoved) {
        // Clicked empty space -> deselect furniture
        onSelectFurnitureRef.current(null);
      }
      pointerStateRef.current.mode = 'idle';
      pointerStateRef.current.draggedId = null;
      setIsDragging3D(false);
      setLiveDragCoords(null);
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if not captured
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const sph = sphericalRef.current;
      sph.desiredRadius = Math.max(4.5, Math.min(36, sph.desiredRadius + e.deltaY * 0.012));
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    canvasEl.addEventListener('pointerdown', onPointerDown);
    canvasEl.addEventListener('pointermove', onPointerMove);
    canvasEl.addEventListener('pointerup', onPointerUp);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('contextmenu', onContextMenu);

    // ResizeObserver for responsive full-viewport resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation loop with smooth camera damping and smart wall cutaway
    let animFrameId = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const sph = sphericalRef.current;
      const damp = 0.14;

      sph.radius += (sph.desiredRadius - sph.radius) * damp;
      sph.phi += (sph.desiredPhi - sph.phi) * damp;
      sph.theta += (sph.desiredTheta - sph.theta) * damp;
      sph.targetX += (sph.desiredTargetX - sph.targetX) * damp;
      sph.targetY += (sph.desiredTargetY - sph.targetY) * damp;
      sph.targetZ += (sph.desiredTargetZ - sph.targetZ) * damp;

      if (cameraRef.current) {
        const camX =
          sph.targetX + sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta);
        const camY = sph.targetY + sph.radius * Math.cos(sph.phi);
        const camZ =
          sph.targetZ + sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta);

        cameraRef.current.position.set(camX, camY, camZ);
        cameraRef.current.lookAt(sph.targetX, sph.targetY, sph.targetZ);

        // Dynamic wall height updates based on wallMode and camera orientation
        const currentWallMode = officeRef.current.wallMode || 'smart_cutaway';
        for (const seg of wallSegmentsRef.current) {
          let targetScaleY = 1.0;
          if (currentWallMode === 'hidden') {
            targetScaleY = 0.03;
          } else if (currentWallMode === 'low_cut') {
            targetScaleY = 0.28;
          } else if (currentWallMode === 'full') {
            targetScaleY = 1.0;
          } else {
            // 'smart_cutaway': lower walls whose outward normal points toward the camera
            const toCamX = camX - seg.midX;
            const toCamZ = camZ - seg.midZ;
            const len = Math.hypot(toCamX, toCamZ) || 1;
            const dot = (toCamX / len) * seg.normalX + (toCamZ / len) * seg.normalZ;
            // Also if looking nearly straight down (top_down), keep walls low
            if (sph.phi < 0.22 || dot > 0.18) {
              targetScaleY = 0.12;
            } else {
              targetScaleY = 1.0;
            }
          }
          seg.group.scale.y += (targetScaleY - seg.group.scale.y) * 0.16;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      canvasEl.removeEventListener('pointermove', onPointerMove);
      canvasEl.removeEventListener('pointerup', onPointerUp);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('contextmenu', onContextMenu);
      canvasEl.removeEventListener('webglcontextlost', handleContextLost);
      canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.dispose();
    };
  }, [snapValue]);

  // Update lighting preset when office.lightingPreset changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ambient = scene.getObjectByName('studio-ambient') as THREE.AmbientLight | undefined;
    const hemi = scene.getObjectByName('studio-hemi') as THREE.HemisphereLight | undefined;
    const key = scene.getObjectByName('studio-key') as THREE.DirectionalLight | undefined;
    const rim = scene.getObjectByName('studio-rim') as THREE.DirectionalLight | undefined;

    const preset = office.lightingPreset || 'daylight';
    if (preset === 'daylight') {
      scene.background = new THREE.Color('#faf9f6');
      scene.fog = new THREE.FogExp2('#faf9f6', 0.012);
      if (ambient) {
        ambient.color.set('#fffbeb');
        ambient.intensity = 0.85;
      }
      if (hemi) hemi.intensity = 0.7;
      if (key) {
        key.color.set('#fff7ed');
        key.intensity = 1.55;
        key.position.set(14, 22, 12);
      }
      if (rim) {
        rim.color.set('#f97316');
        rim.intensity = 0.55;
      }
    } else if (preset === 'golden_hour') {
      scene.background = new THREE.Color('#fff7ed');
      scene.fog = new THREE.FogExp2('#fff7ed', 0.014);
      if (ambient) {
        ambient.color.set('#ffedd5');
        ambient.intensity = 0.75;
      }
      if (hemi) hemi.intensity = 0.6;
      if (key) {
        key.color.set('#fb923c');
        key.intensity = 1.85;
        key.position.set(22, 11, 14);
      }
      if (rim) {
        rim.color.set('#ea580c');
        rim.intensity = 0.65;
      }
    } else if (preset === 'night_studio') {
      scene.background = new THREE.Color('#1c1917');
      scene.fog = new THREE.FogExp2('#1c1917', 0.018);
      if (ambient) {
        ambient.color.set('#fed7aa');
        ambient.intensity = 0.45;
      }
      if (hemi) hemi.intensity = 0.35;
      if (key) {
        key.color.set('#fdba74');
        key.intensity = 0.85;
        key.position.set(-10, 18, -10);
      }
      if (rim) {
        rim.color.set('#ff7828');
        rim.intensity = 0.8;
      }
    } else if (preset === 'blueprint') {
      scene.background = new THREE.Color('#fffbf5');
      scene.fog = new THREE.FogExp2('#fffbf5', 0.01);
      if (ambient) {
        ambient.color.set('#ffedd5');
        ambient.intensity = 0.95;
      }
      if (hemi) hemi.intensity = 0.75;
      if (key) {
        key.color.set('#fff7ed');
        key.intensity = 1.35;
        key.position.set(10, 25, 10);
      }
      if (rim) {
        rim.color.set('#f97316');
        rim.intensity = 0.6;
      }
    }
  }, [office.lightingPreset]);

  // Rebuild 3D Room Architecture when polygon vertices, wallHeight, floorMaterial, wallStyle, or wallFeatures change
  useEffect(() => {
    const roomGroup = roomGroupRef.current;
    if (!roomGroup) return;

    while (roomGroup.children.length > 0) {
      roomGroup.remove(roomGroup.children[0]);
    }

    const { roomGroup: builtRoom, wallSegments } = buildRoomArchitecture(
      office.vertices,
      office.wallHeight,
      office.floorMaterial,
      office.wallStyle,
      office.wallFeatures || []
    );

    for (const child of [...builtRoom.children]) {
      roomGroup.add(child);
    }
    wallSegmentsRef.current = wallSegments;
  }, [
    office.id,
    office.vertices,
    office.wallHeight,
    office.floorMaterial,
    office.wallStyle,
    office.wallFeatures,
  ]);

  // Center camera smoothly when switching to a different office
  useEffect(() => {
    const centroid = computePolygonCentroid(office.vertices);
    sphericalRef.current.desiredTargetX = centroid.x;
    sphericalRef.current.desiredTargetZ = centroid.z;
  }, [office.id]);

  // Rebuild 3D Furniture models when furniture array or selection/hover changes
  useEffect(() => {
    const furnitureGroup = furnitureGroupRef.current;
    if (!furnitureGroup) return;

    while (furnitureGroup.children.length > 0) {
      furnitureGroup.remove(furnitureGroup.children[0]);
    }

    for (const item of office.furniture) {
      const model = buildFurniture3DModel(
        item,
        item.id === selectedFurnitureId,
        item.id === hoveredFurnitureId
      );
      furnitureGroup.add(model);
    }
  }, [office.furniture, selectedFurnitureId, hoveredFurnitureId]);

  // Rebuild 3D Agent models when office.agents or selectedAgentId changes
  useEffect(() => {
    const agentsGroup = agentsGroupRef.current;
    if (!agentsGroup) return;

    while (agentsGroup.children.length > 0) {
      agentsGroup.remove(agentsGroup.children[0]);
    }

    const agents = office.agents || [];
    for (const agent of agents) {
      const model = buildAgent3DFigure(agent, agent.id === selectedAgentId);
      agentsGroup.add(model);
    }
  }, [office.agents, selectedAgentId]);

  // Keyboard shortcuts for selected 3D furniture (R to rotate, Delete/Backspace to remove, Escape to deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if ((e.key === 'f' || e.key === 'F') && onToggleFullscreen) {
        e.preventDefault();
        onToggleFullscreen();
        return;
      }
      if (!selectedFurnitureId || !isEditMode) {
        if (e.key === 'Escape' && isFullscreen && onToggleFullscreen) {
          e.preventDefault();
          onToggleFullscreen();
        }
        return;
      }
      const item = office.furniture.find((f) => f.id === selectedFurnitureId);
      if (!item) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const nextRot = ((item.rotation || 0) + (e.shiftKey ? -45 : 45) + 360) % 360;
        onUpdateFurniture(item.id, { rotation: nextRot });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteFurniture(item.id);
      } else if (e.key === 'Escape') {
        onSelectFurniture(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedFurnitureId,
    office.furniture,
    onUpdateFurniture,
    onDeleteFurniture,
    onSelectFurniture,
    isFullscreen,
    onToggleFullscreen,
    isEditMode,
  ]);

  // HTML5 Drag & Drop from Furniture Catalog onto the 3D WebGL Canvas
  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isEditMode) {
      e.dataTransfer.dropEffect = 'none';
      if (ghostMeshRef.current) {
        ghostMeshRef.current.visible = false;
      }
      return;
    }
    e.dataTransfer.dropEffect = 'copy';

    const container = containerRef.current;
    const camera = cameraRef.current;
    const ghost = ghostMeshRef.current;
    if (!container || !camera || !ghost) return;

    const rect = container.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, pt)) {
      const x = snapValue(pt.x, snapToGrid);
      const z = snapValue(pt.z, snapToGrid);
      const catEntry = FURNITURE_CATALOG.find((c) => c.type === draggingCatalogType);
      if (catEntry) {
        ghost.scale.set(catEntry.width / 1.5, catEntry.height / 0.8, catEntry.depth / 1.0);
        ghost.position.set(x, catEntry.height / 2, z);
      } else {
        ghost.position.set(x, 0.4, z);
      }
      ghost.visible = true;
      setLiveDragCoords({ x, z });
    }
  };

  const handleCanvasDragLeave = () => {
    if (ghostMeshRef.current) {
      ghostMeshRef.current.visible = false;
    }
    setLiveDragCoords(null);
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (ghostMeshRef.current) {
      ghostMeshRef.current.visible = false;
    }
    setLiveDragCoords(null);
    if (!isEditMode) return;

    const droppedType =
      (e.dataTransfer.getData('application/x-furniture-type') as FurnitureType) ||
      draggingCatalogType;
    if (!droppedType) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, pt)) {
      const x = Math.max(-11, Math.min(11, snapValue(pt.x, snapToGrid)));
      const z = Math.max(-11, Math.min(11, snapValue(pt.z, snapToGrid)));
      onAddFurnitureAt(droppedType, x, z);
    }
  };

  const selectedItem = office.furniture.find((f) => f.id === selectedFurnitureId) || null;
  const activeCoord = liveDragCoords || (selectedItem ? { x: selectedItem.x, z: selectedItem.z } : null);
  const insideBounds = activeCoord ? isPointInPolygon(activeCoord, office.vertices) : true;

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden bg-[#090e1a]"
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
    >
      {/* WebGL Canvas Mount */}
      <div
        ref={containerRef}
        className={`w-full h-full touch-none ${
          isDragging3D
            ? 'cursor-grabbing'
            : hoveredFurnitureId
            ? 'cursor-grab'
            : 'cursor-default'
        }`}
      />

      {/* Top-Left Floating Viewport Controls HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Camera Angle Presets */}
        <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-orange-200/90 rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => applyCameraPreset('isometric')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeCamPreset === 'isometric'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(255,120,40,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
            }`}
            title="Isometric 3D Orbit View"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Isometric</span>
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('top_down')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeCamPreset === 'top_down'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(255,120,40,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
            }`}
            title="Top-Down Architectural Plan View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Top Plan</span>
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('walkthrough')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeCamPreset === 'walkthrough'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(255,120,40,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
            }`}
            title="Interior Eye-Level Perspective"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Eye Level</span>
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('corner')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeCamPreset === 'corner'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(255,120,40,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
            }`}
            title="Reverse Corner Perspective"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Corner</span>
          </button>
        </div>

        {/* Wall Cutaway Mode Selector */}
        {!compactMode && (
          <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-orange-200/90 rounded-lg shadow-sm">
            {(
              [
                { id: 'smart_cutaway', label: 'Smart Cutaway' },
                { id: 'full', label: 'Full Walls' },
                { id: 'low_cut', label: 'Half Walls' },
                { id: 'hidden', label: 'Slab Only' },
              ] as { id: WallDisplayMode; label: string }[]
            ).map((wm) => (
              <button
                key={wm.id}
                type="button"
                onClick={() => onUpdateOfficeMeta({ wallMode: wm.id })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  office.wallMode === wm.id
                    ? 'bg-orange-100 text-orange-800 font-semibold border border-orange-300/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
                }`}
              >
                {wm.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top-Right Lighting & Grid Snap Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
        {/* Non-Edit Mode / Edit Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleEditMode}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border backdrop-blur-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm ${
            !isEditMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-white/95 hover:bg-orange-50 border-orange-200/90 text-slate-700 hover:text-orange-600'
          }`}
          title={
            isEditMode
              ? 'Disable Editing (Switch to Non-Edit / View-Only Mode)'
              : 'Non-Edit Mode Active (Editing disabled). Click to enable editing'
          }
          aria-label={isEditMode ? 'Disable editing' : 'Enable editing'}
        >
          {!isEditMode ? (
            <>
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>Non-Edit Mode</span>
            </>
          ) : (
            <>
              <PencilOff className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Disable Edit</span>
            </>
          )}
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={onToggleSnapToGrid}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm ${
              snapToGrid
                ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-[0_0_10px_rgba(255,120,40,0.25)]'
                : 'bg-white/95 border-orange-200/90 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle 0.25m Grid Snapping when dragging furniture"
          >
            <Grid className="w-3.5 h-3.5 text-orange-500" />
            <span>Snap 0.25m</span>
          </button>
        )}

        <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-orange-200/90 rounded-lg shadow-sm">
          {(
            [
              { id: 'daylight', label: 'Daylight', icon: Sun },
              { id: 'golden_hour', label: 'Sunset', icon: Sunset },
              { id: 'night_studio', label: 'Night', icon: Moon },
            ] as { id: LightingPreset; label: string; icon: React.FC<{ className?: string }> }[]
          ).map((lp) => {
            const Icon = lp.icon;
            return (
              <button
                key={lp.id}
                type="button"
                onClick={() => onUpdateOfficeMeta({ lightingPreset: lp.id })}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  office.lightingPreset === lp.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-[0_0_8px_rgba(255,120,40,0.3)]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-orange-50/60'
                }`}
                title={`${lp.label} Lighting`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lp.label}</span>
              </button>
            );
          })}
        </div>

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm ${
              isFullscreen
                ? 'bg-orange-50 border-orange-400 text-orange-800'
                : 'bg-white/95 border-orange-200/90 text-slate-700 hover:text-slate-900 hover:bg-orange-50/60'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc or F)' : 'Fullscreen 3D Playground (F)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-orange-500" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </span>
          </button>
        )}
      </div>

      {/* Floating Quick Action Bar when a 3D Furniture Item is Selected */}
      {selectedItem && isEditMode && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md border border-orange-300 rounded-xl shadow-[0_8px_30px_rgba(255,120,40,0.2)] pointer-events-auto">
          <div className="pr-2 border-r border-orange-100">
            <div className="text-xs font-semibold text-slate-900 whitespace-nowrap">
              {selectedItem.label || selectedItem.name}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
              X: {selectedItem.x.toFixed(2)}m · Z: {selectedItem.z.toFixed(2)}m · {selectedItem.rotation}°
              {!insideBounds && (
                <span className="text-orange-600 font-semibold ml-1.5">· Outside Floor Boundary</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateFurniture(selectedItem.id, {
                rotation: ((selectedItem.rotation || 0) - 45 + 360) % 360,
              })
            }
            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Rotate -45° (Shift+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateFurniture(selectedItem.id, {
                rotation: ((selectedItem.rotation || 0) + 45) % 360,
              })
            }
            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Rotate +45° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <input
            type="color"
            value={selectedItem.primaryColor}
            onChange={(e) =>
              onUpdateFurniture(selectedItem.id, { primaryColor: e.target.value })
            }
            className="w-6 h-6 rounded cursor-pointer bg-transparent border border-orange-200"
            title="Primary Material Finish"
          />

          <button
            type="button"
            onClick={() => onDuplicateFurniture(selectedItem.id)}
            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Duplicate Furniture"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteFurniture(selectedItem.id)}
            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Furniture (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtle Bottom-Left Controls Help & Telemetry Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-[11px] text-slate-500">
        {!isEditMode ? (
          <div className="px-2.5 py-1 bg-amber-50/95 backdrop-blur-sm border border-amber-300 text-amber-900 rounded-md shadow-sm flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold">Non-Edit Mode Active:</span>
            <span>Furniture is locked in place</span>
            <span className="mx-1.5 text-amber-300">·</span>
            <span>Left-drag to orbit</span>
            <span className="mx-1.5 text-amber-300">·</span>
            <span>Right-drag to pan</span>
            <span className="mx-1.5 text-amber-300">·</span>
            <span>Scroll to zoom</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 bg-white/90 backdrop-blur-sm border border-orange-200/80 rounded-md shadow-sm">
            <span>Drag furniture to reposition</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Left-drag background to orbit</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Right-drag to pan</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Scroll to zoom</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Press R to rotate</span>
          </div>
        )}

        {liveDragCoords && isEditMode && (
          <div className="px-2.5 py-1 bg-orange-50 border border-orange-300 text-orange-700 font-mono tabular-nums rounded-md shadow-sm">
            Drop / Drag Target: ({liveDragCoords.x.toFixed(2)}m, {liveDragCoords.z.toFixed(2)}m)
          </div>
        )}
      </div>

      {/* WebGL Context Lost Fallback Safety */}
      {webglLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
          <p className="text-base font-semibold text-white mb-1">
            WebGL 3D Viewport Suspended
          </p>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            The hardware 3D rendering context was paused or unavailable. You can continue editing the 2D CAD floor polygon or reload the 3D engine.
          </p>
          <button
            type="button"
            onClick={() => setWebglLost(false)}
            className="px-4 py-2 text-xs font-medium bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors"
          >
            Restore 3D Viewport
          </button>
        </div>
      )}
    </div>
  );
};
