import React, { useState } from 'react';
import {
  Plus,
  Search,
  Sliders,
  Layers,
  Package,
  Trash2,
  Copy,
  RotateCw,
  GripVertical,
  PanelRightClose,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  FLOOR_MATERIAL_CONFIG,
  FLOOR_SHAPE_PRESETS,
  FURNITURE_CATALOG,
  WALL_STYLE_CONFIG,
} from '../presets';
import {
  FloorMaterial,
  FurnitureCategory,
  FurnitureItem,
  FurnitureType,
  OfficeDepartment,
  OfficeSpace,
  WallStyle,
} from '../types';

interface OfficeInspectorPanelProps {
  office: OfficeSpace;
  allOffices: OfficeSpace[];
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
  onAddFurniture: (type: FurnitureType) => void;
  onUpdateFurniture: (id: string, patch: Partial<FurnitureItem>) => void;
  onDeleteFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
  onUpdateOffice: (patch: Partial<OfficeSpace>) => void;
  onStartDragCatalogType: (type: FurnitureType | null) => void;
  onClose?: () => void;
}

const CATEGORIES: { id: FurnitureCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'workstations', label: 'Desks' },
  { id: 'tables', label: 'Tables' },
  { id: 'seating', label: 'Seating' },
  { id: 'tech_pods', label: 'Tech & Pods' },
  { id: 'storage', label: 'Storage' },
  { id: 'decor', label: 'Zones & Decor' },
];

const MATERIAL_SWATCHES = [
  '#5c4033',
  '#d6b892',
  '#1e293b',
  '#334155',
  '#f8fafc',
  '#0284c7',
  '#0f766e',
  '#d97706',
  '#15803d',
  '#78350f',
];

