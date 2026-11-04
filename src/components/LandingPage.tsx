import React, { useState } from 'react';
import {
  Box,
  Compass,
  Layers,
  ArrowRight,
  Maximize2,
  DollarSign,
  Users,
  Building2,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  LayoutGrid,
  Sun,
  Move,
  FileSpreadsheet,
  ChevronRight,
  ExternalLink,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Company, OfficeSpace, WorkspaceViewMode, computePolygonArea } from '../types';

interface LandingPageProps {
  onEnterMatrix: (mode?: WorkspaceViewMode, officeId?: string) => void;
  activeCompany: Company;
  companies: Company[];
  offices: OfficeSpace[];
  onOpenLegalModal: (tab: 'privacy' | 'terms' | 'disclaimer') => void;
  onSelectCompany?: (companyId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterMatrix,
  activeCompany,
  companies,
  offices,
  onOpenLegalModal,
  onSelectCompany,
}) => {
  const [selectedPreviewTab, setSelectedPreviewTab] = useState<'3d' | 'cad' | 'finance' | 'agents'>('3d');

  // Calculate aggregated stats
  const totalFloorArea = offices.reduce((sum, off) => sum + computePolygonArea(off.vertices || []), 0);
  const totalDesks = offices.reduce(
    (sum, off) => sum + (off.furniture?.filter((f) => f.type.includes('desk') || f.type.includes('workbench')).length || 0),
    0
  );
  const totalAgents = offices.reduce((sum, off) => sum + (off.agents?.length || 0), 0);
  const totalFloors = Array.from(new Set(offices.map((o) => o.floorLevel))).length;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 selection:bg-orange-500 selection:text-white flex flex-col font-sans">
      {/* TOP NOTIFICATION / SYSTEM STATUS STRIP */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-mono text-emerald-300 font-semibold text-[11px] uppercase tracking-wider">
              Matrix Engine Online
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 text-[11px]">
              Active Corporate Entity:{' '}
              <span className="text-orange-400 font-semibold">{activeCompany.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 hidden sm:inline">
              Host: <span className="font-mono text-slate-200">office.studio.ws</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenLegalModal('privacy')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Enterprise Privacy & GDPR
            </button>
            <button
              type="button"
              onClick={() => onEnterMatrix('playground_3d')}
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors flex items-center gap-1"
            >
              <span>Direct Studio Launch</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a
              href="#top"
              className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,120,40,0.5)] group-hover:scale-105 transition-transform">
                <Box className="w-4 h-4" />
              </div>
              <span className="tracking-tight">
                office<span className="text-orange-600">.studio.ws</span>
              </span>
            </a>
          </div>

          {/* Section Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">
              Platform Matrix
            </a>
            <a href="#spatial-engine" className="hover:text-orange-600 transition-colors">
              3D WebGL Engine
            </a>
            <a href="#cad-studio" className="hover:text-orange-600 transition-colors">
              2D CAD Polygon Editor
            </a>
            <a href="#financial-engine" className="hover:text-orange-600 transition-colors">
              Runway & Accounting
            </a>
            <a href="#compliance" className="hover:text-orange-600 transition-colors">
              Legal & Compliance
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {companies.length > 1 && onSelectCompany && (
              <select
                value={activeCompany.id}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="hidden sm:block text-xs font-medium bg-orange-50/50 border border-orange-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                title="Select Enterprise Workspace"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => onEnterMatrix('dashboard')}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-orange-200/90 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors"
            >
              Whole Layout
            </button>

            <button
              type="button"
              onClick={() => onEnterMatrix('playground_3d')}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-[0_0_15px_rgba(255,107,0,0.35)] hover:shadow-[0_0_20px_rgba(255,107,0,0.5)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Enter Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="top" className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-orange-200/60 bg-gradient-to-b from-orange-50/50 via-[#faf9f6] to-white">
        {/* Subtle decorative architectural grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(251, 146, 60, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(251, 146, 60, 0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Category kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100/80 border border-orange-200/80 rounded-full text-xs font-semibold text-orange-900 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Enterprise Spatial Architecture & Financial Virtualization</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-display leading-[1.12]">
              Architect, simulate, and govern autonomous enterprise workspaces in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">
                real-time 3D
              </span>
              .
            </h1>

            {/* Editorial Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Complete client-side spatial computing for corporate real estate. From sub-millimeter 
              polygon CAD drafting and hardware-accelerated WebGL cutaways to live autonomous agent 
              teams and GAAP runway projections.
            </p>

            {/* HERO CTA BUTTON (EXACT REQUIREMENT) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => onEnterMatrix('playground_3d')}
                className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-[0_0_25px_rgba(255,107,0,0.4)] hover:shadow-[0_0_35px_rgba(255,107,0,0.55)] transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>Try the Office.Studio Matrix now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onEnterMatrix('dashboard')}
                className="w-full sm:w-auto px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-orange-50/80 border border-orange-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                <span>Explore Whole Layout Dashboard</span>
              </button>
            </div>

            {/* Live Metrics Strip (Zero-pill discipline: raw typographic data) */}
            <div className="pt-8 border-t border-orange-200/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {Math.round(totalFloorArea)} m²
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Spatial Real Estate
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-orange-600 font-mono tracking-tight">
                  {totalFloors} Floors
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Multi-Tier Stack
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {totalDesks} Desks
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Physical Workstations
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
                  60 FPS
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  WebGL 3D Engine
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SUITES MATRIX PREVIEW */}
      <section className="py-12 bg-white border-b border-orange-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-orange-600 tracking-wider uppercase font-mono">
                Live Spatial Inventory · {activeCompany.name}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
                Active Corporate Suites in Matrix
              </h2>
              <p className="text-sm text-slate-600 max-w-xl">
                Select any office suite below to immediately inspect floor boundaries, furniture
                topology, and autonomous staff in the 3D playground.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onEnterMatrix('dashboard')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>Open full organizational tree</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {offices.map((office) => {
              const area = Math.round(computePolygonArea(office.vertices || []));
              const desksCount = office.furniture?.filter((f) => f.type.includes('desk') || f.type.includes('workbench')).length || 0;
              const agentsCount = office.agents?.length || 0;

              return (
                <div
                  key={office.id}
                  className="bg-[#faf9f6] border border-orange-200/80 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-xs font-mono font-semibold text-slate-500 uppercase">
                          Floor 0{office.floorLevel} · {office.code}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded">
                        {area} m²
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {office.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {office.description || `Departmental suite allocated to ${office.department}.`}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-orange-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-orange-100">
                        <div className="font-mono font-bold text-slate-900">{office.furniture?.length || 0}</div>
                        <div className="text-[10px] text-slate-400">Items</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-orange-100">
                        <div className="font-mono font-bold text-slate-900">{desksCount}</div>
                        <div className="text-[10px] text-slate-400">Desks</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-orange-100">
                        <div className="font-mono font-bold text-orange-600">{agentsCount}</div>
                        <div className="text-[10px] text-slate-400">Agents</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-orange-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEnterMatrix('playground_3d', office.id)}
                      className="flex-1 py-1.5 px-3 bg-white hover:bg-orange-500 hover:text-white text-slate-700 border border-orange-200 hover:border-orange-500 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>3D View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterMatrix('editor_2d', office.id)}
                      className="flex-1 py-1.5 px-3 bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span>CAD Polygon</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLATFORM MATRIX & CORE CAPABILITIES (BENTO GRID) */}
      <section id="features" className="py-16 bg-[#faf9f6] border-b border-orange-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-orange-600 tracking-wider uppercase font-mono">
              The Four Architectural Pillars
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 font-display">
              Unifying 3D spatial design with executive governance.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Most tools force a choice between architectural CAD, static spreadsheets, or expensive
              cloud rendering. Office.Studio provides a unified client-side operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: 3D WebGL Engine */}
            <div id="spatial-engine" className="bg-white border border-orange-200/80 rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time 3D WebGL Matrix</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smooth 60 FPS Three.js viewport with dynamic cutaway walls, daylight/sunset/night
                lighting presets, and collision-aware furniture drag-and-drop.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-orange-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Dynamic wall height cutaways</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Directional shadow casting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Interactive orbit, pan & zoom</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: 2D CAD Polygon Studio */}
            <div id="cad-studio" className="bg-white border border-orange-200/80 rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sub-Millimeter 2D CAD</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Precision vector drafting for complex boundary shapes (L-shaped, pentagonal, open
                atrium) with real-time Shoelace area & perimeter calculations.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-orange-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Vertex manipulation & snapping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Archways & glass partitions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Automated metric calculations</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Corporate Hierarchy & Autonomous Agents */}
            <div className="bg-white border border-orange-200/80 rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Autonomous Agent Teams</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-tier organizational hierarchy (C-Level, Directors, Managers, Associates)
                with physical desk assignments and dynamic activity states.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-orange-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Desk assignment state machines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Coffee breaks & ping-pong lounge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Departmental organizational trees</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Financial Operations & Runway */}
            <div id="financial-engine" className="bg-white border border-orange-200/80 rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">GAAP Runway & Amortization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated monthly lease cost calculations, asset depreciation, payroll burn, and GST
                invoicing configured per legal corporate entity.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-orange-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Real-time runway burn projection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Tax & GST customizable rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Instant PDF audit reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON & ARCHITECTURAL ADVANTAGE */}
      <section className="py-16 bg-white border-b border-orange-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Built for Modern Corporate Space Planners
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              How office.studio.ws replaces fragmented spreadsheets, disconnected CAD exports, and 
              isolated facilities tools.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-orange-200 rounded-xl overflow-hidden">
              <thead className="bg-orange-50/80 text-slate-700 uppercase tracking-wider font-semibold border-b border-orange-200">
                <tr>
                  <th className="py-3.5 px-4 font-mono">Workflow Capability</th>
                  <th className="py-3.5 px-4 text-orange-700 bg-orange-100/60 font-bold">
                    office.studio.ws Matrix
                  </th>
                  <th className="py-3.5 px-4 text-slate-500">Legacy 2D CAD Software</th>
                  <th className="py-3.5 px-4 text-slate-500">Spreadsheets & Slides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-slate-600">
                <tr className="hover:bg-orange-50/20">
                  <td className="py-3 px-4 font-medium text-slate-900">3D WebGL Rendering</td>
                  <td className="py-3 px-4 text-orange-700 font-bold bg-orange-50/40">Instant, 60 FPS in browser</td>
                  <td className="py-3 px-4">Slow desktop plugin</td>
                  <td className="py-3 px-4">Non-existent</td>
                </tr>
                <tr className="hover:bg-orange-50/20">
                  <td className="py-3 px-4 font-medium text-slate-900">Live CAD to 3D Sync</td>
                  <td className="py-3 px-4 text-orange-700 font-bold bg-orange-50/40">Instant bidirectional</td>
                  <td className="py-3 px-4">Requires manual export</td>
                  <td className="py-3 px-4">Static screenshots</td>
                </tr>
                <tr className="hover:bg-orange-50/20">
                  <td className="py-3 px-4 font-medium text-slate-900">Automated Financial Runway</td>
                  <td className="py-3 px-4 text-orange-700 font-bold bg-orange-50/40">GAAP Ledger linked to m²</td>
                  <td className="py-3 px-4">Unlinked</td>
                  <td className="py-3 px-4">Manual formula drift</td>
                </tr>
                <tr className="hover:bg-orange-50/20">
                  <td className="py-3 px-4 font-medium text-slate-900">Autonomous Agent Simulation</td>
                  <td className="py-3 px-4 text-orange-700 font-bold bg-orange-50/40">Multi-tier hierarchy with desks</td>
                  <td className="py-3 px-4">None</td>
                  <td className="py-3 px-4">Flat headcount count</td>
                </tr>
                <tr className="hover:bg-orange-50/20">
                  <td className="py-3 px-4 font-medium text-slate-900">Privacy & Data Governance</td>
                  <td className="py-3 px-4 text-orange-700 font-bold bg-orange-50/40">Local client persistence</td>
                  <td className="py-3 px-4">Proprietary binary locks</td>
                  <td className="py-3 px-4">Unregulated email attachments</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRODUCTION LEGAL, COMPLIANCE & PRIVACY SECTION */}
      <section id="compliance" className="py-14 bg-[#faf9f6] border-b border-orange-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-orange-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider font-mono">
                <Scale className="w-4 h-4" />
                <span>Enterprise Governance & Legal Suite</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                Configured for {activeCompany.name} ({activeCompany.companyType})
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Every corporate workspace incorporates localized governing law, GDPR/DPDP compliant
                privacy terms, and architectural structural liability disclaimers configurable by company entity.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 font-mono">
                <span>Jurisdiction: <span className="text-slate-800 font-semibold">{activeCompany.country}</span></span>
                <span>·</span>
                <span>GST / Tax ID: <span className="text-slate-800 font-semibold">{activeCompany.gstDetails || 'Verified'}</span></span>
                <span>·</span>
                <span>Local Storage: <span className="text-emerald-600 font-semibold">100% Client-Side</span></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => onOpenLegalModal('privacy')}
                className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenLegalModal('terms')}
                className="px-4 py-2.5 bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Terms of Service</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenLegalModal('disclaimer')}
                className="px-4 py-2.5 bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Disclaimers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.4) 0%, transparent 60%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-orange-300">
            <span>Ready for Spatial Virtualization</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Step directly into the interactive corporate studio.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            No installation required. Run full 3D spatial simulations, manipulate polygon CAD vertices,
            and monitor runway metrics directly in your modern browser.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onEnterMatrix('playground_3d')}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Try the Office.Studio Matrix now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onEnterMatrix('dashboard')}
              className="w-full sm:w-auto px-6 py-4 text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
            >
              Open Layout Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-950 text-slate-400 text-xs border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white text-xs">
                  <Box className="w-3.5 h-3.5" />
                </div>
                <span>office.studio.ws</span>
              </div>
              <p className="text-slate-500 max-w-sm text-[11px] leading-relaxed">
                Enterprise 3D spatial engine, 2D vector CAD polygon editor, and financial virtualization 
                for modern multi-floor workplaces.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <button
                type="button"
                onClick={() => onOpenLegalModal('privacy')}
                className="hover:text-orange-400 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => onOpenLegalModal('terms')}
                className="hover:text-orange-400 transition-colors"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => onOpenLegalModal('disclaimer')}
                className="hover:text-orange-400 transition-colors"
              >
                Legal Disclaimers
              </button>
              <button
                type="button"
                onClick={() => onEnterMatrix('playground_3d')}
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Enter Matrix →
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
            <div>
              © 2026 office.studio.ws · {activeCompany.name}. All spatial rights reserved.
            </div>
            <div className="font-mono text-slate-600">
              WebGL 2.0 · Three.js r186 · Local Isolated Runtime
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
