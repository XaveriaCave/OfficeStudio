import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Compass,
  Columns,
  LayoutGrid,
  GitBranch,
  Plus,
  Edit3,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Package,
  ChevronDown,
  DollarSign,
  Bot,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  FurnitureItem,
  FurnitureType,
  OfficeAccounting,
  OfficeAgent,
  OfficeSpace,
  Point2D,
  WallFeature,
  WorkspaceViewMode,
  computePolygonArea,
  computePolygonCentroid,
} from './types';
import { FURNITURE_CATALOG, INITIAL_OFFICES } from './presets';
import { Office3DCanvas } from './components/Office3DCanvas';
import { Office2DCanvas } from './components/Office2DCanvas';
import { OfficeInspectorPanel } from './components/OfficeInspectorPanel';
import { CompanyDashboard } from './components/CompanyDashboard';
import { OfficeFormModal } from './components/OfficeFormModal';
import { AgentChatModal } from './components/AgentChatModal';
import { AgentManagerModal } from './components/AgentManagerModal';
import { AccountingPanel } from './components/AccountingPanel';
import {
  getDefaultAccountingForOffice,
  getDefaultAgentsForOffice,
  simulateAgentTick,
} from './utils/agentAccountingDefaults';

const STORAGE_KEY = 'pacific_mind_spatial_offices_v1';

