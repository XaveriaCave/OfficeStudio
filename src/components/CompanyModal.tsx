import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { Company, CompanyType, OfficeSpace, computePolygonArea } from '../types';
import { PRESET_COMPANY_LOGOS } from '../presets';

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
  const [logoUrl, setLogoUrl] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'offices'>('profile');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setLogoUrl(company.logoUrl || '');
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
      setLogoUrl(PRESET_COMPANY_LOGOS[0]?.url || '');
      // For a new company, by default no offices are pre-checked unless unassigned exist
      const unassignedOfficeIds = allOffices
        .filter((o) => !o.companyId || !allCompanies.some((c) => c.id === o.companyId))
        .map((o) => o.id);
      setSelectedOfficeIds(unassignedOfficeIds);
    }
    setErrors({});
    setActiveTab('profile');
    setShowUrlInput(false);
    setCustomUrlInput('');
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

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Downscale to max 256x256 to conserve localStorage quota
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          setLogoUrl(dataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers onChange
    e.target.value = '';
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
      logoUrl: logoUrl.trim() || undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-orange-200/90 rounded-2xl shadow-[0_20px_60px_rgba(255,107,0,0.18)] overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-orange-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 shadow-sm overflow-hidden shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name || 'Company'}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {isNew ? 'Configure New Company' : `Edit Company · ${company?.name}`}
              </h2>
              <p className="text-xs text-slate-500">
                Manage entity legal structure, GST/Tax identification, regional domain, brand logo, and allocate office branches.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-orange-100 bg-orange-50/30 shrink-0 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
              {/* Brand Identity / Company Logo & Icon */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white border border-orange-200/80 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    <span>Company Brand Logo & Icon</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Displayed across Top Bar, Navigation Sidebars, and Layout Dashboards
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Current Logo Preview Box */}
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-orange-300/80 shadow-sm flex items-center justify-center overflow-hidden p-1.5">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Company Logo Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-orange-400" />
                      )}
                    </div>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-sm transition-colors"
                        title="Remove logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Actions: File Upload, Web URL, Preset Emblems */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo / Icon</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput((prev) => !prev)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-orange-500" />
                        <span>{showUrlInput ? 'Hide URL Input' : 'Enter Image URL'}</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {showUrlInput && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="url"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="flex-1 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customUrlInput.trim()) {
                              setLogoUrl(customUrlInput.trim());
                              setCustomUrlInput('');
                              setShowUrlInput(false);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {/* Presets Row */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3 h-3 text-orange-500" />
                        <span className="text-[11px] font-semibold text-slate-600">
                          Or select corporate emblem preset:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {PRESET_COMPANY_LOGOS.map((preset) => {
                          const isSelected = logoUrl === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setLogoUrl(preset.url)}
                              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-100 text-orange-800 border-orange-400 font-semibold shadow-2xs'
                                  : 'bg-white text-slate-600 border-orange-200 hover:border-orange-300 hover:bg-orange-50/50'
                              }`}
                              title={preset.label}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-3.5 h-3.5 object-contain"
                              />
                              <span>{preset.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 1: Company Name & Company Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pacific Mind Spatial Corp"
                    className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-xs"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company Type / Legal Structure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value as CompanyType)}
                    className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-xs"
                  >
                    {COMPANY_TYPES.map((ct) => (
                      <option key={ct.type} value={ct.type}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {COMPANY_TYPES.find((c) => c.type === companyType)?.desc}
                  </p>
                </div>
              </div>

              {/* Row 2: GST Details / Tax ID & PAN / National Tax No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-orange-50/40 border border-orange-200/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    GST Details / Tax Identification No (GSTIN / VAT / EIN)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-orange-600 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={gstDetails}
                      onChange={(e) => setGstDetails(e.target.value.toUpperCase())}
                      placeholder="e.g. 29ABCDE1234F1Z5 or US-EIN-99-1234567"
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm font-mono font-bold text-orange-700 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Applies to invoice tax audits, reverse charge accounting, and regional compliance.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Corporate Registration (CIN / ROC / Business ID)
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. U72900KA2024PTC189201"
                    className="w-full px-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Official incorporation registration or Registrar of Companies (ROC) filing code.
                  </p>
                </div>
              </div>

              {/* Row 3: Domain, Country & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Corporate Domain / Website
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-orange-600 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value.toLowerCase())}
                      placeholder="pacificmind.io"
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                    />
                  </div>
                  {errors.domain && (
                    <p className="text-xs text-rose-500 mt-1">{errors.domain}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Country of Incorporation
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-orange-600 absolute left-3 top-3 pointer-events-none" />
                    <input
                      list="country-suggestions"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. India or United States"
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                    />
                    <datalist id="country-suggestions">
                      {POPULAR_COUNTRIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Accounting Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PAN / Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-orange-600 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="hq@company.com"
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone / Board Line
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-orange-600 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 80 4910 2300"
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Registered Headquarters Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Corporate Headquarters Address
                </label>
                <textarea
                  rows={2}
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="e.g. Level 14, Orion Cyber Tower, Tech Hub Corridor, Bengaluru, Karnataka 560103"
                  className="w-full px-3.5 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors resize-none shadow-xs"
                />
              </div>
            </div>
          ) : (
            /* Tab 2: Select / Set Offices */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200">
                <div>
                  <div className="text-xs font-bold text-orange-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-orange-600" />
                    <span>Office Allocation Matrix</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Select the physical offices and spatial branches that belong under{' '}
                    <span className="text-slate-900 font-bold">{name || 'this company'}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllOffices}
                    className="px-2.5 py-1 text-xs font-medium text-orange-800 bg-orange-100 hover:bg-orange-200 rounded-md border border-orange-300 transition-colors"
                  >
                    Select All ({allOffices.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllOffices}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white rounded-md border border-slate-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Allocation Quantitative Summary */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-orange-50/30 border border-orange-200">
                <div className="text-center">
                  <div className="text-[11px] text-slate-500 font-medium">Assigned Offices</div>
                  <div className="text-lg font-bold text-orange-600 font-mono">
                    {selectedOfficeIds.length} / {allOffices.length}
                  </div>
                </div>
                <div className="text-center border-x border-orange-200">
                  <div className="text-[11px] text-slate-500 font-medium">Total Spatial Footprint</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {totalAllocatedArea.toFixed(1)} m²
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-slate-500 font-medium">Active Headcount</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono">
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
                          ? 'bg-orange-50/80 border-orange-400 shadow-sm'
                          : 'bg-white border-orange-200/80 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-orange-500 text-white'
                              : 'border border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-orange-600">
                              {office.code}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {office.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              Floor 0{office.floorLevel}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-medium">
                              {office.department}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span>{area.toFixed(1)} m²</span>
                            <span>·</span>
                            <span>{headcount} Agents</span>
                            <span>·</span>
                            <span>{office.furniture.length} Assets</span>
                            {belongsToOther && (
                              <span className="text-amber-800 text-[10px] bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 font-medium">
                                Assigned to: {currentCompany.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isChecked ? (
                          <span className="text-xs font-semibold text-orange-700 px-2 py-0.5 bg-orange-100 rounded-full border border-orange-300">
                            Included
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Excluded</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-orange-100">
            <div>
              {!isNew && onDeleteCompany && (
                allCompanies.length > 1 ? (
                  !isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Company</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-rose-50 border border-rose-300 rounded-xl">
                      <span className="text-xs text-rose-800 px-2 font-medium">
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
                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Single company active. To delete, register a 2nd company first.</span>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-orange-50 rounded-lg border border-orange-200 transition-colors shadow-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg transition-all shadow-[0_2px_12px_rgba(255,107,0,0.3)] flex items-center gap-1.5"
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
