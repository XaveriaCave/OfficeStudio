import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import {
  FLOOR_MATERIAL_CONFIG,
  FLOOR_SHAPE_PRESETS,
  FURNITURE_CATALOG,
  WALL_STYLE_CONFIG,
} from '../presets';
import {
  FloorMaterial,
  FurnitureItem,
  OfficeDepartment,
  OfficeSpace,
  WallStyle,
} from '../types';

interface OfficeFormModalProps {
  isOpen: boolean;
  editingOffice: OfficeSpace | null;
  defaultParentId: string | null;
  allOffices: OfficeSpace[];
  onClose: () => void;
  onSaveOffice: (officeData: OfficeSpace, isNew: boolean) => void;
}

type StarterKitType = 'empty' | 'engineering_pod' | 'executive_suite' | 'design_studio';

export const OfficeFormModal: React.FC<OfficeFormModalProps> = ({
  isOpen,
  editingOffice,
  defaultParentId,
  allOffices,
  onClose,
  onSaveOffice,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState<OfficeDepartment>('Engineering');
  const [floorLevel, setFloorLevel] = useState(2);
  const [parentOfficeId, setParentOfficeId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [shapePresetId, setShapePresetId] = useState('rectangular_studio');
  const [floorMaterial, setFloorMaterial] = useState<FloorMaterial>('warm_oak');
  const [wallStyle, setWallStyle] = useState<WallStyle>('matte_alabaster');
  const [wallHeight, setWallHeight] = useState(3.2);
  const [starterKit, setStarterKit] = useState<StarterKitType>('engineering_pod');

  useEffect(() => {
    if (editingOffice) {
      setName(editingOffice.name);
      setCode(editingOffice.code);
      setDepartment(editingOffice.department);
      setFloorLevel(editingOffice.floorLevel);
      setParentOfficeId(editingOffice.parentOfficeId);
      setDescription(editingOffice.description);
      setFloorMaterial(editingOffice.floorMaterial);
      setWallStyle(editingOffice.wallStyle);
      setWallHeight(editingOffice.wallHeight);
    } else {
      const nextNum = allOffices.length + 1;
      setName(`New Spatial Studio 0${nextNum}`);
      setCode(`STD-${floorLevel}0${nextNum}`);
      setDepartment('Engineering');
      setFloorLevel(2);
      setParentOfficeId(defaultParentId ?? (allOffices[0]?.id || null));
      setDescription(
        'Configurable 3D spatial workspace with custom 2D floor polygon and interactive furniture.'
      );
      setShapePresetId('l_shaped_wing');
      setFloorMaterial('warm_oak');
      setWallStyle('matte_alabaster');
      setWallHeight(3.2);
      setStarterKit('engineering_pod');
    }
  }, [editingOffice, defaultParentId, isOpen, allOffices]);

  if (!isOpen) return null;

  const generateStarterFurniture = (kit: StarterKitType): FurnitureItem[] => {
    const now = Date.now();
    if (kit === 'empty') return [];
    if (kit === 'executive_suite') {
      return [
        {
          id: `f-${now}-1`,
          type: 'executive_desk',
          name: 'Executive L-Desk',
          label: 'Director Workstation',
          x: -2.5,
          z: -1.5,
          rotation: 0,
          scale: 1,
          primaryColor: '#5c4033',
          accentColor: '#1e293b',
        },
        {
          id: `f-${now}-2`,
          type: 'conference_table',
          name: 'Boardroom Table',
          label: 'Briefing Table',
          x: 2.0,
          z: -1.2,
          rotation: 0,
          scale: 1,
          primaryColor: '#6d4c3d',
          accentColor: '#1e293b',
        },
        {
          id: `f-${now}-3`,
          type: 'lounge_sofa',
          name: 'Modular Studio Sofa',
          x: -2.0,
          z: 2.2,
          rotation: 180,
          scale: 1,
          primaryColor: '#334155',
          accentColor: '#f59e0b',
        },
        {
          id: `f-${now}-4`,
          type: 'potted_plant',
          name: 'Architectural Ficus Tree',
          x: 4.2,
          z: 2.4,
          rotation: 0,
          scale: 1,
          primaryColor: '#15803d',
          accentColor: '#e2e8f0',
        },
      ];
    }
    if (kit === 'design_studio') {
      return [
        {
          id: `f-${now}-1`,
          type: 'standing_desk',
          name: 'Pro Standing Desk',
          label: 'Design Station 01',
          x: -3.0,
          z: -2.2,
          rotation: 0,
          scale: 1,
          primaryColor: '#d6b892',
          accentColor: '#1e293b',
        },
        {
          id: `f-${now}-2`,
          type: 'standing_desk',
          name: 'Pro Standing Desk',
          label: 'Design Station 02',
          x: -0.6,
          z: -2.2,
          rotation: 0,
          scale: 1,
          primaryColor: '#d6b892',
          accentColor: '#1e293b',
        },
        {
          id: `f-${now}-3`,
          type: 'round_meeting_table',
          name: 'Round Critique Table',
          label: 'Critique Circle',
          x: 2.4,
          z: -1.4,
          rotation: 0,
          scale: 1,
          primaryColor: '#f8fafc',
          accentColor: '#0f766e',
        },
        {
          id: `f-${now}-4`,
          type: 'bookshelf',
          name: 'Library Shelving Unit',
          x: -4.2,
          z: 2.5,
          rotation: 180,
          scale: 1,
          primaryColor: '#78350f',
          accentColor: '#1e293b',
        },
      ];
    }
    // default 'engineering_pod'
    return [
      {
        id: `f-${now}-1`,
        type: 'quad_workbench',
        name: 'Quad Engineering Pod',
        label: 'Core Squad Bench',
        x: -2.2,
        z: -2.0,
        rotation: 0,
        scale: 1,
        primaryColor: '#e2e8f0',
        accentColor: '#0284c7',
      },
      {
        id: `f-${now}-2`,
        type: 'acoustic_pod',
        name: 'Acoustic Focus Booth',
        x: 3.2,
        z: -2.2,
        rotation: 270,
        scale: 1,
        primaryColor: '#1e293b',
        accentColor: '#0ea5e9',
      },
      {
        id: `f-${now}-3`,
        type: 'whiteboard',
        name: 'Rolling Glass Board',
        x: 0.8,
        z: -2.0,
        rotation: 90,
        scale: 1,
        primaryColor: '#f8fafc',
        accentColor: '#334155',
      },
      {
        id: `f-${now}-4`,
        type: 'coffee_station',
        name: 'Barista Espresso Bar',
        x: -2.8,
        z: 2.8,
        rotation: 180,
        scale: 1,
        primaryColor: '#1e293b',
        accentColor: '#d97706',
      },
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingOffice) {
      const updated: OfficeSpace = {
        ...editingOffice,
        name: name.trim(),
        code: code.trim() || editingOffice.code,
        department,
        floorLevel,
        parentOfficeId,
        description: description.trim(),
        floorMaterial,
        wallStyle,
        wallHeight,
        updatedAt: new Date().toISOString(),
      };
      onSaveOffice(updated, false);
    } else {
      const preset =
        FLOOR_SHAPE_PRESETS.find((p) => p.id === shapePresetId) ||
        FLOOR_SHAPE_PRESETS[0];

      const newOffice: OfficeSpace = {
        id: `office-${Date.now()}`,
        name: name.trim(),
        code: code.trim() || `OFF-${floorLevel}01`,
        department,
        floorLevel,
        parentOfficeId,
        description: description.trim(),
        vertices: preset.vertices.map((v) => ({ ...v })),
        wallHeight,
        wallMode: 'smart_cutaway',
        floorMaterial,
        wallStyle,
        lightingPreset: 'daylight',
        wallFeatures: [
          { id: `wf-${Date.now()}-1`, edgeIndex: 0, type: 'window', offsetRatio: 0.5, width: 3.2 },
          { id: `wf-${Date.now()}-2`, edgeIndex: preset.vertices.length - 1, type: 'door', offsetRatio: 0.5, width: 1.4 },
        ],
        furniture: generateStarterFurniture(starterKit),
        updatedAt: new Date().toISOString(),
      };
      onSaveOffice(newOffice, true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            {editingOffice ? `Configure ${editingOffice.name}` : 'Create New 3D Office Space'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Office Suite Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Suite Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Division / Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as OfficeDepartment)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              >
                {[
                  'Executive',
                  'Engineering',
                  'Design',
                  'Research',
                  'Operations',
                  'Collaborative',
                ].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Building Floor Level
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={floorLevel}
                onChange={(e) => setFloorLevel(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Parent Office in Hierarchy
              </label>
              <select
                value={parentOfficeId || ''}
                onChange={(e) => setParentOfficeId(e.target.value || null)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              >
                <option value="">Root (Top-Level HQ)</option>
                {allOffices
                  .filter((o) => !editingOffice || o.id !== editingOffice.id)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} — {o.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Architectural Brief / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          {!editingOffice && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Initial 2D Floor Polygon Footprint
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FLOOR_SHAPE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setShapePresetId(preset.id)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        shapePresetId === preset.id
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold">{preset.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  3D Starter Furniture Kit
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'engineering_pod', label: 'Engineering Squad' },
                      { id: 'executive_suite', label: 'Executive Suite' },
                      { id: 'design_studio', label: 'Design Studio' },
                      { id: 'empty', label: 'Empty Floor Slab' },
                    ] as { id: StarterKitType; label: string }[]
                  ).map((kit) => (
                    <button
                      key={kit.id}
                      type="button"
                      onClick={() => setStarterKit(kit.id)}
                      className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-colors ${
                        starterKit === kit.id
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {kit.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Flooring Material
              </label>
              <select
                value={floorMaterial}
                onChange={(e) => setFloorMaterial(e.target.value as FloorMaterial)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              >
                {(Object.keys(FLOOR_MATERIAL_CONFIG) as FloorMaterial[]).map((k) => (
                  <option key={k} value={k}>
                    {FLOOR_MATERIAL_CONFIG[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Wall Surface Finish
              </label>
              <select
                value={wallStyle}
                onChange={(e) => setWallStyle(e.target.value as WallStyle)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
              >
                {(Object.keys(WALL_STYLE_CONFIG) as WallStyle[]).map((k) => (
                  <option key={k} value={k}>
                    {WALL_STYLE_CONFIG[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {editingOffice ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingOffice ? 'Save Changes' : 'Create & Open 3D Office'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
