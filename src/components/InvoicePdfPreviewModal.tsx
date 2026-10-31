import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Edit3,
} from 'lucide-react';
import { AccountingInvoice, Company, OfficeSpace } from '../types';
import {
  downloadInvoicePdf,
  formatPdfCurrency,
  formatDisplayCurrency,
} from '../utils/invoicePdfGenerator';

interface InvoicePdfPreviewModalProps {
  isOpen: boolean;
  invoice: AccountingInvoice | null;
  office: OfficeSpace;
  company?: Company;
  onClose: () => void;
  onUpdateInvoiceStatus?: (invoiceId: string, status: 'paid' | 'pending' | 'overdue') => void;
}

export const InvoicePdfPreviewModal: React.FC<InvoicePdfPreviewModalProps> = ({
  isOpen,
  invoice,
  office,
  company,
  onClose,
  onUpdateInvoiceStatus,
}) => {
  if (!isOpen || !invoice) return null;

  const isReceivable = invoice.type === 'receivable';
  const currency = company?.currency || office.accounting?.currency || '$';
  const cleanId = invoice.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '01';

  const [invoiceNumber, setInvoiceNumber] = useState(
    isReceivable
      ? `INV-2026-${office.code.replace(/[^a-zA-Z0-9]/g, '')}-${cleanId}`
      : `BILL-2026-${office.code.replace(/[^a-zA-Z0-9]/g, '')}-${cleanId}`
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [taxRate, setTaxRate] = useState(office.accounting?.taxRate ?? 18);
  const [customNotes, setCustomNotes] = useState(
    `Payment due within Net 30 Days. Please cite #${invoiceNumber} in wire remittance. For invoice queries, reach out to ${company?.contactEmail || 'finance@pacificmind.io'}.`
  );
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Financial calculation
  const totalAmount = invoice.amount;
  const taxPercent = taxRate > 0 ? taxRate : 0;
  const subtotal = totalAmount / (1 + taxPercent / 100);
  const taxAmount = totalAmount - subtotal;
  const issueDate = new Date().toISOString().split('T')[0];

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      downloadInvoicePdf({
        invoice,
        office,
        company,
        taxRate,
        invoiceNumber,
        notes: customNotes,
        paymentTerms,
      });
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[94vh] flex flex-col bg-white border border-orange-200/90 rounded-2xl shadow-[0_25px_70px_rgba(255,107,0,0.22)] overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-100 bg-orange-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {isReceivable ? 'Official Tax Invoice' : 'Vendor Bill & Payment Voucher'}
                </h3>
                <span className="font-mono text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded font-semibold border border-orange-200">
                  #{invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official PDF preview for {invoice.counterparty} · {office.name} ({office.code})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingMeta((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                isEditingMeta
                  ? 'bg-orange-100 border-orange-300 text-orange-800'
                  : 'bg-white border-orange-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Edit Invoice Details & Parameters"
            >
              <Edit3 className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Customize</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-orange-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors flex items-center gap-1 hover:bg-orange-50"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs transition-all shadow-[0_2px_12px_rgba(255,107,0,0.35)] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Customizer Drawer */}
        {isEditingMeta && (
          <div className="p-3.5 bg-orange-50/80 border-b border-orange-200 text-xs space-y-2.5 animate-in fade-in">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Customize Invoice PDF Parameters:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Changes apply directly to generated PDF document
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Tax / GST Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Invoice Notes & Wire Memo</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {/* Scrollable Document Preview Body (Paper Style) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 flex justify-center">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-md p-6 sm:p-8 space-y-6 text-slate-900">
            {/* Document Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  {company?.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-8 h-8 rounded object-contain p-0.5 border border-orange-200"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-orange-600" />
                  )}
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {company?.name || 'Enterprise Spatial Corp'}
                  </h2>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {company?.companyType} · Suite: {office.name} ({office.code}) · Floor 0{office.floorLevel}
                </div>
                {company?.gstDetails && (
                  <div className="text-xs font-mono text-slate-600">
                    GST/Tax ID: <span className="text-emerald-700 font-semibold">{company.gstDetails}</span>
                    {company.panNumber && ` · PAN: ${company.panNumber}`}
                  </div>
                )}
                {company?.registeredAddress && (
                  <div className="text-[11px] text-slate-500 max-w-md">
                    {company.registeredAddress}
                  </div>
                )}
              </div>

              <div className="text-right space-y-1">
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    isReceivable
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : 'bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  {isReceivable ? 'Tax Invoice' : 'Expense Bill'}
                </span>
                <div className="text-sm font-mono font-bold text-slate-900">#{invoiceNumber}</div>
                <div className="text-xs text-slate-500">Issued: {issueDate}</div>
              </div>
            </div>

            {/* Bill To & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-orange-50/40 p-4 rounded-xl border border-orange-200/60 text-xs">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-orange-700 mb-1">
                  {isReceivable ? 'Billed To Client' : 'Vendor / Payee'}
                </div>
                <div className="font-bold text-slate-900 text-sm">{invoice.counterparty}</div>
                <div className="text-slate-600 mt-0.5">Category: {invoice.category}</div>
                <div className="text-slate-500 mt-0.5">{invoice.description}</div>
              </div>

              <div className="space-y-1 sm:text-right">
                <div>
                  <span className="text-slate-500">Due Date:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{invoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Payment Terms:</span>{' '}
                  <span className="font-semibold text-slate-800">{paymentTerms}</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 pt-1">
                  <span className="text-slate-500">Status:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateInvoiceStatus?.(
                        invoice.id,
                        invoice.status === 'paid' ? 'pending' : 'paid'
                      )
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                    title="Click to toggle status"
                  >
                    {invoice.status === 'paid' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PAID</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>PENDING</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description & Service Spec</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-white">
                    <td className="py-3 px-3 text-slate-400 font-mono">1</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {invoice.description || invoice.category}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Allocated to {office.name} ({office.code}) · Spatial Architecture Service
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{invoice.category}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">1</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatDisplayCurrency(subtotal, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Calculations & Remittance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                  <span>Wire / Remittance Instructions</span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  Bank: Global Silicon Corporate Bank
                  <br />
                  A/C Name: {company?.name || 'Enterprise Treasury'}
                  <br />
                  Account: 9482-1049-8821 · IFSC: GSCB0004921
                </div>
              </div>

              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-600 gap-3">
                  <span className="font-medium whitespace-nowrap">Net Subtotal:</span>
                  <span className="font-mono text-slate-900 font-semibold tabular-nums text-right">
                    {formatDisplayCurrency(subtotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 gap-3">
                  <span className="font-medium whitespace-nowrap">Tax / GST ({taxPercent}%):</span>
                  <span className="font-mono text-slate-900 font-semibold tabular-nums text-right">
                    {formatDisplayCurrency(taxAmount, currency)}
                  </span>
                </div>
                <div className="border-t border-orange-200 pt-2 flex justify-between items-center font-bold text-base text-orange-600 gap-3">
                  <span className="whitespace-nowrap">Total Amount:</span>
                  <span className="font-mono tabular-nums text-right">
                    {formatDisplayCurrency(totalAmount, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Authorized Sign-off */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs text-slate-500">
              <div className="max-w-xs space-y-1">
                <div className="font-bold text-slate-700">Audit & Terms Memo:</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{customNotes}</p>
              </div>

              <div className="sm:text-right space-y-1 shrink-0">
                <div className="h-9 flex items-center sm:justify-end">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="font-bold text-slate-900">Authorized Treasury Controller</div>
                <div className="text-[11px] text-slate-500">
                  {office.agents?.find((a) => a.isAccountingAgent)?.name ||
                    'Corporate Finance Controller'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3 border-t border-orange-100 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for client delivery or accounting audit</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg text-xs transition-all shadow-[0_2px_12px_rgba(255,107,0,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Downloading PDF...' : 'Download PDF Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
