import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Grid,
  Ruler,
  DoorOpen,
  Columns,
  Square,
  RotateCw,
  Scissors,
  HelpCircle,
  X,
  Split,
  Info,
  Undo2,
  Redo2,
  UserPlus,
  Bot,
  MessageSquare,
  DollarSign,
  Coffee,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  FurnitureItem,
  FurnitureType,
  OfficeAgent,
  OfficeSpace,
  Point2D,
  WallFeature,
  WallFeatureType,
  computePolygonArea,
  computePolygonCentroid,
  computePolygonPerimeter,
} from '../types';
import { FLOOR_SHAPE_PRESETS, FURNITURE_CATALOG } from '../presets';
import {
  findAvailableDeskSpots,
  HIERARCHY_COLORS,
} from '../utils/agentAccountingDefaults';

interface HistorySnapshot {
  description: string;
  vertices: Point2D[];
  wallFeatures: WallFeature[];
  furniture: FurnitureItem[];
  agents?: OfficeAgent[];
}

interface Office2DCanvasProps {
  office: OfficeSpace;
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
  onUpdateVertices: (vertices: Point2D[]) => void;
  onUpdateWallFeatures: (features: WallFeature[]) => void;
  onUpdateFurniture: (id: string, patch: Partial<FurnitureItem>) => void;
  onDeleteFurniture: (id: string) => void;
  onAddFurnitureAt: (type: FurnitureType, x: number, z: number) => void;
  onUpdateAgent?: (id: string, patch: Partial<OfficeAgent>) => void;
  onDeleteAgent?: (id: string) => void;
  onOpenAgentChat?: (agent: OfficeAgent) => void;
  onOpenAgentManager?: (agent?: OfficeAgent) => void;
  onBatchUpdateOffice?: (patch: Partial<OfficeSpace>) => void;
  draggingCatalogType: FurnitureType | null;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  compactMode?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const Office2DCanvas: React.FC<Office2DCanvasProps> = ({
  office,
  selectedFurnitureId,
  onSelectFurniture,
  selectedAgentId,
  onSelectAgent,
  onUpdateVertices,
  onUpdateWallFeatures,
  onUpdateFurniture,
  onDeleteFurniture,
  onAddFurnitureAt,
  onUpdateAgent,
  onDeleteAgent,
  onOpenAgentChat,
  onOpenAgentManager,
  onBatchUpdateOffice,
  draggingCatalogType,
  snapToGrid,
  onToggleSnapToGrid,
  compactMode = false,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport pan & zoom in SVG world meters (default viewBox covers -11m to +11m)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Undo & Redo History Stacks
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const dragStartSnapshotRef = useRef<HistorySnapshot | null>(null);
  const officeIdRef = useRef(office.id);

  // Reset history stack when switching office
  useEffect(() => {
    if (officeIdRef.current !== office.id) {
      officeIdRef.current = office.id;
      setUndoStack([]);
      setRedoStack([]);
      dragStartSnapshotRef.current = null;
    }
  }, [office.id]);

  // Rapid double-click / double-tap detection refs to bypass SVG browser event inconsistencies
  const lastVertexClickRef = useRef<{ idx: number; time: number } | null>(null);
  const lastFurnitureClickRef = useRef<{ id: string; time: number } | null>(null);
  const lastAgentClickRef = useRef<{ id: string; time: number } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Record a snapshot of the current state before a mutation
  const pushUndoSnapshot = useCallback(
    (description: string) => {
      const snapshot: HistorySnapshot = {
        description,
        vertices: office.vertices.map((v) => ({ ...v })),
        wallFeatures: (office.wallFeatures || []).map((wf) => ({ ...wf })),
        furniture: office.furniture.map((f) => ({ ...f })),
        agents: (office.agents || []).map((a) => ({ ...a })),
      };
      setUndoStack((prev) => [...prev.slice(-49), snapshot]);
      setRedoStack([]);
    },
    [office.vertices, office.wallFeatures, office.furniture, office.agents]
  );

  // Apply a snapshot atomically
  const applySnapshot = useCallback(
    (snapshot: HistorySnapshot) => {
      if (onBatchUpdateOffice) {
        onBatchUpdateOffice({
          vertices: snapshot.vertices.map((v) => ({ ...v })),
          wallFeatures: snapshot.wallFeatures.map((wf) => ({ ...wf })),
          furniture: snapshot.furniture.map((f) => ({ ...f })),
          agents: snapshot.agents ? snapshot.agents.map((a) => ({ ...a })) : undefined,
        });
      } else {
        onUpdateVertices(snapshot.vertices.map((v) => ({ ...v })));
        onUpdateWallFeatures(snapshot.wallFeatures.map((wf) => ({ ...wf })));
      }
      setSelectedVertexIdx(null);
      setSelectedEdgeIdx(null);
    },
    [onBatchUpdateOffice, onUpdateVertices, onUpdateWallFeatures]
  );

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);

    const currentSnapshot: HistorySnapshot = {
      description: prev.description,
      vertices: office.vertices.map((v) => ({ ...v })),
      wallFeatures: (office.wallFeatures || []).map((wf) => ({ ...wf })),
      furniture: office.furniture.map((f) => ({ ...f })),
      agents: (office.agents || []).map((a) => ({ ...a })),
    };

    setUndoStack(newUndo);
    setRedoStack((r) => [...r, currentSnapshot]);
    applySnapshot(prev);
    showToast(`↩️ Undone: ${prev.description}`);
  }, [undoStack, office.vertices, office.wallFeatures, office.furniture, office.agents, applySnapshot, showToast]);

  // Redo previously undone action
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    const currentSnapshot: HistorySnapshot = {
      description: next.description,
      vertices: office.vertices.map((v) => ({ ...v })),
      wallFeatures: (office.wallFeatures || []).map((wf) => ({ ...wf })),
      furniture: office.furniture.map((f) => ({ ...f })),
      agents: (office.agents || []).map((a) => ({ ...a })),
    };

    setRedoStack(newRedo);
    setUndoStack((u) => [...u.slice(-49), currentSnapshot]);
    applySnapshot(next);
    showToast(`↪️ Redone: ${next.description}`);
  }, [redoStack, office.vertices, office.wallFeatures, office.furniture, office.agents, applySnapshot, showToast]);

  // Active dragging state
  const [dragMode, setDragMode] = useState<
    | { type: 'none' }
    | { type: 'vertex'; index: number }
    | { type: 'furniture'; id: string; offsetX: number; offsetZ: number }
    | { type: 'agent'; id: string; offsetX: number; offsetZ: number }
    | { type: 'pan'; startClientX: number; startClientY: number; startPanX: number; startPanZ: number }
  >({ type: 'none' });

  const baseSpan = 20; // 20 meters across at zoom=1
  const currentSpan = baseSpan / zoom;
  const viewMinX = pan.x - currentSpan / 2;
  const viewMinZ = pan.z - currentSpan / 2;

  const snapCoord = useCallback(
    (val: number) => {
      if (!snapToGrid) return Number(val.toFixed(2));
      const step = 0.25;
      return Number((Math.round(val / step) * step).toFixed(2));
    },
    [snapToGrid]
  );

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Point2D => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, z: 0 };
      const rect = svg.getBoundingClientRect();
      const normX = (clientX - rect.left) / rect.width;
      const normZ = (clientY - rect.top) / rect.height;
      // Preserve aspect ratio using SVG viewBox math
      const aspect = rect.width / Math.max(1, rect.height);
      const spanX = aspect >= 1 ? currentSpan * aspect : currentSpan;
      const spanZ = aspect >= 1 ? currentSpan : currentSpan / aspect;
      const minX = pan.x - spanX / 2;
      const minZ = pan.z - spanZ / 2;

      return {
        x: minX + normX * spanX,
        z: minZ + normZ * spanZ,
      };
    },
    [currentSpan, pan.x, pan.z]
  );

  // Delete selected vertex (minimum 3 vertices required for closed polygon)
  const handleDeleteVertex = useCallback(
    (index: number) => {
      if (office.vertices.length <= 3) {
        showToast('⚠️ A room shape requires at least 3 corner points to form an enclosed floor.');
        return;
      }
      pushUndoSnapshot(`Delete Corner #${index + 1}`);
      const next = office.vertices.filter((_, idx) => idx !== index);
      const updatedFeatures = (office.wallFeatures || [])
        .filter((wf) => wf.edgeIndex !== index)
        .map((wf) => (wf.edgeIndex > index ? { ...wf, edgeIndex: wf.edgeIndex - 1 } : wf));
      onUpdateVertices(next);
      onUpdateWallFeatures(updatedFeatures);
      setSelectedVertexIdx(null);
      showToast(`Deleted corner #${index + 1}. Adjacent walls merged into one.`);
    },
    [office.vertices, office.wallFeatures, onUpdateVertices, onUpdateWallFeatures, pushUndoSnapshot, showToast]
  );

  // Delete furniture item
  const handleDeleteFurnitureItem = useCallback(
    (id: string, name?: string) => {
      pushUndoSnapshot(`Delete ${name || 'item'}`);
      onDeleteFurniture(id);
      if (selectedFurnitureId === id) {
        onSelectFurniture(null);
      }
      showToast(`Deleted ${name || 'item'}`);
    },
    [pushUndoSnapshot, onDeleteFurniture, selectedFurnitureId, onSelectFurniture, showToast]
  );

  // Insert a new vertex at the midpoint of edge i -> (i+1)
  const handleInsertVertexAtEdge = useCallback(
    (edgeIndex: number, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      pushUndoSnapshot(`Add Wall Corner on Wall #${edgeIndex + 1}`);
      const v1 = office.vertices[edgeIndex];
      const v2 = office.vertices[(edgeIndex + 1) % office.vertices.length];
      const mid: Point2D = {
        x: snapCoord((v1.x + v2.x) / 2),
        z: snapCoord((v1.z + v2.z) / 2),
      };
      const next = [...office.vertices];
      next.splice(edgeIndex + 1, 0, mid);

      // Shift wall feature indices after edgeIndex
      const updatedFeatures = (office.wallFeatures || []).map((wf) =>
        wf.edgeIndex > edgeIndex ? { ...wf, edgeIndex: wf.edgeIndex + 1 } : wf
      );
      onUpdateVertices(next);
      onUpdateWallFeatures(updatedFeatures);
      setSelectedVertexIdx(edgeIndex + 1);
      setSelectedEdgeIdx(null);
      showToast(`Added new wall corner! Drag the yellow corner point to extend or reshape walls.`);
    },
    [office.vertices, office.wallFeatures, snapCoord, pushUndoSnapshot, onUpdateVertices, onUpdateWallFeatures, showToast]
  );

  // Add wall corner to selected wall, or longest wall
  const handleAddWallCornerGeneral = useCallback(() => {
    let targetEdge = selectedEdgeIdx;
    if (targetEdge === null || targetEdge < 0 || targetEdge >= office.vertices.length) {
      let maxLen = -1;
      let maxIdx = 0;
      for (let i = 0; i < office.vertices.length; i++) {
        const v1 = office.vertices[i];
        const v2 = office.vertices[(i + 1) % office.vertices.length];
        const len = Math.hypot(v2.x - v1.x, v2.z - v1.z);
        if (len > maxLen) {
          maxLen = len;
          maxIdx = i;
        }
      }
      targetEdge = maxIdx;
    }
    handleInsertVertexAtEdge(targetEdge);
  }, [selectedEdgeIdx, office.vertices, handleInsertVertexAtEdge]);

  // Add a 3m solid interior partition wall inside the office suite
  const handleAddInteriorWall = useCallback(() => {
    pushUndoSnapshot('Add Interior Partition Wall');
    let cx = 0;
    let cz = 0;
    for (const v of office.vertices) {
      cx += v.x;
      cz += v.z;
    }
    cx = snapCoord(cx / office.vertices.length);
    cz = snapCoord(cz / office.vertices.length);
    onAddFurnitureAt('solid_partition', cx, cz);
    showToast('🧱 Added 3.0m Solid Interior Partition Wall! Move & rotate anywhere to divide rooms.');
  }, [office.vertices, snapCoord, pushUndoSnapshot, onAddFurnitureAt, showToast]);

  // Add or toggle wall feature (window / door / glass_wall / opening) on selected edge
  const handleSetEdgeFeature = useCallback(
    (edgeIndex: number, type: WallFeatureType | 'none', customWidth?: number) => {
      const existing = (office.wallFeatures || []).filter((wf) => wf.edgeIndex !== edgeIndex);
      pushUndoSnapshot(
        type === 'none'
          ? `Solid Wall #${edgeIndex + 1}`
          : type === 'opening'
          ? `Wall Opening #${edgeIndex + 1}`
          : `${type.replace('_', ' ')} on Wall #${edgeIndex + 1}`
      );

      if (type === 'none') {
        onUpdateWallFeatures(existing);
        showToast('Restored full solid wall (cleared openings and features)');
        return;
      }
      const v1 = office.vertices[edgeIndex];
      const v2 = office.vertices[(edgeIndex + 1) % office.vertices.length];
      const segLen = Math.hypot(v2.x - v1.x, v2.z - v1.z);

      let defaultWidth =
        type === 'opening'
          ? Math.min(2.0, segLen * 0.75)
          : type === 'door'
          ? Math.min(1.4, segLen * 0.6)
          : type === 'glass_wall'
          ? Math.max(1.5, segLen * 0.8)
          : Math.min(2.8, segLen * 0.55);

      if (customWidth !== undefined) {
        defaultWidth = Math.min(customWidth, segLen);
      }

      const newFeature: WallFeature = {
        id: `wf-${Date.now()}`,
        edgeIndex,
        type,
        offsetRatio: 0.5,
        width: Number(defaultWidth.toFixed(2)),
      };
      onUpdateWallFeatures([...existing, newFeature]);

      if (type === 'opening') {
        if (customWidth && customWidth >= segLen * 0.9) {
          showToast(`Deleted entire wall on Edge #${edgeIndex + 1} (open threshold)`);
        } else {
          showToast(`Deleted ${newFeature.width}m portion of Wall #${edgeIndex + 1} (created walkthrough opening)`);
        }
      } else {
        showToast(`Wall #${edgeIndex + 1} updated to ${type.replace('_', ' ')}`);
      }
    },
    [office.vertices, office.wallFeatures, pushUndoSnapshot, onUpdateWallFeatures, showToast]
  );

  const [showAddAgentMenu, setShowAddAgentMenu] = useState(false);
  const selectedAgent = (office.agents || []).find((a) => a.id === selectedAgentId);

  const handlePointerDownAgent = (agent: OfficeAgent, e: React.PointerEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const last = lastAgentClickRef.current;
    if (last && last.id === agent.id && now - last.time < 380) {
      lastAgentClickRef.current = null;
      onOpenAgentChat?.(agent);
      return;
    }
    lastAgentClickRef.current = { id: agent.id, time: now };
    onSelectAgent?.(agent.id);
    onSelectFurniture(null);
    setSelectedVertexIdx(null);
    setSelectedEdgeIdx(null);

    dragStartSnapshotRef.current = {
      description: `Move ${agent.name}`,
      vertices: office.vertices.map((v) => ({ ...v })),
      wallFeatures: (office.wallFeatures || []).map((wf) => ({ ...wf })),
      furniture: office.furniture.map((f) => ({ ...f })),
      agents: (office.agents || []).map((a) => ({ ...a })),
    };

    const worldPt = clientToWorld(e.clientX, e.clientY);
    setDragMode({
      type: 'agent',
      id: agent.id,
      offsetX: agent.x - worldPt.x,
      offsetZ: agent.z - worldPt.z,
    });
  };

  const handleSeatAgentAtDesk = (agent: OfficeAgent) => {
    const spots = findAvailableDeskSpots(office.furniture);
    const occupiedDesks = new Set(
      (office.agents || []).map((a) => a.assignedDeskId).filter(Boolean)
    );
    const openSpot = spots.find((s) => !occupiedDesks.has(s.furnitureId)) || spots[0];

    if (openSpot) {
      pushUndoSnapshot(`Seat ${agent.name} at desk`);
      onUpdateAgent?.(agent.id, {
        x: openSpot.x,
        z: openSpot.z,
        assignedDeskId: openSpot.furnitureId,
        state: 'sitting_working',
        activityDescription: `Working at ${openSpot.label}`,
      });
      showToast(`${agent.name} is now sitting and working at ${openSpot.label}`);
    } else {
      showToast('⚠️ No unoccupied desks available in this room. Place more desks or drag agent.');
    }
  };

  const handleSendAgentToAmenity = (
    agent: OfficeAgent,
    amenity: 'coffee' | 'tennis' | 'smartboard' | 'store'
  ) => {
    const item = office.furniture.find((f) => {
      if (amenity === 'coffee') return f.type === 'coffee_station';
      if (amenity === 'tennis') return f.type === 'ping_pong_table';
      if (amenity === 'smartboard') return f.type === 'smartboard' || f.type === 'whiteboard';
      if (amenity === 'store') return f.type === 'snack_store';
      return false;
    });

    pushUndoSnapshot(`Send ${agent.name} to ${amenity}`);
    if (item) {
      const offsetX = amenity === 'tennis' ? -1.2 : 0.25;
      const offsetZ =
        amenity === 'coffee' || amenity === 'smartboard' || amenity === 'store' ? 0.75 : 0;
      onUpdateAgent?.(agent.id, {
        x: Number((item.x + offsetX).toFixed(2)),
        z: Number((item.z + offsetZ).toFixed(2)),
        assignedDeskId: null,
        state:
          amenity === 'coffee'
            ? 'coffee_break'
            : amenity === 'tennis'
            ? 'playing_tennis'
            : amenity === 'smartboard'
            ? 'using_smartboard'
            : 'visiting_store',
        activityDescription:
          amenity === 'coffee'
            ? 'Grabbing a beverage at barista counter'
            : amenity === 'tennis'
            ? 'Playing table tennis in lounge'
            : amenity === 'smartboard'
            ? 'Brainstorming on 4K smartboard'
            : 'Visiting micro-market snack kiosk',
      });
      showToast(`${agent.name} is now visiting the ${amenity}!`);
    } else {
      const centroid = computePolygonCentroid(office.vertices);
      onUpdateAgent?.(agent.id, {
        x: centroid.x,
        z: centroid.z,
        assignedDeskId: null,
        state:
          amenity === 'coffee'
            ? 'coffee_break'
            : amenity === 'tennis'
            ? 'playing_tennis'
            : amenity === 'smartboard'
            ? 'using_smartboard'
            : 'visiting_store',
        activityDescription: `Taking break (${amenity})`,
      });
      showToast(
        `${agent.name} is now on break (${amenity}). Tip: add a ${amenity} from Catalog to give them a physical station!`
      );
    }
  };

  const handleDeleteAgentItem = (agentId: string) => {
    const ag = (office.agents || []).find((a) => a.id === agentId);
    pushUndoSnapshot(`Delete agent ${ag?.name || ''}`);
    onDeleteAgent?.(agentId);
    if (selectedAgentId === agentId) {
      onSelectAgent?.(null);
    }
    showToast(`Deleted agent ${ag?.name || ''}`);
  };

  const handleQuickSpawnAgent = (presetType: 'exec' | 'eng' | 'des' | 'acc') => {
    setShowAddAgentMenu(false);
    pushUndoSnapshot('Spawn Agent');

    const centroid = computePolygonCentroid(office.vertices);
    const count = (office.agents || []).length;
    const offsetX = ((count % 3) - 1) * 0.9;
    const offsetZ = (Math.floor(count / 3) % 3 - 1) * 0.9;

    let newAgent: Partial<OfficeAgent>;
    if (presetType === 'exec') {
      newAgent = {
        name: `Executive Director ${count + 1}`,
        role: 'VP of Strategy',
        department: 'Executive',
        hierarchy: 'Executive',
        hierarchyLevel: 1,
        color: '#f59e0b',
        avatarInitial: 'EX',
        state: 'standing',
        activityDescription: 'Reviewing quarterly spatial strategy',
        x: snapCoord(centroid.x + offsetX),
        z: snapCoord(centroid.z + offsetZ),
      };
    } else if (presetType === 'eng') {
      newAgent = {
        name: `Systems Engineer ${count + 1}`,
        role: 'Senior Platform Engineer',
        department: 'Engineering',
        hierarchy: 'Senior',
        hierarchyLevel: 4,
        color: '#0284c7',
        avatarInitial: 'SE',
        state: 'walking',
        activityDescription: 'Benchmarking spatial graphics',
        x: snapCoord(centroid.x + offsetX),
        z: snapCoord(centroid.z + offsetZ),
      };
    } else if (presetType === 'des') {
      newAgent = {
        name: `Spatial Designer ${count + 1}`,
        role: 'Product Experience Lead',
        department: 'Design',
        hierarchy: 'Senior',
        hierarchyLevel: 4,
        color: '#ec4899',
        avatarInitial: 'SD',
        state: 'standing',
        activityDescription: 'Evaluating room acoustics',
        x: snapCoord(centroid.x + offsetX),
        z: snapCoord(centroid.z + offsetZ),
      };
    } else {
      newAgent = {
        name: `Financial Controller ${count + 1}`,
        role: 'Corporate Accounting Lead',
        department: 'Executive',
        hierarchy: 'Director',
        hierarchyLevel: 2,
        color: '#10b981',
        avatarInitial: 'AC',
        isAccountingAgent: true,
        state: 'sitting_working',
        activityDescription: 'Auditing ledger & runway',
        x: snapCoord(centroid.x + offsetX),
        z: snapCoord(centroid.z + offsetZ),
      };
    }

    if (onBatchUpdateOffice) {
      const fullAgent: OfficeAgent = {
        id: `agent-${Date.now()}`,
        officeId: office.id,
        createdAt: new Date().toISOString(),
        ...newAgent,
      } as OfficeAgent;
      onBatchUpdateOffice({
        agents: [...(office.agents || []), fullAgent],
      });
      onSelectAgent?.(fullAgent.id);
      showToast(`Spawned ${fullAgent.name}! Drag to place manually or double-click to chat.`);
    } else {
      onOpenAgentManager?.();
    }
  };

  // Keyboard navigation & deletion listener (including Undo / Redo shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      // Undo shortcut: Ctrl+Z / Cmd+Z (without Shift)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo shortcut: Ctrl+Y / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.key === 'f' || e.key === 'F') && onToggleFullscreen) {
        e.preventDefault();
        onToggleFullscreen();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFurnitureId) {
          e.preventDefault();
          const it = office.furniture.find((f) => f.id === selectedFurnitureId);
          handleDeleteFurnitureItem(selectedFurnitureId, it?.name || it?.label);
        } else if (selectedVertexIdx !== null) {
          e.preventDefault();
          handleDeleteVertex(selectedVertexIdx);
        } else if (selectedEdgeIdx !== null) {
          e.preventDefault();
          handleSetEdgeFeature(selectedEdgeIdx, 'none');
        }
        return;
      }

      if (e.key === 'Escape') {
        if (selectedFurnitureId) {
          onSelectFurniture(null);
        } else if (selectedVertexIdx !== null) {
          setSelectedVertexIdx(null);
        } else if (selectedEdgeIdx !== null) {
          setSelectedEdgeIdx(null);
        } else if (isFullscreen && onToggleFullscreen) {
          e.preventDefault();
          onToggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFullscreen,
    onToggleFullscreen,
    selectedFurnitureId,
    selectedVertexIdx,
    selectedEdgeIdx,
    office.furniture,
    handleUndo,
    handleRedo,
    onSelectFurniture,
    handleDeleteVertex,
    handleDeleteFurnitureItem,
    handleSetEdgeFeature,
  ]);

  const handlePointerDownSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      e.preventDefault();
      setDragMode({
        type: 'pan',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: pan.x,
        startPanZ: pan.z,
      });
      return;
    }
    if (e.target === svgRef.current || (e.target as SVGElement).dataset.bg === 'true') {
      onSelectFurniture(null);
      setSelectedVertexIdx(null);
      setSelectedEdgeIdx(null);
      setDragMode({
        type: 'pan',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: pan.x,
        startPanZ: pan.z,
      });
    }
  };

  const handlePointerMoveSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragMode.type === 'none') return;

    if (dragMode.type === 'pan') {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const metersPerPx = currentSpan / Math.min(rect.width, rect.height);
      const dx = (e.clientX - dragMode.startClientX) * metersPerPx;
      const dz = (e.clientY - dragMode.startClientY) * metersPerPx;
      setPan({
        x: Number((dragMode.startPanX - dx).toFixed(2)),
        z: Number((dragMode.startPanZ - dz).toFixed(2)),
      });
      return;
    }

    const pt = clientToWorld(e.clientX, e.clientY);
    const clampedX = Math.max(-12, Math.min(12, snapCoord(pt.x)));
    const clampedZ = Math.max(-12, Math.min(12, snapCoord(pt.z)));

    if (dragMode.type === 'vertex') {
      const next = office.vertices.map((v, idx) =>
        idx === dragMode.index ? { x: clampedX, z: clampedZ } : v
      );
      onUpdateVertices(next);
    } else if (dragMode.type === 'furniture') {
      const fx = Math.max(-11.5, Math.min(11.5, snapCoord(pt.x + dragMode.offsetX)));
      const fz = Math.max(-11.5, Math.min(11.5, snapCoord(pt.z + dragMode.offsetZ)));
      onUpdateFurniture(dragMode.id, { x: fx, z: fz });
    } else if (dragMode.type === 'agent') {
      const ax = Math.max(-11.5, Math.min(11.5, snapCoord(pt.x + dragMode.offsetX)));
      const az = Math.max(-11.5, Math.min(11.5, snapCoord(pt.z + dragMode.offsetZ)));
      onUpdateAgent?.(dragMode.id, {
        x: ax,
        z: az,
        assignedDeskId: null,
        activityDescription: 'Positioned manually on canvas',
      });
    }
  };

  const handlePointerUpSvg = () => {
    // If a drag operation was active, commit the drag start snapshot to the undo stack
    if (dragStartSnapshotRef.current) {
      const initial = dragStartSnapshotRef.current;
      // Check if actual values changed
      const verticesChanged = JSON.stringify(initial.vertices) !== JSON.stringify(office.vertices);
      const furnitureChanged = JSON.stringify(initial.furniture) !== JSON.stringify(office.furniture);
      const agentsChanged = JSON.stringify(initial.agents) !== JSON.stringify(office.agents);
      if (verticesChanged || furnitureChanged || agentsChanged) {
        setUndoStack((prev) => [...prev.slice(-49), initial]);
        setRedoStack([]);
      }
      dragStartSnapshotRef.current = null;
    }
    setDragMode({ type: 'none' });
  };

  // HTML5 Drop from Catalog onto 2D SVG Floorplan
  const handleDropOn2D = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedType =
      (e.dataTransfer.getData('application/x-furniture-type') as FurnitureType) ||
      draggingCatalogType;
    if (!droppedType) return;
    pushUndoSnapshot('Drop Furniture Item');
    const pt = clientToWorld(e.clientX, e.clientY);
    onAddFurnitureAt(droppedType, snapCoord(pt.x), snapCoord(pt.z));
  };

  const areaSqM = computePolygonArea(office.vertices);
  const perimeterM = computePolygonPerimeter(office.vertices);
  const polygonPointsAttr = office.vertices.map((v) => `${v.x},${v.z}`).join(' ');

  const currentEdgeFeature =
    selectedEdgeIdx !== null
      ? (office.wallFeatures || []).find((wf) => wf.edgeIndex === selectedEdgeIdx)
      : undefined;

  const selectedItem = office.furniture.find((f) => f.id === selectedFurnitureId);

  return (
    <div
      className="relative w-full h-full flex flex-col bg-white select-none overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDropOn2D}
    >
      {/* Top 2D CAD Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white/95 backdrop-blur-md border-b border-orange-200/80 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">
            2D Floor Polygon & CAD Layout
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="text-xs font-mono tabular-nums text-orange-600 font-semibold whitespace-nowrap">
            {areaSqM.toFixed(1)} m² ({Math.round(areaSqM * 10.764)} ft²)
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs font-mono tabular-nums text-slate-500 hidden sm:inline whitespace-nowrap">
            {perimeterM.toFixed(1)}m perimeter · {office.vertices.length} corners
          </span>
        </div>

        {/* Action Tools: Undo, Redo, Add Wall, Add Interior Wall, Presets, Snap, Help */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* UNDO & REDO BUTTON GROUP */}
          <div className="flex items-center bg-white border border-orange-200/90 rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1 px-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed rounded flex items-center gap-1 transition-colors"
              title={
                undoStack.length > 0
                  ? `Undo: ${undoStack[undoStack.length - 1].description} (Ctrl+Z / ⌘Z)`
                  : 'Undo (Ctrl+Z / ⌘Z)'
              }
            >
              <Undo2 className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline text-xs">Undo</span>
            </button>

            <div className="w-[1px] h-3.5 bg-orange-100 mx-0.5" />

            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 px-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed rounded flex items-center gap-1 transition-colors"
              title={
                redoStack.length > 0
                  ? `Redo: ${redoStack[redoStack.length - 1].description} (Ctrl+Y / ⌘Shift+Z)`
                  : 'Redo (Ctrl+Y / ⌘Shift+Z)'
              }
            >
              <Redo2 className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline text-xs">Redo</span>
            </button>
          </div>

          {/* Add Wall Corner Button */}
          <button
            type="button"
            onClick={handleAddWallCornerGeneral}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all flex items-center gap-1 shadow-[0_0_12px_rgba(255,120,40,0.35)]"
            title="Add a new corner vertex to split an existing wall and expand the perimeter"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Add Wall Corner</span>
            <span className="sm:hidden">+ Corner</span>
          </button>

          {/* Add Interior Partition Wall Button */}
          <button
            type="button"
            onClick={handleAddInteriorWall}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-orange-50 text-slate-700 border border-orange-200/90 hover:border-orange-300 transition-colors flex items-center gap-1 shadow-sm"
            title="Place a 3m solid interior drywall partition to divide spaces"
          >
            <Columns className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">+ Interior Wall</span>
          </button>

          {/* Add Agent Button with Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddAgentMenu((prev) => !prev)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-300 transition-colors flex items-center gap-1 shadow-sm"
              title="Spawn an agent to work, roam, and collaborate in this suite"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Add Agent</span>
              <span className="sm:hidden">+ Agent</span>
            </button>

            {showAddAgentMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-orange-200 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => handleQuickSpawnAgent('exec')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-orange-50 text-slate-800 flex items-center justify-between"
                >
                  <span>🏢 Executive Director</span>
                  <span className="text-[10px] font-mono text-orange-600 font-semibold">L1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSpawnAgent('eng')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-orange-50 text-slate-800 flex items-center justify-between"
                >
                  <span>💻 Platform Engineer</span>
                  <span className="text-[10px] font-mono text-orange-600 font-semibold">L4</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSpawnAgent('des')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-orange-50 text-slate-800 flex items-center justify-between"
                >
                  <span>🎨 Spatial Designer</span>
                  <span className="text-[10px] font-mono text-orange-600 font-semibold">L4</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSpawnAgent('acc')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-orange-50 text-slate-800 flex items-center justify-between"
                >
                  <span>💵 Financial Controller</span>
                  <span className="text-[10px] font-mono text-orange-600 font-semibold">L2</span>
                </button>
                <div className="border-t border-orange-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAgentMenu(false);
                      onOpenAgentManager?.();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Agent...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {!compactMode && (
            <select
              aria-label="Apply 2D Floor Shape Preset"
              value=""
              onChange={(e) => {
                const preset = FLOOR_SHAPE_PRESETS.find((p) => p.id === e.target.value);
                if (preset) {
                  pushUndoSnapshot(`Apply Template: ${preset.name}`);
                  onUpdateVertices(preset.vertices.map((v) => ({ ...v })));
                  onUpdateWallFeatures([]);
                  setSelectedVertexIdx(null);
                  setSelectedEdgeIdx(null);
                  showToast(`Applied preset: ${preset.name}`);
                }
              }}
              className="px-2 py-1 text-xs bg-white border border-orange-200/90 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer"
            >
              <option value="" disabled>
                Shape Templates...
              </option>
              {FLOOR_SHAPE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={onToggleSnapToGrid}
            className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm ${
              snapToGrid
                ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-[0_0_10px_rgba(255,120,40,0.25)]'
                : 'bg-white border-orange-200/90 text-slate-600 hover:text-slate-900'
            }`}
            title="Snap vertices and furniture to 0.25m CAD grid"
          >
            <Grid className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden md:inline">Snap</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDimensions((prev) => !prev)}
            className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm ${
              showDimensions
                ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-[0_0_10px_rgba(255,120,40,0.25)]'
                : 'bg-white border-orange-200/90 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle Wall Dimension Labels"
          >
            <Ruler className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden lg:inline">Dimensions</span>
          </button>

          {/* Quick Help Guide Button */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-2 py-1 text-xs font-medium rounded-lg bg-white hover:bg-orange-50 text-slate-700 border border-orange-200/90 flex items-center gap-1 transition-colors shadow-sm"
            title="CAD Guide: Undo/Redo, wall tools, and deletion"
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-white border border-orange-200/90 rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.6, Number((z + 0.25).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, z: 0 });
              }}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Reset CAD View"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isFullscreen
                  ? 'bg-sky-500/25 border-sky-400/50 text-sky-200'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (Esc or F)' : 'Fullscreen CAD View (F)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Floating Animated Toast Feedback Banner */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 bg-slate-900/95 border border-sky-400/40 text-sky-200 text-xs font-medium rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition-all">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive 2D SVG Vector Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${viewMinX} ${viewMinZ} ${currentSpan} ${currentSpan}`}
          preserveAspectRatio="xMidYMid slice"
          onPointerDown={handlePointerDownSvg}
          onPointerMove={handlePointerMoveSvg}
          onPointerUp={handlePointerUpSvg}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full cursor-crosshair touch-none"
        >
          <defs>
            {/* 1m Major Grid & 0.25m Minor Sub-grid with light orange neon lines */}
            <pattern id="cadSubGrid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
              <path
                d="M 0.5 0 L 0 0 0 0.5"
                fill="none"
                stroke="rgba(249, 115, 22, 0.09)"
                strokeWidth="0.02"
              />
            </pattern>
            <pattern id="cadMainGrid" width="2" height="2" patternUnits="userSpaceOnUse">
              <rect width="2" height="2" fill="url(#cadSubGrid)" />
              <path
                d="M 2 0 L 0 0 0 2"
                fill="none"
                stroke="rgba(249, 115, 22, 0.22)"
                strokeWidth="0.035"
              />
            </pattern>
          </defs>

          {/* Background CAD Grid */}
          <rect
            data-bg="true"
            x={-40}
            y={-40}
            width={80}
            height={80}
            fill="url(#cadMainGrid)"
          />

          {/* Origin Axes Crosshair (0,0) */}
          <line
            x1={-25}
            y1={0}
            x2={25}
            y2={0}
            stroke="rgba(249, 115, 22, 0.35)"
            strokeWidth={0.03}
            strokeDasharray="0.2 0.2"
          />
          <line
            x1={0}
            y1={-25}
            x2={0}
            y2={25}
            stroke="rgba(249, 115, 22, 0.35)"
            strokeWidth={0.03}
            strokeDasharray="0.2 0.2"
          />

          {/* Room Floor Polygon Fill with Light Orange Neon Perimeter */}
          <polygon
            data-bg="true"
            points={polygonPointsAttr}
            fill="rgba(254, 215, 170, 0.35)"
            stroke="#f97316"
            strokeWidth={0.14}
            strokeLinejoin="round"
          />

          {/* Wall Segments, Features (Windows/Doors/Glass/Opening), Midpoint '+' Handles, and Length Labels */}
          {office.vertices.map((v1, idx) => {
            const v2 = office.vertices[(idx + 1) % office.vertices.length];
            const midX = (v1.x + v2.x) / 2;
            const midZ = (v1.z + v2.z) / 2;
            const segLen = Math.hypot(v2.x - v1.x, v2.z - v1.z);
            const isEdgeSelected = selectedEdgeIdx === idx;
            const edgeFeatures = (office.wallFeatures || []).filter(
              (wf) => wf.edgeIndex === idx
            );

            return (
              <g key={`edge-${idx}`}>
                {/* Clickable thick wall hit target */}
                <line
                  x1={v1.x}
                  y1={v1.z}
                  x2={v2.x}
                  y2={v2.z}
                  stroke={isEdgeSelected ? '#fbbf24' : 'transparent'}
                  strokeWidth={0.34}
                  strokeLinecap="round"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEdgeIdx(idx);
                    setSelectedVertexIdx(null);
                    onSelectFurniture(null);
                  }}
                >
                  <title>Click to select Wall #{idx + 1} and delete a portion, add doors/windows, or split</title>
                </line>

                {/* Render Wall Features (Window / Door / Glass Wall / Wall Opening) on 2D Plan */}
                {edgeFeatures.map((feat) => {
                  const fx = v1.x + (v2.x - v1.x) * feat.offsetRatio;
                  const fz = v1.z + (v2.z - v1.z) * feat.offsetRatio;
                  const angleDeg = (Math.atan2(v2.z - v1.z, v2.x - v1.x) * 180) / Math.PI;
                  const w = Math.min(feat.width, segLen * 0.95);

                  if (feat.type === 'opening') {
                    // DELETED WALL PORTION / WALKTHROUGH OPENING
                    return (
                      <g
                        key={feat.id}
                        transform={`translate(${fx}, ${fz}) rotate(${angleDeg})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdgeIdx(idx);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleSetEdgeFeature(idx, 'none');
                        }}
                        className="cursor-pointer group"
                      >
                        {/* Void mask opening with dashed cut boundary */}
                        <rect
                          x={-w / 2}
                          y={-0.16}
                          width={w}
                          height={0.32}
                          fill="#ffffff"
                          stroke="#ea580c"
                          strokeWidth={0.035}
                          strokeDasharray="0.08 0.06"
                        />
                        <text
                          x={0}
                          y={0.06}
                          textAnchor="middle"
                          fill="#fb7185"
                          fontSize={0.2}
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="bold"
                        >
                          ✂️ Cutout {w.toFixed(1)}m
                        </text>
                        <title>Deleted Wall Portion (Opening). Double-click to restore solid wall.</title>
                      </g>
                    );
                  }

                  const strokeColor =
                    feat.type === 'door'
                      ? '#f59e0b'
                      : feat.type === 'glass_wall'
                      ? '#38bdf8'
                      : '#7dd3fc';

                  return (
                    <g
                      key={feat.id}
                      transform={`translate(${fx}, ${fz}) rotate(${angleDeg})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeIdx(idx);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleSetEdgeFeature(idx, 'none');
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x={-w / 2}
                        y={-0.11}
                        width={w}
                        height={0.22}
                        fill="#0f172a"
                        stroke={strokeColor}
                        strokeWidth={0.045}
                      />
                      {feat.type === 'door' && (
                        <path
                          d={`M ${-w / 2} 0.11 A ${w} ${w} 0 0 0 ${w / 2} ${0.11 + w * 0.6}`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={0.035}
                          strokeDasharray="0.08 0.08"
                        />
                      )}
                      <title>{feat.type.replace('_', ' ')} (Double-click to remove)</title>
                    </g>
                  );
                })}

                {/* Wall Length Dimension Tag */}
                {showDimensions && segLen >= 0.8 && (
                  <g transform={`translate(${midX}, ${midZ})`}>
                    <rect
                      x={-0.62}
                      y={-0.58}
                      width={1.24}
                      height={0.36}
                      rx={0.08}
                      fill="rgba(15, 23, 42, 0.88)"
                      stroke={isEdgeSelected ? '#fbbf24' : 'rgba(148, 163, 184, 0.25)'}
                      strokeWidth={0.025}
                    />
                    <text
                      x={0}
                      y={-0.34}
                      textAnchor="middle"
                      fill={isEdgeSelected ? '#fde68a' : '#cbd5e1'}
                      fontSize={0.22}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {segLen.toFixed(1)}m
                    </text>
                  </g>
                )}

                {/* Midpoint '+' Vertex Insertion Handle (Click to add a wall corner) */}
                <g
                  transform={`translate(${midX}, ${midZ})`}
                  onClick={(e) => handleInsertVertexAtEdge(idx, e)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={0.22}
                    fill="#0284c7"
                    stroke="#38bdf8"
                    strokeWidth={0.045}
                    className="transition-transform group-hover:scale-125"
                  />
                  <line
                    x1={-0.09}
                    y1={0}
                    x2={0.09}
                    y2={0}
                    stroke="#ffffff"
                    strokeWidth={0.038}
                    strokeLinecap="round"
                  />
                  <line
                    x1={0}
                    y1={-0.09}
                    x2={0}
                    y2={0.09}
                    stroke="#ffffff"
                    strokeWidth={0.038}
                    strokeLinecap="round"
                  />
                  <title>Click + to split Wall #{idx + 1} and add a new corner vertex (drag to extend wall)</title>
                </g>
              </g>
            );
          })}

          {/* 2D Top-Down Furniture Symbols */}
          {office.furniture.map((item) => {
            const cat =
              FURNITURE_CATALOG.find((c) => c.type === item.type) || FURNITURE_CATALOG[0];
            const w = cat.width * (item.scale || 1);
            const d = cat.depth * (item.scale || 1);
            const isSel = item.id === selectedFurnitureId;

            const handlePointerDownFurniture = (e: React.PointerEvent) => {
              e.stopPropagation();
              const now = Date.now();
              const last = lastFurnitureClickRef.current;
              if (last && last.id === item.id && now - last.time < 380) {
                // Rapid double click / tap detected!
                lastFurnitureClickRef.current = null;
                handleDeleteFurnitureItem(item.id, item.label || item.name);
                return;
              }
              lastFurnitureClickRef.current = { id: item.id, time: now };
              onSelectFurniture(item.id);
              setSelectedVertexIdx(null);
              setSelectedEdgeIdx(null);

              // Record snapshot for undo prior to dragging
              dragStartSnapshotRef.current = {
                description: `Move ${item.label || item.name}`,
                vertices: office.vertices.map((v) => ({ ...v })),
                wallFeatures: (office.wallFeatures || []).map((wf) => ({ ...wf })),
                furniture: office.furniture.map((f) => ({ ...f })),
              };

              const worldPt = clientToWorld(e.clientX, e.clientY);
              setDragMode({
                type: 'furniture',
                id: item.id,
                offsetX: item.x - worldPt.x,
                offsetZ: item.z - worldPt.z,
              });
            };

            // Dedicated rendering for solid interior partition walls
            if (item.type === 'solid_partition') {
              return (
                <g
                  key={item.id}
                  transform={`translate(${item.x}, ${item.z}) rotate(${item.rotation || 0})`}
                  onPointerDown={handlePointerDownFurniture}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFurnitureItem(item.id, 'Solid Interior Wall');
                  }}
                  className="cursor-move"
                >
                  <rect
                    x={-w / 2}
                    y={-d / 2}
                    width={w}
                    height={d}
                    rx={0.02}
                    fill="#f8fafc"
                    stroke={isSel ? '#fbbf24' : '#0f172a'}
                    strokeWidth={isSel ? 0.08 : 0.04}
                  />
                  <line
                    x1={-w / 2 + 0.08}
                    y1={0}
                    x2={w / 2 - 0.08}
                    y2={0}
                    stroke="#475569"
                    strokeWidth={0.025}
                    strokeDasharray="0.1 0.05"
                  />
                  <text
                    x={0}
                    y={0.05}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize={Math.min(0.2, w * 0.12)}
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    style={{ pointerEvents: 'none' }}
                  >
                    🧱 Solid Interior Wall ({w.toFixed(1)}m)
                  </text>
                  <title>Solid Interior Wall. Double-click to delete.</title>
                </g>
              );
            }

            return (
              <g
                key={item.id}
                transform={`translate(${item.x}, ${item.z}) rotate(${item.rotation || 0})`}
                onPointerDown={handlePointerDownFurniture}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFurnitureItem(item.id, item.label || item.name);
                }}
                className="cursor-move"
              >
                {/* Furniture footprint box */}
                <rect
                  x={-w / 2}
                  y={-d / 2}
                  width={w}
                  height={d}
                  rx={item.type === 'round_meeting_table' || item.type === 'potted_plant' ? w / 2 : 0.08}
                  fill={item.primaryColor || cat.defaultPrimaryColor}
                  fillOpacity={0.85}
                  stroke={isSel ? '#38bdf8' : '#f8fafc'}
                  strokeWidth={isSel ? 0.08 : 0.03}
                />

                {/* Front orientation indicator bar (+Z) */}
                <line
                  x1={-w * 0.25}
                  y1={d / 2 - 0.06}
                  x2={w * 0.25}
                  y2={d / 2 - 0.06}
                  stroke={isSel ? '#38bdf8' : '#94a3b8'}
                  strokeWidth={0.045}
                  strokeLinecap="round"
                />

                {/* Item short label */}
                <text
                  x={0}
                  y={0.06}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={Math.min(0.22, w * 0.18)}
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {(item.label || item.name).slice(0, 14)}
                </text>
                <title>{item.label || item.name} (Double-click to delete)</title>
              </g>
            );
          })}

          {/* 2D Interactive Office Agents */}
          {(office.agents || []).map((agent) => {
            const isAgentSel = agent.id === selectedAgentId;
            const stateIcon =
              agent.state === 'sitting_working'
                ? '💻'
                : agent.state === 'coffee_break'
                ? '☕'
                : agent.state === 'playing_tennis'
                ? '🏓'
                : agent.state === 'using_smartboard'
                ? '📊'
                : agent.state === 'visiting_store'
                ? '🏪'
                : '🚶';

            return (
              <g
                key={agent.id}
                transform={`translate(${agent.x}, ${agent.z})`}
                onPointerDown={(e) => handlePointerDownAgent(agent, e)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onOpenAgentChat?.(agent);
                }}
                className="cursor-move select-none group"
              >
                {/* Glow ring if selected */}
                {isAgentSel && (
                  <circle
                    r={0.65}
                    fill={agent.color}
                    fillOpacity={0.25}
                    stroke="#38bdf8"
                    strokeWidth={0.06}
                  />
                )}

                {/* Avatar body circle */}
                <circle
                  r={0.42}
                  fill={agent.color || '#0284c7'}
                  stroke={isAgentSel ? '#ffffff' : '#0f172a'}
                  strokeWidth={isAgentSel ? 0.08 : 0.05}
                  className="transition-transform group-hover:scale-110"
                />

                {/* Avatar Initials */}
                <text
                  x={0}
                  y={0.08}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={0.25}
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {agent.avatarInitial}
                </text>

                {/* State badge mini-circle */}
                <g transform="translate(0.3, -0.3)">
                  <circle r={0.19} fill="#0f172a" stroke="#ffffff" strokeWidth={0.03} />
                  <text
                    x={0}
                    y={0.06}
                    textAnchor="middle"
                    fontSize={0.18}
                    style={{ pointerEvents: 'none' }}
                  >
                    {stateIcon}
                  </text>
                </g>

                {/* Name Label Tag */}
                <g transform="translate(0, 0.65)">
                  <rect
                    x={-1.0}
                    y={-0.16}
                    width={2.0}
                    height={0.32}
                    rx={0.08}
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke={isAgentSel ? '#38bdf8' : 'rgba(255,255,255,0.18)'}
                    strokeWidth={0.03}
                  />
                  <text
                    x={0}
                    y={0.06}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={0.17}
                    fontWeight="bold"
                    fontFamily="system-ui, sans-serif"
                    style={{ pointerEvents: 'none' }}
                  >
                    {agent.name.split(' ')[0]} ({agent.hierarchy.slice(0, 4)})
                  </text>
                </g>
                <title>{`${agent.name} • ${agent.role} (${agent.hierarchy})\nStatus: ${agent.activityDescription}\n(Double-click to chat, drag to place manually)`}</title>
              </g>
            );
          })}

          {/* Draggable Polygon Corner Vertices */}
          {office.vertices.map((v, idx) => {
            const isSelected = selectedVertexIdx === idx;

            const handlePointerDownVertex = (e: React.PointerEvent) => {
              e.stopPropagation();
              const now = Date.now();
              const last = lastVertexClickRef.current;
              if (last && last.idx === idx && now - last.time < 380) {
                // Rapid double click / tap detected!
                lastVertexClickRef.current = null;
                handleDeleteVertex(idx);
                return;
              }
              lastVertexClickRef.current = { idx, time: now };
              setSelectedVertexIdx(idx);
              setSelectedEdgeIdx(null);
              onSelectFurniture(null);

              // Record snapshot for undo prior to dragging corner
              dragStartSnapshotRef.current = {
                description: `Move Corner #${idx + 1}`,
                vertices: office.vertices.map((vt) => ({ ...vt })),
                wallFeatures: (office.wallFeatures || []).map((wf) => ({ ...wf })),
                furniture: office.furniture.map((f) => ({ ...f })),
              };

              setDragMode({ type: 'vertex', index: idx });
            };

            return (
              <g
                key={`vertex-${idx}`}
                transform={`translate(${v.x}, ${v.z})`}
                onPointerDown={handlePointerDownVertex}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVertex(idx);
                }}
                className="cursor-grab active:cursor-grabbing group"
              >
                <circle
                  r={isSelected ? 0.3 : 0.22}
                  fill={isSelected ? '#ea580c' : '#f97316'}
                  stroke="#ffffff"
                  strokeWidth={0.06}
                  className="transition-transform group-hover:scale-125 shadow-sm"
                />
                {showDimensions && (
                  <text
                    x={0}
                    y={0.48}
                    textAnchor="middle"
                    fill={isSelected ? '#c2410c' : '#7c2d12'}
                    fontSize={0.2}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                  >
                    ({v.x.toFixed(1)}, {v.z.toFixed(1)})
                  </text>
                )}
                <title>Corner #{idx + 1}. Drag to reshape wall, or double-click to delete.</title>
              </g>
            );
          })}
        </svg>

        {/* Contextual Inspector Overlay for Selected Vertex or Selected Wall Edge */}
        {(selectedVertexIdx !== null || selectedEdgeIdx !== null) && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 flex-wrap px-3 py-2 bg-white/95 backdrop-blur-md border border-orange-300 rounded-xl shadow-[0_8px_30px_rgba(255,120,40,0.18)] max-w-xl text-slate-900">
            {selectedVertexIdx !== null && office.vertices[selectedVertexIdx] && (
              <>
                <span className="text-xs font-semibold text-slate-900">
                  Corner #{selectedVertexIdx + 1}:
                </span>
                <span className="text-xs font-mono tabular-nums text-orange-600 font-bold">
                  ({office.vertices[selectedVertexIdx].x.toFixed(2)}m,{' '}
                  {office.vertices[selectedVertexIdx].z.toFixed(2)}m)
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteVertex(selectedVertexIdx)}
                  className="ml-2 px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-md flex items-center gap-1.5 transition-colors"
                  title="Delete this corner and merge adjacent walls into one straight line"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Corner (Del)</span>
                </button>
                <span className="text-[11px] text-slate-500">or double-click to delete</span>
              </>
            )}

            {selectedEdgeIdx !== null && (
              <>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-900">
                    Wall #{selectedEdgeIdx + 1}:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInsertVertexAtEdge(selectedEdgeIdx)}
                    className="px-2 py-1 text-xs rounded-md bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300 flex items-center gap-1 font-medium"
                    title="Split this wall into two wall segments with a new corner"
                  >
                    <Split className="w-3 h-3 text-orange-600" />
                    <span>+ Split Wall (Add Corner)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'none')}
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                      !currentEdgeFeature
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                    }`}
                    title="Continuous solid architectural wall"
                  >
                    <Square className="w-3 h-3" />
                    <span>Solid Wall</span>
                  </button>

                  {/* Delete Portion / Cutout Tool */}
                  <button
                    type="button"
                    onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'opening')}
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                      currentEdgeFeature?.type === 'opening'
                        ? 'bg-rose-500 text-white font-semibold shadow'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                    title="Delete a portion of this wall to create an open walkthrough or archway"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>✂️ Delete Portion (Opening)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'glass_wall')}
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                      currentEdgeFeature?.type === 'glass_wall'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                    }`}
                  >
                    <Columns className="w-3 h-3" />
                    <span>Glass Wall</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'window')}
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                      currentEdgeFeature?.type === 'window'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                    }`}
                  >
                    <Columns className="w-3 h-3" />
                    <span>Window</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'door')}
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                      currentEdgeFeature?.type === 'door'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                    }`}
                  >
                    <DoorOpen className="w-3 h-3" />
                    <span>Doorway</span>
                  </button>
                </div>

                {/* Sub-toolbar when opening / portion deletion is active: Quick width selection */}
                {currentEdgeFeature?.type === 'opening' && (
                  <div className="w-full flex items-center gap-1.5 pt-1 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-500">Cutout width:</span>
                    <button
                      type="button"
                      onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'opening', 1.2)}
                      className={`px-2 py-0.5 rounded font-medium ${
                        currentEdgeFeature.width === 1.2
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      1.2m Walkway
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'opening', 2.0)}
                      className={`px-2 py-0.5 rounded font-medium ${
                        currentEdgeFeature.width === 2.0
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      2.0m Passage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetEdgeFeature(selectedEdgeIdx, 'opening', 3.5)}
                      className={`px-2 py-0.5 rounded font-medium ${
                        currentEdgeFeature.width === 3.5
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      3.5m Wide Arch
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const v1 = office.vertices[selectedEdgeIdx];
                        const v2 = office.vertices[(selectedEdgeIdx + 1) % office.vertices.length];
                        const len = Math.hypot(v2.x - v1.x, v2.z - v1.z);
                        handleSetEdgeFeature(selectedEdgeIdx, 'opening', len * 0.98);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium"
                      title="Completely remove the wall elevation on this edge"
                    >
                      Full (Remove Wall)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Selected Furniture Quick Actions in 2D */}
        {selectedFurnitureId && selectedItem && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-orange-300 rounded-xl shadow-[0_8px_25px_rgba(255,120,40,0.18)] text-slate-900">
            <span className="text-xs text-slate-900 font-semibold">
              {selectedItem.label || selectedItem.name}
            </span>
            <button
              type="button"
              onClick={() => {
                pushUndoSnapshot('Rotate Item');
                onUpdateFurniture(selectedItem.id, {
                  rotation: ((selectedItem.rotation || 0) + 45) % 360,
                });
              }}
              className="px-2 py-1 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>Rotate 45°</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteFurnitureItem(selectedItem.id, selectedItem.name || selectedItem.label)}
              className="px-2 py-1 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded flex items-center gap-1 font-medium transition-colors"
              title="Delete this item (Del or Backspace)"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete (Del)</span>
            </button>
          </div>
        )}

        {/* Selected Agent Quick Actions in 2D */}
        {selectedAgentId && selectedAgent && (
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 p-2 bg-white/95 backdrop-blur-md border border-orange-300 rounded-xl shadow-[0_8px_30px_rgba(255,120,40,0.2)] animate-in fade-in text-slate-900">
            <div className="flex items-center gap-2 pr-2 border-r border-orange-200">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                style={{ backgroundColor: selectedAgent.color }}
              >
                {selectedAgent.avatarInitial}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span>{selectedAgent.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-medium">
                    {selectedAgent.hierarchy}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{selectedAgent.role}</div>
              </div>
            </div>

            {/* Chat Action */}
            <button
              type="button"
              onClick={() => onOpenAgentChat?.(selectedAgent)}
              className="px-2.5 py-1 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-[0_2px_10px_rgba(255,107,0,0.3)]"
              title="Open real-time AI conversation with this agent (or double-click agent)"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat (Double-Click)</span>
            </button>

            {/* Quick State Actions */}
            <button
              type="button"
              onClick={() => handleSeatAgentAtDesk(selectedAgent)}
              className="px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg flex items-center gap-1 transition-colors font-medium"
              title="Seat at available desk"
            >
              <span>💻 Sit at Desk</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendAgentToAmenity(selectedAgent, 'coffee')}
              className="px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg flex items-center gap-1 transition-colors font-medium"
              title="Send to coffee dispenser"
            >
              <span>☕ Coffee</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendAgentToAmenity(selectedAgent, 'tennis')}
              className="px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg flex items-center gap-1 transition-colors font-medium"
              title="Play table tennis"
            >
              <span>🏓 Tennis</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendAgentToAmenity(selectedAgent, 'smartboard')}
              className="px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg flex items-center gap-1 transition-colors font-medium"
              title="Brainstorm on smartboard"
            >
              <span>📊 Board</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendAgentToAmenity(selectedAgent, 'store')}
              className="px-2 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg flex items-center gap-1 transition-colors font-medium"
              title="Visit micro-market store kiosk"
            >
              <span>🏪 Store</span>
            </button>

            {/* Edit & Delete Actions */}
            <button
              type="button"
              onClick={() => onOpenAgentManager?.(selectedAgent)}
              className="p-1.5 bg-orange-50 hover:bg-orange-100 text-slate-600 hover:text-slate-900 border border-orange-200 rounded-lg transition-colors"
              title="Edit agent role & hierarchy"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleDeleteAgentItem(selectedAgent.id)}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors"
              title="Delete this agent"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom 2D Instructions Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[11px] text-slate-600">
          <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md border border-orange-200/90 rounded-lg flex items-center gap-2 flex-wrap shadow-[0_4px_16px_rgba(255,120,40,0.1)] pointer-events-auto">
            <span className="text-orange-600 font-bold">CAD Shortcuts:</span>
            <span><strong className="text-slate-900 font-medium">Ctrl+Z</strong> Undo · <strong className="text-slate-900 font-medium">Ctrl+Y</strong> Redo</span>
            <span className="text-slate-300">·</span>
            <span>Double-click corner or item to delete</span>
            <span className="text-slate-300">·</span>
            <span>Click <strong className="text-orange-600 font-mono">+</strong> on wall line to add wall</span>
            <span className="text-slate-300">·</span>
            <span>Click wall line → choose <strong className="text-rose-600 font-medium">✂️ Delete Portion</strong></span>
          </div>
        </div>
      </div>

      {/* CAD Help & Interactive Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-orange-200 rounded-2xl max-w-lg w-full p-6 shadow-[0_20px_50px_rgba(255,107,0,0.18)] text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2D Floor & Wall Architecture Guide</h3>
                  <p className="text-xs text-slate-500">Quick answers on walls, deletions, history, and reshaping</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Question: Undo and Redo */}
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-orange-700">
                  <Undo2 className="w-4 h-4 text-orange-600" />
                  <span>Undo & Redo Options</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  • Use the <strong>Undo</strong> and <strong>Redo</strong> buttons in the top CAD toolbar at any time.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  • Keyboard shortcuts: press <kbd className="px-1.5 py-0.5 bg-white border border-orange-200 rounded font-mono text-slate-800 shadow-xs">Ctrl+Z</kbd> (or <kbd className="px-1.5 py-0.5 bg-white border border-orange-200 rounded font-mono text-slate-800 shadow-xs">⌘Z</kbd>) to undo, and <kbd className="px-1.5 py-0.5 bg-white border border-orange-200 rounded font-mono text-slate-800 shadow-xs">Ctrl+Y</kbd> (or <kbd className="px-1.5 py-0.5 bg-white border border-orange-200 rounded font-mono text-slate-800 shadow-xs">⌘Shift+Z</kbd>) to redo.
                </p>
                <p className="text-[11px] text-slate-500">
                  * Tracks moving corners, adding walls, deleting elements, moving furniture, rotating, and wall cutouts.
                </p>
              </div>

              {/* Question 1: How to delete elements */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-orange-700">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>1. How to Delete Elements or Corners</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  • <strong>Double-click</strong> directly on any corner point (orange circle) or furniture element to delete it immediately.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  • Alternatively, <strong>click to select</strong> the element or corner, then press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">Delete</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">Backspace</kbd>, or click the red <strong>Delete</strong> button in the top banner.
                </p>
                <p className="text-[11px] text-slate-500">
                  * Note: An enclosed room requires a minimum of 3 corner points.
                </p>
              </div>

              {/* Question 2: How to add a wall */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-orange-700">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>2. How to Add a Wall</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  • <strong>Perimeter Wall</strong>: Click the orange <strong><Plus className="w-3 h-3 inline mx-0.5" /></strong> handle located at the midpoint of any wall line (or click <strong>+ Add Wall Corner</strong> in the top toolbar). This inserts a new corner. Drag that corner outwards to create new walls and alcoves!
                </p>
                <p className="text-slate-700 leading-relaxed">
                  • <strong>Interior Partition Wall</strong>: Click <strong>+ Interior Wall</strong> in the top toolbar to drop a 3-meter architectural drywall divider anywhere inside the office floor.
                </p>
              </div>

              {/* Question 3: How to delete a portion of the wall */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-orange-700">
                  <Scissors className="w-4 h-4 text-rose-500" />
                  <span>3. How to Delete a Portion of a Wall</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  • Click on any wall line to open the Wall Architecture toolbar.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  • Click <strong>✂️ Delete Portion (Opening)</strong>. This cuts out that portion of the wall, turning it into a real walkthrough passage in both 2D and 3D!
                </p>
                <p className="text-slate-700 leading-relaxed">
                  • You can choose cutout widths: <strong>1.2m</strong>, <strong>2.0m</strong>, <strong>3.5m</strong>, or <strong>Full (Remove Wall)</strong>. Double-click the cutout at any time to restore the solid wall.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs rounded-xl transition-all shadow-[0_2px_12px_rgba(255,107,0,0.3)]"
              >
                Got it, let's design!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
