import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  DollarSign,
  Layers,
  Building,
  Cpu,
  Coffee,
  Sparkles,
  AlertCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  FLOOR_MATERIAL_CONFIG,
  FLOOR_SHAPE_PRESETS,
  FURNITURE_CATALOG,
  WALL_STYLE_CONFIG,
} from '../presets';
import {
  FloorMaterial,
  FurnitureItem,
  OfficeAccounting,
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
  const [activeTab, setActiveTab] = useState<'spatial' | 'accounting'>('spatial');
  const [starterKit, setStarterKit] = useState<StarterKitType>('engineering_pod');

  // Accounting Details configuration state
  const [revenue, setRevenue] = useState(145000);
  const [reserves, setReserves] = useState(1500000);
  const [leaseRate, setLeaseRate] = useState(28);
  const [salaryPerAgent, setSalaryPerAgent] = useState(8500);
  const [currency, setCurrency] = useState('$');
  const [equipmentValuePerItem, setEquipmentValuePerItem] = useState(2800);
  const [depreciationMonths, setDepreciationMonths] = useState(36);
  const [amenitiesCostPerAgent, setAmenitiesCostPerAgent] = useState(450);
  const [useCustomAssetValuation, setUseCustomAssetValuation] = useState(false);
  const [customAssetValuation, setCustomAssetValuation] = useState<number>(50000);

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

      if (editingOffice.accounting) {
        const acc = editingOffice.accounting;
        setRevenue(acc.monthlyRevenue ?? 145000);
        setReserves(acc.cashReserves ?? 1500000);
        setLeaseRate(acc.monthlyLeaseRatePerM2 ?? 28);
        setSalaryPerAgent(acc.averageSalaryPerAgent ?? 8500);
        setCurrency(acc.currency || '$');
        setEquipmentValuePerItem(acc.equipmentValuePerItem ?? 2800);
        setDepreciationMonths(acc.depreciationMonths ?? 36);
        setAmenitiesCostPerAgent(acc.amenitiesCostPerAgent ?? 450);
        if (acc.customAssetValuation != null) {
          setUseCustomAssetValuation(true);
          setCustomAssetValuation(acc.customAssetValuation);
        } else {
          setUseCustomAssetValuation(false);
        }
      }
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

      // Default realistic values for new office accounting
      setRevenue(145000);
      setReserves(1500000);
      setLeaseRate(28);
      setSalaryPerAgent(8500);
      setCurrency('$');
      setEquipmentValuePerItem(2800);
      setDepreciationMonths(36);
      setAmenitiesCostPerAgent(450);
      setUseCustomAssetValuation(false);
      setCustomAssetValuation(50000);
      setActiveTab('spatial');
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

    const customAssetVal = useCustomAssetValuation ? Number(customAssetValuation) : null;

    if (editingOffice) {
      const updatedAccounting: OfficeAccounting = editingOffice.accounting
        ? {
            ...editingOffice.accounting,
            monthlyRevenue: Number(revenue),
            cashReserves: Number(reserves),
            monthlyLeaseRatePerM2: Number(leaseRate),
            averageSalaryPerAgent: Number(salaryPerAgent),
            currency,
            equipmentValuePerItem: Number(equipmentValuePerItem),
            depreciationMonths: Number(depreciationMonths),
            amenitiesCostPerAgent: Number(amenitiesCostPerAgent),
            customAssetValuation: customAssetVal,
          }
        : {
            officeId: editingOffice.id,
            managedByAgentIds: [],
            monthlyRevenue: Number(revenue),
            cashReserves: Number(reserves),
            monthlyLeaseRatePerM2: Number(leaseRate),
            averageSalaryPerAgent: Number(salaryPerAgent),
            currency,
            taxRate: 21,
            equipmentValuePerItem: Number(equipmentValuePerItem),
            depreciationMonths: Number(depreciationMonths),
            amenitiesCostPerAgent: Number(amenitiesCostPerAgent),
            customAssetValuation: customAssetVal,
            lastAuditedAt: new Date().toISOString(),
            auditNotes: 'Configured via Office Form.',
            invoices: [],
          };

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
        accounting: updatedAccounting,
        updatedAt: new Date().toISOString(),
      };
      onSaveOffice(updated, false);
    } else {
      const preset =
        FLOOR_SHAPE_PRESETS.find((p) => p.id === shapePresetId) ||
        FLOOR_SHAPE_PRESETS[0];

      const newOfficeId = `office-${Date.now()}`;
      const newAccounting: OfficeAccounting = {
        officeId: newOfficeId,
        managedByAgentIds: [],
        monthlyRevenue: Number(revenue),
        cashReserves: Number(reserves),
        currency,
        taxRate: 21,
        monthlyLeaseRatePerM2: Number(leaseRate),
        averageSalaryPerAgent: Number(salaryPerAgent),
        equipmentValuePerItem: Number(equipmentValuePerItem),
        depreciationMonths: Number(depreciationMonths),
        amenitiesCostPerAgent: Number(amenitiesCostPerAgent),
        customAssetValuation: customAssetVal,
        lastAuditedAt: new Date().toISOString(),
        auditNotes: 'Initialized with custom office accounting profile.',
        invoices: [],
      };

      const newOffice: OfficeSpace = {
        id: newOfficeId,
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
        accounting: newAccounting,
        updatedAt: new Date().toISOString(),
      };
      onSaveOffice(newOffice, true);
    }
    onClose();
  };

  // Preview calculations for the Accounting tab
  const sampleItemsCount = editingOffice?.furniture.length || (starterKit === 'empty' ? 0 : 4);
  const sampleAgentsCount = editingOffice?.agents?.length || (department === 'Executive' ? 4 : 3);
  const sampleAssetVal = useCustomAssetValuation
    ? Number(customAssetValuation)
    : sampleItemsCount * Number(equipmentValuePerItem);
  const sampleMonthlyDeprec = Math.round(sampleAssetVal / Math.max(1, Number(depreciationMonths)));
  const sampleMonthlyAmenities = Math.round(sampleAgentsCount * Number(amenitiesCostPerAgent));
  const sampleLease = Math.round(85 * Number(leaseRate)); // approx 85m² footprint
  const samplePayroll = sampleAgentsCount * Number(salaryPerAgent);
  const sampleTotalBurn = sampleLease + samplePayroll + sampleMonthlyDeprec + sampleMonthlyAmenities;
  const sampleNetMargin = Number(revenue) - sampleTotalBurn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {editingOffice ? `Configure ${editingOffice.name}` : 'Create New 3D Office Space'}
              </h2>
              <p className="text-xs text-slate-400">
                {editingOffice
                  ? 'Update spatial footprint, styling, and operational accounting parameters.'
                  : 'Design architectural perimeter and set initial accounting economics.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 px-6 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('spatial')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'spatial'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spatial Architecture & Design</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accounting')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'accounting'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Accounting & Financial Profile</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Configurable
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'spatial' ? (
            <>
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
            </>
          ) : (
            /* Accounting Configuration Tab */
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-semibold text-amber-300">Office Financial Model:</span>{' '}
                  Configure this suite's monthly revenue, liquid reserves, lease cost per m²,
                  equipment straight-line depreciation horizon, and hospitality & amenities
                  expenditures.
                </div>
              </div>

              {/* Grid 1: Revenue, Reserves & Currency */}
              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Treasury & Revenue Parameters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Monthly Gross Revenue
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500">{currency}</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={revenue}
                        onChange={(e) => setRevenue(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Liquid Cash Reserves
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500">{currency}</span>
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={reserves}
                        onChange={(e) => setReserves(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Currency Symbol
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                    >
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="£">£ (GBP)</option>
                      <option value="¥">¥ (JPY/CNY)</option>
                      <option value="CHF">CHF (Swiss Franc)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid 2: Lease & Staffing */}
              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-sky-400" />
                  <span>Real Estate Lease & Staffing Rates</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Monthly Lease Rate per m² ({currency}/m²)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={leaseRate}
                      onChange={(e) => setLeaseRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Applied across the polygon floor area (e.g. 85 m² × {currency}{leaseRate} = {currency}{Math.round(85 * leaseRate)}/mo)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Average Salary per Agent ({currency}/mo)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={salaryPerAgent}
                      onChange={(e) => setSalaryPerAgent(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-400"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Multiplied by total active agents assigned to this office suite
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid 3: Asset Valuation & Equipment Depreciation */}
              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Asset Valuation & Equipment Depreciation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Equipment Value per Furniture Item ({currency})
                    </label>
                    <input
                      type="number"
                      min={500}
                      step={100}
                      value={equipmentValuePerItem}
                      onChange={(e) => setEquipmentValuePerItem(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Standard valuation per 3D workstation, pod, desk, or fixture (default: $2,800)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Depreciation Amortization Horizon
                    </label>
                    <select
                      value={depreciationMonths}
                      onChange={(e) => setDepreciationMonths(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value={12}>12 Months (1 Year Aggressive)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years Standard GAAP)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years Long-term)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Straight-line monthly expense = Total Asset Value ÷ {depreciationMonths} mo
                    </p>
                  </div>
                </div>

                {/* Custom Asset Valuation Override Toggle */}
                <div className="pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomAssetValuation}
                      onChange={(e) => setUseCustomAssetValuation(e.target.checked)}
                      className="rounded bg-slate-950 border-white/20 text-purple-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300 font-medium">
                      Set Fixed Asset Valuation Override (bypass per-item auto-calculation)
                    </span>
                  </label>

                  {useCustomAssetValuation && (
                    <div className="mt-2.5 max-w-xs">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Fixed Custom Asset Value ({currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={customAssetValuation}
                        onChange={(e) => setCustomAssetValuation(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-purple-500/40 rounded-lg text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 4: Hospitality & Amenities */}
              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hospitality & Office Amenities</span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Amenities & Pantry Cost per Agent ({currency}/agent/month)
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={25}
                    value={amenitiesCostPerAgent}
                    onChange={(e) => setAmenitiesCostPerAgent(Number(e.target.value))}
                    className="w-full max-w-xs px-3 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Covers specialty barista espresso beans, snack kiosk restock, filtered water,
                    and gigabit fiber internet uplink per active team member.
                  </p>
                </div>
              </div>

              {/* Live Preview Summary Card */}
              <div className="p-3.5 bg-slate-950 border border-white/15 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Projected Economics ({currency})</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Est. Runway:{' '}
                    <strong className="text-purple-300 font-mono">
                      {(reserves / Math.max(1, sampleTotalBurn)).toFixed(1)} mo
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Total Asset Value</div>
                    <div className="font-mono font-bold text-white mt-0.5">
                      {currency}{sampleAssetVal.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Equip. Depreciation</div>
                    <div className="font-mono font-bold text-purple-300 mt-0.5">
                      {currency}{sampleMonthlyDeprec.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Amenities & Pantry</div>
                    <div className="font-mono font-bold text-amber-300 mt-0.5">
                      {currency}{sampleMonthlyAmenities.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-400">Projected Burn</div>
                    <div className="font-mono font-bold text-sky-300 mt-0.5">
                      {currency}{sampleTotalBurn.toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2.5">
            <div className="text-xs text-slate-400">
              {activeTab === 'spatial' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('accounting')}
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Configure Accounting & Assets &rarr;</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('spatial')}
                  className="text-sky-400 hover:text-sky-300 underline underline-offset-2 flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" />
                  <span>&larr; Back to Spatial Architecture</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
              >
                {editingOffice ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingOffice ? 'Save Changes' : 'Create & Open 3D Office'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
