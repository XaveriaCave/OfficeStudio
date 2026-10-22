import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Plus,
  Box,
  Compass,
  Copy,
  Trash2,
  Edit3,
  GitBranch,
  LayoutGrid,
  Search,
  ArrowUpRight,
  Layers,
  RotateCcw,
  Maximize2,
  Minimize2,
  Building2,
  Globe,
  FileText,
  Settings2,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import {
  FLOOR_MATERIAL_CONFIG,
  FLOOR_SHAPE_PRESETS,
  FURNITURE_CATALOG,
  WALL_STYLE_CONFIG,
} from '../presets';
import {
  Company,
  OfficeDepartment,
  OfficeSpace,
  WorkspaceViewMode,
  computePolygonArea,
  computePolygonBounds,
} from '../types';
import { buildFurniture3DModel, buildRoomArchitecture } from '../utils/threeBuilders';

interface CompanyDashboardProps {
  offices: OfficeSpace[];
  selectedOfficeId: string;
  viewMode: WorkspaceViewMode;
  companies?: Company[];
  selectedCompanyId?: string;
  onSelectCompany?: (companyId: string) => void;
  onOpenConfigureCompany?: (company?: Company) => void;
  onDeleteCompany?: (companyId: string) => void;
  onSelectOfficeAndMode: (officeId: string, mode: WorkspaceViewMode) => void;
  onOpenCreateModal: (parentOfficeId?: string | null) => void;
  onOpenEditModal: (office: OfficeSpace) => void;
  onDuplicateOffice: (officeId: string) => void;
  onDeleteOffice: (officeId: string) => void;
  onResetAllToPresets: () => void;
}

// Mini 2D SVG Floorplan Blueprint Preview for Cards & Hierarchy Nodes
export const MiniFloorplanSvg: React.FC<{
  office: OfficeSpace;
  className?: string;
}> = ({ office, className = 'w-28 h-24' }) => {
  const bounds = computePolygonBounds(office.vertices);
  const pad = 1.6;
  const minX = bounds.minX - pad;
  const minZ = bounds.minZ - pad;
  const width = bounds.width + pad * 2;
  const depth = bounds.depth + pad * 2;
  const pointsAttr = office.vertices.map((v) => `${v.x},${v.z}`).join(' ');
  const floorCfg = FLOOR_MATERIAL_CONFIG[office.floorMaterial];

  return (
    <svg
      viewBox={`${minX} ${minZ} ${width} ${depth}`}
      preserveAspectRatio="xMidYMid meet"
      className={`${className} bg-slate-950/90 rounded-lg border border-white/10 shrink-0`}
    >
      <polygon
        points={pointsAttr}
        fill={floorCfg.baseColor}
        fillOpacity={0.22}
        stroke="#38bdf8"
        strokeWidth={0.22}
        strokeLinejoin="round"
      />
      {office.furniture.map((f) => {
        const cat =
          FURNITURE_CATALOG.find((c) => c.type === f.type) || FURNITURE_CATALOG[0];
        const w = cat.width * (f.scale || 1);
        const d = cat.depth * (f.scale || 1);
        return (
          <g
            key={f.id}
            transform={`translate(${f.x}, ${f.z}) rotate(${f.rotation || 0})`}
          >
            <rect
              x={-w / 2}
              y={-d / 2}
              width={w}
              height={d}
              rx={0.08}
              fill={f.primaryColor || cat.defaultPrimaryColor}
              stroke="#e2e8f0"
              strokeWidth={0.05}
            />
          </g>
        );
      })}
    </svg>
  );
};