export default function App() {
  const [offices, setOffices] = useState<OfficeSpace[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((off: OfficeSpace) => {
            const area = computePolygonArea(off.vertices || []);
            const agents =
              off.agents && off.agents.length > 0
                ? off.agents
                : getDefaultAgentsForOffice(off.id, off.department);
            const accounting =
              off.accounting ||
              getDefaultAccountingForOffice(off.id, area, agents);
            return {
              ...off,
              agents,
              accounting,
            };
          });
        }
      }
    } catch {
      // Fallback to initial presets
    }
    return INITIAL_OFFICES;
  });

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(() => {
    return offices[0]?.id || INITIAL_OFFICES[0].id;
  });
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('playground_3d');
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [draggingCatalogType, setDraggingCatalogType] = useState<FurnitureType | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [catalogOpen, setCatalogOpen] = useState<boolean>(true);
  const [showFullscreenDrawer, setShowFullscreenDrawer] = useState<boolean>(false);
  const [spatialViewsOpen, setSpatialViewsOpen] = useState<boolean>(true);
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({});

  const toggleFloorCollapse = (floor: number) => {
    setCollapsedFloors((prev) => ({ ...prev, [floor]: !prev[floor] }));
  };

  // Add / Edit Office Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingOffice, setEditingOffice] = useState<OfficeSpace | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [isStudioFullscreen, setIsStudioFullscreen] = useState<boolean>(false);

  // Agent System & Accounting States
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [chatAgent, setChatAgent] = useState<OfficeAgent | null>(null);
  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<OfficeAgent | null>(null);

  // Periodic agent movement / desk-assignment simulation (roaming & amenity usage)
  useEffect(() => {
    const interval = setInterval(() => {
      setOffices((prevOffices) =>
        prevOffices.map((office) => {
          if (!office.agents || office.agents.length === 0) return office;
          const updatedAgents = simulateAgentTick(office);
          return {
            ...office,
            agents: updatedAgents,
          };
        })
      );
    }, 14000);

    return () => clearInterval(interval);
  }, []);

  const toggleStudioFullscreen = useCallback(() => {
    setIsStudioFullscreen((prev) => {
      const next = !prev;
      if (next) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch {}
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
      return next;
    });
  }, []);

  // Sync with browser native fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isStudioFullscreen) {
        setIsStudioFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isStudioFullscreen]);

  // Global keyboard shortcuts for studio fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        const isStudio =
          viewMode === 'playground_3d' ||
          viewMode === 'editor_2d' ||
          viewMode === 'split_studio';
        if (isStudio) {
          e.preventDefault();
          toggleStudioFullscreen();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        const isStudio =
          viewMode === 'playground_3d' ||
          viewMode === 'editor_2d' ||
          viewMode === 'split_studio';
        if (isStudio) {
          e.preventDefault();
          if (isStudioFullscreen) {
            setShowFullscreenDrawer((prev) => !prev);
          } else {
            setCatalogOpen((prev) => !prev);
          }
        }
      } else if (e.key === 'Escape' && isStudioFullscreen) {
        e.preventDefault();
        setIsStudioFullscreen(false);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isStudioFullscreen, toggleStudioFullscreen]);

  // Sync offices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offices));
    } catch {
      // Ignore quota errors
    }
  }, [offices]);

  const activeOffice =
    offices.find((o) => o.id === selectedOfficeId) || offices[0];

  const handleSelectOffice = useCallback((officeId: string) => {
    setSelectedOfficeId(officeId);
    setSelectedFurnitureId(null);
  }, []);

  const handleSelectOfficeAndMode = useCallback(
    (officeId: string, mode: WorkspaceViewMode) => {
      setSelectedOfficeId(officeId);
      setViewMode(mode);
      setSelectedFurnitureId(null);
    },
    []
  );

  // Update active office metadata or architecture
  const handleUpdateActiveOffice = useCallback(
    (patch: Partial<OfficeSpace>) => {
      if (!activeOffice) return;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? { ...o, ...patch, updatedAt: new Date().toISOString() }
            : o
        )
      );
    },
    [activeOffice]
  );

  const handleUpdateVertices = useCallback(
    (vertices: Point2D[]) => {
      handleUpdateActiveOffice({ vertices });
    },
    [handleUpdateActiveOffice]
  );

  const handleUpdateWallFeatures = useCallback(
    (wallFeatures: WallFeature[]) => {
      handleUpdateActiveOffice({ wallFeatures });
    },
    [handleUpdateActiveOffice]
  );

  // Furniture CRUD operations inside the active office
  const handleAddFurnitureAt = useCallback(
    (type: FurnitureType, x: number, z: number) => {
      if (!activeOffice) return;
      const entry =
        FURNITURE_CATALOG.find((c) => c.type === type) || FURNITURE_CATALOG[0];
      const newItem: FurnitureItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: entry.type,
        name: entry.name,
        x: Number(x.toFixed(2)),
        z: Number(z.toFixed(2)),
        rotation: 0,
        scale: 1,
        primaryColor: entry.defaultPrimaryColor,
        accentColor: entry.defaultAccentColor,
      };
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                furniture: [...o.furniture, newItem],
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      setSelectedFurnitureId(newItem.id);
    },
    [activeOffice]
  );

  const handleAddFurnitureDefaultSpot = useCallback(
    (type: FurnitureType) => {
      if (!activeOffice) return;
      const centroid = computePolygonCentroid(activeOffice.vertices);
      const count = activeOffice.furniture.length;
      const offsetX = ((count % 3) - 1) * 0.85;
      const offsetZ = (Math.floor(count / 3) % 3 - 1) * 0.85;
      handleAddFurnitureAt(type, centroid.x + offsetX, centroid.z + offsetZ);
    },
    [activeOffice, handleAddFurnitureAt]
  );

  const handleUpdateFurniture = useCallback(
    (id: string, patch: Partial<FurnitureItem>) => {
      if (!activeOffice) return;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                furniture: o.furniture.map((f) =>
                  f.id === id ? { ...f, ...patch } : f
                ),
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
    },
    [activeOffice]
  );

  const handleDeleteFurniture = useCallback(
    (id: string) => {
      if (!activeOffice) return;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                furniture: o.furniture.filter((f) => f.id !== id),
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      if (selectedFurnitureId === id) {
        setSelectedFurnitureId(null);
      }
    },
    [activeOffice, selectedFurnitureId]
  );

  const handleDuplicateFurniture = useCallback(
    (id: string) => {
      if (!activeOffice) return;
      const source = activeOffice.furniture.find((f) => f.id === id);
      if (!source) return;
      const copy: FurnitureItem = {
        ...source,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: Number((source.x + 0.75).toFixed(2)),
        z: Number((source.z + 0.75).toFixed(2)),
      };
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                furniture: [...o.furniture, copy],
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      setSelectedFurnitureId(copy.id);
    },
    [activeOffice]
  );

  // Agent System Handlers
  const handleUpdateAgent = useCallback(
    (agentId: string, patch: Partial<OfficeAgent>) => {
      if (!activeOffice) return;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                agents: (o.agents || []).map((a) =>
                  a.id === agentId ? { ...a, ...patch } : a
                ),
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
    },
    [activeOffice]
  );

  const handleDeleteAgent = useCallback(
    (agentId: string) => {
      if (!activeOffice) return;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                agents: (o.agents || []).filter((a) => a.id !== agentId),
                accounting: o.accounting
                  ? {
                      ...o.accounting,
                      managedByAgentIds: (o.accounting.managedByAgentIds || []).filter(
                        (id) => id !== agentId
                      ),
                    }
                  : o.accounting,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      if (selectedAgentId === agentId) {
        setSelectedAgentId(null);
      }
      if (chatAgent?.id === agentId) {
        setChatAgent(null);
      }
    },
    [activeOffice, selectedAgentId, chatAgent]
  );

  const handleSaveAgent = useCallback(
    (savedAgent: OfficeAgent, isNew: boolean) => {
      if (!activeOffice) return;
      setOffices((prev) =>
        prev.map((o) => {
          if (o.id !== activeOffice.id) return o;
          const currentAgents = o.agents || [];
          let updatedAgents: OfficeAgent[];
          if (isNew) {
            updatedAgents = [...currentAgents, savedAgent];
          } else {
            updatedAgents = currentAgents.map((a) =>
              a.id === savedAgent.id ? savedAgent : a
            );
          }
          let updatedAccounting = o.accounting;
          if (savedAgent.isAccountingAgent && updatedAccounting) {
            const currentManagers = updatedAccounting.managedByAgentIds || [];
            if (!currentManagers.includes(savedAgent.id)) {
              updatedAccounting = {
                ...updatedAccounting,
                managedByAgentIds: [...currentManagers, savedAgent.id],
              };
            }
          }
          return {
            ...o,
            agents: updatedAgents,
            accounting: updatedAccounting,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [activeOffice]
  );

  const handleUpdateAccounting = useCallback(
    (patch: Partial<OfficeAccounting>) => {
      if (!activeOffice || !activeOffice.accounting) return;
      setOffices((prev) =>
        prev.map((o) =>
          o.id === activeOffice.id
            ? {
                ...o,
                accounting: { ...o.accounting!, ...patch },
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
    },
    [activeOffice]
  );

  // Office CRUD operations
  const handleSaveOfficeModal = (officeData: OfficeSpace, isNew: boolean) => {
    if (isNew) {
      const area = computePolygonArea(officeData.vertices);
      const agents =
        officeData.agents && officeData.agents.length > 0
          ? officeData.agents
          : getDefaultAgentsForOffice(officeData.id, officeData.department);
      const defaultAcc = getDefaultAccountingForOffice(officeData.id, area, agents);
      const accounting: OfficeAccounting = officeData.accounting
        ? {
            ...defaultAcc,
            ...officeData.accounting,
            invoices:
              officeData.accounting.invoices && officeData.accounting.invoices.length > 0
                ? officeData.accounting.invoices
                : defaultAcc.invoices,
            managedByAgentIds:
              officeData.accounting.managedByAgentIds && officeData.accounting.managedByAgentIds.length > 0
                ? officeData.accounting.managedByAgentIds
                : defaultAcc.managedByAgentIds,
          }
        : defaultAcc;

      const completeNewOffice: OfficeSpace = {
        ...officeData,
        agents,
        accounting,
      };
      setOffices((prev) => [...prev, completeNewOffice]);
      setSelectedOfficeId(completeNewOffice.id);
      setViewMode('playground_3d');
      setSelectedFurnitureId(null);
    } else {
      setOffices((prev) =>
        prev.map((o) =>
          o.id === officeData.id
            ? {
                ...o,
                ...officeData,
                accounting: officeData.accounting
                  ? { ...o.accounting, ...officeData.accounting }
                  : o.accounting,
              }
            : o
        )
      );
    }
  };

  const handleDuplicateOffice = (officeId: string) => {
    const src = offices.find((o) => o.id === officeId);
    if (!src) return;
    const now = Date.now();
    const duplicatedAgents = (src.agents || []).map((a, idx) => ({
      ...a,
      id: `agent-${now}-${idx}`,
      officeId: `office-${now}`,
    }));

    const duplicated: OfficeSpace = {
      ...src,
      id: `office-${now}`,
      name: `${src.name} (Copy)`,
      code: `${src.code}-B`,
      vertices: src.vertices.map((v) => ({ ...v })),
      wallFeatures: (src.wallFeatures || []).map((wf, idx) => ({
        ...wf,
        id: `wf-${now}-${idx}`,
      })),
      furniture: src.furniture.map((f, idx) => ({
        ...f,
        id: `item-${now}-${idx}`,
      })),
      agents: duplicatedAgents,
      accounting: src.accounting
        ? {
            ...src.accounting,
            officeId: `office-${now}`,
            managedByAgentIds: duplicatedAgents.slice(0, 1).map((a) => a.id),
          }
        : getDefaultAccountingForOffice(
            `office-${now}`,
            computePolygonArea(src.vertices),
            duplicatedAgents
          ),
      updatedAt: new Date().toISOString(),
    };
    setOffices((prev) => [...prev, duplicated]);
    setSelectedOfficeId(duplicated.id);
  };

  const handleDeleteOffice = (officeId: string) => {
    if (offices.length <= 1) return;
    const target = offices.find((o) => o.id === officeId);
    const parentReplacement = target?.parentOfficeId || null;

    const remaining = offices
      .filter((o) => o.id !== officeId)
      .map((o) =>
        o.parentOfficeId === officeId
          ? { ...o, parentOfficeId: parentReplacement }
          : o
      );
    setOffices(remaining);
    if (selectedOfficeId === officeId && remaining[0]) {
      setSelectedOfficeId(remaining[0].id);
      setSelectedFurnitureId(null);
    }
  };

  const handleResetAllToPresets = () => {
    setOffices(INITIAL_OFFICES);
    setSelectedOfficeId(INITIAL_OFFICES[0].id);
    setSelectedFurnitureId(null);
  };

  // Group offices by floor level descending for sidebar navigation
  const floorLevels = Array.from(new Set(offices.map((o) => o.floorLevel))).sort(
    (a, b) => b - a
  );

  const activeOfficeArea = activeOffice
    ? computePolygonArea(activeOffice.vertices)
    : 0;
  const activeOfficeSeats = activeOffice
    ? activeOffice.furniture.reduce((acc, f) => {
        const cat = FURNITURE_CATALOG.find((c) => c.type === f.type);
        return acc + (cat ? cat.seatCapacity : 0);
      }, 0)
    : 0;

  return (
    <div className="min-h-screen md:h-screen w-screen flex flex-col bg-[#0b1120] text-slate-100 overflow-y-auto md:overflow-hidden">
      {/* TOP BAR CONTRACT: Strictly 3 zones separated by gap-8 */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-8 px-4 sm:px-6 bg-[#090e1a] border-b border-white/10 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setViewMode('dashboard');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
        >
          Office Studio @V
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('dashboard');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'dashboard'
                ? 'text-white underline underline-offset-8 decoration-sky-400 decoration-2'
                : ''
            }`}
          >
            Dashboard
          </a>
          <a
            href="#hierarchy"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('hierarchy');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'hierarchy'
                ? 'text-white underline underline-offset-8 decoration-sky-400 decoration-2'
                : ''
            }`}
          >
            Hierarchy
          </a>
          <a
            href="#playground-3d"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('playground_3d');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'playground_3d'
                ? 'text-white underline underline-offset-8 decoration-sky-400 decoration-2'
                : ''
            }`}
          >
            3D Playground
          </a>
          <a
            href="#floor-cad"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('editor_2d');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'editor_2d'
                ? 'text-white underline underline-offset-8 decoration-sky-400 decoration-2'
                : ''
            }`}
          >
            2D Floor CAD
          </a>
          <a
            href="#split-studio"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('split_studio');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'split_studio'
                ? 'text-white underline underline-offset-8 decoration-sky-400 decoration-2'
                : ''
            }`}
          >
            Split Studio
          </a>
          <a
            href="#accounting"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('accounting');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              viewMode === 'accounting'
                ? 'text-white underline underline-offset-8 decoration-emerald-400 decoration-2'
                : ''
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accounting & Finance</span>
          </a>
        </nav>

        {/* Zone 3: Primary action button + Agent Manager Quick Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditingAgent(null);
              setIsAgentManagerOpen(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-white/10 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Configure Agents & Hierarchy"
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Agents</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded-full text-slate-300">
              {activeOffice?.agents?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingOffice(null);
              setDefaultParentId(activeOffice?.id || null);
              setModalOpen(true);
            }}
            className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            New Office
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTAINER: Left Sidebar (Top on mobile) + Center Viewport + Right Inspector */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
        {/* SECTION 1 ON MOBILE / LEFT SIDEBAR ON DESKTOP: Company Spatial Views */}
        {sidebarOpen ? (
          <aside className="w-full md:w-64 shrink-0 bg-[#090e1a] border-b md:border-b-0 md:border-r border-white/10 flex flex-col select-none md:h-full overflow-hidden">
            {/* Overview & Hierarchy Links (Collapsible Section) */}
            <div className="p-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => setSpatialViewsOpen((prev) => !prev)}
                className="w-full px-2 py-1 flex items-center justify-between text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors group"
                title={spatialViewsOpen ? 'Collapse Company Spatial Views' : 'Expand Company Spatial Views'}
              >
                <span>Company Spatial Views</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                    spatialViewsOpen ? '' : '-rotate-90'
                  }`}
                />
              </button>

              {spatialViewsOpen && (
                <div className="mt-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('dashboard')}
                    className={`w-full px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                      viewMode === 'dashboard'
                        ? 'bg-sky-500/15 text-sky-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <LayoutGrid className="w-4 h-4 text-sky-400" />
                      <span>Whole Layout Dashboard</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {offices.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('hierarchy')}
                    className={`w-full px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                      viewMode === 'hierarchy'
                        ? 'bg-sky-500/15 text-sky-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <GitBranch className="w-4 h-4 text-sky-400" />
                      <span>Office Hierarchy Tree</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      Org
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('accounting')}
                    className={`w-full px-2.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                      viewMode === 'accounting'
                        ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Accounting & Finance</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Seamless Office Switcher Grouped by Floor Level (Collapsible Floors) */}
            <div className="max-h-56 md:max-h-none md:flex-1 overflow-y-auto p-3 space-y-3">
              {floorLevels.map((floor) => {
                const floorOffices = offices.filter((o) => o.floorLevel === floor);
                const isFloorCollapsed = Boolean(collapsedFloors[floor]);
                return (
                  <div key={floor} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleFloorCollapse(floor)}
                      className="w-full px-2 py-0.5 flex items-center justify-between text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors group"
                      title={isFloorCollapsed ? `Expand Floor 0${floor}` : `Collapse Floor 0${floor}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronDown
                          className={`w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                            isFloorCollapsed ? '-rotate-90' : ''
                          }`}
                        />
                        <span>Floor 0{floor}</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {floorOffices.length} {floorOffices.length === 1 ? 'suite' : 'suites'}
                      </span>
                    </button>

                    {!isFloorCollapsed && (
                      <div className="space-y-1 pt-0.5">

                    {floorOffices.map((off) => {
                      const isSel = off.id === activeOffice?.id;
                      const isStudioMode =
                        viewMode === 'playground_3d' ||
                        viewMode === 'editor_2d' ||
                        viewMode === 'split_studio';
                      const sqM = computePolygonArea(off.vertices);

                      return (
                        <div
                          key={off.id}
                          onClick={() => {
                            handleSelectOffice(off.id);
                            if (!isStudioMode) {
                              setViewMode('playground_3d');
                            }
                          }}
                          className={`group px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                            isSel && isStudioMode
                              ? 'bg-sky-500 text-slate-950 font-semibold'
                              : isSel
                              ? 'bg-white/10 text-white font-medium'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs truncate">{off.name}</div>
                            <div
                              className={`text-[11px] font-mono tabular-nums truncate ${
                                isSel && isStudioMode
                                  ? 'text-slate-900/80'
                                  : 'text-slate-500'
                              }`}
                            >
                              {off.code} · {sqM.toFixed(0)}m² · {off.furniture.length} items
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOffice(off);
                                setModalOpen(true);
                              }}
                              className={`p-1 rounded ${
                                isSel && isStudioMode
                                  ? 'hover:bg-slate-900/15 text-slate-900'
                                  : 'hover:bg-white/10 text-slate-400 hover:text-white'
                              }`}
                              title="Edit Office"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            {offices.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOffice(off.id);
                                }}
                                className={`p-1 rounded ${
                                  isSel && isStudioMode
                                    ? 'hover:bg-slate-900/15 text-slate-900'
                                    : 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                                }`}
                                title="Delete Office"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer Action */}
            <div className="p-2.5 md:p-3 border-t border-white/10 bg-slate-950/50">
              <button
                type="button"
                onClick={() => {
                  setEditingOffice(null);
                  setDefaultParentId(activeOffice?.id || null);
                  setModalOpen(true);
                }}
                className="w-full py-1.5 md:py-2 px-3 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>Add Office Suite</span>
              </button>
            </div>
          </aside>
        ) : (
          <div className="w-full md:w-auto px-4 py-2 bg-slate-950/80 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-between text-xs shrink-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-medium"
            >
              <PanelLeftOpen className="w-4 h-4 text-sky-400" />
              <span>Show Company Spatial Views</span>
            </button>
          </div>
        )}

        {/* CENTER WORKSPACE VIEWPORT (Sections 2 and 3 on Mobile) */}
        <main className="flex-1 flex flex-col min-w-0 md:h-full md:overflow-hidden">
          {viewMode === 'dashboard' || viewMode === 'hierarchy' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <CompanyDashboard
                offices={offices}
                selectedOfficeId={activeOffice.id}
                viewMode={viewMode}
                onSelectOfficeAndMode={handleSelectOfficeAndMode}
                onOpenCreateModal={(parentId) => {
                  setEditingOffice(null);
                  setDefaultParentId(parentId ?? null);
                  setModalOpen(true);
                }}
                onOpenEditModal={(off) => {
                  setEditingOffice(off);
                  setModalOpen(true);
                }}
                onDuplicateOffice={handleDuplicateOffice}
                onDeleteOffice={handleDeleteOffice}
                onResetAllToPresets={handleResetAllToPresets}
              />
            </div>
          ) : viewMode === 'accounting' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090e1a]">
              <AccountingPanel
                office={activeOffice}
                onUpdateAccounting={handleUpdateAccounting}
                onOpenAgentChat={(ag) => setChatAgent(ag)}
                onOpenAgentManager={(ag) => {
                  setEditingAgent(ag || null);
                  setIsAgentManagerOpen(true);
                }}
              />
            </div>
          ) : (
            /* ACTIVE OFFICE 3D / 2D / SPLIT STUDIO WORKSPACE (Section 2 & 3 on Mobile) */
            <div
              className={
                isStudioFullscreen
                  ? 'fixed inset-0 z-50 w-screen h-screen bg-[#090e1a] flex flex-col overflow-hidden'
                  : 'flex-1 flex flex-col min-w-0 md:h-full md:overflow-hidden'
              }
            >
              {/* Contextual Studio Sub-Toolbar */}
              <div
                className={`shrink-0 px-3 sm:px-4 bg-[#0f172a] border-b border-white/10 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 py-2 ${
                  isStudioFullscreen ? 'h-14 bg-slate-950/95 backdrop-blur-md' : 'md:h-12'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {!isStudioFullscreen && (
                    <button
                      type="button"
                      onClick={() => setSidebarOpen((prev) => !prev)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"
                      title={sidebarOpen ? 'Collapse Company Views' : 'Expand Company Views'}
                    >
                      {sidebarOpen ? (
                        <PanelLeftClose className="w-4 h-4" />
                      ) : (
                        <PanelLeftOpen className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <span className="font-mono text-sky-400 font-semibold shrink-0">
                      {activeOffice.code}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">/</span>
                    <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-none">
                      {activeOffice.name}
                    </span>
                    <span className="text-slate-600 hidden lg:inline" aria-hidden="true">·</span>
                    <span className="text-slate-400 hidden lg:inline whitespace-nowrap">
                      Floor 0{activeOffice.floorLevel} · {activeOffice.department}
                    </span>
                    <span className="text-slate-600 hidden xl:inline" aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-300 hidden xl:inline whitespace-nowrap">
                      {activeOfficeArea.toFixed(1)} m² · {activeOfficeSeats} Seats
                    </span>
                  </div>
                </div>

                {/* Studio Controls: Mode Switcher + Fullscreen / Drawer Toggles */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-slate-950 border border-white/10 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setViewMode('playground_3d')}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 sm:gap-1.5 ${
                        viewMode === 'playground_3d'
                          ? 'bg-sky-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">3D WebGL World</span>
                      <span className="sm:hidden">3D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('editor_2d')}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 sm:gap-1.5 ${
                        viewMode === 'editor_2d'
                          ? 'bg-sky-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">2D Floor Shape</span>
                      <span className="sm:hidden">2D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('split_studio')}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 sm:gap-1.5 ${
                        viewMode === 'split_studio'
                          ? 'bg-sky-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Split 2D + 3D</span>
                      <span className="sm:hidden">Split</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingAgent(null);
                        setIsAgentManagerOpen(true);
                      }}
                      className="px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-300 hover:text-white hover:bg-white/5"
                      title="Manage Office Agents & Hierarchy"
                    >
                      <Bot className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Agents</span>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1 rounded">
                        {activeOffice.agents?.length || 0}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('accounting')}
                      className="px-2 sm:px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-300 hover:text-white hover:bg-white/5"
                      title="Open Accounting & Finance Panel"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Accounting</span>
                    </button>
                  </div>

                  {isStudioFullscreen ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowFullscreenDrawer((prev) => !prev)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          showFullscreenDrawer
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                        }`}
                        title="Toggle Furniture Catalog & Specs Panel"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Catalog & Specs</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleStudioFullscreen}
                        className="px-3 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                        title="Exit Fullscreen Mode (Esc or F)"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Exit Fullscreen</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setCatalogOpen((prev) => !prev)}
                        className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          catalogOpen
                            ? 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                            : 'bg-sky-500/20 border-sky-400/40 text-sky-200 hover:bg-sky-500/30'
                        }`}
                        title={catalogOpen ? 'Collapse Catalog Panel (C)' : 'Expand Catalog Panel (C)'}
                      >
                        {catalogOpen ? (
                          <>
                            <PanelRightClose className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Collapse Catalog</span>
                            <span className="sm:hidden">Catalog</span>
                          </>
                        ) : (
                          <>
                            <PanelRightOpen className="w-3.5 h-3.5 text-sky-400" />
                            <span>Catalog</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={toggleStudioFullscreen}
                        className="px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                        title="Enter Fullscreen Mode (F)"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* SECTION 2 & 3: Main Studio Canvas + Catalog Section */}
              <div className="relative flex-1 flex flex-col md:flex-row min-h-0 md:overflow-hidden">
                {/* SECTION 2 ON MOBILE: 3D/2D Viewport Area */}
                <div
                  className={`w-full md:flex-1 shrink-0 min-w-0 relative overflow-hidden ${
                    viewMode === 'split_studio'
                      ? 'h-[640px] sm:h-[700px] md:h-full'
                      : 'h-[420px] sm:h-[480px] md:h-full'
                  }`}
                >
                  {viewMode === 'playground_3d' && (
                    <Office3DCanvas
                      office={activeOffice}
                      selectedFurnitureId={selectedFurnitureId}
                      onSelectFurniture={setSelectedFurnitureId}
                      selectedAgentId={selectedAgentId}
                      onSelectAgent={setSelectedAgentId}
                      onOpenAgentChat={(ag) => setChatAgent(ag)}
                      onUpdateFurniture={handleUpdateFurniture}
                      onAddFurnitureAt={handleAddFurnitureAt}
                      onDeleteFurniture={handleDeleteFurniture}
                      onDuplicateFurniture={handleDuplicateFurniture}
                      onUpdateOfficeMeta={handleUpdateActiveOffice}
                      draggingCatalogType={draggingCatalogType}
                      snapToGrid={snapToGrid}
                      onToggleSnapToGrid={() => setSnapToGrid((s) => !s)}
                      isFullscreen={isStudioFullscreen}
                      onToggleFullscreen={toggleStudioFullscreen}
                    />
                  )}

                  {viewMode === 'editor_2d' && (
                    <Office2DCanvas
                      office={activeOffice}
                      selectedFurnitureId={selectedFurnitureId}
                      onSelectFurniture={setSelectedFurnitureId}
                      selectedAgentId={selectedAgentId}
                      onSelectAgent={setSelectedAgentId}
                      onUpdateVertices={handleUpdateVertices}
                      onUpdateWallFeatures={handleUpdateWallFeatures}
                      onUpdateFurniture={handleUpdateFurniture}
                      onDeleteFurniture={handleDeleteFurniture}
                      onAddFurnitureAt={handleAddFurnitureAt}
                      onUpdateAgent={handleUpdateAgent}
                      onDeleteAgent={handleDeleteAgent}
                      onOpenAgentChat={(ag) => setChatAgent(ag)}
                      onOpenAgentManager={(ag) => {
                        setEditingAgent(ag || null);
                        setIsAgentManagerOpen(true);
                      }}
                      onBatchUpdateOffice={handleUpdateActiveOffice}
                      draggingCatalogType={draggingCatalogType}
                      snapToGrid={snapToGrid}
                      onToggleSnapToGrid={() => setSnapToGrid((s) => !s)}
                      isFullscreen={isStudioFullscreen}
                      onToggleFullscreen={toggleStudioFullscreen}
                    />
                  )}

                  {viewMode === 'split_studio' && (
                    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                      <div className="w-full h-full min-h-0 overflow-hidden">
                        <Office2DCanvas
                          office={activeOffice}
                          selectedFurnitureId={selectedFurnitureId}
                          onSelectFurniture={setSelectedFurnitureId}
                          selectedAgentId={selectedAgentId}
                          onSelectAgent={setSelectedAgentId}
                          onUpdateVertices={handleUpdateVertices}
                          onUpdateWallFeatures={handleUpdateWallFeatures}
                          onUpdateFurniture={handleUpdateFurniture}
                          onDeleteFurniture={handleDeleteFurniture}
                          onAddFurnitureAt={handleAddFurnitureAt}
                          onUpdateAgent={handleUpdateAgent}
                          onDeleteAgent={handleDeleteAgent}
                          onOpenAgentChat={(ag) => setChatAgent(ag)}
                          onOpenAgentManager={(ag) => {
                            setEditingAgent(ag || null);
                            setIsAgentManagerOpen(true);
                          }}
                          onBatchUpdateOffice={handleUpdateActiveOffice}
                          draggingCatalogType={draggingCatalogType}
                          snapToGrid={snapToGrid}
                          onToggleSnapToGrid={() => setSnapToGrid((s) => !s)}
                          compactMode
                          isFullscreen={isStudioFullscreen}
                          onToggleFullscreen={toggleStudioFullscreen}
                        />
                      </div>
                      <div className="w-full h-full min-h-0 overflow-hidden">
                        <Office3DCanvas
                          office={activeOffice}
                          selectedFurnitureId={selectedFurnitureId}
                          onSelectFurniture={setSelectedFurnitureId}
                          selectedAgentId={selectedAgentId}
                          onSelectAgent={setSelectedAgentId}
                          onOpenAgentChat={(ag) => setChatAgent(ag)}
                          onUpdateFurniture={handleUpdateFurniture}
                          onAddFurnitureAt={handleAddFurnitureAt}
                          onDeleteFurniture={handleDeleteFurniture}
                          onDuplicateFurniture={handleDuplicateFurniture}
                          onUpdateOfficeMeta={handleUpdateActiveOffice}
                          draggingCatalogType={draggingCatalogType}
                          snapToGrid={snapToGrid}
                          onToggleSnapToGrid={() => setSnapToGrid((s) => !s)}
                          compactMode
                          isFullscreen={isStudioFullscreen}
                          onToggleFullscreen={toggleStudioFullscreen}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3 ON MOBILE: Right Furniture Catalog & Room Spec Inspector Panel (Collapsible) */}
                {((!isStudioFullscreen && catalogOpen) ||
                  (isStudioFullscreen && showFullscreenDrawer)) && (
                  <div
                    className={
                      isStudioFullscreen
                        ? 'absolute top-0 right-0 bottom-0 z-40 shadow-2xl flex'
                        : 'w-full md:w-80 xl:w-88 shrink-0 flex transition-all duration-200'
                    }
                  >
                    <OfficeInspectorPanel
                      office={activeOffice}
                      allOffices={offices}
                      selectedFurnitureId={selectedFurnitureId}
                      onSelectFurniture={setSelectedFurnitureId}
                      onAddFurniture={handleAddFurnitureDefaultSpot}
                      onUpdateFurniture={handleUpdateFurniture}
                      onDeleteFurniture={handleDeleteFurniture}
                      onDuplicateFurniture={handleDuplicateFurniture}
                      onUpdateOffice={handleUpdateActiveOffice}
                      onStartDragCatalogType={setDraggingCatalogType}
                      onClose={() => {
                        if (isStudioFullscreen) {
                          setShowFullscreenDrawer(false);
                        } else {
                          setCatalogOpen(false);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Floating Expand Catalog Button when catalog is collapsed in normal studio mode */}
                {!catalogOpen && !isStudioFullscreen && (
                  <button
                    type="button"
                    onClick={() => setCatalogOpen(true)}
                    className="absolute top-4 right-4 z-20 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/15 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-medium transition-all hover:scale-105 group"
                    title="Expand Furniture Catalog & Room Specs (C)"
                  >
                    <Package className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>Expand Catalog</span>
                    <PanelRightOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Office Suite Modal */}
      <OfficeFormModal
        isOpen={modalOpen}
        editingOffice={editingOffice}
        defaultParentId={defaultParentId}
        allOffices={offices}
        onClose={() => setModalOpen(false)}
        onSaveOffice={handleSaveOfficeModal}
      />

      {/* Interactive Agent Chat Modal with individual API keys */}
      {chatAgent && activeOffice && (
        <AgentChatModal
          agent={chatAgent}
          office={activeOffice}
          onClose={() => setChatAgent(null)}
          onOpenAgentManager={(ag: OfficeAgent) => {
            setChatAgent(null);
            setEditingAgent(ag);
            setIsAgentManagerOpen(true);
          }}
        />
      )}

      {/* Agent Manager Modal (Create, Edit hierarchy, Roles, Delete) */}
      {activeOffice && (
        <AgentManagerModal
          isOpen={isAgentManagerOpen}
          agent={editingAgent}
          office={activeOffice}
          existingAgents={activeOffice.agents || []}
          onClose={() => {
            setIsAgentManagerOpen(false);
            setEditingAgent(null);
          }}
          onSaveAgent={handleSaveAgent}
          onDeleteAgent={handleDeleteAgent}
        />
      )}
    </div>
  );
}
