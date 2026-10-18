import React, { useState } from 'react';
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

  // Quick edit financial inputs
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [editRevenue, setEditRevenue] = useState(accounting?.monthlyRevenue || 145000);
  const [editReserves, setEditReserves] = useState(accounting?.cashReserves || 1500000);
  const [editLeaseRate, setEditLeaseRate] = useState(accounting?.monthlyLeaseRatePerM2 || 28);
  const [editSalary, setEditSalary] = useState(accounting?.averageSalaryPerAgent || 8500);

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

  // Financial Calculations
  const currency = accounting.currency || '$';
  const monthlyLease = Math.round(areaM2 * accounting.monthlyLeaseRatePerM2);
  const monthlyPayroll = agents.length * accounting.averageSalaryPerAgent;
  const equipmentAssetValue = office.furniture.length * 2800;
  const equipmentDepreciation = Math.round(equipmentAssetValue / 36); // 3-year straight line
  const amenitiesCost = Math.round(agents.length * 450); // coffee, snacks, wifi
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
      const res = await fetch('/api/accounting-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accounting: {
            ...accounting,
            areaM2,
            monthlyLease,
            monthlyPayroll,
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

      const data = await res.json();
      setAuditReportText(data.report || 'Audit completed successfully.');
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
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Asset Valuation</span>
            <Building className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1.5">
            {currency}{equipmentAssetValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {office.furniture.length} physical items
          </div>
        </div>
      </div>

      {/* Operational Cost Breakdown Analysis */}
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-400" />
            <span>Monthly Operational Cost Structure & Amortization</span>
          </h3>

          <button
            type="button"
            onClick={() => setIsEditingMetrics((prev) => !prev)}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditingMetrics ? 'Close Edit' : 'Edit Base Variables'}</span>
          </button>
        </div>

        {/* Quick Edit Base Variables */}
        {isEditingMetrics && (
          <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="text-slate-400 block mb-1">Monthly Revenue ($)</label>
              <input
                type="number"
                value={editRevenue}
                onChange={(e) => setEditRevenue(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Cash Reserves ($)</label>
              <input
                type="number"
                value={editReserves}
                onChange={(e) => setEditReserves(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Lease Rate ($/m²)</label>
              <input
                type="number"
                value={editLeaseRate}
                onChange={(e) => setEditLeaseRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSaveMetrics}
                className="w-full px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Accounting Variables</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Real Estate Lease */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Real Estate Lease</span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {currency}{monthlyLease.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {areaM2.toFixed(1)} m² @ {currency}{accounting.monthlyLeaseRatePerM2}/m²
            </div>
          </div>

          {/* Agent Staff Payroll */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Agent Staff Payroll</span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {currency}{monthlyPayroll.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {agents.length} agents @ {currency}{accounting.averageSalaryPerAgent.toLocaleString()}/mo
            </div>
          </div>

          {/* Hardware & Furniture Depreciation */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Equipment Depreciation</span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {currency}{equipmentDepreciation.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              36-mo amortization on {currency}{equipmentAssetValue.toLocaleString()} assets
            </div>
          </div>

          {/* Amenities & Breakroom Ops */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Hospitality & Amenities</span>
            </div>
            <div className="text-base font-bold font-mono text-white mt-1">
              {currency}{amenitiesCost.toLocaleString()} / mo
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Espresso beans, kiosk snacks, gigabit wifi
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
