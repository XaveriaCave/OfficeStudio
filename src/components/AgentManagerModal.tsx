import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Trash2,
  Check,
  Shield,
  Briefcase,
  GitBranch,
  Key,
  DollarSign,
  Palette,
} from 'lucide-react';
import { AgentHierarchyLevel, OfficeAgent, OfficeDepartment, OfficeSpace } from '../types';
import {
  AGENT_PALETTES,
  HIERARCHY_LEVEL_ORDER,
  HIERARCHY_COLORS,
} from '../utils/agentAccountingDefaults';

interface AgentManagerModalProps {
  agent: OfficeAgent | null; // null if creating a new agent
  office: OfficeSpace;
  existingAgents?: OfficeAgent[];
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent?: (savedAgent: OfficeAgent, isNew: boolean) => void;
  onDeleteAgent?: (id: string) => void;
  onSave?: (agent: Partial<OfficeAgent>) => void;
  onDelete?: (id: string) => void;
}

export const AgentManagerModal: React.FC<AgentManagerModalProps> = ({
  agent,
  office,
  existingAgents,
  isOpen,
  onClose,
  onSaveAgent,
  onDeleteAgent,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(agent);

  const [name, setName] = useState<string>(agent?.name || '');
  const [role, setRole] = useState<string>(agent?.role || 'Staff Engineer');
  const [department, setDepartment] = useState<OfficeDepartment>(
    agent?.department || office.department || 'Engineering'
  );
  const [hierarchy, setHierarchy] = useState<AgentHierarchyLevel>(
    agent?.hierarchy || 'Senior'
  );
  const [reportsToId, setReportsToId] = useState<string>(agent?.reportsToId || '');
  const [color, setColor] = useState<string>(agent?.color || AGENT_PALETTES[0]);
  const [isAccountingAgent, setIsAccountingAgent] = useState<boolean>(
    Boolean(agent?.isAccountingAgent)
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(
    agent?.systemPrompt || ''
  );

  // Local storage API key for this agent
  const storageKey = agent ? `agent_api_key_${agent.id}` : null;
  const [apiKey, setApiKey] = useState<string>(() => {
    if (storageKey) {
      try {
        return localStorage.getItem(storageKey) || '';
      } catch {}
    }
    return '';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AG';

    const level = HIERARCHY_LEVEL_ORDER[hierarchy] || 4;

    const payload: Partial<OfficeAgent> = {
      ...(agent || {}),
      name: name.trim(),
      role: role.trim(),
      department,
      hierarchy,
      hierarchyLevel: level,
      reportsToId: reportsToId || null,
      color,
      avatarInitial: initials,
      isAccountingAgent,
      systemPrompt: systemPrompt.trim(),
    };

    if (agent && apiKey.trim()) {
      try {
        localStorage.setItem(`agent_api_key_${agent.id}`, apiKey.trim());
      } catch {}
    }

    if (onSaveAgent) {
      const isNew = !agent;
      const fullAgent: OfficeAgent = {
        id:
          agent?.id ||
          `agent-${office.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim(),
        role: role.trim(),
        department,
        hierarchy,
        hierarchyLevel: level,
        reportsToId: reportsToId || null,
        officeId: office.id,
        x: agent?.x ?? Number((office.vertices[0]?.x || 0).toFixed(2)),
        z: agent?.z ?? Number((office.vertices[0]?.z || 0).toFixed(2)),
        color,
        avatarInitial: initials,
        state: agent?.state || 'standing',
        activityDescription: agent?.activityDescription || `Collaborating as ${role}`,
        isAccountingAgent,
        systemPrompt: systemPrompt.trim(),
        createdAt: agent?.createdAt || new Date().toISOString(),
      };
      if (apiKey.trim()) {
        try {
          localStorage.setItem(`agent_api_key_${fullAgent.id}`, apiKey.trim());
        } catch {}
      }
      onSaveAgent(fullAgent, isNew);
    } else if (onSave) {
      onSave(payload);
    }
    onClose();
  };

  const hierarchyOptions: AgentHierarchyLevel[] = [
    'Executive',
    'Director',
    'Manager',
    'Senior',
    'Associate',
    'Intern',
  ];

  const departmentOptions: OfficeDepartment[] = [
    'Executive',
    'Engineering',
    'Design',
    'Research',
    'Operations',
    'Collaborative',
  ];

  const allExistingAgents = existingAgents || office.agents || [];
  const otherAgents = allExistingAgents.filter((a) => a.id !== agent?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-orange-200/90 rounded-2xl w-full max-w-lg shadow-[0_20px_60px_rgba(255,107,0,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-white/95 border-b border-orange-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isEditing ? `Edit Agent: ${agent?.name}` : 'Spawn New Office Agent'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 bg-white">
          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Role / Title
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead Spatial Architect"
                className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs"
              />
            </div>
          </div>

          {/* Department & Hierarchy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as OfficeDepartment)}
                className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-xs"
              >
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hierarchy Level
              </label>
              <select
                value={hierarchy}
                onChange={(e) => setHierarchy(e.target.value as AgentHierarchyLevel)}
                className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-xs"
              >
                {hierarchyOptions.map((h) => (
                  <option key={h} value={h}>
                    Level {HIERARCHY_LEVEL_ORDER[h]} — {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reports To Hierarchy Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reports To (Organizational Hierarchy)
            </label>
            <select
              value={reportsToId}
              onChange={(e) => setReportsToId(e.target.value)}
              className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-xs"
            >
              <option value="">No Direct Manager (Top-level / C-Suite)</option>
              {otherAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.role} ({a.hierarchy})
                </option>
              ))}
            </select>
          </div>

          {/* Color Palette Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-orange-600" />
              <span>Avatar & Figure Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AGENT_PALETTES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-110 ring-2 ring-orange-500 ring-offset-2 ring-offset-white' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Accounting Controller Toggle */}
          <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAccountingAgent}
                onChange={(e) => setIsAccountingAgent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-orange-600 border-orange-300 focus:ring-orange-500"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Designate as Accounting & Financial Controller</span>
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  Grants this agent access to audit the office balance sheet, monitor runway, calculate lease & payroll expenses, and manage invoices.
                </div>
              </div>
            </label>
          </div>

          {/* Agent Persona / Custom Prompt Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Persona & Directives (Optional)
            </label>
            <textarea
              rows={2}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. Focus on high-throughput architecture, microservices, and clean code principles."
              className="w-full bg-white border border-orange-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-orange-100 flex items-center justify-between gap-3 shrink-0">
            {isEditing && (onDeleteAgent || onDelete) ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${agent?.name}?`)) {
                    if (onDeleteAgent && agent) {
                      onDeleteAgent(agent.id);
                    } else if (onDelete && agent) {
                      onDelete(agent.id);
                    }
                    onClose();
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Agent</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors shadow-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-[0_2px_12px_rgba(255,107,0,0.3)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Spawn Agent'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
