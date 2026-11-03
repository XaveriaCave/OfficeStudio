import React, { useState } from 'react';
import {
  X,
  Shield,
  FileText,
  AlertTriangle,
  Building2,
  Scale,
  Check,
  Copy,
  Printer,
  ExternalLink,
  Edit3,
  Calendar,
  Mail,
  MapPin,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Company } from '../types';

interface LegalComplianceModalProps {
  isOpen: boolean;
  company: Company;
  allCompanies?: Company[];
  initialTab?: 'privacy' | 'terms' | 'disclaimer' | 'impressum';
  onClose: () => void;
  onSelectCompany?: (companyId: string) => void;
  onOpenEditCompany?: (company: Company) => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  company,
  allCompanies,
  initialTab = 'privacy',
  onClose,
  onSelectCompany,
  onOpenEditCompany,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'disclaimer' | 'impressum'>(
    initialTab
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const comp = company.legalCompliance;
  const governingLaw =
    comp?.governingLaw ||
    (company.country === 'India'
      ? 'Laws of the Republic of India & Jurisdiction of Bengaluru, Karnataka'
      : `Laws and Courts of ${company.country}`);
  const legalEmail = comp?.legalContactEmail || company.contactEmail || `legal@${company.domain}`;
  const dpoName = comp?.dpoName || 'Elena Vance, Corporate Compliance Lead';
  const effectiveDate = comp?.effectiveDate || 'November 2026';

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-orange-200/90 rounded-2xl shadow-[0_20px_60px_rgba(255,107,0,0.18)] overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-orange-100 bg-orange-50/50 gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                  Legal & Compliance Documentation
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Production Validated
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Configured specifically for{' '}
                <strong className="text-slate-800">{company.name}</strong> ({company.companyType})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {allCompanies && allCompanies.length > 1 && onSelectCompany && (
              <select
                value={company.id}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-orange-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
                title="Switch company entity"
              >
                {allCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {onOpenEditCompany && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditCompany(company);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Edit legal & compliance settings in Company configuration"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Configure Policies</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-orange-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-orange-100 bg-orange-50/30 shrink-0 gap-2 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'disclaimer'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Financial & Safety Disclaimers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impressum')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'impressum'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Corporate Impressum & Entity</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 leading-relaxed bg-white">
          {/* Metadata Pill Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>Effective Date: <strong>{effectiveDate}</strong></span>
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Jurisdiction: <strong>{governingLaw}</strong></span>
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-orange-500" />
                <span>Legal Desk: <strong>{legalEmail}</strong></span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const content = document.getElementById('legal-doc-content')?.innerText || '';
                  handleCopyText(content);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                title="Print document"
              >
                <Printer className="w-3 h-3 text-slate-500" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div id="legal-doc-content" className="space-y-6">
            {/* TAB 1: PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Privacy Policy & Data Protection Notice
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compliant with GDPR (EU), CCPA/CPRA (US), and the Digital Personal Data Protection Act (India, 2023).
                  </p>
                </div>

                {comp?.customPrivacy ? (
                  <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-200 whitespace-pre-wrap text-slate-800 text-xs sm:text-sm font-sans">
                    {comp.customPrivacy}
                  </div>
                ) : (
                  <>
                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        1. Data Controller Identification
                      </h4>
                      <p>
                        This Privacy Policy applies to all spatial services, WebGL 3D planning tools, and financial
                        dashboards operated by <strong>{company.name}</strong>, a registered {company.companyType}{' '}
                        incorporated under {governingLaw}, having its registered office at{' '}
                        <strong>{company.registeredAddress || 'Registered Office Address on File'}</strong>{' '}
                        (Tax / GST ID: <code>{company.gstDetails}</code>).
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        2. Information Handled & Client-Side Sandboxing
                      </h4>
                      <p>
                        Our platform is engineered with a strict <strong>privacy-by-design</strong> architecture:
                      </p>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                        <li>
                          <strong>Spatial Architectural Geometry:</strong> 2D polygonal room coordinates, 3D furniture
                          coordinates, and CAD wall cutout positions are stored in local browser storage (`localStorage`)
                          and client-side memory.
                        </li>
                        <li>
                          <strong>Organizational Roster & Agents:</strong> Employee and agent personas (e.g. corporate
                          controllers, systems engineers) are simulation entities stored within your tenant partition.
                        </li>
                        <li>
                          <strong>Corporate Financial Models:</strong> Runway calculations, lease amortizations, and GST
                          invoice rates are calculated locally and never monetized or shared with third-party data brokers.
                        </li>
                        <li>
                          <strong>Zero Advertising Trackers:</strong> We do not employ third-party ad retargeting pixels,
                          fingerprinting algorithms, or invasive behavioural tracking.
                        </li>
                      </ul>
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        3. Your Statutory Rights (GDPR & DPDP Act 2023)
                      </h4>
                      <p>
                        Authorized users and corporate administrators maintain uncompromised data rights:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li><strong>Right to Access & Portability:</strong> Export full company JSON records and ledger tables at any time.</li>
                        <li><strong>Right to Rectification:</strong> Real-time editing of registered office details, tax IDs, and personnel rosters.</li>
                        <li><strong>Right to Erasure:</strong> Wipe local workspace state and reset company configurations immediately via the Reset Presets action.</li>
                      </ul>
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        4. Data Protection Inquiries
                      </h4>
                      <p>
                        To exercise data rights, lodge compliance inquiries, or communicate with our designated Data
                        Protection Representative (<strong>{dpoName}</strong>), contact{' '}
                        <a href={`mailto:${legalEmail}`} className="text-orange-600 hover:underline font-semibold font-mono">
                          {legalEmail}
                        </a>.
                      </p>
                    </section>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Terms of Service & Commercial SaaS Agreement
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard governing terms for workspace virtualization and spatial operations.
                  </p>
                </div>

                {comp?.customTerms ? (
                  <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-200 whitespace-pre-wrap text-slate-800 text-xs sm:text-sm font-sans">
                    {comp.customTerms}
                  </div>
                ) : (
                  <>
                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        1. Acceptance & Enterprise License
                      </h4>
                      <p>
                        By accessing or operating the spatial virtualization suite hosted for{' '}
                        <strong>{company.name}</strong>, authorized personnel agree to abide by these Terms.
                        Subject to subscription adherence, {company.name} grants authorized teams a non-exclusive,
                        revocable license to create 2D floor shapes, view 3D architectural scenes, and configure financial
                        runway models.
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        2. Spatial Intellectual Property
                      </h4>
                      <p>
                        <strong>{company.name}</strong> retains all proprietary rights and commercial ownership over all
                        original architectural polygon vertices, CAD blueprints, and custom office layouts designed within
                        the platform. The underlying 3D WebGL renderer and framework remain property of the studio platform.
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        3. Governing Law & Dispute Resolution
                      </h4>
                      <p>
                        These Terms shall be interpreted and governed strictly in accordance with{' '}
                        <strong>{governingLaw}</strong>, without regard to conflict of law principles. Any legal disputes
                        arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the
                        competent courts in {company.country}.
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        4. Availability & Warranties
                      </h4>
                      <p>
                        The application is provided on an “as is” and “as available” basis. While high client-side WebGL
                        rendering uptime is maintained, the software is provided without express warranty of uninterrupted
                        availability across legacy non-WebGL hardware.
                      </p>
                    </section>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: FINANCIAL & SAFETY DISCLAIMERS */}
            {activeTab === 'disclaimer' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Statutory Disclaimers: Financial Modeling & Structural Safety
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical advisory notices regarding financial runway forecasts, GST/VAT calculations, and 2D/3D floorplans.
                  </p>
                </div>

                {comp?.customDisclaimer ? (
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-300 whitespace-pre-wrap text-slate-800 text-xs sm:text-sm font-sans">
                    {comp.customDisclaimer}
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Non-Advisory Financial Disclaimer (CPA / Tax Notice)</span>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed">
                        Cash reserves, monthly burn estimations, runway ratios, and automated invoice Tax/GST summaries
                        generated on this platform are <strong>advisory simulation models</strong> meant for strategic
                        planning only. They do not constitute certified statutory audit reports, CPA certification, or formal
                        tax advice. Organizations must reconcile all generated invoices and lease amortizations with a
                        licensed Chartered Accountant (CA) or Certified Public Accountant (CPA).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
                      <div className="flex items-center gap-2 text-orange-900 font-bold text-sm">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        <span>Architectural & Structural Engineering Disclaimer</span>
                      </div>
                      <p className="text-xs text-orange-950 leading-relaxed">
                        All 2D polygonal floor layouts, wall thicknesses, cutout archways, and 3D WebGL scale models are
                        conceptual geometric representations. Actual structural wall modifications, load-bearing assessments,
                        fire safety egress routes, and HVAC clearances must be surveyed and approved on-site by a licensed
                        civil engineer, architect, and local municipal fire safety authority before physical construction.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                        <Lock className="w-4 h-4 text-slate-600" />
                        <span>Autonomous Simulation Agents</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Office agents, financial controllers, and spatial coordinators visualized on this platform are
                        virtual simulated roles executing deterministic behavioral and accounting models configured by the
                        administrator.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 4: CORPORATE IMPRESSUM & ENTITY DETAILS */}
            {activeTab === 'impressum' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Corporate Impressum & Statutory Entity Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official corporate identification and registered office filings for transparency.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Corporate Legal Entity
                    </div>
                    <div className="text-base font-bold text-slate-900">{company.name}</div>
                    <div className="text-xs text-orange-700 font-semibold">{company.companyType}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Statutory Registration (CIN / Reg No)
                    </div>
                    <div className="text-base font-mono font-bold text-slate-900">
                      {company.registrationNumber || 'Corporate Filing Pending'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Incorporated under: {governingLaw}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tax & GST Identification
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-800">
                      <span>GST/Tax ID:</span>
                      <span>{company.gstDetails}</span>
                    </div>
                    {company.panNumber && (
                      <div className="text-xs font-mono text-slate-600">
                        PAN Number: <strong>{company.panNumber}</strong>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Corporate Contact Desk
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Official Email: <strong className="font-mono text-orange-700">{company.contactEmail || legalEmail}</strong></div>
                      <div>Legal Desk: <strong className="font-mono text-slate-800">{legalEmail}</strong></div>
                      <div>Phone: <strong className="font-mono text-slate-800">{company.phone || 'On file'}</strong></div>
                    </div>
                  </div>

                  <div className="md:col-span-2 p-4 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Registered Corporate Office
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {company.registeredAddress || 'Level 14, Orion Cyber Tower, Tech Hub Corridor, Bengaluru, Karnataka 560103'}
                    </div>
                    <div className="text-xs text-slate-500">Country: {company.country}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-orange-100 bg-orange-50/40 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              All policies are customizable per corporate entity in <strong>Company Settings</strong>.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
