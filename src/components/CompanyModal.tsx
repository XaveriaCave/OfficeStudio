import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Check,
  Globe,
  FileText,
  MapPin,
  Mail,
  Phone,
  Trash2,
  AlertCircle,
  Briefcase,
  Layers,
  Users,
  Maximize2,
  DollarSign,
  Plus,
} from 'lucide-react';
import { Company, CompanyType, OfficeSpace, computePolygonArea } from '../types';

interface CompanyModalProps {
  isOpen: boolean;
  company: Company | null; // null for creating a new company
  allCompanies: Company[];
  allOffices: OfficeSpace[];
  onClose: () => void;
  onSaveCompany: (companyData: Company, isNew: boolean) => void;
  onDeleteCompany?: (companyId: string) => void;
}

const COMPANY_TYPES: { type: CompanyType; label: string; desc: string }[] = [
  {
    type: 'Private Limited',
    label: 'Private Limited (Pvt Ltd)',
    desc: 'Privately held corporate entity with limited liability for shareholders.',
  },
  {
    type: 'LLP',
    label: 'LLP (Limited Liability Partnership)',
    desc: 'Combines the flexibility of a partnership with limited liability protection.',
  },
  {
    type: 'Partnership',
    label: 'Partnership Firm',
    desc: 'Business enterprise owned and operated by two or more partners under agreement.',
  },
  {
    type: 'Proprietorship',
    label: 'Sole Proprietorship',
    desc: 'Unincorporated business owned and managed by a single individual.',
  },
  {
    type: 'Public Limited',
    label: 'Public Limited (PLC)',
    desc: 'Publicly traded or listed corporation with transferable public shares.',
  },
  {
    type: 'Corporation',
    label: 'Corporation (C-Corp / S-Corp / Inc)',
    desc: 'Standard commercial corporation with distinct legal personhood.',
  },
  {
    type: 'One Person Company',
    label: 'One Person Company (OPC)',
    desc: 'Corporate entity structured for a single entrepreneurial founder.',
  },
  {
    type: 'Joint Venture',
    label: 'Joint Venture (JV)',
    desc: 'Strategic consortium or commercial venture between two or more parent firms.',
  },
];

const POPULAR_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Singapore',
  'United Arab Emirates',
  'Germany',
  'Canada',
  'Australia',
  'Japan',
  'Netherlands',
  'France',
  'Switzerland',
  'Ireland',
  'Israel',
];

