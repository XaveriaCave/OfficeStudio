export interface Point2D {
  x: number;
  z: number;
}

export type FurnitureCategory =
  | 'workstations'
  | 'seating'
  | 'tables'
  | 'storage'
  | 'tech_pods'
  | 'decor';

export type FurnitureType =
  | 'executive_desk'
  | 'standing_desk'
  | 'quad_workbench'
  | 'conference_table'
  | 'round_meeting_table'
  | 'ergonomic_chair'
  | 'lounge_sofa'
  | 'armchair'
  | 'acoustic_pod'
  | 'whiteboard'
  | 'bookshelf'
  | 'credenza'
  | 'server_rack'
  | 'coffee_station'
  | 'potted_plant'
  | 'floor_lamp'
  | 'area_rug'
  | 'glass_partition'
  | 'solid_partition'
  | 'ping_pong_table'
  | 'smartboard'
  | 'snack_store';

export type AgentHierarchyLevel =
  | 'Executive'
  | 'Director'
  | 'Manager'
  | 'Senior'
  | 'Associate'
  | 'Intern';

export type AgentState =
  | 'sitting_working'
  | 'standing'
  | 'walking'
  | 'coffee_break'
  | 'playing_tennis'
  | 'using_smartboard'
  | 'visiting_store';

export interface OfficeAgent {
  id: string;
  name: string;
  role: string;
  department: OfficeDepartment;
  hierarchy: AgentHierarchyLevel;
  hierarchyLevel: number; // 1 = C-level/Exec, 2 = Director, 3 = Manager, 4 = Senior, 5 = Associate, 6 = Intern
  reportsToId?: string | null;
  officeId: string;
  x: number;
  z: number;
  color: string;
  avatarInitial: string;
  state: AgentState;
  activityDescription: string;
  assignedDeskId?: string | null;
  isAccountingAgent?: boolean;
  systemPrompt?: string;
  createdAt: string;
}

export interface AccountingInvoice {
  id: string;
  counterparty: string;
  type: 'receivable' | 'payable';
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  category: string;
  description: string;
}

export interface OfficeAccounting {
  officeId: string;
  managedByAgentIds: string[]; // agent IDs managing the accounting
  monthlyRevenue: number;
  cashReserves: number;
  currency: string;
  taxRate: number; // percentage (e.g. 21)
  invoices: AccountingInvoice[];
  monthlyLeaseRatePerM2: number;
  averageSalaryPerAgent: number;
  equipmentValuePerItem?: number; // default $2,800 per furniture piece
  depreciationMonths?: number; // straight-line depreciation period in months (default 36)
  amenitiesCostPerAgent?: number; // monthly hospitality, snacks & coffee per agent (default $450)
  customAssetValuation?: number | null; // direct manual asset override if set
  lastAuditedAt: string;
  auditNotes: string;
}

export interface FurnitureCatalogEntry {
  type: FurnitureType;
  name: string;
  category: FurnitureCategory;
  description: string;
  width: number;  // X dimension in meters
  depth: number;  // Z dimension in meters
  height: number; // Y dimension in meters
  defaultPrimaryColor: string;
  defaultAccentColor: string;
  seatCapacity: number;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  name: string;
  label?: string;
  x: number;
  z: number;
  rotation: number; // Degrees (0 - 360)
  scale: number;    // Default 1.0
  primaryColor: string;
  accentColor: string;
}

export type WallFeatureType = 'window' | 'door' | 'glass_wall' | 'opening';

export interface WallFeature {
  id: string;
  edgeIndex: number; // Index of polygon vertex i -> (i+1)%N
  type: WallFeatureType;
  offsetRatio: number; // 0.15 to 0.85 along the wall segment
  width: number;       // Width in meters
}

export type FloorMaterial =
  | 'warm_oak'
  | 'herringbone_walnut'
  | 'polished_concrete'
  | 'architectural_tile'
  | 'charcoal_carpet'
  | 'terrazzo';

export type WallStyle =
  | 'matte_alabaster'
  | 'slate_concrete'
  | 'warm_sand'
  | 'sage_studio'
  | 'obsidian_accent';

export type LightingPreset =
  | 'daylight'
  | 'golden_hour'
  | 'night_studio'
  | 'blueprint';

export type WallDisplayMode =
  | 'smart_cutaway'
  | 'full'
  | 'low_cut'
  | 'hidden';

export type OfficeDepartment =
  | 'Executive'
  | 'Engineering'
  | 'Design'
  | 'Research'
  | 'Operations'
  | 'Collaborative';

export interface OfficeSpace {
  id: string;
  name: string;
  code: string;
  department: OfficeDepartment;
  floorLevel: number;
  parentOfficeId: string | null;
  description: string;
  vertices: Point2D[];
  wallHeight: number;
  wallMode: WallDisplayMode;
  floorMaterial: FloorMaterial;
  wallStyle: WallStyle;
  lightingPreset: LightingPreset;
  wallFeatures: WallFeature[];
  furniture: FurnitureItem[];
  agents?: OfficeAgent[];
  accounting?: OfficeAccounting;
  updatedAt: string;
}

export type WorkspaceViewMode =
  | 'dashboard'
  | 'playground_3d'
  | 'editor_2d'
  | 'split_studio'
  | 'hierarchy'
  | 'accounting'
  | 'agents_team';

export interface FloorShapePreset {
  id: string;
  name: string;
  description: string;
  vertices: Point2D[];
}

// Geometry helper functions
export function computePolygonArea(vertices: Point2D[]): number {
  if (vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].z;
    area -= vertices[j].x * vertices[i].z;
  }
  return Math.abs(area) / 2;
}

export function computePolygonPerimeter(vertices: Point2D[]): number {
  if (vertices.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const dx = vertices[j].x - vertices[i].x;
    const dz = vertices[j].z - vertices[i].z;
    perimeter += Math.hypot(dx, dz);
  }
  return perimeter;
}

export function computePolygonCentroid(vertices: Point2D[]): Point2D {
  if (vertices.length === 0) return { x: 0, z: 0 };
  let sumX = 0;
  let sumZ = 0;
  for (const v of vertices) {
    sumX += v.x;
    sumZ += v.z;
  }
  return {
    x: Number((sumX / vertices.length).toFixed(2)),
    z: Number((sumZ / vertices.length).toFixed(2)),
  };
}

export function computePolygonBounds(vertices: Point2D[]): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
} {
  if (vertices.length === 0) {
    return { minX: -5, maxX: 5, minZ: -5, maxZ: 5, width: 10, depth: 10 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.z < minZ) minZ = v.z;
    if (v.z > maxZ) maxZ = v.z;
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: Math.max(1, maxX - minX),
    depth: Math.max(1, maxZ - minZ),
  };
}

export function isPointInPolygon(point: Point2D, vertices: Point2D[]): boolean {
  if (vertices.length < 3) return false;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const zi = vertices[i].z;
    const xj = vertices[j].x;
    const zj = vertices[j].z;

    const intersect =
      zi > point.z !== zj > point.z &&
      point.x < ((xj - xi) * (point.z - zi)) / (zj - zi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
