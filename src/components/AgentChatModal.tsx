import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Key,
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Trash2,
  DollarSign,
  Coffee,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { OfficeAgent, OfficeSpace } from '../types';
import { HIERARCHY_COLORS } from '../utils/agentAccountingDefaults';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface AgentChatModalProps {
  agent: OfficeAgent | null;
  office: OfficeSpace;
  onClose: () => void;
  onUpdateAgent?: (id: string, patch: Partial<OfficeAgent>) => void;
  onOpenAgentManager?: (agent: OfficeAgent) => void;
}

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  agent,
  office,
  onClose,
  onOpenAgentManager,
}) => {
  if (!agent) return null;

  const storageKey = `agent_api_key_${agent.id}`;
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) || localStorage.getItem('gemini_global_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(!apiKey);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const defaultGreeting = agent.isAccountingAgent
      ? `Hello! I'm ${agent.name}, your Corporate Financial Controller for ${office.name}. I'm actively auditing our balance sheet, monthly burn rate, lease economics, and runway. How can I assist with your financial planning today?`
      : `Hello! I'm ${agent.name}, ${agent.role} in the ${agent.department} department. I'm currently ${agent.activityDescription}. How can I help you?`;

    return [
      {
        id: 'msg-welcome',
        role: 'model',
        text: defaultGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSaveApiKey = () => {
    try {
      if (apiKey.trim()) {
        localStorage.setItem(storageKey, apiKey.trim());
        localStorage.setItem('gemini_global_api_key', apiKey.trim());
      } else {
        localStorage.removeItem(storageKey);
      }
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 2500);
    } catch {}
  };

  // Quick suggestion prompts based on agent role
  const quickPrompts = agent.isAccountingAgent
    ? [
        'What is our current monthly burn rate & runway?',
        'Can you audit our office lease & equipment depreciation?',
        'Give me 3 cost-cutting recommendations for this suite.',
        'Which invoices are currently pending or overdue?',
      ]
    : agent.hierarchy === 'Executive'
    ? [
        'What are our strategic expansion priorities for this quarter?',
        'How does this office floor plan align with team productivity?',
        'Review our department headcount and desk allocations.',
      ]
    : agent.department === 'Engineering'
    ? [
        'How should we optimize our server rack and compute nodes?',
        'What is the best layout for our engineering squad pods?',
        'Review technical latency in our current spatial engine.',
      ]
    : [
        'What are you working on right now?',
        'How is the acoustic comfort and lighting in this room?',
        'Suggest an ergonomic improvement for my workstation.',
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setErrorMsg(null);

    // Compute accounting context if agent is in accounting
    const accounting = office.accounting;
    let accountingContext: any = null;
    if (accounting) {
      const area = 120; // approximate
      const suiteLeaseCost = Math.round(area * accounting.monthlyLeaseRatePerM2);
      const agentCount = office.agents?.length || 4;
      const payrollCost = agentCount * accounting.averageSalaryPerAgent;
      const monthlyBurn = suiteLeaseCost + payrollCost + 4800; // perks & cloud
      const netMargin = accounting.monthlyRevenue - monthlyBurn;
      const runwayMonths = (accounting.cashReserves / Math.max(1, monthlyBurn)).toFixed(1);

      accountingContext = {
        currency: accounting.currency,
        monthlyRevenue: accounting.monthlyRevenue,
        cashReserves: accounting.cashReserves,
        monthlyLeaseRatePerM2: accounting.monthlyLeaseRatePerM2,
        suiteLeaseCost,
        agentCount,
        averageSalaryPerAgent: accounting.averageSalaryPerAgent,
        payrollCost,
        monthlyBurn,
        netMargin,
        runwayMonths,
        invoices: accounting.invoices,
      };
    }

    try {
      let botReply = '';
      try {
        const res = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent,
            message: text,
            chatHistory: messages,
            customApiKey: apiKey.trim(),
            officeContext: {
              name: office.name,
              code: office.code,
              department: office.department,
              floorLevel: office.floorLevel,
            },
            accountingContext,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            botReply = data.reply;
          }
        }
      } catch {
        // Backend not available (e.g. static GitHub Pages)
      }

      // If backend was not reachable or didn't return a reply
      if (!botReply) {
        if (apiKey.trim()) {
          // Direct client call to Gemini with the user-provided API key
          const systemPrompt = `You are ${agent.name}, ${agent.role} in ${agent.department} department (${agent.hierarchy} level) at Office Studio @V, in office suite ${office.name} (${office.code}). Current status: ${agent.activityDescription}. ${agent.systemPrompt || ''}`;
          const directRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nUser query: ${text}` }],
                  },
                ],
              }),
            }
          );
          if (directRes.ok) {
            const directData = await directRes.json();
            botReply = directData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else {
            const errJson = await directRes.json().catch(() => null);
            throw new Error(errJson?.error?.message || `API error ${directRes.status}`);
          }
        } else {
          // Contextual simulated response for static GitHub Pages when no API key is configured
          botReply = `Hello! I'm ${agent.name}, ${agent.role} (${agent.hierarchy}) in ${office.name}. I'm currently ${agent.activityDescription.toLowerCase()}.\n\nTo enable live generative AI responses on GitHub Pages, click the "Gemini API Key" button above and enter your Google AI Studio API key (stored securely in your browser's localStorage).`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-model`,
          role: 'model',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with agent');
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-error`,
          role: 'model',
          text: `[System Notice]: ${err.message}. If you have not entered a Gemini API key for this agent, please enter it in the key panel above.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hierarchyStyle = HIERARCHY_COLORS[agent.hierarchy] || HIERARCHY_COLORS.Associate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: agent.color }}
            >
              {agent.avatarInitial}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white truncate">{agent.name}</h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${hierarchyStyle.bg} ${hierarchyStyle.text} ${hierarchyStyle.border}`}
                >
                  L{agent.hierarchyLevel} {agent.hierarchy}
                </span>
                {agent.isAccountingAgent && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Accounts Controller
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{agent.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowApiKeyInput((prev) => !prev)}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                apiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Configure Personal Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{apiKey ? 'Key Connected' : 'Set API Key'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible API Key Drawer */}
        {showApiKeyInput && (
          <div className="px-4 py-3 bg-slate-950/90 border-b border-white/10 shrink-0 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-white">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Agent Gemini API Key (Stored in LocalStorage)</span>
              </span>
              <span className="text-[11px] text-slate-500">Each agent can have their own API key</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeyPassword ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste Gemini API key (e.g. AIzaSy...)"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-3 pr-10 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
              >
                {keySavedToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Status Activity Banner */}
        <div className="px-4 py-2 bg-slate-900/50 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium truncate">
              {agent.activityDescription || 'Active in suite'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            {office.name} (Floor 0{office.floorLevel})
          </span>
        </div>

        {/* Chat Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ring-1 ring-white/10"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.avatarInitial}
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div
                    className={`text-[10px] mt-1 font-mono tabular-nums ${
                      isUser ? 'text-sky-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-sky-700 flex items-center justify-center text-white font-bold text-xs shrink-0 ring-1 ring-white/10">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: agent.color }}
              >
                {agent.avatarInitial}
              </div>
              <div className="bg-slate-900 border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>{agent.name} is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0 font-medium mr-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Suggestions:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-sky-400/50 text-slate-300 hover:text-white rounded-full text-[11px] whitespace-nowrap transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 bg-slate-900 border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${agent.name} (${agent.role})...`}
              disabled={loading}
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-colors shrink-0 flex items-center justify-center"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
