import {
  AgentHierarchyLevel,
  AgentState,
  FurnitureItem,
  OfficeAccounting,
  OfficeAgent,
  OfficeDepartment,
  OfficeSpace,
  Point2D,
  computePolygonArea,
  computePolygonCentroid,
  isPointInPolygon,
} from '../types';

export const HIERARCHY_LEVEL_ORDER: Record<AgentHierarchyLevel, number> = {
  Executive: 1,
  Director: 2,
  Manager: 3,
  Senior: 4,
  Associate: 5,
  Intern: 6,
};

export const HIERARCHY_COLORS: Record<AgentHierarchyLevel, { bg: string; text: string; border: string }> = {
  Executive: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/40' },
  Director: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40' },
  Manager: { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/40' },
  Senior: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  Associate: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/40' },
  Intern: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/40' },
};

export const AGENT_PALETTES = [
  '#0284c7', // Sky
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

// Helper to find desk seat positions in the office
export function findAvailableDeskSpots(furniture: FurnitureItem[]): Array<{
  furnitureId: string;
  furnitureName: string;
  x: number;
  z: number;
  label: string;
}> {
  const spots: Array<{
    furnitureId: string;
    furnitureName: string;
    x: number;
    z: number;
    label: string;
  }> = [];

  for (const item of furniture) {
    if (item.type === 'executive_desk') {
      spots.push({
        furnitureId: item.id,
        furnitureName: item.name || 'Executive Desk',
        x: item.x,
        z: item.z + 0.45,
        label: `${item.label || item.name} (Chair)`,
      });
    } else if (item.type === 'standing_desk') {
      spots.push({
        furnitureId: item.id,
        furnitureName: item.name || 'Pro Standing Desk',
        x: item.x,
        z: item.z + 0.4,
        label: `${item.label || item.name} (Desk)`,
      });
    } else if (item.type === 'quad_workbench') {
      // 4 seats around the quad pod
      spots.push(
        { furnitureId: item.id, furnitureName: item.name, x: item.x - 0.75, z: item.z - 0.55, label: `${item.label || 'Quad Pod'} Seat 1` },
        { furnitureId: item.id, furnitureName: item.name, x: item.x + 0.75, z: item.z - 0.55, label: `${item.label || 'Quad Pod'} Seat 2` },
        { furnitureId: item.id, furnitureName: item.name, x: item.x - 0.75, z: item.z + 0.55, label: `${item.label || 'Quad Pod'} Seat 3` },
        { furnitureId: item.id, furnitureName: item.name, x: item.x + 0.75, z: item.z + 0.55, label: `${item.label || 'Quad Pod'} Seat 4` }
      );
    } else if (item.type === 'round_meeting_table') {
      // 4 huddle chairs
      spots.push(
        { furnitureId: item.id, furnitureName: item.name, x: item.x - 0.55, z: item.z, label: `${item.label || 'Table'} W` },
        { furnitureId: item.id, furnitureName: item.name, x: item.x + 0.55, z: item.z, label: `${item.label || 'Table'} E` },
        { furnitureId: item.id, furnitureName: item.name, x: item.x, z: item.z - 0.55, label: `${item.label || 'Table'} N` },
        { furnitureId: item.id, furnitureName: item.name, x: item.x, z: item.z + 0.55, label: `${item.label || 'Table'} S` }
      );
    } else if (item.type === 'conference_table') {
      // 8 boardroom seats
      for (let i = -1.2; i <= 1.2; i += 0.8) {
        spots.push({
          furnitureId: item.id,
          furnitureName: item.name,
          x: item.x + i,
          z: item.z - 0.65,
          label: `${item.label || 'Boardroom'} North`,
        });
        spots.push({
          furnitureId: item.id,
          furnitureName: item.name,
          x: item.x + i,
          z: item.z + 0.65,
          label: `${item.label || 'Boardroom'} South`,
        });
      }
    }
  }

  return spots;
}

// Generate default agents for an office
export function getDefaultAgentsForOffice(
  officeId: string,
  department: OfficeDepartment
): OfficeAgent[] {
  if (officeId.includes('hq') || department === 'Executive') {
    return [
      {
        id: `agent-${officeId}-exec-1`,
        name: 'Elena Vance',
        role: 'Corporate Financial Controller & Accounting Lead',
        department: 'Executive',
        hierarchy: 'Director',
        hierarchyLevel: 2,
        reportsToId: `agent-${officeId}-exec-2`,
        officeId,
        x: 3.6,
        z: -1.8,
        color: '#f59e0b',
        avatarInitial: 'EV',
        state: 'sitting_working',
        activityDescription: 'Auditing Q3 operating expenditures and balance sheet',
        isAccountingAgent: true,
        systemPrompt:
          'You are Elena Vance, Corporate Financial Controller & Accounting Lead at Pacific Mind Spatial. You manage the company balance sheet, runway, capital expenditures, furniture asset valuation, and office lease economics. You provide precise, analytical financial advice.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-exec-2`,
        name: 'Alexander Vance',
        role: 'Chief Executive Officer',
        department: 'Executive',
        hierarchy: 'Executive',
        hierarchyLevel: 1,
        reportsToId: null,
        officeId,
        x: -2.4,
        z: -1.6,
        color: '#0284c7',
        avatarInitial: 'AV',
        state: 'sitting_working',
        activityDescription: 'Reviewing cross-department expansion roadmap',
        isAccountingAgent: false,
        systemPrompt:
          'You are Alexander Vance, CEO of Office Studio @V. You focus on strategic vision, executive capital allocation, and team organizational hierarchy.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-exec-3`,
        name: 'David Kim',
        role: 'VP of Workplace Operations',
        department: 'Operations',
        hierarchy: 'Director',
        hierarchyLevel: 2,
        reportsToId: `agent-${officeId}-exec-2`,
        officeId,
        x: -4.0,
        z: 2.0,
        color: '#8b5cf6',
        avatarInitial: 'DK',
        state: 'coffee_break',
        activityDescription: 'Brewing pour-over espresso at barista station',
        isAccountingAgent: false,
        systemPrompt:
          'You are David Kim, VP of Workplace Operations. You oversee facilities, acoustic design, ergonomic compliance, and office hospitality.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-exec-4`,
        name: 'Chloe Bennett',
        role: 'Senior Executive Operations Lead',
        department: 'Operations',
        hierarchy: 'Senior',
        hierarchyLevel: 4,
        reportsToId: `agent-${officeId}-exec-3`,
        officeId,
        x: 0.5,
        z: 1.2,
        color: '#10b981',
        avatarInitial: 'CB',
        state: 'standing',
        activityDescription: 'Reviewing architectural presentation layout',
        isAccountingAgent: false,
        systemPrompt:
          'You are Chloe Bennett, Senior Executive Operations Lead. You coordinate executive huddles, vendor agreements, and townhall presentations.',
        createdAt: '2026-10-10T08:00:00Z',
      },
    ];
  }

  if (officeId.includes('eng') || department === 'Engineering') {
    return [
      {
        id: `agent-${officeId}-eng-1`,
        name: 'Dr. Marcus Chen',
        role: 'VP of Systems Architecture',
        department: 'Engineering',
        hierarchy: 'Executive',
        hierarchyLevel: 1,
        reportsToId: null,
        officeId,
        x: 5.4,
        z: -0.9,
        color: '#0284c7',
        avatarInitial: 'MC',
        state: 'sitting_working',
        activityDescription: 'Benchmarking WebGL 3D spatial render pipeline',
        isAccountingAgent: false,
        systemPrompt:
          'You are Dr. Marcus Chen, VP of Systems Architecture. You specialize in high-performance WebGL, Three.js shaders, real-time spatial physics, and distributed systems.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-eng-2`,
        name: 'Maya Lin',
        role: 'Engineering Finance & Procurement Controller',
        department: 'Engineering',
        hierarchy: 'Director',
        hierarchyLevel: 2,
        reportsToId: `agent-${officeId}-eng-1`,
        officeId,
        x: -3.5,
        z: -2.4,
        color: '#f59e0b',
        avatarInitial: 'ML',
        state: 'sitting_working',
        activityDescription: 'Optimizing cloud GPU cluster compute budget',
        isAccountingAgent: true,
        systemPrompt:
          'You are Maya Lin, Engineering Finance & Procurement Controller. You audit infrastructure bills, cloud compute expenses, workstation amortizations, and engineering salaries.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-eng-3`,
        name: 'Liam Tanaka',
        role: 'Staff Infrastructure Engineer',
        department: 'Engineering',
        hierarchy: 'Senior',
        hierarchyLevel: 4,
        reportsToId: `agent-${officeId}-eng-1`,
        officeId,
        x: 2.6,
        z: -2.4,
        color: '#10b981',
        avatarInitial: 'LT',
        state: 'sitting_working',
        activityDescription: 'Scaling distributed CAD mesh tessellation nodes',
        isAccountingAgent: false,
        systemPrompt:
          'You are Liam Tanaka, Staff Infrastructure Engineer. You love discussing compute clusters, Kubernetes, and low-latency networking.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-eng-4`,
        name: 'Aria Sterling',
        role: 'Senior Full-Stack Engineer',
        department: 'Engineering',
        hierarchy: 'Senior',
        hierarchyLevel: 4,
        reportsToId: `agent-${officeId}-eng-1`,
        officeId,
        x: -1.6,
        z: 4.4,
        color: '#8b5cf6',
        avatarInitial: 'AS',
        state: 'coffee_break',
        activityDescription: 'Enjoying double espresso at barista counter',
        isAccountingAgent: false,
        systemPrompt:
          'You are Aria Sterling, Senior Full-Stack Engineer. You work on reactive React state, SVG floor plans, and canvas math.',
        createdAt: '2026-10-10T08:00:00Z',
      },
      {
        id: `agent-${officeId}-eng-5`,
        name: 'Kiran Patel',
        role: 'Systems Reliability Engineer',
        department: 'Engineering',
        hierarchy: 'Associate',
        hierarchyLevel: 5,
        reportsToId: `agent-${officeId}-eng-3`,
        officeId,
        x: -0.4,
        z: -2.4,
        color: '#06b6d4',
        avatarInitial: 'KP',
        state: 'using_smartboard',
        activityDescription: 'Sketching failover topology on rolling smartboard',
        isAccountingAgent: false,
        systemPrompt:
          'You are Kiran Patel, SRE at Pacific Mind Spatial. You diagram network topologies and uptime SLAs.',
        createdAt: '2026-10-10T08:00:00Z',
      },
    ];
  }

  // Default fallback for Design or Collaborative offices
  return [
    {
      id: `agent-${officeId}-gen-1`,
      name: 'Sofia Rodriguez',
      role: 'Principal Spatial Experience Designer',
      department,
      hierarchy: 'Director',
      hierarchyLevel: 2,
      reportsToId: null,
      officeId,
      x: -1.5,
      z: -1.5,
      color: '#ec4899',
      avatarInitial: 'SR',
      state: 'sitting_working',
      activityDescription: 'Refining human-scale ergonomic circulation paths',
      isAccountingAgent: false,
      systemPrompt:
        'You are Sofia Rodriguez, Principal Spatial Designer. You champion daylighting, natural acoustics, and zero-pill spatial aesthetics.',
      createdAt: '2026-10-10T08:00:00Z',
    },
    {
      id: `agent-${officeId}-gen-2`,
      name: 'Julian Thorne',
      role: 'Finance & Studio Operations Manager',
      department,
      hierarchy: 'Manager',
      hierarchyLevel: 3,
      reportsToId: `agent-${officeId}-gen-1`,
      officeId,
      x: 1.8,
      z: -1.5,
      color: '#f59e0b',
      avatarInitial: 'JT',
      state: 'sitting_working',
      activityDescription: 'Verifying quarterly studio furniture procurement budget',
      isAccountingAgent: true,
      systemPrompt:
        'You are Julian Thorne, Finance & Studio Operations Manager. You track design software licenses, prototype materials budget, and studio equipment ledger.',
      createdAt: '2026-10-10T08:00:00Z',
    },
    {
      id: `agent-${officeId}-gen-3`,
      name: 'Nadia Osei',
      role: 'Junior Spatial Researcher',
      department,
      hierarchy: 'Associate',
      hierarchyLevel: 5,
      reportsToId: `agent-${officeId}-gen-1`,
      officeId,
      x: 0.8,
      z: 2.0,
      color: '#10b981',
      avatarInitial: 'NO',
      state: 'visiting_store',
      activityDescription: 'Grabbing sparkling water and snack at breakroom store',
      isAccountingAgent: false,
      systemPrompt:
        'You are Nadia Osei, Junior Spatial Researcher. You research biophilic design patterns and ergonomic employee wellness.',
      createdAt: '2026-10-10T08:00:00Z',
    },
  ];
}

// Generate demo accounting profile for an office
export function getDefaultAccountingForOffice(
  officeId: string,
  areaM2: number,
  agents: OfficeAgent[]
): OfficeAccounting {
  const accountingAgents = agents.filter((a) => a.isAccountingAgent);
  const managedByAgentIds =
    accountingAgents.length > 0 ? accountingAgents.map((a) => a.id) : agents.slice(0, 1).map((a) => a.id);

  // Scaled realistic figures based on office size
  const baseRevenue = Math.max(85000, Math.round(areaM2 * 1850));
  const baseReserves = Math.max(950000, Math.round(areaM2 * 16500));
  const leasePerM2 = 28; // $28/m2
  const salaryPerAgent = 8500; // $8,500/mo

  return {
    officeId,
    managedByAgentIds,
    monthlyRevenue: baseRevenue,
    cashReserves: baseReserves,
    currency: '$',
    taxRate: 21,
    monthlyLeaseRatePerM2: leasePerM2,
    averageSalaryPerAgent: salaryPerAgent,
    equipmentValuePerItem: 2800,
    depreciationMonths: 36,
    amenitiesCostPerAgent: 450,
    customAssetValuation: null,
    lastAuditedAt: '2026-10-18T08:30:00Z',
    auditNotes:
      'Verified GAAP compliance. Operating cash flow is net positive. Runway exceeds 24 months. Asset amortizations match current 3D furniture catalog inventory.',
    invoices: [
      {
        id: `inv-${officeId}-1`,
        counterparty: 'Apex Global Enterprises',
        type: 'receivable',
        amount: Math.round(baseRevenue * 0.55),
        dueDate: '2026-11-01',
        status: 'paid',
        category: 'Enterprise Client Retainer',
        description: 'Quarterly spatial infrastructure software license & SLA support',
      },
      {
        id: `inv-${officeId}-2`,
        counterparty: 'Nordic Architecture Labs',
        type: 'receivable',
        amount: Math.round(baseRevenue * 0.35),
        dueDate: '2026-11-15',
        status: 'pending',
        category: 'Consulting Contract',
        description: 'Digital Twin deployment and acoustic partitioning consultation',
      },
      {
        id: `inv-${officeId}-3`,
        counterparty: 'Metropolitan Commercial Realty Corp',
        type: 'payable',
        amount: Math.round(areaM2 * leasePerM2),
        dueDate: '2026-11-01',
        status: 'pending',
        category: 'Facility Lease',
        description: `Monthly prime commercial suite lease (${Math.round(areaM2)} m² @ $${leasePerM2}/m²)`,
      },
      {
        id: `inv-${officeId}-4`,
        counterparty: 'Herman Miller Commercial Interiors',
        type: 'payable',
        amount: 8600,
        dueDate: '2026-10-25',
        status: 'paid',
        category: 'Furniture & Fixture Assets',
        description: 'Ergonomic task seating and motorized sit-stand workstations',
      },
      {
        id: `inv-${officeId}-5`,
        counterparty: 'Amazon Web Services & Cloud Compute',
        type: 'payable',
        amount: 4850,
        dueDate: '2026-11-05',
        status: 'pending',
        category: 'Cloud Infrastructure',
        description: 'GPU cluster instances and distributed spatial pipeline hosting',
      },
      {
        id: `inv-${officeId}-6`,
        counterparty: 'Artisan Espresso Bean Roasters',
        type: 'payable',
        amount: 540,
        dueDate: '2026-10-28',
        status: 'pending',
        category: 'Breakroom Amenities',
        description: 'Organic roast espresso beans and specialty dairy for office station',
      },
    ],
  };
}

// Autonomous agent simulation step:
// "If desks are available, agents sit there and work, otherwise they keep moving -
//  standing - playing tennis/using the coffee dispenser,smartboard, store, etc."
export function simulateAgentTick(office: OfficeSpace): OfficeAgent[] {
  const agents = office.agents || [];
  if (agents.length === 0) return agents;

  const deskSpots = findAvailableDeskSpots(office.furniture);
  const coffeeItems = office.furniture.filter((f) => f.type === 'coffee_station');
  const tennisItems = office.furniture.filter((f) => f.type === 'ping_pong_table');
  const smartboardItems = office.furniture.filter((f) => f.type === 'smartboard' || f.type === 'whiteboard');
  const storeItems = office.furniture.filter((f) => f.type === 'snack_store');
  const loungeItems = office.furniture.filter((f) => f.type === 'lounge_sofa' || f.type === 'armchair');

  const centroid = computePolygonCentroid(office.vertices);
  const occupiedDeskIndices = new Set<number>();

  return agents.map((agent, index) => {
    // If agent is manually being dragged/positioned or we decide their state:
    // Try to find an available desk if available
    const availableDeskIdx = deskSpots.findIndex((_, i) => !occupiedDeskIndices.has(i));

    if (availableDeskIdx !== -1 && index < deskSpots.length) {
      // Desk is available for this agent!
      occupiedDeskIndices.add(availableDeskIdx);
      const spot = deskSpots[availableDeskIdx];
      return {
        ...agent,
        state: 'sitting_working',
        assignedDeskId: spot.furnitureId,
        x: spot.x,
        z: spot.z,
        activityDescription: `Working at ${spot.label}`,
      };
    }

    // No desk available (or extra agents): they keep moving around, standing, playing tennis, visiting coffee/smartboard/store!
    // Pick an amenity or roaming state
    const cycle = (index + Math.floor(Date.now() / 15000)) % 6;

    if (cycle === 0 && tennisItems.length > 0) {
      const item = tennisItems[0];
      const side = index % 2 === 0 ? -1.2 : 1.2;
      return {
        ...agent,
        state: 'playing_tennis',
        assignedDeskId: null,
        x: Number((item.x + side).toFixed(2)),
        z: Number(item.z.toFixed(2)),
        activityDescription: 'Playing table tennis rally in game zone',
      };
    }

    if (cycle === 1 && coffeeItems.length > 0) {
      const item = coffeeItems[0];
      return {
        ...agent,
        state: 'coffee_break',
        assignedDeskId: null,
        x: Number((item.x + 0.3).toFixed(2)),
        z: Number((item.z + 0.9).toFixed(2)),
        activityDescription: 'Ordering macchiato at barista dispenser',
      };
    }

    if (cycle === 2 && smartboardItems.length > 0) {
      const item = smartboardItems[0];
      return {
        ...agent,
        state: 'using_smartboard',
        assignedDeskId: null,
        x: Number(item.x.toFixed(2)),
        z: Number((item.z + 0.8).toFixed(2)),
        activityDescription: 'Sketching quarterly OKRs on 4K smartboard',
      };
    }

    if (cycle === 3 && storeItems.length > 0) {
      const item = storeItems[0];
      return {
        ...agent,
        state: 'visiting_store',
        assignedDeskId: null,
        x: Number(item.x.toFixed(2)),
        z: Number((item.z + 0.85).toFixed(2)),
        activityDescription: 'Checking fresh snacks at micro-market store',
      };
    }

    if (cycle === 4 && loungeItems.length > 0) {
      const item = loungeItems[index % loungeItems.length];
      return {
        ...agent,
        state: 'standing',
        assignedDeskId: null,
        x: Number((item.x + 0.4).toFixed(2)),
        z: Number((item.z + 0.6).toFixed(2)),
        activityDescription: 'Relaxing in lounge briefing area',
      };
    }

    // Default: Walking or Standing along the floor
    const angle = (index * (Math.PI * 2)) / Math.max(1, agents.length);
    const radius = 1.8 + (index % 3) * 0.8;
    let targetX = centroid.x + Math.cos(angle) * radius;
    let targetZ = centroid.z + Math.sin(angle) * radius;

    // Safety check inside polygon
    if (!isPointInPolygon({ x: targetX, z: targetZ }, office.vertices)) {
      targetX = centroid.x;
      targetZ = centroid.z;
    }

    return {
      ...agent,
      state: index % 2 === 0 ? 'walking' : 'standing',
      assignedDeskId: null,
      x: Number(targetX.toFixed(2)),
      z: Number(targetZ.toFixed(2)),
      activityDescription:
        index % 2 === 0 ? 'Walking across the studio corridor' : 'Standing by the window reviewing blueprint',
    };
  });
}