const CURRENCIES = [
  { code: '$', label: 'USD ($) - US Dollar' },
  { code: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: '€', label: 'EUR (€) - Euro' },
  { code: '£', label: 'GBP (£) - British Pound' },
  { code: 'S$', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'A$', label: 'AUD (A$) - Australian Dollar' },
  { code: 'C$', label: 'CAD (C$) - Canadian Dollar' },
  { code: '¥', label: 'JPY/CNY (¥) - Yen / Yuan' },
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'CHF', label: 'CHF - Swiss Franc' },
];

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  company,
  allCompanies,
  allOffices,
  onClose,
  onSaveCompany,
  onDeleteCompany,
}) => {
  const isNew = !company;

  const [name, setName] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('Private Limited');
  const [gstDetails, setGstDetails] = useState('');
  const [domain, setDomain] = useState('');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState('$');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'offices'>('profile');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (company) {
      setName(company.name);
      setCompanyType(company.companyType);
      setGstDetails(company.gstDetails || '');
      setDomain(company.domain || '');
      setCountry(company.country || 'India');
      setCurrency(company.currency || '$');
      setRegistrationNumber(company.registrationNumber || '');
      setPanNumber(company.panNumber || '');
      setRegisteredAddress(company.registeredAddress || '');
      setContactEmail(company.contactEmail || '');
      setPhone(company.phone || '');
      setSelectedOfficeIds(company.officeIds || []);
    } else {
      // New company defaults
      const randomId = Math.floor(Math.random() * 900) + 100;
      setName(`New Enterprise ${randomId}`);
      setCompanyType('Private Limited');
      setGstDetails('');
      setDomain('example.com');
      setCountry('India');
      setCurrency('$');
      setRegistrationNumber('');
      setPanNumber('');
      setRegisteredAddress('');
      setContactEmail('');
      setPhone('');
      // For a new company, by default no offices are pre-checked unless unassigned exist
      const unassignedOfficeIds = allOffices
        .filter((o) => !o.companyId || !allCompanies.some((c) => c.id === o.companyId))
        .map((o) => o.id);
      setSelectedOfficeIds(unassignedOfficeIds);
    }
    setErrors({});
    setActiveTab('profile');
  }, [company, isOpen, allOffices, allCompanies]);

  if (!isOpen) return null;

  const handleToggleOffice = (officeId: string) => {
    setSelectedOfficeIds((prev) =>
      prev.includes(officeId) ? prev.filter((id) => id !== officeId) : [...prev, officeId]
    );
  };

  const handleSelectAllOffices = () => {
    setSelectedOfficeIds(allOffices.map((o) => o.id));
  };

  const handleDeselectAllOffices = () => {
    setSelectedOfficeIds([]);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Company name is required';
    }
    if (domain && !domain.includes('.')) {
      newErrors.domain = 'Please enter a valid domain (e.g. enterprise.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const companyId = company?.id || `comp-${Date.now()}`;
    const now = new Date().toISOString();

    const companyData: Company = {
      id: companyId,
      name: name.trim(),
      companyType,
      gstDetails: gstDetails.trim(),
      domain: domain.trim(),
      country: country.trim(),
      currency,
      registrationNumber: registrationNumber.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      registeredAddress: registeredAddress.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      phone: phone.trim() || undefined,
      officeIds: selectedOfficeIds,
      createdAt: company?.createdAt || now,
      updatedAt: now,
    };

    onSaveCompany(companyData, isNew);
    onClose();
  };

  // Compute selected offices aggregate summary
  const allocatedOffices = allOffices.filter((o) => selectedOfficeIds.includes(o.id));
  const totalAllocatedArea = allocatedOffices.reduce(
    (sum, o) => sum + computePolygonArea(o.vertices || []),
    0
  );
  const totalAllocatedHeadcount = allocatedOffices.reduce(
    (sum, o) => sum + (o.agents?.length || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isNew ? 'Configure New Company' : `Edit Company · ${company?.name}`}
              </h2>
              <p className="text-xs text-slate-400">
                Manage entity legal structure, GST/Tax identification, regional domain, and allocate office branches.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/10 bg-slate-900/30 shrink-0 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Company Profile & Legal Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offices')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'offices'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Select & Set Offices ({selectedOfficeIds.length}/{allOffices.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Row 1: Company Name & Company Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company Legal Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pacific Mind Spatial Corp"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company Type / Legal Structure <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value as CompanyType)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                  >
                    {COMPANY_TYPES.map((ct) => (
                      <option key={ct.type} value={ct.type}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {COMPANY_TYPES.find((c) => c.type === companyType)?.desc}
                  </p>
                </div>
              </div>

              {/* Row 2: GST Details / Tax ID & PAN / National Tax No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    GST Details / Tax Identification No (GSTIN / VAT / EIN)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={gstDetails}
                      onChange={(e) => setGstDetails(e.target.value.toUpperCase())}
                      placeholder="e.g. 29ABCDE1234F1Z5 or US-EIN-99-1234567"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-lg text-sm font-mono text-sky-300 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Applies to invoice tax audits, reverse charge accounting, and regional compliance.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Corporate Registration (CIN / ROC / Business ID)
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. U72900KA2024PTC189201"
                    className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-lg text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Official incorporation registration or Registrar of Companies (ROC) filing code.
                  </p>
                </div>
              </div>

              {/* Row 3: Domain, Country & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Corporate Domain / Website
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value.toLowerCase())}
                      placeholder="pacificmind.io"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                    />
                  </div>
                  {errors.domain && (
                    <p className="text-xs text-rose-400 mt-1">{errors.domain}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Country of Incorporation
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      list="country-suggestions"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. India or United States"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                    />
                    <datalist id="country-suggestions">
                      {POPULAR_COUNTRIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Accounting Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-400 transition-colors"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: PAN / Tax ID & Contact Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    PAN / Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Official Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="hq@company.com"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone / Board Line
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 80 4910 2300"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Registered Headquarters Address */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Registered Corporate Headquarters Address
                </label>
                <textarea
                  rows={2}
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="e.g. Level 14, Orion Cyber Tower, Tech Hub Corridor, Bengaluru, Karnataka 560103"
                  className="w-full px-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors resize-none"
                />
              </div>
            </div>
          ) : (
            /* Tab 2: Select / Set Offices */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-sky-950/30 border border-sky-400/20">
                <div>
                  <div className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Office Allocation Matrix</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select the physical offices and spatial branches that belong under{' '}
                    <span className="text-white font-medium">{name || 'this company'}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllOffices}
                    className="px-2.5 py-1 text-xs font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-md border border-sky-400/30 transition-colors"
                  >
                    Select All ({allOffices.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllOffices}
                    className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-md border border-white/10 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Allocation Quantitative Summary */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-900/60 border border-white/10">
                <div className="text-center">
                  <div className="text-[11px] text-slate-400">Assigned Offices</div>
                  <div className="text-lg font-bold text-sky-400 font-mono">
                    {selectedOfficeIds.length} / {allOffices.length}
                  </div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-[11px] text-slate-400">Total Spatial Footprint</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {totalAllocatedArea.toFixed(1)} m²
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-slate-400">Active Headcount</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {totalAllocatedHeadcount} Agents
                  </div>
                </div>
              </div>

              {/* Office Cards List with Checkboxes */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {allOffices.map((office) => {
                  const isChecked = selectedOfficeIds.includes(office.id);
                  const currentCompany = allCompanies.find((c) => c.id === office.companyId);
                  const belongsToOther =
                    currentCompany && (!company || currentCompany.id !== company.id);
                  const area = computePolygonArea(office.vertices || []);
                  const headcount = office.agents?.length || 0;

                  return (
                    <div
                      key={office.id}
                      onClick={() => handleToggleOffice(office.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                        isChecked
                          ? 'bg-sky-950/40 border-sky-500/60 shadow-sm'
                          : 'bg-slate-900/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-sky-500 text-slate-950'
                              : 'border border-slate-600 bg-slate-800 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-sky-400">
                              {office.code}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">
                              {office.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
                              Floor 0{office.floorLevel}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-medium">
                              {office.department}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>{area.toFixed(1)} m²</span>
                            <span>·</span>
                            <span>{headcount} Agents</span>
                            <span>·</span>
                            <span>{office.furniture.length} Assets</span>
                            {belongsToOther && (
                              <span className="text-amber-400/90 text-[10px] bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                Assigned to: {currentCompany.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isChecked ? (
                          <span className="text-xs font-medium text-sky-400 px-2 py-0.5 bg-sky-500/10 rounded-full border border-sky-400/30">
                            Included
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Excluded</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div>
              {!isNew && onDeleteCompany && (
                allCompanies.length > 1 ? (
                  !isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Company</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-rose-950/60 border border-rose-500/40 rounded-xl">
                      <span className="text-xs text-rose-200 px-2 font-medium">
                        Delete &quot;{company?.name}&quot;?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteCompany(company!.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Single company active. To delete, register a 2nd company first.</span>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isNew ? 'Create Company' : 'Save Company Details'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
