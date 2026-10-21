import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Bot,
  Sparkles,
  FileText,
  Building,
  Users,
  Cpu,
  Coffee,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RefreshCw,
  Edit2,
  Check,
  Sliders,
  Settings,
} from 'lucide-react';
import {
  AccountingInvoice,
  OfficeAccounting,
  OfficeAgent,
  OfficeSpace,
  computePolygonArea,
} from '../types';
import { HIERARCHY_COLORS } from '../utils/agentAccountingDefaults';

interface AccountingPanelProps {
  office: OfficeSpace;
  onUpdateAccounting: (patch: Partial<OfficeAccounting>) => void;
  onOpenAgentChat: (agent: OfficeAgent) => void;
  onOpenAgentManager: (agent?: OfficeAgent) => void;
}

export const AccountingPanel: React.FC<AccountingPanelProps> = ({
  office,
  onUpdateAccounting,
  onOpenAgentChat,
  onOpenAgentManager,
}) => {
  const accounting = office.accounting;
  const agents = office.agents || [];
  const areaM2 = computePolygonArea(office.vertices);

  // Accounting agents managing this office
  const managedAgentIds = accounting?.managedByAgentIds || [];
  const currentAccountingAgents = agents.filter((a) =>
    managedAgentIds.includes(a.id)
  );
  const otherAgents = agents.filter((a) => !managedAgentIds.includes(a.id));

  // Filters & Modal States
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'receivable' | 'payable' | 'pending'>('all');
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showConfigAgentsModal, setShowConfigAgentsModal] = useState(false);
  const [showAuditReportModal, setShowAuditReportModal] = useState(false);
  const [auditReportText, setAuditReportText] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Financial model configuration editor states
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [configFocusSection, setConfigFocusSection] = useState<'all' | 'assets' | 'depreciation' | 'amenities'>('all');
  const [editRevenue, setEditRevenue] = useState(accounting?.monthlyRevenue ?? 145000);
  const [editReserves, setEditReserves] = useState(accounting?.cashReserves ?? 1500000);
  const [editLeaseRate, setEditLeaseRate] = useState(accounting?.monthlyLeaseRatePerM2 ?? 28);
  const [editSalary, setEditSalary] = useState(accounting?.averageSalaryPerAgent ?? 8500);
  const [editCurrency, setEditCurrency] = useState(accounting?.currency || '$');
  const [editEquipmentValuePerItem, setEditEquipmentValuePerItem] = useState(accounting?.equipmentValuePerItem ?? 2800);
  const [editDepreciationMonths, setEditDepreciationMonths] = useState(accounting?.depreciationMonths ?? 36);
  const [editAmenitiesCostPerAgent, setEditAmenitiesCostPerAgent] = useState(accounting?.amenitiesCostPerAgent ?? 450);
  const [useCustomAssetOverride, setUseCustomAssetOverride] = useState(accounting?.customAssetValuation != null);
  const [editCustomAssetValuation, setEditCustomAssetValuation] = useState<number>(accounting?.customAssetValuation ?? 50000);

  useEffect(() => {
    if (accounting) {
      setEditRevenue(accounting.monthlyRevenue ?? 145000);
      setEditReserves(accounting.cashReserves ?? 1500000);
      setEditLeaseRate(accounting.monthlyLeaseRatePerM2 ?? 28);
      setEditSalary(accounting.averageSalaryPerAgent ?? 8500);
      setEditCurrency(accounting.currency || '$');
      setEditEquipmentValuePerItem(accounting.equipmentValuePerItem ?? 2800);
      setEditDepreciationMonths(accounting.depreciationMonths ?? 36);
      setEditAmenitiesCostPerAgent(accounting.amenitiesCostPerAgent ?? 450);
      setUseCustomAssetOverride(accounting.customAssetValuation != null);
      if (accounting.customAssetValuation != null) {
        setEditCustomAssetValuation(accounting.customAssetValuation);
      }
    }
  }, [accounting]);

  // New Invoice Form state
  const [newCounterparty, setNewCounterparty] = useState('');
  const [newType, setNewType] = useState<'receivable' | 'payable'>('receivable');
  const [newAmount, setNewAmount] = useState(12000);
  const [newDueDate, setNewDueDate] = useState('2026-11-15');
  const [newCategory, setNewCategory] = useState('Enterprise Retainer');
  const [newDescription, setNewDescription] = useState('');

  if (!accounting) {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p>No accounting record initialized for {office.name}.</p>
      </div>
    );
  }

  // Financial Calculations using configured variables
  const currency = accounting.currency || '$';
  const monthlyLease = Math.round(areaM2 * accounting.monthlyLeaseRatePerM2);
  const monthlyPayroll = agents.length * accounting.averageSalaryPerAgent;
  const equipmentValuePerItem = accounting.equipmentValuePerItem ?? 2800;
  const depreciationMonths = accounting.depreciationMonths ?? 36;
  const amenitiesCostPerAgent = accounting.amenitiesCostPerAgent ?? 450;
  const equipmentAssetValue =
    accounting.customAssetValuation != null
      ? accounting.customAssetValuation
      : office.furniture.length * equipmentValuePerItem;
  const equipmentDepreciation = Math.round(
    equipmentAssetValue / Math.max(1, depreciationMonths)
  ); // straight line
  const amenitiesCost = Math.round(agents.length * amenitiesCostPerAgent); // hospitality, espresso, snacks, wifi
  const totalMonthlyBurn = monthlyLease + monthlyPayroll + equipmentDepreciation + amenitiesCost;
  const netMonthlyMargin = accounting.monthlyRevenue - totalMonthlyBurn;
  const runwayMonths = (accounting.cashReserves / Math.max(1, totalMonthlyBurn)).toFixed(1);

  // Invoice filtering
  const invoices = accounting.invoices || [];
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === 'receivable') return inv.type === 'receivable';
    if (invoiceFilter === 'payable') return inv.type === 'payable';
    if (invoiceFilter === 'pending') return inv.status === 'pending';
    return true;
  });

  const handleToggleInvoiceStatus = (invId: string) => {
    const updated = invoices.map((inv) => {
      if (inv.id !== invId) return inv;
      const nextStatus = inv.status === 'paid' ? 'pending' : 'paid';
      return { ...inv, status: nextStatus as 'paid' | 'pending' };
    });
    onUpdateAccounting({ invoices: updated });
  };

  const handleDeleteInvoice = (invId: string) => {
    const updated = invoices.filter((inv) => inv.id !== invId);
    onUpdateAccounting({ invoices: updated });
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterparty.trim()) return;

    const newInv: AccountingInvoice = {
      id: `inv-${Date.now()}`,
      counterparty: newCounterparty.trim(),
      type: newType,
      amount: Number(newAmount),
      dueDate: newDueDate,
      status: 'pending',
      category: newCategory,
      description: newDescription.trim() || `${newCategory} for ${office.name}`,
    };

    onUpdateAccounting({ invoices: [newInv, ...invoices] });
    setShowAddInvoiceModal(false);
    setNewCounterparty('');
    setNewDescription('');
  };

  const handleSaveMetrics = () => {
    onUpdateAccounting({
      monthlyRevenue: Number(editRevenue),
      cashReserves: Number(editReserves),
      monthlyLeaseRatePerM2: Number(editLeaseRate),
      averageSalaryPerAgent: Number(editSalary),
      currency: editCurrency,
      equipmentValuePerItem: Number(editEquipmentValuePerItem),
      depreciationMonths: Number(editDepreciationMonths),
      amenitiesCostPerAgent: Number(editAmenitiesCostPerAgent),
      customAssetValuation: useCustomAssetOverride ? Number(editCustomAssetValuation) : null,
    });
    setIsEditingMetrics(false);
  };

  // Run AI Financial Audit
  const handleTriggerAiAudit = async () => {
    const defaultAgent = currentAccountingAgents[0] || agents[0];
    setIsAuditing(true);
    setShowAuditReportModal(true);

    try {
      const apiKey = defaultAgent ? localStorage.getItem(`agent_api_key_${defaultAgent.id}`) : null;
      let auditText = '';

      try {
        const res = await fetch('/api/accounting-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accounting: {
              ...accounting,
              areaM2,
              monthlyLease,
              monthlyPayroll,
              equipmentAssetValue,
              equipmentDepreciation,
              amenitiesCost,
              totalMonthlyBurn,
              netMonthlyMargin,
              runwayMonths,
              agentCount: agents.length,
            },
            agent: defaultAgent,
            officeName: office.name,
            customApiKey: apiKey || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.report) {
            auditText = data.report;
          }
        }
      } catch {
        // Backend not available (e.g. static GitHub Pages)
      }

      if (!auditText) {
        if (apiKey && apiKey.trim()) {
          // Direct client call with Gemini
          const prompt = `Perform an executive GAAP financial audit and runway assessment for office suite "${office.name}". Financial metrics: Currency: ${currency}, Monthly Revenue: ${currency}${accounting.monthlyRevenue.toLocaleString()}, Cash Reserves: ${currency}${accounting.cashReserves.toLocaleString()}, Area: ${areaM2.toFixed(1)} m², Monthly Lease: ${currency}${monthlyLease.toLocaleString()} (@ ${currency}${accounting.monthlyLeaseRatePerM2}/m²), Team Size: ${agents.length} agents, Monthly Payroll: ${currency}${monthlyPayroll.toLocaleString()} (@ ${currency}${accounting.averageSalaryPerAgent}/mo per agent), Capital Asset Valuation: ${currency}${equipmentAssetValue.toLocaleString()}, Equipment Depreciation: ${currency}${equipmentDepreciation.toLocaleString()}/mo (${depreciationMonths}-month straight-line), Hospitality & Amenities: ${currency}${amenitiesCost.toLocaleString()}/mo (${currency}${amenitiesCostPerAgent}/mo per agent), Total Monthly Burn: ${currency}${totalMonthlyBurn.toLocaleString()}/mo, Net Operating Margin: ${netMonthlyMargin >= 0 ? '+' : ''}${currency}${netMonthlyMargin.toLocaleString()}/mo, Runway Longevity: ${runwayMonths} months. Provide an executive summary, capital efficiency rating, and 3 strategic recommendations.`;

          const directRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
              }),
            }
          );
          if (directRes.ok) {
            const directData = await directRes.json();
            auditText = directData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        }

        if (!auditText) {
          // Comprehensive client-calculated audit report
          auditText =
            `========================================================\n` +
            `OFFICE FINANCIAL & RUNWAY AUDIT REPORT\n` +
            `OFFICE STUDIO @V — ${office.name.toUpperCase()}\n` +
            `Audited by: ${defaultAgent ? defaultAgent.name : 'Corporate Accounting'} (${defaultAgent?.role || 'Financial Controller'})\n` +
            `Date: ${new Date().toLocaleDateString()} · Status: VERIFIED\n` +
            `========================================================\n\n` +
            `1. EXECUTIVE BALANCE SHEET SUMMARY:\n` +
            `• Cash Reserves: ${currency}${accounting.cashReserves.toLocaleString()}\n` +
            `• Monthly Gross Revenue: ${currency}${accounting.monthlyRevenue.toLocaleString()}\n` +
            `• Net Monthly Burn Rate: ${currency}${totalMonthlyBurn.toLocaleString()}\n` +
            `• Net Operating Margin: ${netMonthlyMargin >= 0 ? '+' : ''}${currency}${netMonthlyMargin.toLocaleString()} / month\n` +
            `• Runway Longevity: ${runwayMonths} Months (${Number(runwayMonths) > 18 ? 'Strong' : 'Moderate'} Capital Stability)\n\n` +
            `2. REAL ESTATE & OPERATIONAL AMORTIZATION:\n` +
            `• Spatial Area: ${areaM2.toFixed(1)} m² at ${currency}${accounting.monthlyLeaseRatePerM2}/m²\n` +
            `• Base Real Estate Lease: ${currency}${monthlyLease.toLocaleString()} / month\n` +
            `• Team Payroll (${agents.length} Active Agents): ${currency}${monthlyPayroll.toLocaleString()} / month\n` +
            `• Asset & Workstation Depreciation: ${currency}${equipmentDepreciation.toLocaleString()} / month\n` +
            `• Amenities, Coffee & Gigabit Uplink: ${currency}${amenitiesCost.toLocaleString()} / month\n\n` +
            `3. STRATEGIC RECOMMENDATIONS:\n` +
            `1. Density Optimization: Active workspace density is ${(areaM2 / Math.max(1, agents.length)).toFixed(1)} m² per agent, which meets ergonomic Class-A corporate spatial guidelines.\n` +
            `2. Receivable Collection: Maintain positive net cash flow by executing open ledger receivables prior to net-30 terms.\n` +
            `3. Capital Allocation: Runway of ${runwayMonths} months provides sufficient buffer for spatial footprint and team expansion.\n\n` +
            `[GitHub Pages Note: Enter your Gemini API key in the Agent Chat Modal to activate dynamic real-time AI-generated audit reports!]`;
        }
      }

      setAuditReportText(auditText);
    } catch (err: any) {
      setAuditReportText(`Audit failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner: Accounting Management Status & Designated Agent */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              GAAP Ledger & Runway
            </span>
            <span className="text-slate-500">·</span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {office.name} — Financial Operations
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time balance sheet, automated lease amortizations, and runway projections managed by office agents.
          </p>
        </div>

        {/* Accounting Controller Agent Card(s) */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
          {currentAccountingAgents.length > 0 ? (
            <div className="flex items-center gap-2 bg-slate-950 border border-white/10 p-2 rounded-xl">
              {currentAccountingAgents.map((ag) => (
                <div key={ag.id} className="flex items-center gap-2.5 pr-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20 shadow"
                    style={{ backgroundColor: ag.color }}
                  >
                    {ag.avatarInitial}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{ag.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        Controller
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{ag.role}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAgentChat(ag)}
                    className="ml-2 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No agent assigned. Accounting is currently unmanaged.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigAgentsModal(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Configure Agents</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerAiAudit}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run AI Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Cash Reserves */}
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Cash Reserves</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1.5">
            {currency}{accounting.cashReserves.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Treasury Liquid</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Monthly Revenue</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-sky-300 mt-1.5">
            {currency}{accounting.monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Enterprise retainers</div>
        </div>

        {/* Monthly Burn Rate */}
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Monthly Burn</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-300 mt-1.5">
            {currency}{totalMonthlyBurn.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lease + Payroll + Ops</div>
        </div>

        {/* Net Monthly Margin */}
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Net Monthly Margin</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div
            className={`text-lg sm:text-xl font-bold font-mono mt-1.5 ${
              netMonthlyMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netMonthlyMargin >= 0 ? '+' : ''}
            {currency}{netMonthlyMargin.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {((netMonthlyMargin / Math.max(1, accounting.monthlyRevenue)) * 100).toFixed(0)}% Margin
          </div>
        </div>

        {/* Net Runway */}
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Net Runway</span>
            <Clock className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-purple-300 mt-1.5">
            {runwayMonths} mo
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">Extremely Stable</div>
        </div>

        {/* Capital Asset Valuation */}
        <div
          onClick={() => {
            setIsEditingMetrics(true);
            setConfigFocusSection('assets');
          }}
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 hover:border-purple-500/50 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group"
          title="Click to configure Asset Valuation and Equipment values"
        >
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Asset Valuation</span>
            <div className="flex items-center gap-1 text-[10px] text-purple-400 opacity-80 group-hover:opacity-100">
              <Edit2 className="w-3 h-3" />
              <span>Configure</span>
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1.5">
            {currency}{equipmentAssetValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="truncate">
              {accounting.customAssetValuation != null
                ? 'Manual Fixed Valuation'
                : `${office.furniture.length} items @ ${currency}${equipmentValuePerItem}`}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Cost Breakdown Analysis & Configurator */}
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-400" />
              <span>Monthly Operational Cost Structure & Amortization</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              GAAP straight-line depreciation, workstation asset valuation, lease amortization, and hospitality
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditingMetrics((prev) => !prev);
              setConfigFocusSection('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm ${
              isEditingMetrics
                ? 'bg-sky-500 text-slate-950 border-sky-400 hover:bg-sky-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isEditingMetrics ? 'Close Configurator' : 'Configure Financial Variables'}</span>
          </button>
        </div>

        {/* Full Comprehensive Financial Variables Configurator */}
        {isEditingMetrics && (
          <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-xl space-y-4 text-xs animate-in fade-in">
            {/* Quick Filter Section Chips */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-sky-400" />
                  <span>Config Section:</span>
                </span>
                {[
                  { id: 'all', label: 'All Parameters' },
                  { id: 'assets', label: 'Asset Valuation' },
                  { id: 'depreciation', label: 'Equipment Depreciation' },
                  { id: 'amenities', label: 'Hospitality & Amenities' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setConfigFocusSection(s.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      configFocusSection === s.id
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Changes recalculate runway & balance sheet in real time
              </div>
            </div>

            {/* Section 1: Revenue, Cash Reserves & Currency */}
            {(configFocusSection === 'all') && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-white/5">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Monthly Gross Revenue</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-500">{editCurrency}</span>
                    <input
                      type="number"
                      step={1000}
                      value={editRevenue}
                      onChange={(e) => setEditRevenue(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg pl-6 pr-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Liquid Cash Reserves</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-500">{editCurrency}</span>
                    <input
                      type="number"
                      step={10000}
                      value={editReserves}
                      onChange={(e) => setEditReserves(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg pl-6 pr-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Lease Rate ({editCurrency}/m²)</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={editLeaseRate}
                    onChange={(e) => setEditLeaseRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Avg Salary / Agent ({editCurrency}/mo)</label>
                  <input
                    type="number"
                    step={250}
                    value={editSalary}
                    onChange={(e) => setEditSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Section 2: Asset Valuation & Equipment Depreciation Configuration */}
            {(configFocusSection === 'all' || configFocusSection === 'assets' || configFocusSection === 'depreciation') && (
              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Asset Valuation & Equipment Straight-Line Depreciation</span>
                  </span>
                  <span className="text-[11px] text-purple-300 font-mono">
                    Current Base: {editCurrency}{(useCustomAssetOverride ? editCustomAssetValuation : office.furniture.length * editEquipmentValuePerItem).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Equipment Value Per Item ({editCurrency})
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={editEquipmentValuePerItem}
                      onChange={(e) => setEditEquipmentValuePerItem(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Multiplied by {office.furniture.length} items = {editCurrency}{(office.furniture.length * editEquipmentValuePerItem).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Depreciation Horizon (Months)
                    </label>
                    <select
                      value={editDepreciationMonths}
                      onChange={(e) => setEditDepreciationMonths(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    >
                      <option value={12}>12 Months (1 Year Aggressive)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years Standard GAAP)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years Long-term)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Monthly amortization = Asset Value ÷ {editDepreciationMonths} mo
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Currency Symbol
                    </label>
                    <select
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    >
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="£">£ (GBP)</option>
                      <option value="¥">¥ (JPY/CNY)</option>
                      <option value="CHF">CHF (Swiss Franc)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Asset Override Option */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomAssetOverride}
                      onChange={(e) => setUseCustomAssetOverride(e.target.checked)}
                      className="rounded bg-slate-950 border-white/20 text-purple-500 focus:ring-0"
                    />
                    <span className="text-slate-300 font-medium">
                      Enable Fixed Asset Valuation Override (ignore furniture catalog count)
                    </span>
                  </label>

                  {useCustomAssetOverride && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Fixed Value:</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={editCustomAssetValuation}
                        onChange={(e) => setEditCustomAssetValuation(Number(e.target.value))}
                        className="w-36 bg-slate-950 border border-purple-500/40 rounded-lg px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: Hospitality & Amenities Configuration */}
            {(configFocusSection === 'all' || configFocusSection === 'amenities') && (
              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hospitality & Office Amenities Expenditures</span>
                  </span>
                  <span className="text-[11px] text-amber-300 font-mono">
                    Total: {editCurrency}{(agents.length * editAmenitiesCostPerAgent).toLocaleString()}/mo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Monthly Amenities Cost per Agent ({editCurrency}/agent/month)
                    </label>
                    <input
                      type="number"
                      min={50}
                      step={25}
                      value={editAmenitiesCostPerAgent}
                      onChange={(e) => setEditAmenitiesCostPerAgent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Covers barista coffee beans, pantry snacks, filtered water, and gigabit fiber
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-white/5 flex flex-col justify-center">
                    <div className="text-[11px] text-slate-400">Formula Breakdown:</div>
                    <div className="text-xs text-white font-mono mt-0.5">
                      {agents.length} active agents × {editCurrency}{editAmenitiesCostPerAgent}/mo = <strong className="text-amber-300">{editCurrency}{(agents.length * editAmenitiesCostPerAgent).toLocaleString()}/mo</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="text-[11px] text-slate-400">
                Preview Net Margin:{' '}
                <span className="font-mono font-bold text-white">
                  {editCurrency}{(
                    editRevenue -
                    (Math.round(areaM2 * editLeaseRate) +
                      agents.length * editSalary +
                      Math.round(
                        (useCustomAssetOverride
                          ? editCustomAssetValuation
                          : office.furniture.length * editEquipmentValuePerItem) /
                          Math.max(1, editDepreciationMonths)
                      ) +
                      Math.round(agents.length * editAmenitiesCostPerAgent))
                  ).toLocaleString()} / mo
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMetrics(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMetrics}
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Accounting Configuration</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Real Estate Lease */}
          <div
            onClick={() => {
              setIsEditingMetrics(true);
              setConfigFocusSection('all');
            }}
            className="bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-sky-500/30 rounded-xl p-3.5 cursor-pointer transition-all group"
          >
            <div className="text-xs text-slate-400 flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span>Real Estate Lease</span>
              </div>
              <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-sky-400 transition-colors" />
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {currency}{monthlyLease.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {areaM2.toFixed(1)} m² @ {currency}{accounting.monthlyLeaseRatePerM2}/m²
            </div>
          </div>

          {/* Agent Staff Payroll */}
          <div
            onClick={() => {
              setIsEditingMetrics(true);
              setConfigFocusSection('all');
            }}
            className="bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-purple-500/30 rounded-xl p-3.5 cursor-pointer transition-all group"
          >
            <div className="text-xs text-slate-400 flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Agent Staff Payroll</span>
              </div>
              <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {currency}{monthlyPayroll.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {agents.length} agents @ {currency}{accounting.averageSalaryPerAgent.toLocaleString()}/mo
            </div>
          </div>

          {/* Hardware & Furniture Depreciation */}
          <div
            onClick={() => {
              setIsEditingMetrics(true);
              setConfigFocusSection('depreciation');
            }}
            className="bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/40 rounded-xl p-3.5 cursor-pointer transition-all group"
          >
            <div className="text-xs text-slate-400 flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Equipment Depreciation</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 opacity-80 group-hover:opacity-100">
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </div>
            </div>
            <div className="text-base font-bold font-mono text-emerald-300 mt-1">
              {currency}{equipmentDepreciation.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {depreciationMonths}-mo straight-line on {currency}{equipmentAssetValue.toLocaleString()} assets
            </div>
          </div>

          {/* Amenities & Breakroom Ops */}
          <div
            onClick={() => {
              setIsEditingMetrics(true);
              setConfigFocusSection('amenities');
            }}
            className="bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-amber-500/40 rounded-xl p-3.5 cursor-pointer transition-all group"
          >
            <div className="text-xs text-slate-400 flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>Hospitality & Amenities</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 opacity-80 group-hover:opacity-100">
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </div>
            </div>
            <div className="text-base font-bold font-mono text-amber-300 mt-1">
              {currency}{amenitiesCost.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {agents.length} agents @ {currency}{amenitiesCostPerAgent}/mo (barista beans, kiosk, wifi)
            </div>
          </div>
        </div>
      </div>

      {/* Invoices & Accounts Ledger */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Accounts Ledger & Invoices</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Receivables from enterprise licenses and payables for facilities and compute
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setInvoiceFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'all' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setInvoiceFilter('receivable')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'receivable' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Receivables
              </button>
              <button
                type="button"
                onClick={() => setInvoiceFilter('payable')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'payable' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Payables
              </button>
              <button
                type="button"
                onClick={() => setInvoiceFilter('pending')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'pending' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddInvoiceModal(true)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-white/10 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Counterparty</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        inv.type === 'receivable'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {inv.type === 'receivable' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>Income</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Expense</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{inv.counterparty}</div>
                    <div className="text-[11px] text-slate-500">{inv.description}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{inv.category}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{inv.dueDate}</td>
                  <td
                    className={`py-2.5 px-3 font-mono font-bold text-right text-xs ${
                      inv.type === 'receivable' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {inv.type === 'receivable' ? '+' : '-'}
                    {currency}{inv.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleInvoiceStatus(inv.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                      title="Click to toggle status"
                    >
                      {inv.status === 'paid' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteInvoice(inv.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Configure Accounting Agents */}
      {showConfigAgentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span>Configure Accounting Agents</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowConfigAgentsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Designate which agents have authorization to govern this suite's balance sheet, run audits, and analyze budget allocations.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {agents.map((ag) => {
                const isAssigned = managedAgentIds.includes(ag.id);
                return (
                  <div
                    key={ag.id}
                    className="p-2.5 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: ag.color }}
                      >
                        {ag.avatarInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{ag.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{ag.role}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextIds = isAssigned
                          ? managedAgentIds.filter((id) => id !== ag.id)
                          : [...managedAgentIds, ag.id];
                        onUpdateAccounting({ managedByAgentIds: nextIds });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                        isAssigned
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                      }`}
                    >
                      {isAssigned ? 'Remove' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfigAgentsModal(false)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Invoice */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Create New Invoice or Expense</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddInvoiceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Invoice Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('receivable')}
                    className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      newType === 'receivable'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-white/10'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Income (Receivable)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('payable')}
                    className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      newType === 'payable'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-950 text-slate-400 border border-white/10'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Expense (Payable)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Counterparty / Client / Vendor</label>
                <input
                  type="text"
                  required
                  value={newCounterparty}
                  onChange={(e) => setNewCounterparty(e.target.value)}
                  placeholder="e.g. Acme Space Labs"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Cloud Compute, Client Retainer, Hardware"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-3 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI Audit Report */}
      {showAuditReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h4 className="text-base font-semibold text-white">
                  Corporate Financial & Runway Audit
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
              {isAuditing ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                  <span>Auditing ledger, calculating amortizations, and verifying runway...</span>
                </div>
              ) : (
                auditReportText
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowAuditReportModal(false)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