export const OfficeInspectorPanel: React.FC<OfficeInspectorPanelProps> = ({
  office,
  allOffices,
  selectedFurnitureId,
  onSelectFurniture,
  onAddFurniture,
  onUpdateFurniture,
  onDeleteFurniture,
  onDuplicateFurniture,
  onUpdateOffice,
  onStartDragCatalogType,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'inspector' | 'architecture'>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<FurnitureCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const selectedItem =
    office.furniture.find((f) => f.id === selectedFurnitureId) || null;

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <aside className="w-full md:w-80 xl:w-88 shrink-0 h-[520px] md:h-full bg-[#0f172a] border-t md:border-t-0 md:border-l border-white/10 flex flex-col select-none overflow-hidden">
      {/* Top Header with Title and Collapse Panel Action */}
      <div className="px-3 py-2 border-b border-white/10 bg-slate-950/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-white tracking-wide truncate">
            Catalog & Room Specs
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px]"
            title="Collapse Catalog Section"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        )}
      </div>

      {/* Top Segmented Mode Tabs */}
      <div className="p-2 border-b border-white/10 bg-slate-950/40">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Placed ({office.furniture.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Room Spec</span>
          </button>
        </div>
      </div>

      {/* Contextual Selected Item Banner if User is on Catalog Tab */}
      {selectedItem && activeTab === 'catalog' && (
        <div className="px-3 py-2 bg-sky-950/50 border-b border-sky-500/30 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-sky-200 truncate">
              Selected: {selectedItem.label || selectedItem.name}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-sky-300/80">
              ({selectedItem.x.toFixed(1)}m, {selectedItem.z.toFixed(1)}m) · {selectedItem.rotation}°
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className="px-2.5 py-1 text-xs font-medium bg-sky-500 text-slate-950 rounded-md hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0"
          >
            Customize
          </button>
        </div>
      )}

      {/* TAB 1: 3D FURNITURE DRAG-AND-DROP CATALOG */}
      {activeTab === 'catalog' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 space-y-2.5 border-b border-white/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 3D furniture & pods..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat.id
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              Drag any item directly into the 3D WebGL scene or 2D floorplan, or click Add.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const items = filteredCatalog.filter((item) => item.category === cat.id);
              if (items.length === 0) return null;
              const isCollapsed = Boolean(collapsedCategories[cat.id]);

              return (
                <div key={cat.id} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-white/5 rounded-md transition-colors group"
                  >
                    <span className="flex items-center gap-1.5">
                      <ChevronDown
                        className={`w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-500">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2 pl-0.5">
                      {items.map((entry) => (
                        <div
                          key={entry.type}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-furniture-type', entry.type);
                            e.dataTransfer.effectAllowed = 'copy';
                            onStartDragCatalogType(entry.type);
                          }}
                          onDragEnd={() => onStartDragCatalogType(null)}
                          className="group p-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-sky-500/40 rounded-lg transition-colors cursor-grab active:cursor-grabbing flex items-start justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="mt-0.5 text-slate-500 group-hover:text-sky-400 transition-colors shrink-0">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-100 truncate">
                                  {entry.name}
                                </span>
                                <span
                                  className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20"
                                  style={{ backgroundColor: entry.defaultPrimaryColor }}
                                />
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                {entry.description}
                              </p>
                              <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-1">
                                {entry.width}m × {entry.depth}m × {entry.height}m
                                {entry.seatCapacity > 0 && ` · ${entry.seatCapacity} Seats`}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onAddFurniture(entry.type)}
                            className="px-2.5 py-1.5 text-xs font-medium bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-slate-950 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                            title={`Add ${entry.name} to office`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SELECTED FURNITURE INSPECTOR & PLACED ITEMS LIST */}
      {activeTab === 'inspector' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {selectedItem ? (
            <div className="space-y-4 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selected 3D Object Properties
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDuplicateFurniture(selectedItem.id)}
                    className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                    title="Duplicate Item"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFurniture(selectedItem.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Custom Workstation / Zone Label */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Station / Zone Label
                </label>
                <input
                  type="text"
                  value={selectedItem.label || ''}
                  onChange={(e) =>
                    onUpdateFurniture(selectedItem.id, { label: e.target.value })
                  }
                  placeholder={selectedItem.name}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Coordinates X & Z */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    X Position (m)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={selectedItem.x}
                    onChange={(e) =>
                      onUpdateFurniture(selectedItem.id, {
                        x: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Z Position (m)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={selectedItem.z}
                    onChange={(e) =>
                      onUpdateFurniture(selectedItem.id, {
                        z: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Rotation & Quick Angles */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Orientation Angle</span>
                  <span className="font-mono tabular-nums text-sky-300">
                    {selectedItem.rotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={345}
                  step={15}
                  value={selectedItem.rotation}
                  onChange={(e) =>
                    onUpdateFurniture(selectedItem.id, {
                      rotation: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-sky-400"
                />
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() =>
                        onUpdateFurniture(selectedItem.id, { rotation: deg })
                      }
                      className={`py-1 text-xs font-mono tabular-nums rounded border transition-colors ${
                        selectedItem.rotation === deg
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Proportion Scale</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {(selectedItem.scale || 1).toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.4}
                  step={0.05}
                  value={selectedItem.scale || 1}
                  onChange={(e) =>
                    onUpdateFurniture(selectedItem.id, {
                      scale: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-sky-400"
                />
              </div>

              {/* Primary & Accent Material Colors */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Primary Finish Color
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MATERIAL_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          onUpdateFurniture(selectedItem.id, { primaryColor: hex })
                        }
                        className={`w-5 h-5 rounded border transition-transform ${
                          selectedItem.primaryColor.toLowerCase() === hex
                            ? 'border-sky-400 scale-110'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedItem.primaryColor}
                      onChange={(e) =>
                        onUpdateFurniture(selectedItem.id, {
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-6 h-6 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Secondary Accent Finish
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MATERIAL_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          onUpdateFurniture(selectedItem.id, { accentColor: hex })
                        }
                        className={`w-5 h-5 rounded border transition-transform ${
                          selectedItem.accentColor.toLowerCase() === hex
                            ? 'border-sky-400 scale-110'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedItem.accentColor}
                      onChange={(e) =>
                        onUpdateFurniture(selectedItem.id, {
                          accentColor: e.target.value,
                        })
                      }
                      className="w-6 h-6 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/70 border border-white/10 rounded-lg text-xs text-slate-400">
              Click any 3D object in the viewport or select an item from the inventory list below to customize its position, angle, scale, and material finish.
            </div>
          )}

          {/* Inventory of All Placed Items in This Office */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">
                Placed Office Inventory ({office.furniture.length})
              </span>
            </div>

            {office.furniture.length === 0 ? (
              <div className="p-4 text-center bg-slate-900/40 border border-white/5 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">
                  This office floor is currently unfurnished.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-3 py-1.5 text-xs font-medium bg-sky-500 text-slate-950 rounded-md hover:bg-sky-400 transition-colors"
                >
                  Browse 3D Furniture Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {office.furniture.map((item) => {
                  const isSel = item.id === selectedFurnitureId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectFurniture(item.id)}
                      className={`px-2.5 py-2 rounded-lg border cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        isSel
                          ? 'bg-sky-500/15 border-sky-400/50 text-white'
                          : 'bg-slate-900/80 border-white/5 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 border border-white/20"
                          style={{ backgroundColor: item.primaryColor }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">
                            {item.label || item.name}
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-slate-500">
                            ({item.x.toFixed(1)}m, {item.z.toFixed(1)}m) · {item.rotation}°
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateFurniture(item.id, {
                              rotation: ((item.rotation || 0) + 45) % 360,
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Rotate +45°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFurniture(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ROOM ARCHITECTURE, MATERIALS & HIERARCHY METADATA */}
      {activeTab === 'architecture' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-2.5 pb-4 border-b border-white/10">
            <h3 className="text-xs font-semibold text-slate-200">
              Office Identity & Hierarchy
            </h3>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Office Name
              </label>
              <input
                type="text"
                value={office.name}
                onChange={(e) => onUpdateOffice({ name: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Room Code
                </label>
                <input
                  type="text"
                  value={office.code}
                  onChange={(e) => onUpdateOffice({ code: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Floor Level
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={office.floorLevel}
                  onChange={(e) =>
                    onUpdateOffice({ floorLevel: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Division
                </label>
                <select
                  value={office.department}
                  onChange={(e) =>
                    onUpdateOffice({ department: e.target.value as OfficeDepartment })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                >
                  {[
                    'Executive',
                    'Engineering',
                    'Design',
                    'Research',
                    'Operations',
                    'Collaborative',
                  ].map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Reports To (Parent Office)
                </label>
                <select
                  value={office.parentOfficeId || ''}
                  onChange={(e) =>
                    onUpdateOffice({
                      parentOfficeId: e.target.value ? e.target.value : null,
                    })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                >
                  <option value="">Root (Top-Level HQ)</option>
                  {allOffices
                    .filter((o) => o.id !== office.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} — {o.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3D Flooring Material */}
          <div className="space-y-2 pb-4 border-b border-white/10">
            <h3 className="text-xs font-semibold text-slate-200">
              3D Flooring Material
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(FLOOR_MATERIAL_CONFIG) as FloorMaterial[]).map((matKey) => {
                const cfg = FLOOR_MATERIAL_CONFIG[matKey];
                const active = office.floorMaterial === matKey;
                return (
                  <button
                    key={matKey}
                    type="button"
                    onClick={() => onUpdateOffice({ floorMaterial: matKey })}
                    className={`p-2 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                      active
                        ? 'bg-sky-500/15 border-sky-400 text-white'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded shrink-0 border border-white/20"
                      style={{ backgroundColor: cfg.baseColor }}
                    />
                    <span className="text-[11px] font-medium truncate">
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wall Finish & Height */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">Wall Ceiling Height</span>
                <span className="font-mono tabular-nums text-sky-300">
                  {office.wallHeight.toFixed(1)}m
                </span>
              </div>
              <input
                type="range"
                min={2.4}
                max={4.5}
                step={0.1}
                value={office.wallHeight}
                onChange={(e) =>
                  onUpdateOffice({ wallHeight: parseFloat(e.target.value) })
                }
                className="w-full accent-sky-400"
              />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 mb-1.5">
                Architectural Wall Finish
              </h4>
              <div className="space-y-1.5">
                {(Object.keys(WALL_STYLE_CONFIG) as WallStyle[]).map((styleKey) => {
                  const cfg = WALL_STYLE_CONFIG[styleKey];
                  const active = office.wallStyle === styleKey;
                  return (
                    <button
                      key={styleKey}
                      type="button"
                      onClick={() => onUpdateOffice({ wallStyle: styleKey })}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-left transition-colors flex items-center justify-between ${
                        active
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-medium">{cfg.label}</span>
                      <span
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ backgroundColor: cfg.color }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2D Floor Footprint Templates */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              2D Floor Shape Presets
            </h3>
            <p className="text-[11px] text-slate-400">
              Replace room vertices with a standard architectural footprint, or fine-tune corners in the 2D CAD view.
            </p>
            <div className="space-y-1.5">
              {FLOOR_SHAPE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onUpdateOffice({
                      vertices: preset.vertices.map((v) => ({ ...v })),
                      wallFeatures: [],
                    })
                  }
                  className="w-full p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-left transition-colors"
                >
                  <div className="text-xs font-medium text-slate-200">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