// Interactive 3D Multi-Office Campus Constellation Viewer
const Campus3DConstellation: React.FC<{
  offices: OfficeSpace[];
  selectedOfficeId: string;
  onSelectOffice: (officeId: string) => void;
  onOpenOffice3D: (officeId: string) => void;
}> = ({ offices, selectedOfficeId, onSelectOffice, onOpenOffice3D }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredOfficeId, setHoveredOfficeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070c18');
    scene.fog = new THREE.FogExp2('#070c18', 0.008);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 250);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight('#f1f5f9', 0.9);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.4);
    dirLight.position.set(25, 45, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const grid = new THREE.GridHelper(110, 55, '#1e293b', '#0f172a');
    grid.position.y = -0.5;
    scene.add(grid);

    // Arrange offices spatially in a campus constellation grid with vertical elevation per floorLevel
    const officePositions = new Map<string, THREE.Vector3>();
    const clickableOfficeGroups: THREE.Group[] = [];

    const cols = Math.max(2, Math.ceil(Math.sqrt(offices.length)));
    const spacingX = 22;
    const spacingZ = 18;

    offices.forEach((off, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const posX = (col - (cols - 1) / 2) * spacingX;
      const posZ = (row - (Math.ceil(offices.length / cols) - 1) / 2) * spacingZ;
      const posY = (off.floorLevel - 1) * 3.2;

      const worldPos = new THREE.Vector3(posX, posY, posZ);
      officePositions.set(off.id, worldPos);

      const officeContainer = new THREE.Group();
      officeContainer.position.copy(worldPos);
      officeContainer.userData = { officeId: off.id };

      const { roomGroup, wallSegments } = buildRoomArchitecture(
        off.vertices,
        off.wallHeight,
        off.floorMaterial,
        off.wallStyle,
        off.wallFeatures || []
      );
      // Lower walls to cutaway height so all furniture is clearly visible in overview
      for (const seg of wallSegments) {
        seg.group.scale.y = 0.25;
      }
      officeContainer.add(roomGroup);

      for (const item of off.furniture) {
        const fModel = buildFurniture3DModel(item, false, false);
        officeContainer.add(fModel);
      }

      // Highlight platform ring if selected
      if (off.id === selectedOfficeId) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(8.2, 8.6, 48),
          new THREE.MeshBasicMaterial({
            color: '#38bdf8',
            side: THREE.DoubleSide,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.15;
        officeContainer.add(ring);
      }

      scene.add(officeContainer);
      clickableOfficeGroups.push(officeContainer);
    });

    // Draw 3D Hierarchy Connection Tubes between parentOfficeId -> child office
    offices.forEach((off) => {
      if (off.parentOfficeId && officePositions.has(off.parentOfficeId)) {
        const parentPos = officePositions.get(off.parentOfficeId)!;
        const childPos = officePositions.get(off.id)!;
        const midPoint = new THREE.Vector3(
          (parentPos.x + childPos.x) / 2,
          Math.max(parentPos.y, childPos.y) + 2.5,
          (parentPos.z + childPos.z) / 2
        );
        const curve = new THREE.QuadraticBezierCurve3(parentPos, midPoint, childPos);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.09, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.55,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tubeMesh);
      }
    });

    // Orbit state for campus view
    let theta = Math.PI / 5;
    let phi = Math.PI / 3.1;
    let radius = 48;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let moved = false;

    const canvasEl = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const findOfficeHit = (clientX: number, clientY: number): string | null => {
      const rect = canvasEl.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableOfficeGroups, true);
      for (const h of hits) {
        let cur: THREE.Object3D | null = h.object;
        while (cur) {
          if (cur.userData && cur.userData.officeId) {
            return cur.userData.officeId as string;
          }
          cur = cur.parent;
        }
      }
      return null;
    };

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.hypot(dx, dy) > 4) moved = true;
        theta -= dx * 0.006;
        phi = Math.max(0.15, Math.min(Math.PI / 2.1, phi - dy * 0.005));
        startX = e.clientX;
        startY = e.clientY;
      } else {
        const hitId = findOfficeHit(e.clientX, e.clientY);
        setHoveredOfficeId(hitId);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (isDragging && !moved) {
        const hitId = findOfficeHit(e.clientX, e.clientY);
        if (hitId) {
          onSelectOffice(hitId);
        }
      }
      isDragging = false;
    };

    const onDblClick = (e: MouseEvent) => {
      const hitId = findOfficeHit(e.clientX, e.clientY);
      if (hitId) {
        onOpenOffice3D(hitId);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(20, Math.min(95, radius + e.deltaY * 0.03));
    };

    canvasEl.addEventListener('pointerdown', onDown);
    canvasEl.addEventListener('pointermove', onMove);
    canvasEl.addEventListener('pointerup', onUp);
    canvasEl.addEventListener('dblclick', onDblClick);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        theta += 0.0008; // Gentle architectural turntable drift
      }
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 2, 0);
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('pointerdown', onDown);
      canvasEl.removeEventListener('pointermove', onMove);
      canvasEl.removeEventListener('pointerup', onUp);
      canvasEl.removeEventListener('dblclick', onDblClick);
      canvasEl.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [offices, selectedOfficeId, onSelectOffice, onOpenOffice3D]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const hoveredOffice = offices.find((o) => o.id === hoveredOfficeId);

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'relative w-full h-96 rounded-xl'
      } overflow-hidden border border-white/10 bg-[#070c18]`}
    >
      <div
        ref={mountRef}
        className={`w-full h-full ${hoveredOfficeId ? 'cursor-pointer' : 'cursor-grab'}`}
      />
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg pointer-events-none">
        <div className="text-xs font-semibold text-white">
          3D Multi-Office Spatial Hierarchy Constellation
        </div>
        <div className="text-[11px] text-slate-400">
          Cyan arcs link parent HQ suites to child offices · Click any 3D office to select · Double-click to enter 3D Playground
        </div>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-lg ${
            isFullscreen
              ? 'bg-sky-500/25 border-sky-400/50 text-sky-200'
              : 'bg-slate-950/80 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
          }`}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen 3D Campus Constellation'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Campus'}</span>
        </button>
      </div>

      {hoveredOffice && (
        <div className="absolute bottom-3 left-3 z-10 px-3 py-2 bg-slate-950/90 border border-sky-400/40 rounded-lg pointer-events-none">
          <div className="text-xs font-semibold text-sky-300">
            {hoveredOffice.code} — {hoveredOffice.name}
          </div>
          <div className="text-[11px] text-slate-300 font-mono tabular-nums">
            Floor 0{hoveredOffice.floorLevel} · {hoveredOffice.department} ·{' '}
            {computePolygonArea(hoveredOffice.vertices).toFixed(1)} m² ·{' '}
            {hoveredOffice.furniture.length} 3D items
          </div>
        </div>
      )}
    </div>
  );
};

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  offices,
  selectedOfficeId,
  viewMode,
  companies = [],
  selectedCompanyId,
  onSelectCompany,
  onOpenConfigureCompany,
  onDeleteCompany,
  onSelectOfficeAndMode,
  onOpenCreateModal,
  onOpenEditModal,
  onDuplicateOffice,
  onDeleteOffice,
  onResetAllToPresets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<OfficeDepartment | 'All'>('All');
  const [floorFilter, setFloorFilter] = useState<number | 'All'>('All');
  const [companyFilter, setCompanyFilter] = useState<string | 'All'>('All');
  const [show3DConstellation, setShow3DConstellation] = useState(true);
  const [isConfirmingBannerDelete, setIsConfirmingBannerDelete] = useState(false);

  const activeCompany =
    companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Calculate aggregate company metrics
  const totalAreaSqM = offices.reduce(
    (sum, o) => sum + computePolygonArea(o.vertices),
    0
  );
  const totalFurnitureItems = offices.reduce((sum, o) => sum + o.furniture.length, 0);
  const totalSeatCapacity = offices.reduce((sum, o) => {
    const seats = o.furniture.reduce((s, item) => {
      const cat = FURNITURE_CATALOG.find((c) => c.type === item.type);
      return s + (cat ? cat.seatCapacity : 0);
    }, 0);
    return sum + seats;
  }, 0);
  const uniqueFloors = Array.from(new Set(offices.map((o) => o.floorLevel))).sort(
    (a, b) => b - a
  );

  const filteredOffices = offices.filter((o) => {
    const matchesDep = departmentFilter === 'All' || o.department === departmentFilter;
    const matchesFloor = floorFilter === 'All' || o.floorLevel === floorFilter;
    const matchesCompany =
      companyFilter === 'All' ||
      o.companyId === companyFilter ||
      (activeCompany &&
        companyFilter === activeCompany.id &&
        activeCompany.officeIds?.includes(o.id));
    const matchesQuery =
      !searchQuery.trim() ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDep && matchesFloor && matchesCompany && matchesQuery;
  });

  // Root offices for Hierarchy Tree (those with parentOfficeId === null or pointing to non-existent office)
  const officeIdSet = new Set(offices.map((o) => o.id));
  const rootOffices = offices.filter(
    (o) => !o.parentOfficeId || !officeIdSet.has(o.parentOfficeId)
  );

  const renderHierarchyNode = (office: OfficeSpace, depth = 0) => {
    const children = offices.filter((o) => o.parentOfficeId === office.id);
    const area = computePolygonArea(office.vertices);
    const seats = office.furniture.reduce((acc, f) => {
      const cat = FURNITURE_CATALOG.find((c) => c.type === f.type);
      return acc + (cat ? cat.seatCapacity : 0);
    }, 0);
    const isSelected = office.id === selectedOfficeId;

    return (
      <div key={office.id} className="space-y-3">
        <div
          className={`p-4 rounded-xl border transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            isSelected
              ? 'bg-slate-900/95 border-sky-500/50'
              : 'bg-slate-900/60 border-white/10 hover:border-white/20'
          }`}
          style={{ marginLeft: `${Math.min(depth * 28, 84)}px` }}
        >
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <MiniFloorplanSvg office={office} className="w-24 h-20" />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                <span className="text-sky-400 font-semibold">{office.code}</span>
                <span aria-hidden="true">·</span>
                <span>{office.department}</span>
                <span aria-hidden="true">·</span>
                <span>Floor 0{office.floorLevel}</span>
                <span aria-hidden="true">·</span>
                <span>{area.toFixed(1)} m²</span>
                <span aria-hidden="true">·</span>
                <span>{seats} Seats</span>
                <span aria-hidden="true">·</span>
                <span>{office.furniture.length} 3D Assets</span>
              </div>

              <h3 className="text-base font-semibold text-white truncate">
                {office.name}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">
                {office.description}
              </p>

              <div className="text-[11px] text-slate-500">
                <span>
                  Flooring: {FLOOR_MATERIAL_CONFIG[office.floorMaterial].label}
                </span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>Walls: {WALL_STYLE_CONFIG[office.wallStyle].label}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>Polygon: {office.vertices.length} corners</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectOfficeAndMode(office.id, 'playground_3d')}
              className="px-3 py-1.5 text-xs font-semibold bg-sky-500 text-slate-950 rounded-lg hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Open 3D World</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectOfficeAndMode(office.id, 'editor_2d')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 hover:text-white rounded-lg border border-white/10 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D Shape</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal(office.id)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-800/80 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
              title="Add Sub-Office under this node in company hierarchy"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sub-Office</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenEditModal(office)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg border border-white/10 transition-colors"
              title="Modify Office Properties"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDuplicateOffice(office.id)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg border border-white/10 transition-colors"
              title="Duplicate Office"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {offices.length > 1 && (
              <button
                type="button"
                onClick={() => onDeleteOffice(office.id)}
                className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors"
                title="Delete Office"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {children.length > 0 && (
          <div className="space-y-3">
            {children.map((child) => renderHierarchyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0b1120] p-6 lg:p-8 space-y-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="text-xs text-sky-400 font-medium mb-1">
            Enterprise Spatial Architecture · Client-Side WebGL Studio
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {viewMode === 'hierarchy'
              ? 'Company Spatial Hierarchy & Floor Tree'
              : 'Company Office Layout & 3D World Directory'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect the organization’s multi-floor spatial hierarchy, customize 2D polygonal floor footprints, and launch interactive WebGL 3D office playgrounds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShow3DConstellation((prev) => !prev)}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{show3DConstellation ? 'Hide 3D Campus Map' : 'Show 3D Campus Map'}</span>
          </button>

          <button
            type="button"
            onClick={onResetAllToPresets}
            className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Reset all offices to default architectural presets"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Presets</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal(null)}
            className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Office</span>
          </button>
        </div>
      </div>

      {/* Corporate Company Profile & Branch Allocation Banner */}
      {activeCompany && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-sky-950/40 border border-sky-500/20 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeCompany.name}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30">
                    {activeCompany.companyType}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300 font-medium">
                    {activeCompany.country}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                  {activeCompany.gstDetails && (
                    <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>GST/Tax ID: {activeCompany.gstDetails}</span>
                    </span>
                  )}
                  {activeCompany.domain && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{activeCompany.domain}</span>
                    </span>
                  )}
                  {activeCompany.registrationNumber && (
                    <span className="font-mono text-slate-400">
                      Reg: {activeCompany.registrationNumber}
                    </span>
                  )}
                  <span className="text-slate-400">
                    Currency: <strong className="text-white">{activeCompany.currency}</strong>
                  </span>
                  <span className="text-sky-300 font-medium">
                    {offices.filter((o) => o.companyId === activeCompany.id || activeCompany.officeIds?.includes(o.id)).length} Offices Assigned
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {companies.length > 1 && onSelectCompany && (
                <div className="relative">
                  <select
                    value={activeCompany.id}
                    onChange={(e) => onSelectCompany(e.target.value)}
                    className="px-3 py-2 text-xs font-medium bg-slate-950/80 text-slate-200 border border-white/15 rounded-lg focus:outline-none focus:border-sky-400"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onOpenConfigureCompany && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenConfigureCompany(activeCompany)}
                    className="px-3.5 py-2 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Configure company name, type, GST, domain, country, and assigned offices"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configure Company & Offices</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenConfigureCompany(undefined)}
                    className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Register an additional company entity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Company</span>
                  </button>

                  {companies.length > 1 && onDeleteCompany && (
                    !isConfirmingBannerDelete ? (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingBannerDelete(true)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-lg transition-colors"
                        title={`Delete "${activeCompany.name}" (unassigns its offices)`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 p-1 bg-rose-950/80 border border-rose-500/40 rounded-lg">
                        <span className="text-[11px] text-rose-200 px-1 font-medium">Delete entity?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCompany(activeCompany.id);
                            setIsConfirmingBannerDelete(false);
                          }}
                          className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingBannerDelete(false)}
                          className="px-1.5 py-0.5 text-[11px] text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4-Column Quantitative Spatial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10">
          <div className="text-xs text-slate-400">Active Office Suites</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {offices.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {uniqueFloors.length} building floor levels
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10">
          <div className="text-xs text-slate-400">Total Configured Floor Area</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {totalAreaSqM.toFixed(1)} m²
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-1">
            {Math.round(totalAreaSqM * 10.764).toLocaleString()} sq.ft total polygon area
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10">
          <div className="text-xs text-slate-400">Workstation & Meeting Capacity</div>
          <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums mt-1">
            {totalSeatCapacity} Seats
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-1">
            {(totalAreaSqM / Math.max(1, totalSeatCapacity)).toFixed(1)} m² per seat ratio
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10">
          <div className="text-xs text-slate-400">Placed 3D Furniture Assets</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {totalFurnitureItems}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Real-time WebGL customizable objects
          </div>
        </div>
      </div>

      {/* Live 3D Multi-Office Campus Constellation Overview */}
      {show3DConstellation && (
        <Campus3DConstellation
          offices={offices}
          selectedOfficeId={selectedOfficeId}
          onSelectOffice={(id) => onSelectOfficeAndMode(id, viewMode)}
          onOpenOffice3D={(id) => onSelectOfficeAndMode(id, 'playground_3d')}
        />
      )}

      {/* View Switcher & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => onSelectOfficeAndMode(selectedOfficeId, 'dashboard')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  viewMode !== 'hierarchy'
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Blueprint Cards Grid</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectOfficeAndMode(selectedOfficeId, 'hierarchy')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  viewMode === 'hierarchy'
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Organizational Hierarchy Tree</span>
              </button>
            </div>
          </div>

          {viewMode !== 'hierarchy' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter offices by name or code..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Floor Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFloorFilter('All')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    floorFilter === 'All'
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Floors
                </button>
                {uniqueFloors.map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setFloorFilter(fl)}
                    className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      floorFilter === fl
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    F0{fl}
                  </button>
                ))}
              </div>

              {/* Department Filter */}
              <select
                aria-label="Filter by Department"
                value={departmentFilter}
                onChange={(e) =>
                  setDepartmentFilter(e.target.value as OfficeDepartment | 'All')
                }
                className="px-2.5 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-sky-400"
              >
                <option value="All">All Divisions</option>
                <option value="Executive">Executive</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Research">Research</option>
                <option value="Operations">Operations</option>
                <option value="Collaborative">Collaborative</option>
              </select>
            </div>
          )}
        </div>

        {/* HIERARCHY TREE VIEW */}
        {viewMode === 'hierarchy' ? (
          <div className="space-y-4">
            {rootOffices.map((root) => renderHierarchyNode(root, 0))}
          </div>
        ) : (
          /* BLUEPRINT CARDS GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredOffices.map((office) => {
              const area = computePolygonArea(office.vertices);
              const seats = office.furniture.reduce((acc, f) => {
                const cat = FURNITURE_CATALOG.find((c) => c.type === f.type);
                return acc + (cat ? cat.seatCapacity : 0);
              }, 0);
              const parentOffice = offices.find((p) => p.id === office.parentOfficeId);
              const isSelected = office.id === selectedOfficeId;

              return (
                <div
                  key={office.id}
                  className={`p-5 rounded-xl border transition-colors flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900/95 border-sky-500/50'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
                          <span className="text-sky-400 font-semibold">
                            {office.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{office.department}</span>
                          <span aria-hidden="true">·</span>
                          <span>Floor 0{office.floorLevel}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mt-0.5 truncate">
                          {office.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(office)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Edit Office Spec"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateOffice(office.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Duplicate Office"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {offices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteOffice(office.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Office"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive 2D Blueprint Thumbnail + Spatial Specs */}
                    <div className="flex items-center gap-4 py-2">
                      <div
                        onClick={() =>
                          onSelectOfficeAndMode(office.id, 'playground_3d')
                        }
                        className="cursor-pointer group relative"
                        title="Click to launch 3D WebGL Playground"
                      >
                        <MiniFloorplanSvg office={office} className="w-32 h-28" />
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 min-w-0">
                        <div className="font-mono tabular-nums">
                          <span className="text-slate-500">Area: </span>
                          <span className="text-white font-semibold">
                            {area.toFixed(1)} m²
                          </span>
                          <span className="text-slate-500">
                            {' '}
                            ({Math.round(area * 10.764)} ft²)
                          </span>
                        </div>
                        <div className="font-mono tabular-nums">
                          <span className="text-slate-500">Capacity: </span>
                          <span className="text-sky-300 font-semibold">
                            {seats} Seats
                          </span>
                          <span className="text-slate-500">
                            {' '}
                            · {office.furniture.length} Items
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Floor: </span>
                          <span>
                            {FLOOR_MATERIAL_CONFIG[office.floorMaterial].label}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Hierarchy: </span>
                          <span>
                            {parentOffice
                              ? `Reports to ${parentOffice.code}`
                              : 'Root HQ Suite'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {office.description}
                    </p>
                  </div>

                  {/* Card Footer Action Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectOfficeAndMode(office.id, 'playground_3d')
                      }
                      className="flex-1 py-2 px-3 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Launch 3D Playground</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectOfficeAndMode(office.id, 'editor_2d')}
                      className="py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <span>2D Shape</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onSelectOfficeAndMode(office.id, 'split_studio')
                      }
                      className="py-2 px-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors whitespace-nowrap"
                      title="Open synchronized 2D + 3D Split Studio"
                    >
                      Split
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
